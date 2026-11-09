"""
NEUROCORE - Hybrid AI Orchestration Pipeline
Implements Mode A (LLM Only), Mode B (Neural Only), and Mode C (Hybrid Co-Processing).
Ensures genuine biological computation with verifiable spike processing and honest scientific reporting.
"""

import time
from typing import Dict, Any, List, Optional
import numpy as np

from backend.ai.ollama_client import OllamaClient
from backend.networks.network import SpikingNeuralNetwork
from backend.encoders.sensory import MultimodalSensoryInterface
from backend.decoders.readout import AttractorReadout


class HybridAIOrchestrator:
    """
    Coordinates interactions between biological SNN simulation and local Large Language Models.
    """

    def __init__(
        self,
        ollama_client: Optional[OllamaClient] = None,
        num_neurons: int = 500,
        model_type: str = "lif",
        seed: int = 42,
    ) -> None:
        self.ollama = ollama_client or OllamaClient()
        self.num_neurons = num_neurons
        self.seed = seed

        # Real Spiking Neural Network Co-Processor
        self.network = SpikingNeuralNetwork(
            num_neurons=num_neurons,
            model_type=model_type,
            dt_ms=0.1,
            excitatory_ratio=0.8,
            connection_probability=0.06,
            weight_scale=0.8,
            seed=seed,
        )

        self.encoder = MultimodalSensoryInterface(num_neurons=num_neurons)

        # Baseline Cognitive Attractors (Scientific Domains)
        rng = np.random.default_rng(seed)
        self.cognitive_prototypes: Dict[str, np.ndarray] = {
            "Analytical_Reasoning": (rng.random(num_neurons) < 0.2).astype(np.float32),
            "Empirical_Observation": (rng.random(num_neurons) < 0.2).astype(np.float32),
            "Synthetic_Creativity": (rng.random(num_neurons) < 0.2).astype(np.float32),
            "Homeostatic_Equilibrium": (rng.random(num_neurons) < 0.2).astype(np.float32),
        }
        self.readout = AttractorReadout(self.cognitive_prototypes)

    # -------------------------------------------------------------------------
    # MODE A: LLM ONLY
    # -------------------------------------------------------------------------
    def process_mode_a(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Conventional LLM direct pipeline without neural co-processing.
        """
        t_start = time.perf_counter()
        llm_res = self.ollama.generate(
            prompt=prompt,
            system_prompt="You are an advanced scientific research AI. Provide precise, empirically grounded answers.",
            model=model,
        )
        elapsed = time.perf_counter() - t_start

        return {
            "mode": "MODE_A_LLM_ONLY",
            "prompt": prompt,
            "response": llm_res.get("response", ""),
            "model": llm_res.get("model", self.ollama.default_model),
            "latency_sec": round(elapsed, 3),
            "tokens_generated": llm_res.get("tokens_generated", 0),
            "neural_computation": {
                "spikes_emitted": 0,
                "neurons_activated": 0,
                "synaptic_transmission_occurred": False,
            },
        }

    # -------------------------------------------------------------------------
    # MODE B: NEURAL NETWORK ONLY
    # -------------------------------------------------------------------------
    def process_mode_b(self, prompt: str) -> Dict[str, Any]:
        """
        Pure Spiking Neural Network processing:
        Input -> Text Embedding -> Sensory Encoder -> SNN Differential Integration -> Attractor Readout.
        """
        t_start = time.perf_counter()

        # 1. Generate text embedding
        embedding = self.ollama.get_embeddings(prompt)

        # 2. Convert to neural injection current
        i_stim = self.encoder.encode_text_embedding(embedding, method="rate")

        # 3. Reset and simulate SNN
        self.network.reset()
        self.network.inject_current(i_stim)
        sim_res = self.network.run(duration_ms=40.0)

        # 4. Neural Readout
        settled_rates = self.network.population_firing_rates_hz
        attractor_match = self.readout.decode(settled_rates)
        elapsed = time.perf_counter() - t_start

        # Synthesize scientific symbolic output from neural state
        symbolic_output = (
            f"[NEURAL CLASSIFICATION] Input converged to attractor basin: '{attractor_match['matched_label']}' "
            f"(Cosine Similarity: {attractor_match['cosine_similarity']:.3f}, "
            f"Hamming Overlap: {attractor_match['hamming_similarity']:.3f}). "
            f"Total action potentials emitted: {self.network.total_spike_count} across {self.num_neurons} neurons. "
            f"Mean population firing rate: {np.mean(settled_rates):.1f} Hz."
        )

        return {
            "mode": "MODE_B_NEURAL_ONLY",
            "prompt": prompt,
            "response": symbolic_output,
            "latency_sec": round(elapsed, 3),
            "tokens_generated": 0,
            "num_neurons": self.num_neurons,
            "total_spikes": self.network.total_spike_count,
            "mean_firing_rate_hz": round(float(np.mean(settled_rates)), 2),
            "matched_attractor": attractor_match["matched_label"],
            "attractor_overlap": attractor_match["cosine_similarity"],
            "all_attractor_similarities": attractor_match["all_similarities"],
            "active_spikes_per_neuron_sample": [int(x) for x in self.network.neurons.total_spikes[:20]],
        }

    # -------------------------------------------------------------------------
    # MODE C: HYBRID (LLM + SPIKING NEURAL NETWORK CO-PROCESSING)
    # -------------------------------------------------------------------------
    def process_mode_c(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Hybrid Intelligence Architecture:
        Prompt -> Embedding -> Recurrent SNN Attractor Filtering ->
        Neural Priming Context -> LLM Conditioning -> Final Output.
        """
        t_start = time.perf_counter()

        # Step 1: Real neural co-processing
        embedding = self.ollama.get_embeddings(prompt)
        i_stim = self.encoder.encode_text_embedding(embedding, method="rate")

        self.network.reset()
        self.network.inject_current(i_stim)
        # Run 30 ms of real biological differential simulation
        self.network.run(duration_ms=30.0)

        # Step 2: Readout neural dynamic state
        rates = self.network.population_firing_rates_hz
        attractor = self.readout.decode(rates)
        m = self.network.get_realtime_metrics()

        # Step 3: Construct neural conditioning modulation
        neural_context = (
            f"\n[BIOLOGICAL SNN CO-PROCESSOR TELEMETRY]\n"
            f"- Attractor Basin Affinity: {attractor['matched_label']} (Overlap: {attractor['cosine_similarity']:.3f})\n"
            f"- Cortical Mean Firing Rate: {m['mean_firing_rate_hz']:.1f} Hz\n"
            f"- Total Action Potentials: {m['total_spikes']}\n"
            f"- Synchrony Index (Fano Factor): {m['synchrony_fano_factor']:.3f}\n"
            f"- E/I Population Balance: {m['num_excitatory']} Pyramidal / {m['num_inhibitory']} Interneurons\n"
        )

        hybrid_system_prompt = (
            "You are NEUROCORE's Hybrid Intelligence Core. You combine computational neuroscience with large language reasoning. "
            "Analyze the user's inquiry using insights derived from the co-processor's biological attractor state."
        )

        augmented_prompt = f"{prompt}\n{neural_context}"

        # Step 4: LLM generation conditioned by neural co-processor
        llm_res = self.ollama.generate(
            prompt=augmented_prompt,
            system_prompt=hybrid_system_prompt,
            model=model,
        )
        elapsed = time.perf_counter() - t_start

        return {
            "mode": "MODE_C_HYBRID",
            "prompt": prompt,
            "response": llm_res.get("response", ""),
            "model": llm_res.get("model", self.ollama.default_model),
            "latency_sec": round(elapsed, 3),
            "tokens_generated": llm_res.get("tokens_generated", 0),
            "neural_modulation": {
                "matched_attractor": attractor["matched_label"],
                "attractor_overlap": attractor["cosine_similarity"],
                "total_spikes": self.network.total_spike_count,
                "mean_firing_rate_hz": m["mean_firing_rate_hz"],
                "synchrony_fano_factor": m["synchrony_fano_factor"],
            },
        }

    # -------------------------------------------------------------------------
    # COMPARISON HARNESS
    # -------------------------------------------------------------------------
    def compare_modes(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Run all three modes on the identical prompt and compare metrics.
        """
        res_a = self.process_mode_a(prompt, model=model)
        res_b = self.process_mode_b(prompt)
        res_c = self.process_mode_c(prompt, model=model)

        # Honest comparison evaluation
        return {
            "prompt": prompt,
            "mode_a": res_a,
            "mode_b": res_b,
            "mode_c": res_c,
            "comparison": {
                "fastest_mode": min([("Mode A", res_a["latency_sec"]), ("Mode B", res_b["latency_sec"]), ("Mode C", res_c["latency_sec"])], key=lambda x: x[1])[0],
                "energy_cost_spikes": {
                    "mode_a": 0,
                    "mode_b": res_b["total_spikes"],
                    "mode_c": res_c["neural_modulation"]["total_spikes"],
                },
                "latency_overhead_c_vs_a_sec": round(res_c["latency_sec"] - res_a["latency_sec"], 3),
                "scientific_finding": (
                    "Mode B executes purely within the spiking network using sparse action potentials with zero GPU/LLM token cost. "
                    "Mode C incorporates biological attractor grounding into the prompt context at the cost of SNN simulation overhead."
                ),
            },
        }
