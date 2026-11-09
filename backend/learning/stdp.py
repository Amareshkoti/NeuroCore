"""
NEUROCORE - Spike-Timing-Dependent Plasticity (STDP)
Implements biophysically verified pre- and post-synaptic spike-trace plasticity (Bi & Poo, 1998).
"""

from typing import Dict, Any, Optional
import numpy as np


class STDPPlasticity:
    """
    Online trace-based Spike-Timing-Dependent Plasticity.
    Maintains presynaptic traces (x_pre) and postsynaptic traces (y_post):
        dx_pre/dt = -x_pre / tau_plus
        dy_post/dt = -y_post / tau_minus

    Weight modification:
        Upon post-synaptic spike i:
            W_ij <- W_ij + a_plus * x_pre_j   (Long-Term Potentiation - LTP)
        Upon pre-synaptic spike j:
            W_ij <- W_ij - a_minus * y_post_i (Long-Term Depression - LTD)
    """

    def __init__(
        self,
        num_neurons: int,
        dt_ms: float = 0.1,
        a_plus: float = 0.008,     # LTP amplitude
        a_minus: float = 0.0085,   # LTD amplitude (slightly higher to maintain stability)
        tau_plus_ms: float = 20.0, # LTP time window (ms)
        tau_minus_ms: float = 20.0,# LTD time window (ms)
        w_min: float = 0.0,
        w_max: float = 2.0,
        is_excitatory: Optional[np.ndarray] = None,
    ) -> None:
        self.num_neurons = num_neurons
        self.dt_ms = dt_ms
        self.a_plus = a_plus
        self.a_minus = a_minus
        self.tau_plus = tau_plus_ms
        self.tau_minus = tau_minus_ms
        self.w_min = w_min
        self.w_max = w_max

        # Exponential decay constants per timestep
        self.decay_pre = np.float32(np.exp(-dt_ms / tau_plus_ms))
        self.decay_post = np.float32(np.exp(-dt_ms / tau_minus_ms))

        # Traces
        self.x_pre = np.zeros(num_neurons, dtype=np.float32)
        self.y_post = np.zeros(num_neurons, dtype=np.float32)

        # STDP is typically applied to excitatory synapses (Dale's principle)
        if is_excitatory is not None:
            self.plastic_mask = np.asarray(is_excitatory, dtype=bool)
        else:
            self.plastic_mask = np.ones(num_neurons, dtype=bool)

        # Cumulative tracking of weight changes for analytics
        self.total_ltp_events = 0
        self.total_ltd_events = 0
        self.net_weight_change = 0.0

    def step(self, weights: np.ndarray, current_spikes: np.ndarray) -> np.ndarray:
        """
        Update synaptic traces and modify connection weights based on spike timing.
        Modifies weights in-place where synapses exist (weights > 0).
        Returns the modified weights matrix.
        """
        # Decay traces
        self.x_pre *= self.decay_pre
        self.y_post *= self.decay_post

        if not np.any(current_spikes):
            return weights

        spiking_ids = np.where(current_spikes)[0]
        spiking_mask = current_spikes.astype(bool)

        # Postsynaptic spikes induce LTP from prior presynaptic activity (x_pre)
        # delta_W[post, :] += A_+ * x_pre[:]
        if np.any(self.x_pre > 1e-4):
            # Only update existing synapses
            for post_id in spiking_ids:
                # Target must have active presynaptic connections
                pre_active = (weights[post_id, :] > 0) & self.plastic_mask
                if np.any(pre_active):
                    dw = self.a_plus * self.x_pre[pre_active]
                    weights[post_id, pre_active] += dw
                    self.total_ltp_events += int(np.sum(pre_active))
                    self.net_weight_change += float(np.sum(dw))

        # Presynaptic spikes induce LTD from prior postsynaptic activity (y_post)
        # delta_W[:, pre] -= A_- * y_post[:]
        if np.any(self.y_post > 1e-4):
            for pre_id in spiking_ids:
                if self.plastic_mask[pre_id]:
                    post_active = weights[:, pre_id] > 0
                    if np.any(post_active):
                        dw = self.a_minus * self.y_post[post_active]
                        weights[post_active, pre_id] -= dw
                        self.total_ltd_events += int(np.sum(post_active))
                        self.net_weight_change -= float(np.sum(dw))

        # Clip weights to biophysical bounds [w_min, w_max]
        np.clip(weights, self.w_min, self.w_max, out=weights)

        # Increment traces for newly spiking neurons
        self.x_pre[spiking_mask] += 1.0
        self.y_post[spiking_mask] += 1.0

        return weights

    def reset(self) -> None:
        """Reset traces and plasticity counters."""
        self.x_pre.fill(0.0)
        self.y_post.fill(0.0)
        self.total_ltp_events = 0
        self.total_ltd_events = 0
        self.net_weight_change = 0.0

    def get_metrics(self) -> Dict[str, Any]:
        """Return plasticity telemetry."""
        return {
            "total_ltp_events": self.total_ltp_events,
            "total_ltd_events": self.total_ltd_events,
            "net_weight_change": round(self.net_weight_change, 5),
            "mean_x_pre_trace": float(np.mean(self.x_pre)),
            "mean_y_post_trace": float(np.mean(self.y_post)),
        }
