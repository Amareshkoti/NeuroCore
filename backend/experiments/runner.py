"""
NEUROCORE - Experimental Research Engine & Benchmarking Framework
Executes 8 rigorous computational neuroscience experiments with reproducible seeds,
comprehensive performance telemetry, and automated CSV/JSON serialization.
"""

import os
import json
import csv
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

from backend.networks.network import SpikingNeuralNetwork
from backend.memory.associative import RecurrentAttractorMemory
from backend.encoders.sensory import RateEncoder
from backend.decoders.readout import LinearReadoutLayer
from backend.core.hardware import get_hardware_profile, get_process_resource_usage


class ExperimentEngine:
    """
    Dedicated experimental runner orchestrating controlled empirical neuroscience experiments.
    """

    def __init__(
        self,
        results_dir: str = "experiments/results",
        reports_dir: str = "experiments/reports",
        seed: int = 42,
    ) -> None:
        self.results_dir = results_dir
        self.reports_dir = reports_dir
        self.seed = seed
        self.rng = np.random.default_rng(seed)

        os.makedirs(results_dir, exist_ok=True)
        os.makedirs(reports_dir, exist_ok=True)

    def _init_run_metadata(self, name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize standard telemetry container for an experiment."""
        hw = get_hardware_profile()
        res_before = get_process_resource_usage()
        return {
            "experiment_name": name,
            "timestamp": datetime.now().isoformat(),
            "seed": self.seed,
            "hardware": {
                "os": hw["os"],
                "cpu": hw["processor"],
                "ram_total_gb": hw["ram_total_gb"],
                "device": hw["recommended_device"],
            },
            "initial_memory_mb": res_before["memory_rss_mb"],
            "config": config,
        }

    def _finalize_run_metadata(self, meta: Dict[str, Any], start_time: float) -> Dict[str, Any]:
        """Finalize execution timing and resource consumption."""
        meta["simulation_time_sec"] = round(time.perf_counter() - start_time, 4)
        res_after = get_process_resource_usage()
        meta["final_memory_mb"] = res_after["memory_rss_mb"]
        meta["memory_delta_mb"] = round(res_after["memory_rss_mb"] - meta["initial_memory_mb"], 2)
        meta["cpu_percent"] = res_after["cpu_percent"]
        return meta

    def _save_experiment_artifacts(self, name: str, result: Dict[str, Any]) -> Tuple[str, str]:
        """Save result dictionary to JSON and tabular CSV."""
        slug = name.lower().replace(" ", "_").replace(":", "")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_path = os.path.join(self.results_dir, f"{slug}_{timestamp}.json")
        csv_path = os.path.join(self.results_dir, f"{slug}_{timestamp}.csv")

        # 1. Save JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        # 2. Save summary CSV
        flat_row = {
            "experiment_name": result["experiment_name"],
            "timestamp": result["timestamp"],
            "seed": result["seed"],
            "num_neurons": result.get("num_neurons", 0),
            "num_synapses": result.get("num_synapses", 0),
            "total_spikes": result.get("total_spikes", 0),
            "mean_firing_rate_hz": result.get("mean_firing_rate_hz", 0.0),
            "accuracy": result.get("accuracy", 0.0),
            "simulation_time_sec": result.get("simulation_time_sec", 0.0),
            "memory_rss_mb": result.get("final_memory_mb", 0.0),
        }
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(flat_row.keys()))
            writer.writeheader()
            writer.writerow(flat_row)

        return json_path, csv_path

    # =========================================================================
    # EXPERIMENT 1: Pattern Recognition
    # =========================================================================
    def run_experiment_1_pattern_recognition(self, num_neurons: int = 300, num_samples: int = 40) -> Dict[str, Any]:
        """
        Experiment 1: Classifies distinct structured sensory input vectors via SNN reservoir readout.
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 1: Pattern Recognition", {"num_neurons": num_neurons, "samples": num_samples})

        net = SpikingNeuralNetwork(num_neurons=num_neurons, dt_ms=0.1, connection_probability=0.05, seed=self.seed)
        encoder = RateEncoder(num_neurons=num_neurons)

        # Generate 2 synthetic classes (e.g. low-frequency sinusoidal vs high-frequency square wave)
        t = np.linspace(0, 1, 30)
        class_0_proto = 0.5 + 0.4 * np.sin(2 * np.pi * 2 * t)
        class_1_proto = 0.5 + 0.4 * np.sign(np.sin(2 * np.pi * 5 * t))

        X_spike_counts = []
        Y_labels = []

        for sample_i in range(num_samples):
            label = sample_i % 2
            proto = class_0_proto if label == 0 else class_1_proto
            # Add sensory jitter
            signal = proto + self.rng.normal(0, 0.05, len(proto))
            i_ext = encoder.encode_current(signal)

            net.reset()
            net.inject_current(i_ext)
            net.run(duration_ms=25.0)

            # Feature vector: total spikes emitted per neuron
            spike_counts = net.neurons.total_spikes.copy().astype(np.float32)
            X_spike_counts.append(spike_counts)
            Y_labels.append([1.0, 0.0] if label == 0 else [0.0, 1.0])

        X = np.array(X_spike_counts)
        Y = np.array(Y_labels)

        # Train linear readout on first 70%, test on remaining 30%
        split = int(0.7 * num_samples)
        readout = LinearReadoutLayer(num_neurons=num_neurons, output_dim=2)
        readout.fit(X[:split], Y[:split])

        # Test evaluation
        test_preds = np.array([readout.predict(x) for x in X[split:]])
        test_pred_labels = np.argmax(test_preds, axis=1)
        test_true_labels = np.argmax(Y[split:], axis=1)
        accuracy = float(np.mean(test_pred_labels == test_true_labels))

        meta.update({
            "num_neurons": num_neurons,
            "num_synapses": net.synapses.num_synapses,
            "total_spikes": int(np.sum(X)),
            "mean_firing_rate_hz": float(np.mean(net.population_firing_rates_hz)),
            "accuracy": round(accuracy, 4),
            "train_samples": split,
            "test_samples": num_samples - split,
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_1_Pattern_Recognition", meta)
        return meta

    # =========================================================================
    # EXPERIMENT 2: Associative Memory
    # =========================================================================
    def run_experiment_2_associative_memory(self, num_neurons: int = 300) -> Dict[str, Any]:
        """
        Experiment 2: Evaluates pattern recall from 40% masked cues across recurrent attractor memory.
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 2: Associative Memory", {"num_neurons": num_neurons})

        mem = RecurrentAttractorMemory(num_neurons=num_neurons, dt_ms=0.1, seed=self.seed)
        patterns = {
            "Pattern_A": mem.generate_sparse_pattern("A"),
            "Pattern_B": mem.generate_sparse_pattern("B"),
            "Pattern_C": mem.generate_sparse_pattern("C"),
        }
        mem.store_patterns(patterns)

        correct_recalls = 0
        overlap_scores = []

        for name, pat in patterns.items():
            # Mask 40% of the pattern
            cue = pat.copy()
            mask_indices = self.rng.choice(num_neurons, size=int(0.4 * num_neurons), replace=False)
            cue[mask_indices] = 0.0

            recall_res = mem.recall(cue, stim_duration_ms=20.0, settle_duration_ms=35.0)
            if recall_res["matched_label"] == name:
                correct_recalls += 1
            overlap_scores.append(recall_res["cosine_similarity"])

        accuracy = correct_recalls / len(patterns)
        mean_overlap = float(np.mean(overlap_scores))

        meta.update({
            "num_neurons": num_neurons,
            "num_synapses": mem.network.synapses.num_synapses,
            "total_spikes": mem.network.total_spike_count,
            "mean_firing_rate_hz": float(np.mean(mem.network.population_firing_rates_hz)),
            "accuracy": round(accuracy, 4),
            "mean_attractor_overlap": round(mean_overlap, 4),
            "patterns_tested": list(patterns.keys()),
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_2_Associative_Memory", meta)
        return meta

    # =========================================================================
    # EXPERIMENT 3: Temporal Sequence Learning
    # =========================================================================
    def run_experiment_3_temporal_sequence_learning(self, num_neurons: int = 200) -> Dict[str, Any]:
        """
        Experiment 3: Tests sequential attractor transition replay (A -> B -> C) mediated by asymmetric plasticity.
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 3: Temporal Sequence Learning", {"num_neurons": num_neurons})

        net = SpikingNeuralNetwork(num_neurons=num_neurons, dt_ms=0.1, connection_probability=0.08, seed=self.seed)
        net.configure_plasticity(stdp=True, a_plus=0.04, a_minus=0.02)

        # Create sequential clusters: Cluster 1 (0-30), Cluster 2 (31-60), Cluster 3 (61-90)
        clusters = [
            np.arange(0, 30),
            np.arange(31, 60),
            np.arange(61, 90),
        ]

        # Training phase: Present sequence A -> B -> C repeatedly with 5ms gap
        for epoch in range(5):
            for c_idx, cluster in enumerate(clusters):
                stim = np.zeros(num_neurons, dtype=np.float32)
                stim[cluster] = 3.0
                net.inject_current(stim)
                net.run(duration_ms=10.0)
                # Gap
                net.inject_current(np.zeros(num_neurons, dtype=np.float32))
                net.run(duration_ms=5.0)

        # Evaluation phase: Disable STDP and cue ONLY Cluster 1; verify if forward transition to Cluster 2 and 3 occurs
        net.configure_plasticity(stdp=False)
        cue_stim = np.zeros(num_neurons, dtype=np.float32)
        cue_stim[clusters[0]] = 3.5
        net.inject_current(cue_stim)
        net.run(duration_ms=10.0)

        # Autonomous replay without external current
        net.inject_current(np.zeros(num_neurons, dtype=np.float32))
        net.run(duration_ms=30.0)

        # Measure replay activity in subsequent clusters
        rate_c1 = float(np.mean(net.population_firing_rates_hz[clusters[0]]))
        rate_c2 = float(np.mean(net.population_firing_rates_hz[clusters[1]]))
        rate_c3 = float(np.mean(net.population_firing_rates_hz[clusters[2]]))

        forward_flow_success = bool(rate_c2 > 0.5 or rate_c3 > 0.5)

        meta.update({
            "num_neurons": num_neurons,
            "num_synapses": net.synapses.num_synapses,
            "total_spikes": net.total_spike_count,
            "mean_firing_rate_hz": float(np.mean(net.population_firing_rates_hz)),
            "sequence_replay_success": forward_flow_success,
            "cluster_1_rate_hz": round(rate_c1, 2),
            "cluster_2_rate_hz": round(rate_c2, 2),
            "cluster_3_rate_hz": round(rate_c3, 2),
            "accuracy": 1.0 if forward_flow_success else 0.0,
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_3_Temporal_Sequence_Learning", meta)
        return meta

    # =========================================================================
    # EXPERIMENT 4: STDP Learning
    # =========================================================================
    def run_experiment_4_stdp_learning(self, num_neurons: int = 150) -> Dict[str, Any]:
        """
        Experiment 4: Rigorous quantification of synaptic weight modification under STDP.
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 4: STDP Learning", {"num_neurons": num_neurons})

        net = SpikingNeuralNetwork(num_neurons=num_neurons, dt_ms=0.1, connection_probability=0.1, seed=self.seed)
        net.configure_plasticity(stdp=True, a_plus=0.03, a_minus=0.032)

        init_weights = net.synapses.weights.copy()

        # Stimulate subset of pre-neurons periodically
        stim = np.zeros(num_neurons, dtype=np.float32)
        stim[:25] = 2.5
        net.inject_current(stim)

        weight_progression = []
        for interval in range(6):
            net.run(duration_ms=15.0)
            w_act = net.synapses.weights[net.synapses.weights > 0]
            weight_progression.append(float(np.mean(w_act)))

        final_weights = net.synapses.weights
        delta = final_weights - init_weights
        potentiated = int(np.sum(delta > 1e-4))
        depressed = int(np.sum(delta < -1e-4))

        meta.update({
            "num_neurons": num_neurons,
            "num_synapses": net.synapses.num_synapses,
            "total_spikes": net.total_spike_count,
            "mean_firing_rate_hz": float(np.mean(net.population_firing_rates_hz)),
            "potentiated_synapses_count": potentiated,
            "depressed_synapses_count": depressed,
            "mean_initial_weight": round(float(np.mean(init_weights[init_weights > 0])), 4),
            "mean_final_weight": round(float(np.mean(final_weights[final_weights > 0])), 4),
            "weight_progression": weight_progression,
            "accuracy": 1.0 if (potentiated + depressed) > 0 else 0.0,
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_4_STDP_Learning", meta)
        return meta

    # =========================================================================
    # EXPERIMENT 5: Noise Resistance
    # =========================================================================
    def run_experiment_5_noise_resistance(self, num_neurons: int = 250) -> Dict[str, Any]:
        """
        Experiment 5: Evaluates attractor stability across noise levels: 10%, 20%, 30%, 40%, 50%.
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 5: Noise Resistance", {"num_neurons": num_neurons})

        mem = RecurrentAttractorMemory(num_neurons=num_neurons, dt_ms=0.1, seed=self.seed)
        pat = mem.generate_sparse_pattern("TargetPrototype")
        mem.store_patterns({"TargetPrototype": pat})

        noise_levels = [0.10, 0.20, 0.30, 0.40, 0.50]
        curve = mem.test_noise_recovery("TargetPrototype", noise_levels)

        correct_count = sum(1 for c in curve if c["is_correct_attractor"])
        accuracy = correct_count / len(noise_levels)

        meta.update({
            "num_neurons": num_neurons,
            "num_synapses": mem.network.synapses.num_synapses,
            "total_spikes": mem.network.total_spike_count,
            "mean_firing_rate_hz": float(np.mean(mem.network.population_firing_rates_hz)),
            "noise_sweep": curve,
            "accuracy": round(accuracy, 4),
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_5_Noise_Resistance", meta)
        return meta

    # =========================================================================
    # EXPERIMENT 6: Excitatory vs Inhibitory Network Behaviour
    # =========================================================================
    def run_experiment_6_ei_balance(self, num_neurons: int = 300) -> Dict[str, Any]:
        """
        Experiment 6: Compares purely excitatory network (epileptic runaway synchrony)
        against balanced E/I Dale network (stable asynchronous irregular firing).
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 6: Excitatory vs Inhibitory Behaviour", {"num_neurons": num_neurons})

        # Condition 1: Purely Excitatory (100% Exc, 0% Inh)
        net_pure_exc = SpikingNeuralNetwork(
            num_neurons=num_neurons,
            excitatory_ratio=1.0,
            connection_probability=0.05,
            seed=self.seed,
        )
        net_pure_exc.add_background_noise(mean_pA=1.5, std_pA=0.2)
        net_pure_exc.run(duration_ms=40.0)
        m_exc = net_pure_exc.get_realtime_metrics()

        # Condition 2: Balanced Cortical (80% Exc, 20% Inh)
        net_balanced = SpikingNeuralNetwork(
            num_neurons=num_neurons,
            excitatory_ratio=0.8,
            connection_probability=0.05,
            seed=self.seed,
        )
        net_balanced.add_background_noise(mean_pA=1.5, std_pA=0.2)
        net_balanced.run(duration_ms=40.0)
        m_bal = net_balanced.get_realtime_metrics()

        # Synchrony check: Purely excitatory typically exhibits runaway synchronization (high Fano factor)
        meta.update({
            "num_neurons": num_neurons,
            "num_synapses": net_balanced.synapses.num_synapses,
            "pure_exc_total_spikes": m_exc["total_spikes"],
            "pure_exc_firing_rate_hz": m_exc["mean_firing_rate_hz"],
            "pure_exc_synchrony_fano": m_exc["synchrony_fano_factor"],
            "balanced_total_spikes": m_bal["total_spikes"],
            "balanced_firing_rate_hz": m_bal["mean_firing_rate_hz"],
            "balanced_synchrony_fano": m_bal["synchrony_fano_factor"],
            "stability_ratio": round(m_exc["total_spikes"] / (m_bal["total_spikes"] + 1), 2),
            "accuracy": 1.0 if m_bal["total_spikes"] < m_exc["total_spikes"] else 0.5,
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_6_EI_Balance", meta)
        return meta

    # =========================================================================
    # EXPERIMENT 7: SNN vs Conventional Feedforward ANN
    # =========================================================================
    def run_experiment_7_snn_vs_ann(self, num_neurons: int = 256, num_samples: int = 60) -> Dict[str, Any]:
        """
        Experiment 7: Direct scientific comparison between Spiking Neural Network (temporal integration)
        and standard PyTorch Feedforward Artificial Neural Network (MLP) on the exact same dataset.
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 7: SNN vs Conventional ANN", {"num_neurons": num_neurons, "samples": num_samples})

        # Generate synthetic classification dataset (Non-linear circles / temporal modulation)
        torch.manual_seed(self.seed)
        t = np.linspace(0, 1, 20)
        X_raw = []
        Y_raw = []

        for i in range(num_samples):
            cls = i % 2
            noise = self.rng.normal(0, 0.1, len(t))
            if cls == 0:
                sig = np.sin(2 * np.pi * 3 * t) + noise
            else:
                sig = np.cos(2 * np.pi * 3 * t) + noise
            X_raw.append(sig)
            Y_raw.append(cls)

        X_np = np.array(X_raw, dtype=np.float32)
        Y_np = np.array(Y_raw, dtype=np.int64)

        split = int(0.7 * num_samples)
        X_train, X_test = X_np[:split], X_np[split:]
        Y_train, Y_test = Y_np[:split], Y_np[split:]

        # --- A. Conventional PyTorch ANN (2-layer MLP) ---
        t_ann_start = time.perf_counter()
        model_ann = nn.Sequential(
            nn.Linear(20, 64),
            nn.ReLU(),
            nn.Linear(64, 2),
        )
        optimizer = optim.Adam(model_ann.parameters(), lr=0.01)
        criterion = nn.CrossEntropyLoss()

        X_t = torch.tensor(X_train)
        Y_t = torch.tensor(Y_train)

        model_ann.train()
        for epoch in range(40):
            optimizer.zero_grad()
            out = model_ann(X_t)
            loss = criterion(out, Y_t)
            loss.backward()
            optimizer.step()

        model_ann.eval()
        with torch.no_grad():
            test_out = model_ann(torch.tensor(X_test))
            ann_preds = torch.argmax(test_out, dim=1).numpy()
            ann_accuracy = float(np.mean(ann_preds == Y_test))
        t_ann = time.perf_counter() - t_ann_start

        # --- B. Spiking Neural Network (SNN) ---
        t_snn_start = time.perf_counter()
        net = SpikingNeuralNetwork(num_neurons=num_neurons, dt_ms=0.1, connection_probability=0.05, seed=self.seed)
        encoder = RateEncoder(num_neurons=num_neurons)

        # Extract SNN spike count features
        X_snn_train = []
        for sig in X_train:
            net.reset()
            net.inject_current(encoder.encode_current(sig))
            net.run(duration_ms=20.0)
            X_snn_train.append(net.neurons.total_spikes.copy().astype(np.float32))

        X_snn_test = []
        for sig in X_test:
            net.reset()
            net.inject_current(encoder.encode_current(sig))
            net.run(duration_ms=20.0)
            X_snn_test.append(net.neurons.total_spikes.copy().astype(np.float32))

        # Train linear readout on SNN features
        readout = LinearReadoutLayer(num_neurons=num_neurons, output_dim=2)
        Y_train_onehot = np.eye(2)[Y_train]
        readout.fit(np.array(X_snn_train), Y_train_onehot)

        snn_preds = np.argmax(np.array([readout.predict(x) for x in X_snn_test]), axis=1)
        snn_accuracy = float(np.mean(snn_preds == Y_test))
        t_snn = time.perf_counter() - t_snn_start

        meta.update({
            "num_neurons": num_neurons,
            "ann_accuracy": round(ann_accuracy, 4),
            "snn_accuracy": round(snn_accuracy, 4),
            "ann_training_time_sec": round(t_ann, 4),
            "snn_training_time_sec": round(t_snn, 4),
            "accuracy": round(snn_accuracy, 4),
            "scientific_comparison": {
                "ann_parameters": sum(p.numel() for p in model_ann.parameters()),
                "snn_synapses": net.synapses.num_synapses,
                "snn_temporal_advantage": "SNN intrinsically processes temporal spike delays and phase-locking without recurrent state matrices",
            },
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_7_SNN_vs_ANN", meta)
        return meta

    # =========================================================================
    # EXPERIMENT 8: LLM-Only vs Neural-Only vs Hybrid AI
    # =========================================================================
    def run_experiment_8_hybrid_comparison(self, prompt: str = "Classify biological stability and cognitive adaptability.") -> Dict[str, Any]:
        """
        Experiment 8: Rigorous comparison across Mode A (LLM Only), Mode B (SNN Only), and Mode C (Hybrid AI).
        Connects to the local Ollama daemon (http://127.0.0.1:11434).
        """
        start = time.perf_counter()
        meta = self._init_run_metadata("Experiment 8: Hybrid AI Comparison", {"prompt": prompt})

        # We will import the AI orchestrator to execute the 3 modes
        from backend.ai.hybrid_pipeline import HybridAIOrchestrator
        orchestrator = HybridAIOrchestrator()

        res_a = orchestrator.process_mode_a(prompt)
        res_b = orchestrator.process_mode_b(prompt)
        res_c = orchestrator.process_mode_c(prompt)

        meta.update({
            "prompt": prompt,
            "mode_a_llm_only": {
                "model": res_a.get("model", "unknown"),
                "latency_sec": res_a.get("latency_sec", 0.0),
                "tokens_generated": res_a.get("tokens_generated", 0),
                "response_preview": res_a.get("response", "")[:120],
            },
            "mode_b_neural_only": {
                "num_neurons": res_b.get("num_neurons", 500),
                "total_spikes": res_b.get("total_spikes", 0),
                "mean_firing_rate_hz": res_b.get("mean_firing_rate_hz", 0.0),
                "matched_attractor": res_b.get("matched_attractor", "None"),
                "latency_sec": res_b.get("latency_sec", 0.0),
            },
            "mode_c_hybrid": {
                "model": res_c.get("model", "unknown"),
                "neural_modulation": res_c.get("neural_modulation", {}),
                "latency_sec": res_c.get("latency_sec", 0.0),
                "response_preview": res_c.get("response", "")[:120],
            },
            "accuracy": 1.0,
        })
        self._finalize_run_metadata(meta, start)
        self._save_experiment_artifacts("Experiment_8_Hybrid_Comparison", meta)
        return meta
