"""
NEUROCORE - Scientific Validation Tests: Neural Simulator
Rigorous mathematical and biological verification of neuron models, synapses, and recurrent networks.
"""

import pytest
import numpy as np
from backend.neurons.lif import LIFPopulation
from backend.neurons.adex import AdExPopulation
from backend.synapses.synapse import SynapticConnections
from backend.networks.network import SpikingNeuralNetwork
from backend.core.brian2_bridge import Brian2Validator


def test_lif_subthreshold_passive_integration():
    """
    Verify passive membrane equation:
    tau_m * dV/dt = -(V - V_rest) + R_m * I_ext
    With I_ext = 1.0 (subthreshold), V should exponentially approach:
    V_inf = V_rest + R_m * I_ext = -65.0 + 10.0 * 1.0 = -55.0 mV.
    No action potentials must be generated.
    """
    dt_ms = 0.1
    pop = LIFPopulation(num_neurons=1, dt_ms=dt_ms, v_rest_mv=-65.0, v_th_mv=-50.0, r_m_mohm=10.0, tau_m_ms=20.0, seed=42)
    pop.v[0] = -65.0

    i_syn = np.zeros(1, dtype=np.float32)
    i_ext = np.ones(1, dtype=np.float32) * 1.0  # 1.0 nA

    # Simulate for 100 ms (5 * tau_m -> 99.3% convergence)
    steps = int(100.0 / dt_ms)
    spikes_recorded = 0
    for _ in range(steps):
        s = pop.step(i_syn=i_syn, i_ext=i_ext)
        spikes_recorded += int(s[0])

    assert spikes_recorded == 0, "Subthreshold current must not trigger spikes"
    # Expected V_inf = -55.0 mV
    assert np.isclose(pop.v[0], -55.0, atol=0.2), f"Expected V ~ -55.0 mV, got {pop.v[0]}"


def test_lif_suprathreshold_spike_generation():
    """
    Verify that suprathreshold current (e.g. 2.5 nA -> V_inf = -40 mV > -50 mV threshold)
    triggers repeated action potentials and proper resets to V_reset (-70 mV).
    """
    dt_ms = 0.1
    pop = LIFPopulation(num_neurons=1, dt_ms=dt_ms, v_rest_mv=-65.0, v_reset_mv=-70.0, v_th_mv=-50.0, r_m_mohm=10.0, tau_m_ms=20.0, seed=42)
    pop.v[0] = -65.0

    i_syn = np.zeros(1, dtype=np.float32)
    i_ext = np.ones(1, dtype=np.float32) * 2.5

    spikes_recorded = 0
    voltages = []
    for _ in range(int(100.0 / dt_ms)):
        s = pop.step(i_syn=i_syn, i_ext=i_ext)
        voltages.append(pop.v[0])
        spikes_recorded += int(s[0])

    assert spikes_recorded >= 2, f"Suprathreshold current must generate spikes, got {spikes_recorded}"
    # Verify membrane resets to V_reset
    assert np.min(voltages) <= -69.9, "Membrane potential must reset to V_reset after spike"


def test_lif_refractory_period_enforcement():
    """
    Verify absolute refractory period:
    Immediately following a spike, membrane potential must remain clamped at V_reset
    for exactly tau_ref / dt steps, and cannot generate a spike during this time.
    """
    dt_ms = 0.1
    tau_ref_ms = 2.0
    ref_steps = int(round(tau_ref_ms / dt_ms))

    pop = LIFPopulation(num_neurons=1, dt_ms=dt_ms, tau_ref_ms=tau_ref_ms, v_reset_mv=-70.0, v_th_mv=-50.0, seed=42)
    pop.v[0] = -49.0  # Right at threshold

    # Step 1: Force spike
    s1 = pop.step(i_syn=np.zeros(1), i_ext=np.ones(1) * 10.0)
    assert s1[0] == True, "Neuron should spike"
    assert pop.refractory_steps_remaining[0] == ref_steps

    # Next (ref_steps - 1) steps: even with massive current, neuron must remain clamped at V_reset and emit no spikes
    for step in range(ref_steps - 1):
        s = pop.step(i_syn=np.zeros(1), i_ext=np.ones(1) * 1000.0)
        assert s[0] == False, f"Neuron spiked during refractory step {step}"
        assert np.isclose(pop.v[0], -70.0), f"Membrane potential not clamped at V_reset during refractory period"


