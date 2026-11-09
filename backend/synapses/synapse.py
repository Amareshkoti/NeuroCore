"""
NEUROCORE - Synaptic Transmission & Connection Network
Implements biophysically grounded conductance/current kinetics with conduction delays and Dale's principle.
"""

from typing import Dict, Any, Optional, Tuple
import numpy as np


class SynapticConnections:
    """
    Manages synaptic connectivity matrix and dynamic current transmission.
    Adheres strictly to Dale's Principle:
    - Excitatory presynaptic neurons release excitatory neurotransmitters (e.g. Glutamate / AMPA kinetics).
    - Inhibitory presynaptic neurons release inhibitory neurotransmitters (e.g. GABA kinetics).
    """

    def __init__(
        self,
        num_neurons: int,
        is_excitatory: np.ndarray,
        dt_ms: float = 0.1,
        tau_exc_ms: float = 5.0,
        tau_inh_ms: float = 10.0,
        delay_ms: float = 1.0,
        connection_probability: float = 0.1,
        weight_scale: float = 0.5,
        seed: Optional[int] = None
    ) -> None:
        self.num_neurons = num_neurons
        self.is_excitatory = np.asarray(is_excitatory, dtype=bool)
        self.dt_ms = dt_ms
        self.tau_exc = tau_exc_ms
        self.tau_inh = tau_inh_ms
        self.delay_ms = delay_ms
        self.rng = np.random.default_rng(seed)

        # Decay factors per timestep: exp(-dt / tau)
        self.decay_exc = np.float32(np.exp(-dt_ms / tau_exc_ms))
        self.decay_inh = np.float32(np.exp(-dt_ms / tau_inh_ms))

        # Dynamic postsynaptic currents (nA or arbitrary calibrated biological current)
        self.i_exc = np.zeros(num_neurons, dtype=np.float32)
        self.i_inh = np.zeros(num_neurons, dtype=np.float32)

        # Conduction delay buffer
        self.delay_steps = max(1, int(round(delay_ms / dt_ms)))
        self.delay_buffer = np.zeros((self.delay_steps, num_neurons), dtype=bool)
        self.delay_pointer = 0

        # Construct synaptic weight matrix W [target_post, source_pre]
        # strictly non-negative; excitatory vs inhibitory sign is applied dynamically
        self.weights = np.zeros((num_neurons, num_neurons), dtype=np.float32)
        self._initialize_connectivity(connection_probability, weight_scale)

    def _initialize_connectivity(self, p: float, scale: float) -> None:
        """
        Create sparse recurrent connectivity with autapse avoidance (no self-loops W_ii = 0).
        Excitatory synapses are calibrated to drive activity;
        Inhibitory synapses are calibrated higher to maintain cortical E/I balance (typically 4x stronger).
        """
        # Random Erdős-Rényi sparse graph
        mask = self.rng.random((self.num_neurons, self.num_neurons)) < p
        np.fill_diagonal(mask, False)

        # Initial random log-normal synaptic weights (biologically realistic long-tailed distribution)
        raw_weights = self.rng.lognormal(mean=0.0, sigma=0.5, size=(self.num_neurons, self.num_neurons))
        raw_weights = raw_weights / np.mean(raw_weights) * scale

        # Apply mask
        self.weights = (raw_weights * mask).astype(np.float32)

        # Strengthen inhibitory presynaptic columns to ensure inhibition counterbalances excitation
        inh_indices = np.where(~self.is_excitatory)[0]
        self.weights[:, inh_indices] *= 3.0

        # Calculate number of active synapses
        self.num_synapses = int(np.sum(mask))

    def step(self, current_spikes: np.ndarray) -> np.ndarray:
        """
        Advance synaptic kinetics by one timestep:
        1. Store current spikes into conduction delay buffer.
        2. Retrieve delayed spikes from conduction buffer.
        3. Propagate delayed spikes through synaptic weight matrix.
        4. Apply exponential decay to excitatory and inhibitory currents.
        5. Return net synaptic current I_syn = I_exc - I_inh.
        """
        # 1. Circular delay buffer insertion
        self.delay_buffer[self.delay_pointer] = current_spikes

        # 2. Retrieve delayed spikes
        read_pointer = (self.delay_pointer + 1) % self.delay_steps
        delayed_spikes = self.delay_buffer[read_pointer]

        # Advance pointer
        self.delay_pointer = read_pointer

        # 3. Decay existing currents
        self.i_exc *= self.decay_exc
        self.i_inh *= self.decay_inh

        # 4. Synaptic release from delayed spiking neurons
        if np.any(delayed_spikes):
            spiking_indices = np.where(delayed_spikes)[0]
            spiking_exc = spiking_indices[self.is_excitatory[spiking_indices]]
            spiking_inh = spiking_indices[~self.is_excitatory[spiking_indices]]

            if len(spiking_exc) > 0:
                # Target neurons receive excitatory current: sum of W[:, pre]
                delta_exc = np.sum(self.weights[:, spiking_exc], axis=1)
                self.i_exc += delta_exc

            if len(spiking_inh) > 0:
                # Target neurons receive inhibitory current: sum of W[:, pre]
                delta_inh = np.sum(self.weights[:, spiking_inh], axis=1)
                self.i_inh += delta_inh

        # 5. Net synaptic current: Excitation depolarizes, Inhibition hyperpolarizes
        return self.i_exc - self.i_inh

    def reset(self) -> None:
        """Clear synaptic currents and delay buffers."""
        self.i_exc.fill(0.0)
        self.i_inh.fill(0.0)
        self.delay_buffer.fill(False)
        self.delay_pointer = 0

    def get_summary(self) -> Dict[str, Any]:
        """Return connectivity metadata."""
        non_zero = self.weights[self.weights > 0]
        return {
            "num_synapses": self.num_synapses,
            "mean_weight": float(np.mean(non_zero)) if len(non_zero) > 0 else 0.0,
            "max_weight": float(np.max(non_zero)) if len(non_zero) > 0 else 0.0,
            "min_weight": float(np.min(non_zero)) if len(non_zero) > 0 else 0.0,
            "mean_exc_current": float(np.mean(self.i_exc)),
            "mean_inh_current": float(np.mean(self.i_inh)),
        }
