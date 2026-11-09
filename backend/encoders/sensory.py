"""
NEUROCORE - Neural Sensory Encoders
Translates multimodal data (text embeddings, numerical vectors, binary signals, time-series)
into biologically realistic neural stimulation currents and spike trains.
"""

from typing import Dict, Any, List, Optional, Union
import numpy as np


class RateEncoder:
    """
    Rate Coding: Maps normalized input signal x in [0, 1] into proportional firing rates
    or equivalent injected stimulation currents I_ext = I_base + (I_max - I_base) * x.
    """

    def __init__(
        self,
        num_neurons: int,
        i_base_na: float = 0.5,
        i_max_na: float = 3.5,
        f_min_hz: float = 0.0,
        f_max_hz: float = 100.0,
    ) -> None:
        self.num_neurons = num_neurons
        self.i_base = i_base_na
        self.i_max = i_max_na
        self.f_min = f_min_hz
        self.f_max = f_max_hz

    def encode_current(self, signal: np.ndarray) -> np.ndarray:
        """Map feature vector of arbitrary length to population injection currents."""
        signal = np.asarray(signal, dtype=np.float32)
        if len(signal) == 0:
            return np.ones(self.num_neurons, dtype=np.float32) * self.i_base

        if len(signal) == 1:
            features = np.ones(self.num_neurons, dtype=np.float32) * signal[0]
        elif len(signal) != self.num_neurons:
            x_old = np.linspace(0, 1, len(signal))
            x_new = np.linspace(0, 1, self.num_neurons)
            features = np.interp(x_new, x_old, signal).astype(np.float32)
        else:
            features = signal.copy()

        # Normalize to [0, 1]
        f_min, f_max = float(np.min(features)), float(np.max(features))
        if f_max > f_min:
            norm_features = (features - f_min) / (f_max - f_min)
        else:
            norm_features = np.zeros_like(features)

        return (self.i_base + (self.i_max - self.i_base) * norm_features).astype(np.float32)

    def generate_poisson_spikes(self, signal: np.ndarray, dt_ms: float, rng: np.random.Generator) -> np.ndarray:
        """Generate stochastic Poisson spike events for the current timestep."""
        currents = self.encode_current(signal)
        # Rate proportional to current: r = (I - I_base) / (I_max - I_base) * f_max
        rates_hz = np.clip((currents - self.i_base) / (self.i_max - self.i_base + 1e-6) * self.f_max, 0.0, self.f_max)
        prob_spike = rates_hz * (dt_ms / 1000.0)
        return rng.random(self.num_neurons) < prob_spike


class TemporalEncoder:
    """
    Temporal (Latency) Coding: Information is encoded in the precise time-to-first-spike.
    Stronger inputs trigger earlier spikes (shorter latencies):
        t_spike(x) = t_min + tau * ln(1 / (x + epsilon))
    """

    def __init__(
        self,
        num_neurons: int,
        t_min_ms: float = 1.0,
        t_max_ms: float = 20.0,
    ) -> None:
        self.num_neurons = num_neurons
        self.t_min = t_min_ms
        self.t_max = t_max_ms

    def encode_latencies(self, signal: np.ndarray) -> np.ndarray:
        """Return spike latency in milliseconds for each neuron."""
        if len(signal) > self.num_neurons:
            x_old = np.linspace(0, 1, len(signal))
            x_new = np.linspace(0, 1, self.num_neurons)
            features = np.interp(x_new, x_old, signal)
        else:
            features = np.zeros(self.num_neurons, dtype=np.float32)
            features[:len(signal)] = signal

        norm_signal = np.clip(features, 0.0, 1.0)
        # Latency inversely proportional to signal intensity
        latencies = self.t_max - norm_signal * (self.t_max - self.t_min)
        return latencies.astype(np.float32)


class PopulationEncoder:
    """
    Population Coding (Gaussian Tuning Curves):
    Encodes continuous variables across an array of neurons with bell-shaped receptive fields:
        r_k(x) = r_peak * exp( - (x - mu_k)^2 / (2 * sigma^2) )
    """

    def __init__(
        self,
        num_neurons: int,
        val_min: float = -1.0,
        val_max: float = 1.0,
        sigma: Optional[float] = None,
        i_peak_na: float = 3.0,
    ) -> None:
        self.num_neurons = num_neurons
        self.val_min = val_min
        self.val_max = val_max
        self.centers = np.linspace(val_min, val_max, num_neurons, dtype=np.float32)
        if sigma is None:
            self.sigma = float((val_max - val_min) / (num_neurons * 0.5))
        else:
            self.sigma = sigma
        self.i_peak = i_peak_na

    def encode(self, scalar_or_vector: Union[float, np.ndarray]) -> np.ndarray:
        """Encode values into population current vector."""
        if np.isscalar(scalar_or_vector):
            val = float(scalar_or_vector)
            current = self.i_peak * np.exp(-((val - self.centers) ** 2) / (2.0 * self.sigma ** 2))
            return current.astype(np.float32)

        # Multi-dimensional vector: project onto population centers
        vec = np.asarray(scalar_or_vector, dtype=np.float32)
        # Compute nearest center distances
        expanded_vec = np.interp(np.linspace(0, 1, self.num_neurons), np.linspace(0, 1, len(vec)), vec)
        current = self.i_peak * np.exp(-((expanded_vec - self.centers) ** 2) / (2.0 * self.sigma ** 2))
        return current.astype(np.float32)


class MultimodalSensoryInterface:
    """
    High-level gateway supporting text embeddings, numerical arrays, binary masks, and time-series.
    """

    def __init__(self, num_neurons: int) -> None:
        self.num_neurons = num_neurons
        self.rate_encoder = RateEncoder(num_neurons=num_neurons)
        self.temporal_encoder = TemporalEncoder(num_neurons=num_neurons)
        self.population_encoder = PopulationEncoder(num_neurons=num_neurons)

    def encode_text_embedding(self, embedding_vector: List[float], method: str = "rate") -> np.ndarray:
        """Transform high-dimensional text embedding (e.g. 768-dim from nomic-embed-text) to neural drive."""
        arr = np.array(embedding_vector, dtype=np.float32)
        if method == "rate":
            return self.rate_encoder.encode_current(arr)
        elif method == "population":
            return self.population_encoder.encode(arr)
        return self.rate_encoder.encode_current(arr)

    def encode_binary_pattern(self, pattern: np.ndarray, on_current_na: float = 2.8, off_current_na: float = 0.0) -> np.ndarray:
        """Transform binary pattern into discrete neural stimulation."""
        currents = np.zeros(self.num_neurons, dtype=np.float32)
        n = min(len(pattern), self.num_neurons)
        currents[:n] = np.where(pattern[:n] > 0, on_current_na, off_current_na)
        return currents
