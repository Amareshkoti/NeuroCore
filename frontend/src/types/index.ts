export interface HardwareProfile {
  os: string;
  processor: string;
  cpu_count_physical: number;
  cpu_count_logical: number;
  cpu_freq_mhz: number;
  ram_total_gb: number;
  ram_available_gb: number;
  ram_percent_used: number;
  cuda_available: boolean;
  cuda_device_count: number;
  cuda_device_name: string;
  torch_version: string;
  recommended_device: string;
}

export interface OllamaModelInfo {
  name: string;
  size_bytes?: number;
  family?: string;
  parameter_size?: string;
}

export interface SystemStatus {
  hardware: HardwareProfile;
  process_resources: {
    cpu_percent: number;
    memory_rss_mb: number;
    memory_vms_mb: number;
  };
  ollama: {
    available: boolean;
    endpoint: string;
    active_model: string;
    active_embed_model: string;
    models_count: number;
    models: OllamaModelInfo[];
  };
  simulation: {
    is_running: boolean;
    num_neurons: number;
    current_time_ms: number;
    total_spikes: number;
  };
}

export interface RealtimeMetrics {
  current_time_ms: number;
  step_count: number;
  num_neurons: number;
  active_spikes_current_step: number;
  total_spikes: number;
  mean_membrane_potential_mv: number;
  std_membrane_potential_mv: number;
  mean_firing_rate_hz: number;
  max_firing_rate_hz: number;
  synchrony_fano_factor: number;
  num_excitatory: number;
  num_inhibitory: number;
  num_synapses: number;
  mean_synaptic_weight: number;
  stdp_enabled?: boolean;
  homeostatic_enabled?: boolean;
  stdp_ltp_events?: number;
  stdp_ltd_events?: number;
  stdp_net_weight_change?: number;
  recent_mean_weight_trend?: number[];
}

export interface NeuronVisualData {
  id: number;
  x: number;
  y: number;
  z: number;
  is_exc: boolean;
  v: number;
  rate: number;
  spiked: boolean;
}

export interface SynapticEdgeVisualData {
  source: number;
  target: number;
  weight: number;
  is_exc: boolean;
}

export interface NetworkVisualizationPayload {
  metrics: RealtimeMetrics;
  neurons: NeuronVisualData[];
  edges: SynapticEdgeVisualData[];
  recent_raster: [number, number][];
}

export interface AIProcessResult {
  mode: string;
  prompt: string;
  response: string;
  model?: string;
  latency_sec: number;
  tokens_generated?: number;
  num_neurons?: number;
  total_spikes?: number;
  mean_firing_rate_hz?: number;
  matched_attractor?: string;
  attractor_overlap?: number;
  neural_modulation?: {
    matched_attractor: string;
    attractor_overlap: number;
    total_spikes: number;
    mean_firing_rate_hz: number;
    synchrony_fano_factor: number;
  };
}

export interface RecallResult {
  matched_label: string;
  cosine_similarity: number;
  hamming_similarity: number;
  settled_firing_rate_hz: number;
  total_settling_spikes: number;
  all_similarities: Record<string, number>;
}

export interface NoisePoint {
  noise_fraction: number;
  input_cue_similarity: number;
  recovered_similarity: number;
  matched_label: string;
  is_correct_attractor: boolean;
}

export interface ExperimentSummary {
  filename: string;
  experiment_name: string;
  timestamp: string;
  accuracy?: number | null;
  simulation_time_sec?: number | null;
  num_neurons?: number | null;
}

export interface LivePacket {
  metrics?: RealtimeMetrics;
  is_running?: boolean;
  spiked_ids?: number[];
  spike_events?: [number, number][];
  sample_v?: number[];
}

export interface AIComparisonResult {
  prompt: string;
  mode_a: AIProcessResult;
  mode_b: AIProcessResult;
  mode_c: AIProcessResult;
  comparison: {
    fastest_mode: string;
    energy_cost_spikes: {
      mode_a: number;
      mode_b: number;
      mode_c: number;
    };
    latency_overhead_c_vs_a_sec: number;
    scientific_finding: string;
  };
}
