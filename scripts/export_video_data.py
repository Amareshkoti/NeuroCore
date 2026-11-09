"""
NEUROCORE - export real simulation data for the LinkedIn presentation video.

Every number and every spike drawn in video/neurocore_video.html comes from the
JSON this script writes. Nothing is hand-typed or synthesised for effect.

Run from the repository root:
    .venv/Scripts/python.exe scripts/export_video_data.py [--skip-llm]
"""

import argparse
import glob
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.networks.network import SpikingNeuralNetwork  # noqa: E402
from backend.memory.associative import RecurrentAttractorMemory  # noqa: E402
from backend.ai.ollama_client import OllamaClient  # noqa: E402
from backend.ai.hybrid_pipeline import HybridAIOrchestrator  # noqa: E402
from backend.core.hardware import get_hardware_profile  # noqa: E402

OUT = os.path.join("video", "video_data.json")
SEED = 42


def network_activity():
    """1,000 LIF neurons: 60 ms spontaneous, 120 ms with 2.6 nA into the sensory group, 120 ms after."""
    net = SpikingNeuralNetwork(num_neurons=1000, model_type="lif", seed=SEED)
    n = net.num_neurons
    sensory = max(10, int(0.15 * n))
    raster, v_sens, mean_v, pop_spikes = [], [], [], []

    phases = [(60.0, 0.0), (120.0, 2.6), (120.0, 0.0)]
    t0 = time.perf_counter()
    for duration, amp in phases:
        cur = np.zeros(n, dtype=np.float32)
        cur[:sensory] = amp
        # a weak diffuse drive keeps the rest of the network near threshold
        cur[sensory:] = 0.9 if amp > 0 else 0.0
        net.inject_current(cur)
        for _ in range(int(round(duration / net.dt_ms))):
            t = round(net.current_time_ms, 1)
            s = net.step()
            ids = np.where(s)[0]
            raster.extend([t, int(i)] for i in ids)
            pop_spikes.append(int(len(ids)))
            v_sens.append(net.neurons.v[:sensory].copy())
            mean_v.append(round(float(np.mean(net.neurons.v)), 2))
    wall = time.perf_counter() - t0

    # show the membrane of the sensory neuron whose spike count is closest to 8,
    # so the trace has visible spikes without being a solid block
    counts = np.bincount([i for _, i in raster if i < sensory], minlength=sensory)
    probe = int(np.argmin(np.abs(counts - 8)))
    v_probe = [round(float(v[probe]), 2) for v in v_sens]

    return {
        "num_neurons": n,
        "num_excitatory": int(np.sum(net.is_excitatory)),
        "num_inhibitory": int(np.sum(~net.is_excitatory)),
        "num_synapses": int(net.synapses.num_synapses),
        "dt_ms": net.dt_ms,
        "duration_ms": sum(p[0] for p in phases),
        "stim_window_ms": [60.0, 180.0],
        "stim_sensory_na": 2.6,
        "sensory_count": sensory,
        "probe_id": probe,
        "is_exc": [bool(x) for x in net.is_excitatory],
        "positions": [[round(float(c), 1) for c in p] for p in net.neurons.positions],
        "raster": raster,
        "v_probe": v_probe,
        "mean_v": mean_v,
        "pop_spikes": pop_spikes,
        "total_spikes": int(net.total_spike_count),
        "v_threshold": float(net.neurons.v_th),
        "v_rest": float(net.neurons.v_rest),
        "v_reset": float(net.neurons.v_reset),
        "wall_time_sec": round(wall, 2),
    }


def stdp_learning():
    """STDP on a 300-neuron network driven through its first 40 neurons."""
    net = SpikingNeuralNetwork(num_neurons=300, connection_probability=0.08, seed=SEED)
    net.configure_plasticity(stdp=True, a_plus=0.02, a_minus=0.021)
    w0 = net.synapses.weights.copy()
    mask = w0 > 0
    stim = np.zeros(300, dtype=np.float32)
    stim[:40] = 2.6
    net.inject_current(stim)
    trend = [round(float(np.mean(w0[mask])), 5)]
    for _ in range(30):
        net.run(duration_ms=5.0)
        trend.append(round(float(np.mean(net.synapses.weights[mask])), 5))
    delta = (net.synapses.weights - w0)[mask]
    hist, edges = np.histogram(delta, bins=31)
    return {
        "num_neurons": 300,
        "num_synapses": int(mask.sum()),
        "duration_ms": 150.0,
        "a_plus": 0.02,
        "a_minus": 0.021,
        "tau_ms": 20.0,
        "mean_weight_trend": trend,
        "potentiated": int(np.sum(delta > 1e-4)),
        "depressed": int(np.sum(delta < -1e-4)),
        "unchanged": int(np.sum(np.abs(delta) <= 1e-4)),
        "ltp_events": int(net.stdp.total_ltp_events),
        "ltd_events": int(net.stdp.total_ltd_events),
        "delta_hist": [int(h) for h in hist],
        "delta_edges": [round(float(e), 5) for e in edges],
    }


