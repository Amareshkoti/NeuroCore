"""
NEUROCORE - FastAPI Backend Application & WebSocket Real-time Stream
Provides robust REST endpoints and WebSocket channels for the research workstation.
"""

import asyncio
import json
import os
import numpy as np
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.networks.network import SpikingNeuralNetwork
from backend.core.hardware import get_hardware_profile, get_process_resource_usage
from backend.ai.ollama_client import OllamaClient
from backend.ai.hybrid_pipeline import HybridAIOrchestrator
from backend.experiments.runner import ExperimentEngine
from backend.memory.associative import RecurrentAttractorMemory

app = FastAPI(
    title="NEUROCORE Research API",
    description="Synthetic Biological Computing & Hybrid AI Empirical Platform",
    version="1.0.0",
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# GLOBAL STATE CONTAINER
# -----------------------------------------------------------------------------
class SimulationState:
    def __init__(self):
        self.network = SpikingNeuralNetwork(num_neurons=1000, model_type="lif", seed=42)
        self.memory = RecurrentAttractorMemory(num_neurons=300, seed=42)
        self.ollama = OllamaClient()
        self.orchestrator = HybridAIOrchestrator(ollama_client=self.ollama)
        self.experiment_engine = ExperimentEngine()
        self.is_running = False
        self.simulation_task: Optional[asyncio.Task] = None
        self.subscribers: List[WebSocket] = []

state = SimulationState()


# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class CreateSimulationRequest(BaseModel):
    num_neurons: int = Field(1000, ge=50, le=10000)
    model_type: str = Field("lif", pattern="^(lif|adex)$")
    excitatory_ratio: float = Field(0.8, ge=0.1, le=1.0)
    connection_probability: float = Field(0.04, ge=0.001, le=0.5)
    seed: int = 42

class InjectCurrentRequest(BaseModel):
    target_cluster: str = "sensory"  # "sensory", "all", "inhibitory"
    amplitude_na: float = 2.5
    duration_ms: float = 20.0

class ConfigureLearningRequest(BaseModel):
    stdp_enabled: bool = True
    homeostatic_enabled: bool = False
    a_plus: float = 0.008
    a_minus: float = 0.0085

class MemoryStoreRequest(BaseModel):
    pattern_names: List[str] = ["Alpha", "Beta", "Gamma"]

class MemoryRecallRequest(BaseModel):
    pattern_name: str
    noise_fraction: float = Field(0.0, ge=0.0, le=0.8)
    mask_fraction: float = Field(0.0, ge=0.0, le=0.9)

class AIProcessRequest(BaseModel):
    mode: str = Field("MODE_C_HYBRID", pattern="^(MODE_A_LLM_ONLY|MODE_B_NEURAL_ONLY|MODE_C_HYBRID|COMPARE_ALL)$")
    prompt: str = Field(..., min_length=1)
    model: Optional[str] = None

class RunExperimentRequest(BaseModel):
    experiment_id: int = Field(..., ge=1, le=8)
    num_neurons: int = 250


# -----------------------------------------------------------------------------
# SYSTEM & HEALTH ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/api/health")
def get_health() -> Dict[str, Any]:
    return {"status": "healthy", "service": "NEUROCORE", "version": "1.0.0"}

@app.get("/api/system")
def get_system_status() -> Dict[str, Any]:
    hw = get_hardware_profile()
    res = get_process_resource_usage()
    ollama_ok = state.ollama.is_available()
    models = state.ollama.list_local_models() if ollama_ok else []
    return {
        "hardware": hw,
        "process_resources": res,
        "ollama": {
            "available": ollama_ok,
            "endpoint": state.ollama.endpoint,
            "active_model": state.ollama.default_model,
            "active_embed_model": state.ollama.default_embed_model,
            "models_count": len(models),
            "models": models,
        },
        "simulation": {
            "is_running": state.is_running,
            "num_neurons": state.network.num_neurons,
            "current_time_ms": state.network.current_time_ms,
            "total_spikes": state.network.total_spike_count,
        },
    }

@app.get("/api/ollama/models")
def get_ollama_models() -> Dict[str, Any]:
    return {
        "endpoint": state.ollama.endpoint,
        "available": state.ollama.is_available(),
        "models": state.ollama.list_local_models(),
    }


# -----------------------------------------------------------------------------
# SIMULATION CONTROL ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/simulation/create")
def create_simulation(req: CreateSimulationRequest) -> Dict[str, Any]:
    state.is_running = False
    state.network = SpikingNeuralNetwork(
        num_neurons=req.num_neurons,
        model_type=req.model_type,
        excitatory_ratio=req.excitatory_ratio,
        connection_probability=req.connection_probability,
        seed=req.seed,
    )
    return {
        "message": f"Created simulation with {req.num_neurons} neurons ({req.model_type.upper()})",
        "metrics": state.network.get_realtime_metrics(),
    }

@app.post("/api/simulation/start")
def start_simulation() -> Dict[str, Any]:
    state.is_running = True
    return {"status": "started", "is_running": True}

@app.post("/api/simulation/pause")
def pause_simulation() -> Dict[str, Any]:
    state.is_running = False
    return {"status": "paused", "is_running": False}

@app.post("/api/simulation/step")
def step_simulation(steps: int = 1) -> Dict[str, Any]:
    for _ in range(max(1, min(steps, 100))):
        state.network.step()
    return {"metrics": state.network.get_realtime_metrics()}

@app.post("/api/simulation/reset")
def reset_simulation() -> Dict[str, Any]:
    state.is_running = False
    state.network.reset()
    return {"status": "reset", "metrics": state.network.get_realtime_metrics()}

@app.post("/api/simulation/inject")
def inject_current(req: InjectCurrentRequest) -> Dict[str, Any]:
    import numpy as np
    n = state.network.num_neurons
    current = np.zeros(n, dtype=np.float32)

    if req.target_cluster == "sensory":
        # First 15% of neurons
        cluster_size = max(10, int(0.15 * n))
        current[:cluster_size] = req.amplitude_na
    elif req.target_cluster == "inhibitory":
        inh_indices = np.where(~state.network.is_excitatory)[0]
        current[inh_indices] = req.amplitude_na
    else:
        current.fill(req.amplitude_na)

    state.network.inject_current(current)
    return {
        "message": f"Injected {req.amplitude_na} nA to {req.target_cluster} cluster",
        "active_stimulation": True,
    }

@app.get("/api/neural/activity")
def get_neural_activity() -> Dict[str, Any]:
    return state.network.get_realtime_metrics()

@app.get("/api/neural/network")
def get_neural_network_3d(max_edges: int = 1200) -> Dict[str, Any]:
    return state.network.get_visualization_payload(max_edges=max_edges)

@app.post("/api/learning/configure")
def configure_learning(req: ConfigureLearningRequest) -> Dict[str, Any]:
    state.network.configure_plasticity(
        stdp=req.stdp_enabled,
        homeostatic=req.homeostatic_enabled,
        a_plus=req.a_plus,
        a_minus=req.a_minus,
    )
    return {
        "stdp_enabled": state.network.stdp_enabled,
        "homeostatic_enabled": state.network.homeostatic_enabled,
        "a_plus": state.network.stdp.a_plus,
        "a_minus": state.network.stdp.a_minus,
    }


# -----------------------------------------------------------------------------
# ASSOCIATIVE MEMORY ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/memory/store")
def store_memory_patterns(req: MemoryStoreRequest) -> Dict[str, Any]:
    patterns = {name: state.memory.generate_sparse_pattern(name) for name in req.pattern_names}
    res = state.memory.store_patterns(patterns)
    return {"status": "stored", "meta": res, "patterns": req.pattern_names}

@app.post("/api/memory/recall")
def recall_memory_pattern(req: MemoryRecallRequest) -> Dict[str, Any]:
    if req.pattern_name not in state.memory.stored_patterns:
        # If not initialized, initialize defaults
        store_memory_patterns(MemoryStoreRequest())

    original = state.memory.stored_patterns[req.pattern_name]
    cue = original.copy()
    import numpy as np

    if req.mask_fraction > 0:
        mask = np.random.random(len(cue)) < req.mask_fraction
        cue[mask] = 0.0

    if req.noise_fraction > 0:
        flips = np.random.random(len(cue)) < req.noise_fraction
        cue[flips] = 1.0 - cue[flips]

    res = state.memory.recall(cue)
    return {"query_pattern": req.pattern_name, "recall_result": res}

@app.get("/api/memory/noise_benchmark")
def get_noise_benchmark(pattern: str = "Alpha") -> Dict[str, Any]:
    if pattern not in state.memory.stored_patterns:
        store_memory_patterns(MemoryStoreRequest())
    curve = state.memory.test_noise_recovery(pattern, [0.1, 0.2, 0.3, 0.4, 0.5])
    return {"pattern": pattern, "benchmark": curve}


# -----------------------------------------------------------------------------
# HYBRID AI PIPELINE ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/ai/process")
def process_ai(req: AIProcessRequest) -> Dict[str, Any]:
    if req.mode == "MODE_A_LLM_ONLY":
        return state.orchestrator.process_mode_a(req.prompt, model=req.model)
    elif req.mode == "MODE_B_NEURAL_ONLY":
        return state.orchestrator.process_mode_b(req.prompt)
    elif req.mode == "MODE_C_HYBRID":
        return state.orchestrator.process_mode_c(req.prompt, model=req.model)
    elif req.mode == "COMPARE_ALL":
        return state.orchestrator.compare_modes(req.prompt, model=req.model)
    raise HTTPException(status_code=400, detail="Invalid mode")


# -----------------------------------------------------------------------------
# EXPERIMENTAL RESEARCH ENGINE ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/experiments/run")
def run_experiment(req: RunExperimentRequest) -> Dict[str, Any]:
    e_id = req.experiment_id
    eng = state.experiment_engine
    n = req.num_neurons

    if e_id == 1:
        return eng.run_experiment_1_pattern_recognition(num_neurons=n)
    elif e_id == 2:
        return eng.run_experiment_2_associative_memory(num_neurons=n)
    elif e_id == 3:
        return eng.run_experiment_3_temporal_sequence_learning(num_neurons=n)
    elif e_id == 4:
        return eng.run_experiment_4_stdp_learning(num_neurons=n)
    elif e_id == 5:
        return eng.run_experiment_5_noise_resistance(num_neurons=n)
    elif e_id == 6:
        return eng.run_experiment_6_ei_balance(num_neurons=n)
    elif e_id == 7:
        return eng.run_experiment_7_snn_vs_ann(num_neurons=n)
    elif e_id == 8:
        return eng.run_experiment_8_hybrid_comparison()
    raise HTTPException(status_code=400, detail=f"Experiment {e_id} unknown")

@app.get("/api/experiments/results")
def list_experiment_results() -> List[Dict[str, Any]]:
    import os
    res_dir = "experiments/results"
    results = []
    if os.path.exists(res_dir):
        files = sorted(os.listdir(res_dir), reverse=True)
        for f in files[:20]:
            if f.endswith(".json"):
                try:
                    with open(os.path.join(res_dir, f), "r") as fp:
                        data = json.load(fp)
                        results.append({
                            "filename": f,
                            "experiment_name": data.get("experiment_name"),
                            "timestamp": data.get("timestamp"),
                            "accuracy": data.get("accuracy"),
                            "simulation_time_sec": data.get("simulation_time_sec"),
                            "num_neurons": data.get("num_neurons"),
                        })
                except Exception:
                    pass
    return results


# -----------------------------------------------------------------------------
# WEBSOCKET REAL-TIME STREAMING
# -----------------------------------------------------------------------------
@app.websocket("/ws/simulation")
async def websocket_simulation_stream(websocket: WebSocket):
    await websocket.accept()
    state.subscribers.append(websocket)
    try:
        while True:
            # Check for client messages (e.g. pause/start or ping)
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.05)
                cmd = json.loads(msg)
                if cmd.get("action") == "start":
                    state.is_running = True
                elif cmd.get("action") == "pause":
                    state.is_running = False
                elif cmd.get("action") == "reset":
                    state.network.reset()
            except asyncio.TimeoutError:
                pass

            # If simulation is active, step the network
            if state.is_running:
                # Run 5 steps of 0.1ms (0.5ms biological time per packet)
                for _ in range(5):
                    state.network.step()

            # Stream telemetry packet
            metrics = state.network.get_realtime_metrics()
            # Sample active spiked neuron IDs and voltage slice
            spiked_indices = [int(x) for x in np.where(state.network.neurons.spikes)[0]]
            voltage_sample = [round(float(v), 1) for v in state.network.neurons.v[:50]]

            packet = {
                "metrics": metrics,
                "is_running": state.is_running,
                "spiked_ids": spiked_indices,
                "sample_v": voltage_sample,
            }
            await websocket.send_text(json.dumps(packet))
            await asyncio.sleep(0.04)  # ~25 FPS streaming
    except WebSocketDisconnect:
        if websocket in state.subscribers:
            state.subscribers.remove(websocket)
    except Exception:
        if websocket in state.subscribers:
            state.subscribers.remove(websocket)


# -----------------------------------------------------------------------------
# STATIC FRONTEND SPA SERVING
# -----------------------------------------------------------------------------
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

