"""
NEUROCORE - Scientific Validation Tests: Memory, Encoders & Readout
Validates associative attractor dynamics, noisy/partial pattern recovery, and sensory encodings.
"""

import pytest
import numpy as np
from backend.encoders.sensory import RateEncoder, TemporalEncoder, PopulationEncoder, MultimodalSensoryInterface
from backend.decoders.readout import PopulationVectorDecoder, AttractorReadout, LinearReadoutLayer
from backend.memory.associative import RecurrentAttractorMemory


def test_rate_encoder_dynamics():
    """Verify RateEncoder maps feature signals to proportional current amplitudes."""
    encoder = RateEncoder(num_neurons=50, i_base_na=0.5, i_max_na=3.5)
    signal = np.array([0.0, 0.5, 1.0])
    currents = encoder.encode_current(signal)

    assert len(currents) == 50
    assert currents[0] < currents[25] < currents[49]
    assert np.isclose(currents[0], 0.5, atol=0.1)
    assert np.isclose(currents[49], 3.5, atol=0.1)


def test_temporal_latency_encoder():
    """Verify TemporalEncoder assigns shorter latencies to stronger signals."""
    encoder = TemporalEncoder(num_neurons=10, t_min_ms=1.0, t_max_ms=20.0)
    signal = np.linspace(0.1, 1.0, 10)
    latencies = encoder.encode_latencies(signal)

    # Stronger signal -> lower latency
    assert latencies[0] > latencies[-1]
    assert np.isclose(latencies[-1], 1.0, atol=0.1)


def test_population_vector_decoder():
    """Verify PopulationVectorDecoder correctly recovers continuous value from tuning curves."""
    centers = np.linspace(-10.0, 10.0, 100)
    decoder = PopulationVectorDecoder(centers=centers)

    # Simulate Gaussian response centered at +3.5
    true_val = 3.5
    rates = np.exp(-((centers - true_val) ** 2) / (2.0 * 1.5 ** 2))
    decoded_val = decoder.decode_scalar(rates)

    assert np.isclose(decoded_val, true_val, atol=0.1), f"Expected ~{true_val}, got {decoded_val}"


def test_linear_readout_layer():
    """Verify LinearReadoutLayer can train on neural representations and make accurate predictions."""
    np.random.seed(42)
    # 50 samples, 20 neurons, 2 output classes
    X = np.random.randn(50, 20).astype(np.float32)
    W_true = np.random.randn(2, 20).astype(np.float32)
    Y = X @ W_true.T

    readout = LinearReadoutLayer(num_neurons=20, output_dim=2)
    readout.fit(X, Y)

    preds = readout.predict(X[0])
    assert np.allclose(preds, Y[0], atol=0.1), "Linear readout predictions must closely match targets"


def test_recurrent_associative_memory_partial_recall():
    """
    Milestone 3 Core Acceptance:
    Store orthogonal patterns in actual synaptic weights W and verify that
    partial cues (40% masked) settle into the correct attractor basin.
    """
    mem = RecurrentAttractorMemory(num_neurons=200, dt_ms=0.1, seed=42)

    # Generate 3 distinct sparse patterns
    pat_A = mem.generate_sparse_pattern("Pattern_Alpha")
    pat_B = mem.generate_sparse_pattern("Pattern_Beta")
    pat_C = mem.generate_sparse_pattern("Pattern_Gamma")

    # Store in synaptic connectivity matrix
    store_meta = mem.store_patterns({
        "Alpha": pat_A,
        "Beta": pat_B,
        "Gamma": pat_C,
    })
    assert store_meta["num_patterns_stored"] == 3
    assert store_meta["num_synapses_potentiated"] > 1000

    # Create partial cue for Pattern Alpha (mask 40% of its bits)
    partial_cue = pat_A.copy()
    mask_indices = np.random.choice(200, size=80, replace=False)
    partial_cue[mask_indices] = 0.0

    # Recall
    recall_res = mem.recall(partial_cue, stim_duration_ms=20.0, settle_duration_ms=40.0)

    assert recall_res["matched_label"] == "Alpha", f"Expected 'Alpha', got '{recall_res['matched_label']}'"
    assert recall_res["cosine_similarity"] > 0.45, f"Expected strong attractor overlap, got {recall_res['cosine_similarity']}"


def test_recurrent_associative_memory_noise_recovery():
    """
    Verify noise resistance:
    Corrupt pattern with 15% bit-flip noise and verify network settles into correct attractor.
    """
    mem = RecurrentAttractorMemory(num_neurons=200, dt_ms=0.1, seed=123)

    pat_A = mem.generate_sparse_pattern("Alpha")
    pat_B = mem.generate_sparse_pattern("Beta")

    mem.store_patterns({"Alpha": pat_A, "Beta": pat_B})

    # Benchmark noise recovery at 15% noise
    res = mem.test_noise_recovery("Alpha", [0.15])
    assert len(res) == 1
    assert res[0]["is_correct_attractor"] is True
    assert res[0]["matched_label"] == "Alpha"
