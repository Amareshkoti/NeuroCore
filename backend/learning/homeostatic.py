"""
NEUROCORE - Homeostatic Plasticity & Synaptic Scaling
Maintains network stability, dynamic range, and target firing rates (Turrigiano, 2008).
"""

from typing import Dict, Any, Optional
import numpy as np


class HomeostaticPlasticity:
    """
    Implements activity-dependent homeostatic synaptic scaling.
    Slowly normalizes incoming synaptic weights to stabilize target firing rates:
        r_running_i <- (1 - dt / tau_avg) * r_running_i + (spikes_i / dt) * (dt / tau_avg)
        W_ij <- W_ij * (1 + gamma * (r_target - r_running_i))
    """

    def __init__(
        self,
        num_neurons: int,
        dt_ms: float = 0.1,
        target_rate_hz: float = 5.0,
        tau_avg_ms: float = 1000.0,
        learning_rate: float = 0.0001,
        w_min: float = 0.01,
        w_max: float = 2.0,
    ) -> None:
        self.num_neurons = num_neurons
        self.dt_ms = dt_ms
        self.target_rate_hz = target_rate_hz
        self.tau_avg_ms = tau_avg_ms
        self.gamma = learning_rate
        self.w_min = w_min
        self.w_max = w_max

        # Running average firing rate (Hz) per neuron
        self.r_avg = np.ones(num_neurons, dtype=np.float32) * target_rate_hz

        # Filter decay per step
        self.alpha = np.float32(dt_ms / tau_avg_ms)

    def step(self, weights: np.ndarray, current_spikes: np.ndarray) -> np.ndarray:
        """
        Update running firing rate estimates and scale synaptic weights accordingly.
        """
        # Instantaneous rate (Hz) for this step
        instant_rate = (current_spikes.astype(np.float32) / (self.dt_ms / 1000.0))

        # Low-pass filter running average
        self.r_avg = (1.0 - self.alpha) * self.r_avg + self.alpha * instant_rate

        # Multiplicative scaling factor per postsynaptic neuron: 1 + gamma * (target - actual)
        scaling = 1.0 + self.gamma * (self.target_rate_hz - self.r_avg)
        scaling = np.clip(scaling, 0.9, 1.1)  # Bound single-step change for stability

        # Scale incoming rows: W[post, :] *= scaling[post]
        # Only scale active synapses
        mask = weights > 0
        weights[mask] = (weights[mask] * np.repeat(scaling[:, np.newaxis], weights.shape[1], axis=1)[mask])

        np.clip(weights, self.w_min, self.w_max, out=weights)
        return weights

    def reset(self) -> None:
        self.r_avg.fill(self.target_rate_hz)

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "target_rate_hz": self.target_rate_hz,
            "mean_estimated_rate_hz": float(np.mean(self.r_avg)),
            "std_estimated_rate_hz": float(np.std(self.r_avg)),
            "underactive_neurons": int(np.sum(self.r_avg < (self.target_rate_hz * 0.5))),
            "overactive_neurons": int(np.sum(self.r_avg > (self.target_rate_hz * 1.5))),
        }
