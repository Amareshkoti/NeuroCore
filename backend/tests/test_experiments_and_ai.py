"""
NEUROCORE - Scientific Validation Tests: Experiments & Hybrid AI Integration
Validates the experiment execution engine and Mode A / Mode B / Mode C hybrid pipelines.
"""

import pytest
import numpy as np
from backend.core.hardware import get_hardware_profile, get_process_resource_usage
from backend.experiments.runner import ExperimentEngine
from backend.ai.hybrid_pipeline import HybridAIOrchestrator


def test_hardware_profiler():
    """Verify hardware profile detection."""
    hw = get_hardware_profile()
    assert "os" in hw
    assert hw["ram_total_gb"] > 0.0
    assert hw["cpu_count_logical"] is not None and hw["cpu_count_logical"] > 0
    assert "cuda_available" in hw

    res = get_process_resource_usage()
    assert res["memory_rss_mb"] > 0.0


def test_experiment_1_pattern_recognition():
    """Run Experiment 1 on small test scale and verify metrics output."""
    engine = ExperimentEngine(seed=42)
    res = engine.run_experiment_1_pattern_recognition(num_neurons=100, num_samples=16)

    assert res["experiment_name"] == "Experiment 1: Pattern Recognition"
    assert "accuracy" in res
    assert res["total_spikes"] > 0
    assert res["simulation_time_sec"] > 0.0


def test_experiment_2_associative_memory():
    """Run Experiment 2 and verify recall metrics."""
    engine = ExperimentEngine(seed=42)
    res = engine.run_experiment_2_associative_memory(num_neurons=150)

    assert res["experiment_name"] == "Experiment 2: Associative Memory"
    assert "mean_attractor_overlap" in res
    assert res["accuracy"] >= 0.0


def test_experiment_6_ei_balance():
    """Verify Experiment 6 shows difference between purely excitatory and balanced E/I."""
    engine = ExperimentEngine(seed=42)
    res = engine.run_experiment_6_ei_balance(num_neurons=150)

    assert "pure_exc_total_spikes" in res
    assert "balanced_total_spikes" in res
    # Pure excitation without inhibition leads to greater or runaway spiking
    assert res["pure_exc_total_spikes"] >= res["balanced_total_spikes"]


def test_experiment_7_snn_vs_ann():
    """Run Experiment 7 and verify comparison between PyTorch MLP and SNN."""
    engine = ExperimentEngine(seed=42)
    res = engine.run_experiment_7_snn_vs_ann(num_neurons=100, num_samples=20)

    assert "ann_accuracy" in res
    assert "snn_accuracy" in res
    assert "scientific_comparison" in res


def test_hybrid_ai_modes_execution():
    """Verify Mode A, Mode B, and Mode C execution paths."""
    orchestrator = HybridAIOrchestrator(num_neurons=100, seed=42)

    # Test Mode B: SNN Only
    res_b = orchestrator.process_mode_b("Analyze synaptic transmission in neocortex")
    assert res_b["mode"] == "MODE_B_NEURAL_ONLY"
    assert res_b["total_spikes"] > 0
    assert "matched_attractor" in res_b
    assert res_b["num_neurons"] == 100

    # Test Mode A: LLM Only (local Ollama)
    res_a = orchestrator.process_mode_a("Briefly explain action potentials in 1 sentence.")
    assert res_a["mode"] == "MODE_A_LLM_ONLY"
    assert len(res_a["response"]) > 0

    # Test Mode C: Hybrid Co-processing
    res_c = orchestrator.process_mode_c("Assess homeostatic plasticity in 1 sentence.")
    assert res_c["mode"] == "MODE_C_HYBRID"
    assert "neural_modulation" in res_c
    assert res_c["neural_modulation"]["total_spikes"] > 0
