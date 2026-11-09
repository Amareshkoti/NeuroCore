"""
NEUROCORE - Leaky Integrate-and-Fire (LIF) Neuron Population
Biologically plausible implementation solving differential equations for membrane potential dynamics.
"""

from typing import Dict, Any, Optional
import numpy as np
from backend.neurons.base import BaseNeuronPopulation


class LIFPopulation(BaseNeuronPopulation):
    """
    Population of Leaky Integrate-and-Fire (LIF) neurons.
    Governed by the differential equation:
        tau_m * (dV/dt) = -(V - V_rest) + R_m * (I_syn + I_ext)

    With spike threshold condition:
        if V(t) >= V_th:
            V(t) -> V_reset
            refractory_period -> tau_ref
    """

    def __init__(
        self,
        num_neurons: int,
        dt_ms: float = 0.1,
        v_rest_mv: float = -65.0,
        v_reset_mv: float = -70.0,
        v_th_mv: float = -50.0,
        tau_m_ms: float = 20.0,
        r_m_mohm: float = 10.0,
        tau_ref_ms: float = 2.0,
        is_excitatory: Optional[np.ndarray] = None,
        seed: Optional[int] = None
    ) -> None:
        super().__init__(num_neurons=num_neurons, dt_ms=dt_ms, seed=seed)

        self.v_rest = float(v_rest_mv)
        self.v_reset = float(v_reset_mv)
        self.v_th = float(v_th_mv)
        self.tau_m = float(tau_m_ms)
        self.r_m = float(r_m_mohm)
        self.tau_ref = float(tau_ref_ms)

        # Refractory period in discrete simulation steps
        self.refractory_steps_total = int(round(self.tau_ref / self.dt_ms))

        # Neuronal phenotype (Excitatory vs Inhibitory)
        if is_excitatory is None:
            # Default to cortical Dale's law ratio: 80% excitatory, 20% inhibitory
            num_exc = int(0.8 * num_neurons)
            self.is_excitatory = np.zeros(num_neurons, dtype=bool)
            self.is_excitatory[:num_exc] = True
            # Shuffle so E/I are uniformly interspersed
            self.rng.shuffle(self.is_excitatory)
        else:
            self.is_excitatory = np.asarray(is_excitatory, dtype=bool)

        # Assign biological positions in 3D ellipsoidal brain volume
        self._initialize_spatial_coordinates()

        # Initialize membrane potential to resting state with small physiological variance
        self.reset()

    def _initialize_spatial_coordinates(self) -> None:
        """
        Distribute neurons within an ellipsoidal 3D brain volume
        representing cortical/subcortical structure for Three.js rendering.
        """
        # Ellipsoidal radius coordinates: semi-axes (a=100, b=80, c=60)
        phi = self.rng.uniform(0, 2 * np.pi, self.num_neurons)
        cos_theta = self.rng.uniform(-1, 1, self.num_neurons)
        theta = np.arccos(cos_theta)
        r = (self.rng.uniform(0.15, 1.0, self.num_neurons) ** (1.0 / 3.0))

        self.positions[:, 0] = 100.0 * r * np.sin(theta) * np.cos(phi)
        self.positions[:, 1] = 60.0 * r * np.sin(theta) * np.sin(phi)
        self.positions[:, 2] = 80.0 * r * np.cos(theta)

    def reset(self) -> None:
        """Reset membrane potential to resting value with slight biological jitter."""
        noise = self.rng.normal(0.0, 0.5, self.num_neurons).astype(np.float32)
        self.v = np.clip(self.v_rest + noise, self.v_reset, self.v_th - 1.0)
        self.spikes = np.zeros(self.num_neurons, dtype=bool)
        self.refractory_steps_remaining = np.zeros(self.num_neurons, dtype=np.int32)
        self.total_spikes = np.zeros(self.num_neurons, dtype=np.int64)

    def step(self, i_syn: np.ndarray, i_ext: np.ndarray) -> np.ndarray:
        """
        Advance one simulation step dt:
        1. Decrement refractory timer for refractory neurons.
        2. Integrate differential equation dV/dt for non-refractory neurons.
        3. Detect threshold crossings (spikes).
        4. Reset spiked neurons and initialize refractory state.
        """
        # Neurons currently in absolute refractory state cannot integrate or spike
        is_refractory = self.refractory_steps_remaining > 0
        self.refractory_steps_remaining[is_refractory] -= 1
        self.v[is_refractory] = self.v_reset

        # Integrate for active neurons
        can_integrate = ~is_refractory
        total_current = i_syn + i_ext

        # Forward Euler integration of LIF differential equation:
        # dv = (-(V - V_rest) + R_m * I) * (dt / tau_m)
        dv = (-(self.v[can_integrate] - self.v_rest) + self.r_m * total_current[can_integrate]) * (self.dt_ms / self.tau_m)
        self.v[can_integrate] += dv.astype(np.float32)

        # Detect action potentials
        spikes = np.zeros(self.num_neurons, dtype=bool)
        spiked_indices = np.where(self.v >= self.v_th)[0]

        if len(spiked_indices) > 0:
            spikes[spiked_indices] = True
            self.v[spiked_indices] = self.v_reset
            self.refractory_steps_remaining[spiked_indices] = self.refractory_steps_total
            self.total_spikes[spiked_indices] += 1

        self.spikes = spikes
        return spikes

    def get_state(self) -> Dict[str, Any]:
        """Return snapshot of population dynamics."""
        return {
            "num_neurons": self.num_neurons,
            "mean_v_mv": float(np.mean(self.v)),
            "std_v_mv": float(np.std(self.v)),
            "active_spikes": int(np.sum(self.spikes)),
            "refractory_count": int(np.sum(self.refractory_steps_remaining > 0)),
            "total_spikes": int(np.sum(self.total_spikes)),
            "num_excitatory": int(np.sum(self.is_excitatory)),
            "num_inhibitory": int(np.sum(~self.is_excitatory)),
        }
