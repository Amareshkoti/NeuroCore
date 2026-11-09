"""
NEUROCORE - Neural Decoders & Readout Layer
Translates spiking neural network state (spike rates, membrane potentials, attractor basins)
into continuous vectors, classifications, or semantic tokens.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np


class PopulationVectorDecoder:
    """
    Decodes population activity back into continuous scalar or vector estimates
    using center-of-mass / population vector algorithm.
    """

    def __init__(self, centers: np.ndarray) -> None:
        self.centers = np.asarray(centers, dtype=np.float32)

    def decode_scalar(self, spike_counts_or_rates: np.ndarray) -> float:
        """Decode population vector center of mass."""
        weights = np.maximum(0.0, np.asarray(spike_counts_or_rates, dtype=np.float32))
        total_w = np.sum(weights)
        if total_w < 1e-6:
            return float(np.mean(self.centers))
        return float(np.sum(weights * self.centers) / total_w)


class AttractorReadout:
    """
    Compares settled spiking activity against stored target memory attractors
    using normalized cosine similarity and Hamming distance.
    """

    def __init__(self, target_patterns: Dict[str, np.ndarray]) -> None:
        self.target_patterns = {k: np.asarray(v, dtype=np.float32) for k, v in target_patterns.items()}

    def decode(self, neural_activity: np.ndarray) -> Dict[str, Any]:
        """
        Find closest matching stored pattern and compute overlap metrics.
        """
        act = np.asarray(neural_activity, dtype=np.float32)
        act_norm = np.linalg.norm(act) + 1e-8

        similarities: Dict[str, float] = {}
        best_label = "unknown"
        best_sim = -1.0

        for label, pat in self.target_patterns.items():
            pat_norm = np.linalg.norm(pat) + 1e-8
            cos_sim = float(np.dot(act, pat) / (act_norm * pat_norm))
            similarities[label] = round(cos_sim, 4)
            if cos_sim > best_sim:
                best_sim = cos_sim
                best_label = label

        # Binary pattern threshold overlap
        binary_act = (act > np.median(act)).astype(int)
        best_pat = (self.target_patterns[best_label] > 0).astype(int)
        hamming_similarity = 1.0 - float(np.mean(np.abs(binary_act - best_pat)))

        return {
            "matched_label": best_label,
            "cosine_similarity": round(best_sim, 4),
            "hamming_similarity": round(hamming_similarity, 4),
            "all_similarities": similarities,
        }


class LinearReadoutLayer:
    """
    Trainable linear/ridge regression readout layer that maps spike count vectors
    to continuous representations or target classes.
    """

    def __init__(self, num_neurons: int, output_dim: int, l2_reg: float = 1e-3) -> None:
        self.num_neurons = num_neurons
        self.output_dim = output_dim
        self.l2_reg = l2_reg
        # Weight matrix: [output_dim, num_neurons]
        self.weights = np.zeros((output_dim, num_neurons), dtype=np.float32)
        self.bias = np.zeros(output_dim, dtype=np.float32)
        self.is_trained = False

    def fit(self, X: np.ndarray, Y: np.ndarray) -> None:
        """
        Fit readout weights using regularized ridge closed-form solution:
        W = (Y^T * X) * (X^T * X + lambda * I)^-1
        """
        # X: [num_samples, num_neurons], Y: [num_samples, output_dim]
        X = np.asarray(X, dtype=np.float32)
        Y = np.asarray(Y, dtype=np.float32)

        n_samples = X.shape[0]
        # Add bias column
        X_b = np.hstack([X, np.ones((n_samples, 1), dtype=np.float32)])

        # Ridge regression
        xtx = X_b.T @ X_b
        identity = np.eye(xtx.shape[0], dtype=np.float32)
        identity[-1, -1] = 0.0  # Do not regularize bias
        reg_matrix = xtx + self.l2_reg * identity

        # Solve system
        W_all = np.linalg.solve(reg_matrix, X_b.T @ Y).T  # [output_dim, num_neurons + 1]
        self.weights = W_all[:, :-1]
        self.bias = W_all[:, -1]
        self.is_trained = True

    def predict(self, x: np.ndarray) -> np.ndarray:
        """Map neural spike count vector to predicted output space."""
        x = np.asarray(x, dtype=np.float32)
        return self.weights @ x + self.bias
