"""
NEUROCORE - Base Neuron Model
Defines the abstract interface for biologically plausible simulated spiking neurons.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import numpy as np


class BaseNeuronPopulation(ABC):
    """
    Abstract base class for a population of spiking neurons.
    Operates on vectorized NumPy arrays for high-performance CPU simulation.
    """

    def __init__(
        self,
        num_neurons: int,
        dt_ms: float = 0.1,
        seed: Optional[int] = None
    ) -> None:
        if num_neurons <= 0:
            raise ValueError(f"num_neurons must be positive, got {num_neurons}")
        if dt_ms <= 0:
            raise ValueError(f"dt_ms must be positive, got {dt_ms}")

        self.num_neurons = num_neurons
        self.dt_ms = dt_ms
        self.rng = np.random.default_rng(seed)

        # 3D spatial positioning for visualization & topology
        self.positions: np.ndarray = np.zeros((num_neurons, 3), dtype=np.float32)

        # Vectorized neuron state arrays
        self.v: np.ndarray = np.zeros(num_neurons, dtype=np.float32)
        self.spikes: np.ndarray = np.zeros(num_neurons, dtype=bool)
        self.refractory_steps_remaining: np.ndarray = np.zeros(num_neurons, dtype=np.int32)
        self.spike_history: list[np.ndarray] = []
        self.total_spikes: np.ndarray = np.zeros(num_neurons, dtype=np.int64)

    @abstractmethod
    def step(self, i_syn: np.ndarray, i_ext: np.ndarray) -> np.ndarray:
        """
        Advance population state by one time-step dt_ms.
        Returns boolean array of spikes for the current time-step.
        """
        pass

    @abstractmethod
    def reset(self) -> None:
        """Reset all internal states to baseline."""
        pass

    @abstractmethod
    def get_state(self) -> Dict[str, Any]:
        """Return a snapshot of current population metrics."""
        pass
