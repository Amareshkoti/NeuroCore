"""
NEUROCORE - API Integration Tests
Tests all core REST endpoints of the FastAPI backend.
"""

import pytest
from fastapi.testclient import TestClient
from backend.api.app import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_api_system():
    res = client.get("/api/system")
    assert res.status_code == 200
    data = res.json()
    assert "hardware" in data
    assert "ollama" in data
    assert "simulation" in data


def test_api_simulation_lifecycle():
    # 1. Create
    res_create = client.post("/api/simulation/create", json={"num_neurons": 150, "model_type": "lif"})
    assert res_create.status_code == 200
    assert res_create.json()["metrics"]["num_neurons"] == 150

    # 2. Step
    res_step = client.post("/api/simulation/step?steps=5")
    assert res_step.status_code == 200

    # 3. Activity
    res_act = client.get("/api/neural/activity")
    assert res_act.status_code == 200
    assert "mean_membrane_potential_mv" in res_act.json()

    # 4. Network 3D payload
    res_net = client.get("/api/neural/network?max_edges=50")
    assert res_net.status_code == 200
    assert len(res_net.json()["neurons"]) == 150

    # 5. Reset
    res_reset = client.post("/api/simulation/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["status"] == "reset"


def test_api_learning_configuration():
    res = client.post("/api/learning/configure", json={"stdp_enabled": True, "a_plus": 0.01})
    assert res.status_code == 200
    assert res.json()["stdp_enabled"] is True


def test_api_memory_lifecycle():
    res_store = client.post("/api/memory/store", json={"pattern_names": ["Alpha", "Beta"]})
    assert res_store.status_code == 200

    res_recall = client.post("/api/memory/recall", json={"pattern_name": "Alpha", "noise_fraction": 0.1})
    assert res_recall.status_code == 200
    assert "recall_result" in res_recall.json()


def test_api_ai_mode_b_neural_only():
    res = client.post("/api/ai/process", json={"mode": "MODE_B_NEURAL_ONLY", "prompt": "Cerebellar timing"})
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "MODE_B_NEURAL_ONLY"
    assert data["total_spikes"] > 0
