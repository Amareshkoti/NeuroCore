"""
NEUROCORE - Brian2 Simulation & Validation Bridge
Provides seamless execution and scientific cross-validation against Brian2 reference equations.
"""

from typing import Dict, Any, Optional
import numpy as np
import brian2 as b2

# Configure Brian2 to use standard NumPy standalone code generation without requiring external compilers
b2.prefs.codegen.target = "numpy"


class Brian2Validator:
    """
    Executes identical differential equations via Brian2 to validate NEUROCORE's numerical fidelity.
    """

    def __init__(
        self,
        num_neurons: int = 100,
        dt_ms: float = 0.1,
        v_rest_mv: float = -65.0,
        v_reset_mv: float = -70.0,
        v_th_mv: float = -50.0,
        tau_m_ms: float = 20.0,
        r_m_mohm: float = 10.0,
        tau_ref_ms: float = 2.0,
        seed: Optional[int] = 42,
    ) -> None:
        self.num_neurons = num_neurons
        self.dt_ms = dt_ms
        self.v_rest = v_rest_mv
        self.v_reset = v_reset_mv
        self.v_th = v_th_mv
        self.tau_m = tau_m_ms
        self.r_m = r_m_mohm
        self.tau_ref = tau_ref_ms
        self.seed = seed

    def run_benchmark(self, duration_ms: float = 100.0, i_ext_pa: float = 2.5) -> Dict[str, Any]:
        """
        Run Brian2 simulation with injected current and return metrics for cross-comparison.
        """
        b2.start_scope()
        if self.seed is not None:
            b2.seed(self.seed)

        # Standard Leaky Integrate-and-Fire Brian2 equations
        eqs = """
        dv/dt = (-(v - v_rest) + r_m * (i_ext)) / tau_m : volt (unless refractory)
        i_ext : amp
        tau_m : second
        v_rest : volt
        r_m : ohm
        """

        group = b2.NeuronGroup(
            self.num_neurons,
            model=eqs,
            threshold="v > -50*mV",
            reset="v = -70*mV",
            refractory="2*ms",
            method="euler",
            dt=self.dt_ms * b2.ms,
        )

        group.v = self.v_rest * b2.mV
        group.tau_m = self.tau_m * b2.ms
        group.v_rest = self.v_rest * b2.mV
        group.r_m = self.r_m * 1e6 * b2.ohm
        group.i_ext = i_ext_pa * 1e-9 * b2.amp  # Injected current in amperes

        spike_mon = b2.SpikeMonitor(group)
        state_mon = b2.StateMonitor(group, "v", record=0)

        # Run Brian2 network
        net = b2.Network(group, spike_mon, state_mon)
        net.run(duration_ms * b2.ms)

        total_spikes = int(spike_mon.num_spikes)
        mean_rate = total_spikes / (self.num_neurons * (duration_ms / 1000.0))

        return {
            "engine": "brian2",
            "num_neurons": self.num_neurons,
            "duration_ms": duration_ms,
            "total_spikes": total_spikes,
            "mean_firing_rate_hz": float(mean_rate),
            "trace_sample_v_mv": [float(val / b2.mV) for val in state_mon.v[0][-20:]],
        }