def associative_memory():
    mem = RecurrentAttractorMemory(num_neurons=300, seed=SEED)
    names = ["Alpha", "Beta", "Gamma", "Delta"]
    store = mem.store_patterns({k: mem.generate_sparse_pattern(k) for k in names})
    rng = np.random.default_rng(SEED)
    original = mem.stored_patterns["Alpha"]
    cue = original.copy()
    cue[rng.random(len(cue)) < 0.3] = 0.0  # hide 30%
    flips = rng.random(len(cue)) < 0.1  # flip 10%
    cue[flips] = 1.0 - cue[flips]
    res = mem.recall(cue)
    # copy: the network zeroes this array in place on its next reset
    settled = mem.network.population_firing_rates_hz.copy()
    cue_cos = float(np.dot(cue, original) / (np.linalg.norm(cue) * np.linalg.norm(original) + 1e-8))
    sweep = mem.test_noise_recovery("Alpha", [0.1, 0.2, 0.3, 0.4, 0.5])
    return {
        "num_neurons": 300,
        "patterns": names,
        "synapses_potentiated": store["num_synapses_potentiated"],
        "mask_fraction": 0.3,
        "noise_fraction": 0.1,
        "original": [int(x) for x in original],
        "cue": [int(round(float(x))) for x in cue],
        "settled_rates_hz": [round(float(r), 1) for r in settled],
        "cue_similarity": round(cue_cos, 4),
        "matched_label": res["matched_label"],
        "cosine_similarity": res["cosine_similarity"],
        "all_similarities": res["all_similarities"],
        "noise_sweep": sweep,
    }


def hybrid(skip_llm: bool):
    if skip_llm:
        return None
    client = OllamaClient()
    if not client.is_available():
        return {"available": False}
    orch = HybridAIOrchestrator(ollama_client=client)
    prompt = "In one sentence, why do brains need inhibitory neurons?"
    r = orch.compare_modes(prompt)
    return {
        "available": True,
        "prompt": prompt,
        "model": r["mode_a"].get("model"),
        "mode_a": {"latency_sec": r["mode_a"]["latency_sec"], "tokens": r["mode_a"].get("tokens_generated", 0), "response": r["mode_a"]["response"]},
        "mode_b": {"latency_sec": r["mode_b"]["latency_sec"], "spikes": r["mode_b"]["total_spikes"], "attractor": r["mode_b"]["matched_attractor"], "response": r["mode_b"]["response"]},
        "mode_c": {"latency_sec": r["mode_c"]["latency_sec"], "tokens": r["mode_c"].get("tokens_generated", 0), "spikes": r["mode_c"]["neural_modulation"]["total_spikes"], "attractor": r["mode_c"]["neural_modulation"]["matched_attractor"], "response": r["mode_c"]["response"]},
    }


def latest(pattern):
    files = sorted(glob.glob(os.path.join("experiments", "results", pattern)))
    if not files:
        return None
    with open(files[-1]) as f:
        d = json.load(f)
    d.pop("hardware", None)
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-llm", action="store_true")
    ap.add_argument("--reuse-llm", action="store_true", help="keep the hybrid result already in video_data.json")
    args = ap.parse_args()

    print("network activity…")
    data = {"network": network_activity()}
    print("stdp…")
    data["stdp"] = stdp_learning()
    print("memory…")
    data["memory"] = associative_memory()
    print("hybrid (Ollama)…")
    if args.reuse_llm and os.path.exists(OUT):
        with open(OUT) as f:
            data["hybrid"] = json.load(f).get("hybrid")
    else:
        data["hybrid"] = hybrid(args.skip_llm)
    data["snn_vs_ann"] = latest("experiment_7_*.json")
    data["ei_balance"] = latest("experiment_6_*.json")
    hw = get_hardware_profile()
    data["hardware"] = {"processor": hw.get("processor"), "ram_gb": hw.get("ram_total_gb"), "cuda": hw.get("cuda_available"), "torch": hw.get("torch_version")}
    data["generated"] = time.strftime("%Y-%m-%d %H:%M")

    os.makedirs("video", exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    n = data["network"]
    print(f"wrote {OUT}: {len(n['raster'])} spikes, memory -> {data['memory']['matched_label']}")


if __name__ == "__main__":
    main()
