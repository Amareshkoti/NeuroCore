"""
NEUROCORE - Scientific Validation Tests: Synaptic Plasticity & STDP
Proves that learning occurs based on precise biological spike timing (Bi & Poo 1998, Turrigiano 2008).
"""

import pytest
import numpy as np
from backend.learning.stdp import STDPPlasticity
from backend.learning.homeostatic import HomeostaticPlasticity
from backend.learning.hebbian import HebbianPlasticity
from backend.networks.network import SpikingNeuralNetwork


def test_stdp_long_term_potentiation_ltp():
    """
    Verify LTP (Long-Term Potentiation):
    Pre-before-Post pairing (Delta t = t_post - t_pre > 0).
    When presynaptic neuron 0 spikes at t=1.0ms and postsynaptic neuron 1 spikes at t=6.0ms (Delta t = +5.0ms),
    synaptic weight W[1, 0] must INCREASE.
    """
    dt_ms = 0.1
    stdp = STDPPlasticity(num_neurons=2, dt_ms=dt_ms, a_plus=0.05, a_minus=0.05, tau_plus_ms=20.0, tau_minus_ms=20.0)

    # Initial connection weight from 0 to 1
    w = np.zeros((2, 2), dtype=np.float32)
    w[1, 0] = 0.5
    initial_w = float(w[1, 0])

    # t = 1.0 ms: Presynaptic spike from neuron 0
    spikes_t1 = np.array([True, False], dtype=bool)
    w = stdp.step(w, spikes_t1)

    # Simulate intervening 5.0 ms (50 steps of 0.1ms) with no spikes
    for _ in range(50):
        w = stdp.step(w, np.array([False, False], dtype=bool))

    # t = 6.0 ms: Postsynaptic spike from neuron 1
    spikes_t2 = np.array([False, True], dtype=bool)
    w = stdp.step(w, spikes_t2)

    final_w = float(w[1, 0])
    delta_w = final_w - initial_w

    assert delta_w > 0.0, f"Expected LTP (delta_w > 0), but got delta_w = {delta_w}"
    # Theoretical LTP: A_+ * exp(-5 / 20) = 0.05 * exp(-0.25) ~ 0.03894
    expected_delta = 0.05 * np.exp(-5.0 / 20.0)
    assert np.isclose(delta_w, expected_delta, atol=0.005), f"LTP mismatch: got {delta_w}, expected ~{expected_delta}"


def test_stdp_long_term_depression_ltd():
    """
    Verify LTD (Long-Term Depression):
    Post-before-Pre pairing (Delta t = t_post - t_pre < 0).
    When postsynaptic neuron 1 spikes first, and presynaptic neuron 0 spikes 5.0ms later,
    synaptic weight W[1, 0] must DECREASE.
    """
    dt_ms = 0.1
    stdp = STDPPlasticity(num_neurons=2, dt_ms=dt_ms, a_plus=0.05, a_minus=0.05, tau_plus_ms=20.0, tau_minus_ms=20.0)

    w = np.zeros((2, 2), dtype=np.float32)
    w[1, 0] = 0.5
    initial_w = float(w[1, 0])

    # t = 1.0 ms: Postsynaptic spike from neuron 1
    spikes_post = np.array([False, True], dtype=bool)
    w = stdp.step(w, spikes_post)

    # Intervening 5.0 ms (50 steps)
    for _ in range(50):
        w = stdp.step(w, np.array([False, False], dtype=bool))

    # t = 6.0 ms: Presynaptic spike from neuron 0
    spikes_pre = np.array([True, False], dtype=bool)
    w = stdp.step(w, spikes_pre)

    final_w = float(w[1, 0])
    delta_w = final_w - initial_w

    assert delta_w < 0.0, f"Expected LTD (delta_w < 0), but got delta_w = {delta_w}"
    # Theoretical LTD: -A_- * exp(-5 / 20) = -0.05 * exp(-0.25) ~ -0.03894
    expected_delta = -0.05 * np.exp(-5.0 / 20.0)
    assert np.isclose(delta_w, expected_delta, atol=0.005), f"LTD mismatch: got {delta_w}, expected ~{expected_delta}"


