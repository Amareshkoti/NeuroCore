import {
  SystemStatus,
  RealtimeMetrics,
  NetworkVisualizationPayload,
  AIProcessResult,
  AIComparisonResult,
  RecallResult,
  NoisePoint,
  ExperimentSummary,
  LivePacket,
} from "../types";

const HOST = import.meta.env.VITE_API_HOST ?? "127.0.0.1:8000";
const API_BASE = `http://${HOST}/api`;
const WS_BASE = `ws://${HOST}/ws`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* body was not JSON */
    }
    throw new Error(detail);
  }
  return res.json();
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const api = {
  getSystemStatus: () => request<SystemStatus>("/system"),

  createSimulation: (params: {
    num_neurons: number;
    model_type: string;
    excitatory_ratio: number;
    connection_probability: number;
    seed: number;
  }) => post<{ message: string; metrics: RealtimeMetrics }>("/simulation/create", params),

  startSimulation: () => post("/simulation/start"),
  pauseSimulation: () => post("/simulation/pause"),
  stepSimulation: (steps = 1) => post<{ metrics: RealtimeMetrics }>(`/simulation/step?steps=${steps}`),
  resetSimulation: () => post("/simulation/reset"),

  injectCurrent: (target_cluster: string, amplitude_na: number, duration_ms = 20) =>
    post<{ message: string }>("/simulation/inject", { target_cluster, amplitude_na, duration_ms }),

  getNeuralActivity: () => request<RealtimeMetrics>("/neural/activity"),

  getNeuralNetwork3D: (maxEdges = 1200) =>
    request<NetworkVisualizationPayload>(`/neural/network?max_edges=${maxEdges}`),

  configureLearning: (params: {
    stdp_enabled: boolean;
    homeostatic_enabled: boolean;
    a_plus: number;
    a_minus: number;
  }) => post("/learning/configure", params),

  storeMemoryPatterns: (pattern_names: string[]) =>
    post<{ meta: { num_patterns_stored: number; num_synapses_potentiated: number; mean_synaptic_weight: number } }>(
      "/memory/store",
      { pattern_names },
    ),

  recallMemoryPattern: (params: { pattern_name: string; noise_fraction: number; mask_fraction: number }) =>
    post<{ query_pattern: string; recall_result: RecallResult; original: number[]; cue: number[]; settled_rates_hz: number[] }>(
      "/memory/recall",
      params,
    ),

  getNoiseBenchmark: (pattern = "Alpha") =>
    request<{ pattern: string; benchmark: NoisePoint[] }>(
      `/memory/noise_benchmark?pattern=${encodeURIComponent(pattern)}`,
    ),

  processAI: (params: { mode: string; prompt: string; model?: string }) =>
    post<AIProcessResult | AIComparisonResult>("/ai/process", params),

  runExperiment: (experiment_id: number, num_neurons = 250) =>
    post<Record<string, unknown>>("/experiments/run", { experiment_id, num_neurons }),

  getExperimentResults: () => request<ExperimentSummary[]>("/experiments/results"),

  getOllamaModels: () => request("/ollama/models"),

  createSimulationWebSocket(onMessage: (data: LivePacket) => void): WebSocket {
    const ws = new WebSocket(`${WS_BASE}/simulation`);
    ws.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch (err) {
        console.error("Could not parse simulation packet", err);
      }
    };
    return ws;
  },
};