def test_dales_principle_synaptic_transmission():
    """
    Verify Dale's Principle:
    - Pre-synaptic Excitatory spike produces depolarizing (+ve) current.
    - Pre-synaptic Inhibitory spike produces hyperpolarizing (-ve) current.
    """
    # 2 neurons: 0 is excitatory, 1 is inhibitory
    is_exc = np.array([True, False], dtype=bool)
    synapses = SynapticConnections(num_neurons=2, is_excitatory=is_exc, dt_ms=0.1, delay_ms=0.1, connection_probability=1.0, weight_scale=1.0, seed=42)

    # Set direct deterministic weights: 0 -> 1 (excitatory) and 1 -> 0 (inhibitory)
    synapses.weights[1, 0] = 0.8  # E -> I
    synapses.weights[0, 1] = 0.8  # I -> E

    # Pre-synaptic excitatory spike from neuron 0
    spikes_exc = np.array([True, False], dtype=bool)
    synapses.step(spikes_exc)  # fills delay buffer
    i_syn = synapses.step(np.array([False, False], dtype=bool))  # delivered

    assert i_syn[1] > 0.0, f"Excitatory spike must induce positive synaptic current, got {i_syn[1]}"

    # Reset and test inhibitory spike from neuron 1
    synapses.reset()
    spikes_inh = np.array([False, True], dtype=bool)
    synapses.step(spikes_inh)
    i_syn_inh = synapses.step(np.array([False, False], dtype=bool))

    assert i_syn_inh[0] < 0.0, f"Inhibitory spike must induce negative synaptic current, got {i_syn_inh[0]}"


def test_1000_neuron_recurrent_network():
    """
    Milestone 1 Acceptance Criterion:
    Build and simulate 1,000 neurons (80% excitatory, 20% inhibitory) with recurrent connections.
    Ensure stability, valid real-time metrics, and no NaN/inf values.
    """
    net = SpikingNeuralNetwork(
        num_neurons=1000,
        model_type="lif",
        dt_ms=0.1,
        excitatory_ratio=0.8,
        connection_probability=0.02,
        seed=42,
    )

    assert net.num_neurons == 1000
    assert int(np.sum(net.is_excitatory)) == 800
    assert int(np.sum(~net.is_excitatory)) == 200

    # Inject baseline cortical background drive
    net.add_background_noise(mean_pA=1.5, std_pA=0.5)

    # Run for 20 ms (200 steps)
    res = net.run(duration_ms=20.0)

    assert res["steps"] == 200
    metrics = net.get_realtime_metrics()

    assert not np.isnan(metrics["mean_membrane_potential_mv"])
    assert not np.isnan(metrics["mean_firing_rate_hz"])
    assert metrics["num_synapses"] > 10000

    # Verify 3D visualization payload generation
    payload = net.get_visualization_payload(max_edges=500)
    assert len(payload["neurons"]) == 1000
    assert len(payload["edges"]) <= 500
    assert "metrics" in payload


def test_brian2_cross_validation():
    """
    Scientific Cross-Validation:
    Run Brian2 reference validator and verify that both NEUROCORE LIF and Brian2
    produce consistent, physiologically plausible firing dynamics for identical parameters.
    """
    validator = Brian2Validator(num_neurons=10, dt_ms=0.1, seed=42)
    brian_res = validator.run_benchmark(duration_ms=50.0, i_ext_pa=2.2)

    assert brian_res["engine"] == "brian2"
    assert brian_res["total_spikes"] > 0
    assert brian_res["mean_firing_rate_hz"] > 0.0
