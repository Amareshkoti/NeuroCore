"""
NEUROCORE - Hebbian Learning & Oja's Normalized Rule
Implements associative covariance learning and stable single-unit PCA convergence.
"""

from typing import Dict, Any, Optional
import numpy as np


class HebbianPlasticity:
    """
    Hebbian learning rule with Oja's weight normalization:
        delta_W_ij = eta * y_i * (x_j - y_i * W_ij)
    Where y_i is postsynaptic activity and x_j is presynaptic activity.
    """

    def __init__(
        self,
        num_neurons: int,
        learning_rate: float = 0.001,
        w_min: float = 0.0,
        w_max: float = 2.0,
    ) -> None:
        self.num_neurons = num_neurons
        self.eta = learning_rate
        self.w_min = w_min
        self.w_max = w_max
        self.total_updates = 0

    def step(self, weights: np.ndarray, pre_activity: np.ndarray, post_activity: np.ndarray) -> np.ndarray:
        """
        Apply Oja's Hebbian update given firing rates or instantaneous activity vectors.
        """
        # Outer product: post x pre
        y = post_activity[:, np.newaxis]
        x = pre_activity[np.newaxis, :]

        # Oja's rule: delta_W = eta * (y * x - (y^2) * W)
        dw = self.eta * (y * x - (y ** 2) * weights)

        # Apply only to existing connections
        mask = weights > 0
        weights[mask] += dw[mask]
        np.clip(weights, self.w_min, self.w_max, out=weights)

        self.total_updates += 1
        return weights

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "total_updates": self.total_updates,
            "learning_rate": self.eta,
        }
