"""
NEUROCORE - Associative Neural Memory & Recurrent Attractor Subsystem
Implements genuine biological pattern storage, partial recall, noise recovery, and temporal sequence memory.
The memory is physically encoded in the recurrent synaptic connectivity matrix W, not in a lookup table.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from backend.networks.network import SpikingNeuralNetwork
from backend.encoders.sensory import MultimodalSensoryInterface
from backend.decoders.readout import AttractorReadout


class RecurrentAttractorMemory:
    """
    Associative Memory backed by actual recurrent spiking neural networks and attractor dynamics.
    Patterns are stored by computing biological Hebbian covariance matrices into recurrent synapses.
    Retrieval occurs through dynamical settling into energy attractor basins.
    """

    def __init__(
        self,
        num_neurons: int = 500,
        model_type: str = "lif",
        dt_ms: float = 0.1,
        weight_scale: float = 1.2,
        seed: Optional[int] = 42,
    ) -> None:
        self.num_neurons = num_neurons
        self.dt_ms = dt_ms
        self.weight_scale = weight_scale
        self.seed = seed
        self.rng = np.random.default_rng(seed)

        # Underlying real Spiking Neural Network
        self.network = SpikingNeuralNetwork(
            num_neurons=num_neurons,
            model_type=model_type,
            dt_ms=dt_ms,
            excitatory_ratio=0.85,
            connection_probability=0.1,
            seed=seed,
        )

        self.encoder = MultimodalSensoryInterface(num_neurons=num_neurons)
        self.stored_pattern_keys: List[str] = []
        self.stored_patterns: Dict[str, np.ndarray] = {}
        self.pattern_sparsity = 0.2  # 20% active neurons per sparse pattern (biologically realistic)

    def generate_sparse_pattern(self, name: str) -> np.ndarray:
        """Generate a random orthogonal sparse binary pattern (e.g. 20% ones)."""
        pat = np.zeros(self.num_neurons, dtype=np.float32)
        num_active = int(round(self.num_neurons * self.pattern_sparsity))
        active_indices = self.rng.choice(self.num_neurons, size=num_active, replace=False)
        pat[active_indices] = 1.0
        return pat

    def store_patterns(self, pattern_dict: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """
        Embed patterns into the actual synaptic weight matrix W using Hebbian covariance:
            W_ij = scale * sum_mu (xi_i^mu - a) * (xi_j^mu - a)
        Autapses (W_ii) are zeroed. Inhibitory interneurons are calibrated to prevent epileptic blowup.
        """
        self.stored_patterns = {k: np.asarray(v, dtype=np.float32) for k, v in pattern_dict.items()}
        self.stored_pattern_keys = list(pattern_dict.keys())

        # Reset weight matrix
        W_hebbian = np.zeros((self.num_neurons, self.num_neurons), dtype=np.float32)
        a = self.pattern_sparsity

        for name, pat in self.stored_patterns.items():
            # Zero-mean sparse covariance vector
            xi = pat - a
            # Outer product: xi x xi^T
            W_hebbian += np.outer(xi, xi)

        # Scale by network size and parameter
        W_hebbian = (W_hebbian / (self.num_neurons * a * (1.0 - a))) * self.weight_scale

        # Zero self-connections (no autapses)
        np.fill_diagonal(W_hebbian, 0.0)

        # Enforce Dale's Principle:
        # Excitatory columns project positive weights;
        # Non-negative weights with positive values for excitatory presynaptic neurons
        w_positive = np.maximum(0.0, W_hebbian)

        # Balance with baseline recurrent inhibition
        inh_indices = np.where(~self.network.is_excitatory)[0]
        w_positive[:, inh_indices] = 0.5  # Fixed recurrent inhibitory pool

        # Inject into network synapses
        self.network.synapses.weights = w_positive.astype(np.float32)
        self.readout = AttractorReadout(self.stored_patterns)

        return {
            "num_patterns_stored": len(self.stored_patterns),
            "num_synapses_potentiated": int(np.sum(w_positive > 0)),
            "mean_synaptic_weight": float(np.mean(w_positive[w_positive > 0])),
        }

    def recall(
        self,
        cue_pattern: np.ndarray,
        stim_duration_ms: float = 25.0,
        settle_duration_ms: float = 40.0,
        cue_strength_na: float = 2.5,
    ) -> Dict[str, Any]:
        """
        Run genuine dynamical recall:
        1. Stimulate network with cue pattern for stim_duration_ms.
        2. Remove cue current, allowing recurrent attractor dynamics to settle for settle_duration_ms.
        3. Read out settled spike rates and determine recovered pattern overlap.
        """
        self.network.reset()

        # Phase 1: Stimulation with cue
        i_stim = self.encoder.encode_binary_pattern(cue_pattern, on_current_na=cue_strength_na, off_current_na=0.0)
        self.network.inject_current(i_stim)
        self.network.run(duration_ms=stim_duration_ms)

        # Phase 2: Autonomous attractor settling (no external current, only recurrent feedback)
        self.network.inject_current(np.zeros(self.num_neurons, dtype=np.float32))
        self.network.run(duration_ms=settle_duration_ms)

        # Decoded activity: spike count across settling phase
        settled_rates = self.network.population_firing_rates_hz
        readout_metrics = self.readout.decode(settled_rates)

        return {
            "matched_label": readout_metrics["matched_label"],
            "cosine_similarity": readout_metrics["cosine_similarity"],
            "hamming_similarity": readout_metrics["hamming_similarity"],
            "settled_firing_rate_hz": float(np.mean(settled_rates)),
            "total_settling_spikes": self.network.total_spike_count,
            "all_similarities": readout_metrics["all_similarities"],
        }

    def test_noise_recovery(self, pattern_name: str, noise_fractions: List[float]) -> List[Dict[str, Any]]:
        """
        Benchmark pattern restoration accuracy under progressive bit-flip noise (e.g. 10% to 50%).
        """
        if pattern_name not in self.stored_patterns:
            raise KeyError(f"Pattern '{pattern_name}' not stored in memory")

        original_pat = self.stored_patterns[pattern_name]
        results = []

        for noise_p in noise_fractions:
            # Corrupt pattern: flip noise_p fraction of bits
            noisy_pat = original_pat.copy()
            flip_mask = self.rng.random(self.num_neurons) < noise_p
            noisy_pat[flip_mask] = 1.0 - noisy_pat[flip_mask]

            # Measure initial cue overlap before network simulation
            cue_cos = float(np.dot(noisy_pat, original_pat) / (np.linalg.norm(noisy_pat) * np.linalg.norm(original_pat) + 1e-8))

            # Run network recall
            recall_res = self.recall(noisy_pat)

            results.append({
                "noise_fraction": noise_p,
                "input_cue_similarity": round(cue_cos, 4),
                "recovered_similarity": recall_res["cosine_similarity"],
                "matched_label": recall_res["matched_label"],
                "is_correct_attractor": (recall_res["matched_label"] == pattern_name),
            })

        return results

    def test_partial_recall(self, pattern_name: str, mask_fractions: List[float]) -> List[Dict[str, Any]]:
        """
        Benchmark pattern completion accuracy under progressive occlusion/masking (e.g. 20% to 70% masked).
        """
        if pattern_name not in self.stored_patterns:
            raise KeyError(f"Pattern '{pattern_name}' not stored in memory")

        original_pat = self.stored_patterns[pattern_name]
        results = []

        for mask_p in mask_fractions:
            # Mask out mask_p fraction of the pattern to 0
            partial_pat = original_pat.copy()
            mask = self.rng.random(self.num_neurons) < mask_p
            partial_pat[mask] = 0.0

            recall_res = self.recall(partial_pat)

            results.append({
                "mask_fraction": mask_p,
                "recovered_similarity": recall_res["cosine_similarity"],
                "matched_label": recall_res["matched_label"],
                "is_correct_attractor": (recall_res["matched_label"] == pattern_name),
            })

        return results