def test_stdp_asymmetric_timing_window():
    """
    Generate and verify full empirical Bi & Poo STDP curve across multiple Delta t values.
    Verifies that potentiation magnitude decreases with larger Delta t, and that LTD dominates for negative Delta t.
    """
    dt_ms = 0.1
    deltas = [-30.0, -20.0, -10.0, 10.0, 20.0, 30.0]
    dw_results = {}

    for dt in deltas:
        stdp = STDPPlasticity(num_neurons=2, dt_ms=dt_ms, a_plus=0.02, a_minus=0.022, tau_plus_ms=20.0, tau_minus_ms=20.0)
        w = np.zeros((2, 2), dtype=np.float32)
        w[1, 0] = 0.5
        init_w = float(w[1, 0])

        gap_steps = int(abs(dt) / dt_ms)

        if dt > 0:  # Pre then Post (LTP)
            w = stdp.step(w, np.array([True, False], dtype=bool))
            for _ in range(gap_steps):
                w = stdp.step(w, np.array([False, False], dtype=bool))
            w = stdp.step(w, np.array([False, True], dtype=bool))
        else:  # Post then Pre (LTD)
            w = stdp.step(w, np.array([False, True], dtype=bool))
            for _ in range(gap_steps):
                w = stdp.step(w, np.array([False, False], dtype=bool))
            w = stdp.step(w, np.array([True, False], dtype=bool))

        dw_results[dt] = float(w[1, 0]) - init_w

    # Check LTP ordering: closer delta t produces larger potentiation
    assert dw_results[10.0] > dw_results[20.0] > dw_results[30.0] > 0.0
    # Check LTD ordering: closer negative delta t produces larger depression (more negative)
    assert dw_results[-10.0] < dw_results[-20.0] < dw_results[-30.0] < 0.0


def test_homeostatic_synaptic_scaling():
    """
    Verify homeostatic scaling:
    When neuron firing rate exceeds target rate (10 Hz > 5 Hz target),
    synaptic weights are scaled DOWN.
    When firing rate falls below target rate (0 Hz < 5 Hz target),
    synaptic weights are scaled UP.
    """
    homeo = HomeostaticPlasticity(num_neurons=2, dt_ms=0.1, target_rate_hz=5.0, tau_avg_ms=10.0, learning_rate=0.01)
    w = np.ones((2, 2), dtype=np.float32) * 0.5

    # Case 1: Hyperactive neuron (spikes every step = 10,000 Hz >> 5 Hz)
    spikes_hyper = np.array([True, False], dtype=bool)
    for _ in range(50):
        w = homeo.step(w, spikes_hyper)

    assert w[0, 1] < 0.5, "Hyperactive neuron must have incoming weights scaled down"

    # Case 2: Quiescent neuron (0 spikes << 5 Hz)
    homeo.reset()
    w_low = np.ones((2, 2), dtype=np.float32) * 0.5
    homeo.r_avg[0] = 0.0  # Force running rate to 0
    spikes_silent = np.array([False, False], dtype=bool)
    for _ in range(10):
        w_low = homeo.step(w_low, spikes_silent)

    assert w_low[0, 1] > 0.5, "Quiescent neuron must have incoming weights scaled up"


def test_network_stdp_learning_demonstration():
    """
    Milestone 2 Acceptance Criterion:
    Simulate recurrent network with STDP enabled and verify that synaptic weights
    dynamically update based on actual network firing activity.
    """
    net = SpikingNeuralNetwork(
        num_neurons=200,
        model_type="lif",
        dt_ms=0.1,
        connection_probability=0.08,
        seed=42,
    )

    # Enable STDP learning
    net.configure_plasticity(stdp=True, homeostatic=True)

    # Inject repeated paired stimulation into cluster A (0-20) then cluster B (21-40)
    current = np.zeros(200, dtype=np.float32)
    current[:20] = 2.5
    net.inject_current(current)

    initial_weights = net.synapses.weights.copy()

    # Run for 50 ms
    net.run(duration_ms=50.0)

    final_weights = net.synapses.weights
    diff = np.abs(final_weights - initial_weights)
    max_weight_change = float(np.max(diff))
    num_changed_synapses = int(np.sum(diff > 1e-4))

    assert max_weight_change > 0.0, "Weights must change when STDP is active and neurons fire"
    assert num_changed_synapses > 0, "Synapses must undergo plasticity"

    metrics = net.get_realtime_metrics()
    assert metrics["stdp_enabled"] is True
    assert (metrics["stdp_ltp_events"] + metrics["stdp_ltd_events"]) > 0
