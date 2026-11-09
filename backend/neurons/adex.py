"""
NEUROCORE - Adaptive Exponential Leaky Integrate-and-Fire (AdEx) Neuron Model
Implements spike-frequency adaptation and biological bursting dynamics.
Reference: Brette & Gerstner (2005).
"""

from typing import Dict, Any, Optional
import numpy as np
from backend.neurons.base import BaseNeuronPopulation


class AdExPopulation(BaseNeuronPopulation):
    """
    Population of Adaptive Exponential (AdEx) integrate-and-fire neurons.
    Coupled two-variable differential equations:
        tau_m * (dV/dt) = -(V - V_rest) + delta_t * exp((V - V_th) / delta_t) - R_m * w + R_m * I
        tau_w * (dw/dt) = a * (V - V_rest) - w

    Spike reset:
        if V >= V_peak:
            V -> V_reset
            w -> w + b
    """

    def __init__(
        self,
        num_neurons: int,
        dt_ms: float = 0.1,
        v_rest_mv: float = -70.0,
        v_reset_mv: float = -65.0,
        v_th_mv: float = -50.0,
        v_peak_mv: float = 0.0,
        delta_t_mv: float = 2.0,
        tau_m_ms: float = 20.0,
        r_m_mohm: float = 10.0,
        tau_w_ms: float = 100.0,
        a_ns: float = 2.0,       # Subthreshold adaptation conductance (nS)
        b_pa: float = 50.0,      # Spike-triggered adaptation current jump (pA)
        tau_ref_ms: float = 2.0,
        is_excitatory: Optional[np.ndarray] = None,
        seed: Optional[int] = None
    ) -> None:
        super().__init__(num_neurons=num_neurons, dt_ms=dt_ms, seed=seed)

        self.v_rest = float(v_rest_mv)
        self.v_reset = float(v_reset_mv)
        self.v_th = float(v_th_mv)
        self.v_peak = float(v_peak_mv)
        self.delta_t = float(delta_t_mv)
        self.tau_m = float(tau_m_ms)
        self.r_m = float(r_m_mohm)
        self.tau_w = float(tau_w_ms)
        self.a = float(a_ns)
        self.b = float(b_pa)
        self.tau_ref = float(tau_ref_ms)

        self.refractory_steps_total = int(round(self.tau_ref / self.dt_ms))

        # Adaptation variable w (pA)
        self.w = np.zeros(num_neurons, dtype=np.float32)

        # Excitatory / Inhibitory partition
        if is_excitatory is None:
            num_exc = int(0.8 * num_neurons)
            self.is_excitatory = np.zeros(num_neurons, dtype=bool)
            self.is_excitatory[:num_exc] = True
            self.rng.shuffle(self.is_excitatory)
        else:
            self.is_excitatory = np.asarray(is_excitatory, dtype=bool)

        self._initialize_spatial_coordinates()
        self.reset()

    def _initialize_spatial_coordinates(self) -> None:
        phi = self.rng.uniform(0, 2 * np.pi, self.num_neurons)
        cos_theta = self.rng.uniform(-1, 1, self.num_neurons)
        theta = np.arccos(cos_theta)
        r = (self.rng.uniform(0.15, 1.0, self.num_neurons) ** (1.0 / 3.0))

        self.positions[:, 0] = 100.0 * r * np.sin(theta) * np.cos(phi)
        self.positions[:, 1] = 60.0 * r * np.sin(theta) * np.sin(phi)
        self.positions[:, 2] = 80.0 * r * np.cos(theta)

    def reset(self) -> None:
        noise = self.rng.normal(0.0, 0.5, self.num_neurons).astype(np.float32)
        self.v = np.clip(self.v_rest + noise, self.v_reset - 5.0, self.v_th - 1.0)
        self.w = np.zeros(self.num_neurons, dtype=np.float32)
        self.spikes = np.zeros(self.num_neurons, dtype=bool)
        self.refractory_steps_remaining = np.zeros(self.num_neurons, dtype=np.int32)
        self.total_spikes = np.zeros(self.num_neurons, dtype=np.int64)

    def step(self, i_syn: np.ndarray, i_ext: np.ndarray) -> np.ndarray:
        is_refractory = self.refractory_steps_remaining > 0
        self.refractory_steps_remaining[is_refractory] -= 1
        self.v[is_refractory] = self.v_reset

        can_integrate = ~is_refractory
        total_current = i_syn + i_ext

        # AdEx exponential term with numerical clipping to prevent overflow
        exp_arg = np.clip((self.v[can_integrate] - self.v_th) / self.delta_t, -50.0, 20.0)
        exp_term = self.delta_t * np.exp(exp_arg)

        # dv/dt
        dv = (
            -(self.v[can_integrate] - self.v_rest)
            + exp_term
            - (self.r_m * 0.001) * self.w[can_integrate]
            + self.r_m * total_current[can_integrate]
        ) * (self.dt_ms / self.tau_m)

        # dw/dt
        dw = (
            self.a * (self.v[can_integrate] - self.v_rest) - self.w[can_integrate]
        ) * (self.dt_ms / self.tau_w)

        self.v[can_integrate] += dv.astype(np.float32)
        self.w[can_integrate] += dw.astype(np.float32)

        # Spike detection at peak threshold
        spikes = np.zeros(self.num_neurons, dtype=bool)
        spiked_indices = np.where(self.v >= self.v_peak)[0]

        if len(spiked_indices) > 0:
            spikes[spiked_indices] = True
            self.v[spiked_indices] = self.v_reset
            self.w[spiked_indices] += self.b  # Spike-frequency adaptation jump
            self.refractory_steps_remaining[spiked_indices] = self.refractory_steps_total
            self.total_spikes[spiked_indices] += 1

        self.spikes = spikes
        return spikes

    def get_state(self) -> Dict[str, Any]:
        return {
            "num_neurons": self.num_neurons,
            "mean_v_mv": float(np.mean(self.v)),
            "mean_w_pa": float(np.mean(self.w)),
            "active_spikes": int(np.sum(self.spikes)),
            "refractory_count": int(np.sum(self.refractory_steps_remaining > 0)),
            "total_spikes": int(np.sum(self.total_spikes)),
        }
