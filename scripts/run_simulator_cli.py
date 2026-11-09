"""
NEUROCORE - Milestone 1 CLI Experiment Runner
Executes a 1,000-neuron recurrent spiking neural network with excitatory and inhibitory populations,
printing real-time biological telemetry to the console.
"""

import sys
import os
import time

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.networks.network import SpikingNeuralNetwork


def main():
    print("=" * 70)
    print("   NEUROCORE COMPUTATIONAL NEUROSCIENCE ENGINE - SIMULATOR CLI")
    print("=" * 70)
    print("Initializing 1,000 Spiking Neurons (80% Pyramidal Exc, 20% Interneuron Inh)...")

    net = SpikingNeuralNetwork(
        num_neurons=1000,
        model_type="lif",
        dt_ms=0.1,
        excitatory_ratio=0.8,
        connection_probability=0.03,
        weight_scale=0.5,
        seed=42,
    )

    metrics = net.get_realtime_metrics()
    print(f"Network Initialized:")
    print(f"  Neurons: {metrics['num_neurons']} ({metrics['num_excitatory']} Excitatory, {metrics['num_inhibitory']} Inhibitory)")
    print(f"  Synapses: {metrics['num_synapses']:,}")
    print(f"  Mean Synaptic Weight: {metrics['mean_synaptic_weight']:.4f}")
    print(f"  Initial Mean Potential: {metrics['mean_membrane_potential_mv']:.2f} mV")
    print("-" * 70)

    # Deliver physiological current stimulation (sensory drive) to a subset of neurons
    print("Injecting sensory stimulation current (2.2 nA) to sensory cluster (neurons 0-150)...")
    stimulation = np_zeros = [0.0] * 1000
    for i in range(150):
        stimulation[i] = 2.2
    import numpy as np
    net.inject_current(np.array(stimulation, dtype=np.float32))

    # Add realistic spontaneous cortical background noise
    net.add_background_noise(mean_pA=0.8, std_pA=0.4)

    print("\nRunning real-time simulation for 100.0 ms (1,000 steps at dt=0.1ms)...")
    start_time = time.perf_counter()

    # Step in 10ms intervals and print telemetry
    for interval in range(1, 11):
        res = net.run(duration_ms=10.0)
        m = net.get_realtime_metrics()
        print(
            f"[t={m['current_time_ms']:6.1f} ms] "
            f"Active Spikes (step): {m['active_spikes_current_step']:3d} | "
            f"Total Spikes: {m['total_spikes']:5d} | "
            f"Mean V: {m['mean_membrane_potential_mv']:6.2f} mV | "
            f"Mean Rate: {m['mean_firing_rate_hz']:5.1f} Hz | "
            f"Fano Synchrony: {m['synchrony_fano_factor']:.3f}"
        )

    wall_time = time.perf_counter() - start_time
    print("-" * 70)
    print(f"Simulation completed in {wall_time:.3f} seconds (Simulated 100ms across 1,000 neurons).")
    print(f"Speed: {(0.100 / wall_time):.2f}x Real-Time equivalent.")
    print("=" * 70)


if __name__ == "__main__":
    main()
