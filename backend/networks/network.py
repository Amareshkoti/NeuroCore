"""
NEUROCORE - Spiking Neural Network Orchestrator
Integrates neuron populations, synaptic connectivity, stimulation currents, and real-time statistics.
"""

from typing import Dict, Any, Optional, List, Tuple
import numpy as np
from backend.neurons.base import BaseNeuronPopulation
from backend.neurons.lif import LIFPopulation
from backend.neurons.adex import AdExPopulation
from backend.synapses.synapse import SynapticConnections


class SpikingNeuralNetwork:
    """
    Complete Spiking Neural Network (SNN) representing a cortical column or microcircuit.
    Configurable up to thousands of neurons with Dale's principle and recurrent topology.
    """

    def __init__(
        self,
        num_neurons: int = 1000,
        model_type: str = "lif",
        dt_ms: float = 0.1,
        excitatory_ratio: float = 0.8,
        connection_probability: float = 0.05,
        synaptic_delay_ms: float = 1.0,
        weight_scale: float = 0.6,
        seed: Optional[int] = 42,
    ) -> None:
        self.num_neurons = num_neurons
        self.model_type = model_type.lower()
        self.dt_ms = dt_ms
        self.excitatory_ratio = excitatory_ratio
        self.seed = seed
        self.rng = np.random.default_rng(seed)

        # Simulation clock
        self.current_time_ms = 0.0
        self.step_count = 0

        # Construct neuron phenotype array (Dale's principle)
        num_exc = int(round(num_neurons * excitatory_ratio))
        is_exc = np.zeros(num_neurons, dtype=bool)
        is_exc[:num_exc] = True
        self.rng.shuffle(is_exc)
        self.is_excitatory = is_exc

        # Instantiate Neuron Population
        if self.model_type == "adex":
            self.neurons: BaseNeuronPopulation = AdExPopulation(
                num_neurons=num_neurons,
                dt_ms=dt_ms,
                is_excitatory=is_exc,
                seed=seed,
            )
        else:
            self.neurons = LIFPopulation(
                num_neurons=num_neurons,
                dt_ms=dt_ms,
                is_excitatory=is_exc,
                seed=seed,
            )

        # Instantiate Synapses
        self.synapses = SynapticConnections(
            num_neurons=num_neurons,
            is_excitatory=is_exc,
            dt_ms=dt_ms,
            delay_ms=synaptic_delay_ms,
            connection_probability=connection_probability,
            weight_scale=weight_scale,
            seed=seed,
        )

        # External stimulation input vector (pA or nA)
        self.i_ext = np.zeros(num_neurons, dtype=np.float32)

        # Activity recording buffers
        self.history_window_size = 500  # Steps of recent spike history for visualization & raster
        self.spike_raster: List[Tuple[float, int]] = []  # List of (time_ms, neuron_id)
        self.recent_spikes_buffer = np.zeros((self.history_window_size, num_neurons), dtype=bool)
        self.buffer_pointer = 0

        # Metrics tracking
        self.total_spike_count = 0
        self.population_firing_rates_hz = np.zeros(num_neurons, dtype=np.float32)

    def inject_current(self, current_vector: np.ndarray) -> None:
        """Inject external sensory or experimental stimulation current."""
        if len(current_vector) != self.num_neurons:
            raise ValueError(f"Expected current vector of size {self.num_neurons}, got {len(current_vector)}")
        self.i_ext = current_vector.astype(np.float32)

    def add_background_noise(self, mean_pA: float = 0.0, std_pA: float = 0.5) -> None:
        """Add spontaneous biological background Poisson/Gaussian noise."""
        noise = self.rng.normal(mean_pA, std_pA, self.num_neurons).astype(np.float32)
        self.i_ext += noise

    def step(self) -> np.ndarray:
        """
        Execute one discrete simulation step:
        1. Calculate net recurrent synaptic currents.
        2. Advance neuronal membrane differential equations.
        3. Record spikes, update raster, and increment simulation time.
        """
        # 1. Update synaptic transmission from previous step spikes
        i_syn = self.synapses.step(self.neurons.spikes)

        # 2. Advance neurons with total current (i_syn + i_ext)
        current_spikes = self.neurons.step(i_syn=i_syn, i_ext=self.i_ext)

        # 3. Record spike event metadata
        spike_count = int(np.sum(current_spikes))
        self.total_spike_count += spike_count

        # Circular buffer for recent activity
        self.recent_spikes_buffer[self.buffer_pointer] = current_spikes
        self.buffer_pointer = (self.buffer_pointer + 1) % self.history_window_size

        if spike_count > 0:
            spiked_ids = np.where(current_spikes)[0]
            t = self.current_time_ms
            for nid in spiked_ids:
                self.spike_raster.append((round(t, 2), int(nid)))

            # Prune raster list to keep memory bounded (last 5,000 spikes)
            if len(self.spike_raster) > 5000:
                self.spike_raster = self.spike_raster[-5000:]

        # Increment simulation clock
        self.current_time_ms += self.dt_ms
        self.step_count += 1

        # Running firing rate (Hz) estimation over window
        window_duration_sec = (min(self.step_count, self.history_window_size) * self.dt_ms) / 1000.0
        if window_duration_sec > 0:
            spikes_in_window = np.sum(self.recent_spikes_buffer, axis=0)
            self.population_firing_rates_hz = spikes_in_window / window_duration_sec

        return current_spikes

    def run(self, duration_ms: float, progress_callback=None) -> Dict[str, Any]:
        """
        Run continuous simulation for specified duration in milliseconds.
        """
        steps = int(round(duration_ms / self.dt_ms))
        initial_spikes = self.total_spike_count

        for step_idx in range(steps):
            self.step()
            if progress_callback and step_idx % 100 == 0:
                progress_callback(step_idx / steps)

        spikes_produced = self.total_spike_count - initial_spikes
        mean_rate = (spikes_produced / (self.num_neurons * (duration_ms / 1000.0))) if duration_ms > 0 else 0.0

        return {
            "duration_ms": duration_ms,
            "steps": steps,
            "spikes_produced": spikes_produced,
            "mean_population_firing_rate_hz": float(mean_rate),
            "final_time_ms": float(self.current_time_ms),
        }

    def reset(self) -> None:
        """Reset network, neurons, synapses, and metrics to initial baseline."""
        self.current_time_ms = 0.0
        self.step_count = 0
        self.total_spike_count = 0
        self.i_ext.fill(0.0)
        self.spike_raster.clear()
        self.recent_spikes_buffer.fill(False)
        self.buffer_pointer = 0
        self.population_firing_rates_hz.fill(0.0)
        self.neurons.reset()
        self.synapses.reset()

    def get_realtime_metrics(self) -> Dict[str, Any]:
        """Extract instant real-time telemetry for frontend streaming."""
        active_spikes = int(np.sum(self.neurons.spikes))
        mean_v = float(np.mean(self.neurons.v))
        std_v = float(np.std(self.neurons.v))
        mean_rate = float(np.mean(self.population_firing_rates_hz))

        # Synchrony index (variance of population spike count over recent window / mean)
        spike_sums_per_step = np.sum(self.recent_spikes_buffer, axis=1)
        mean_step_spikes = np.mean(spike_sums_per_step)
        fano_factor = float(np.var(spike_sums_per_step) / (mean_step_spikes + 1e-6))

        return {
            "current_time_ms": round(self.current_time_ms, 2),
            "step_count": self.step_count,
            "num_neurons": self.num_neurons,
            "active_spikes_current_step": active_spikes,
            "total_spikes": self.total_spike_count,
            "mean_membrane_potential_mv": round(mean_v, 2),
            "std_membrane_potential_mv": round(std_v, 2),
            "mean_firing_rate_hz": round(mean_rate, 2),
            "max_firing_rate_hz": round(float(np.max(self.population_firing_rates_hz)), 2),
            "synchrony_fano_factor": round(fano_factor, 3),
            "num_excitatory": int(np.sum(self.is_excitatory)),
            "num_inhibitory": int(np.sum(~self.is_excitatory)),
            "num_synapses": self.synapses.num_synapses,
            "mean_synaptic_weight": round(float(np.mean(self.synapses.weights[self.synapses.weights > 0])), 4),
        }

    def get_visualization_payload(self, max_edges: int = 1500) -> Dict[str, Any]:
        """
        Generate lightweight payload for 3D Three.js visualization.
        Contains neuron coordinates, types, potentials, firing rates, and sparse synaptic edges.
        """
        # Neurons info
        neurons_data = []
        for i in range(self.num_neurons):
            neurons_data.append({
                "id": i,
                "x": round(float(self.neurons.positions[i, 0]), 2),
                "y": round(float(self.neurons.positions[i, 1]), 2),
                "z": round(float(self.neurons.positions[i, 2]), 2),
                "is_exc": bool(self.is_excitatory[i]),
                "v": round(float(self.neurons.v[i]), 2),
                "rate": round(float(self.population_firing_rates_hz[i]), 1),
                "spiked": bool(self.neurons.spikes[i]),
            })

        # Sample strongest synaptic connections for 3D rendering
        # (rendering all 50,000+ edges simultaneously in WebGL can cause draw call latency)
        w = self.synapses.weights
        non_zero_indices = np.argwhere(w > 0)
        edges_data = []

        if len(non_zero_indices) > 0:
            if len(non_zero_indices) > max_edges:
                # Sample the highest-weight synapses
                flat_weights = w[non_zero_indices[:, 0], non_zero_indices[:, 1]]
                top_indices = np.argsort(flat_weights)[-max_edges:]
                selected = non_zero_indices[top_indices]
            else:
                selected = non_zero_indices

            for post, pre in selected:
                edges_data.append({
                    "source": int(pre),
                    "target": int(post),
                    "weight": round(float(w[post, pre]), 3),
                    "is_exc": bool(self.is_excitatory[pre]),
                })

        return {
            "metrics": self.get_realtime_metrics(),
            "neurons": neurons_data,
            "edges": edges_data,
            "recent_raster": self.spike_raster[-100:] if self.spike_raster else [],
        }
