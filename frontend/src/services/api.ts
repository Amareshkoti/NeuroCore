import {
  SystemStatus,
  RealtimeMetrics,
  NetworkVisualizationPayload,
  AIProcessResult,
  AIComparisonResult,
} from "../types";

const API_BASE = "http://127.0.0.1:8000/api";
const WS_BASE = "ws://127.0.0.1:8000/ws";

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system`);
    return res.json();
  },

  async createSimulation(params: {
    num_neurons: number;
    model_type: string;
    excitatory_ratio: number;
    connection_probability: number;
    seed: number;
  }) {
    const res = await fetch(`${API_BASE}/simulation/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify(params),
    });
    return res.json();
  },

  async startSimulation() {
    const res = await fetch(`${API_BASE}/simulation/start`, { method: "POST" });
    return res.json();
  },

  async pauseSimulation() {
    const res = await fetch(`${API_BASE}/simulation/pause`, { method: "POST" });
    return res.json();
  },

  async stepSimulation(steps: number = 1) {
    const res = await fetch(`${API_BASE}/simulation/step?steps=${steps}`, { method: "POST" });
    return res.json();
  },

  async resetSimulation() {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: "POST" });
    return res.json();
  },

  async injectCurrent(target_cluster: string, amplitude_na: number, duration_ms: number = 20) {
    const res = await fetch(`${API_BASE}/simulation/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify({ target_cluster, amplitude_na, duration_ms }),
    });
    return res.json();
  },

  async getNeuralActivity(): Promise<RealtimeMetrics> {
    const res = await fetch(`${API_BASE}/neural/activity`);
    return res.json();
  },

  async getNeuralNetwork3D(maxEdges: number = 1200): Promise<NetworkVisualizationPayload> {
    const res = await fetch(`${API_BASE}/neural/network?max_edges=${maxEdges}`);
    return res.json();
  },

  async configureLearning(params: {
    stdp_enabled: boolean;
    homeostatic_enabled: boolean;
    a_plus: number;
    a_minus: number;
  }) {
    const res = await fetch(`${API_BASE}/learning/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify(params),
    });
    return res.json();
  },

  async storeMemoryPatterns(pattern_names: string[]) {
    const res = await fetch(`${API_BASE}/memory/store`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify({ pattern_names }),
    });
    return res.json();
  },

  async recallMemoryPattern(params: {
    pattern_name: string;
    noise_fraction: number;
    mask_fraction: number;
  }) {
    const res = await fetch(`${API_BASE}/memory/recall`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify(params),
    });
    return res.json();
  },

  async getNoiseBenchmark(pattern: string = "Alpha") {
    const res = await fetch(`${API_BASE}/memory/noise_benchmark?pattern=${encodeURIComponent(pattern)}`);
    return res.json();
  },

  async processAI(params: {
    mode: string;
    prompt: string;
    model?: string;
  }): Promise<AIProcessResult | AIComparisonResult> {
    const res = await fetch(`${API_BASE}/ai/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify(params),
    });
    return res.json();
  },

  async runExperiment(experiment_id: number, num_neurons: number = 250) {
    const res = await fetch(`${API_BASE}/experiments/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify({ experiment_id, num_neurons }),
    });
    return res.json();
  },

  async getExperimentResults() {
    const res = await fetch(`${API_BASE}/experiments/results`);
    return res.json();
  },

  async getOllamaModels() {
    const res = await fetch(`${API_BASE}/ollama/models`);
    return res.json();
  },

  createSimulationWebSocket(onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`${WS_BASE}/simulation`);
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };
    return ws;
  },
};

function jsonStringify(obj: any): string {
  return JSON.stringify(obj);
}
