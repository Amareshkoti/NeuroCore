import React from "react";
import { SystemStatus, RealtimeMetrics } from "../types";
import { GlassCard } from "../components/GlassCard";
import {
  Cpu,
  Bot,
  Activity,
  Zap,
  ShieldCheck,
  ArrowRight,
  Layers,
  Database,
  Sliders,
} from "lucide-react";

interface OverviewPageProps {
  system: SystemStatus | null;
  metrics: RealtimeMetrics | null;
  onNavigate: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ system, metrics, onNavigate }) => {
  return (
    <div
      style={{
        padding: "20px 24px",
        maxWidth: "1440px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Platform Summary Banner */}
      <GlassCard style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ maxWidth: "800px" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-blue">SNN Differential Engine</span>
              <span className="badge badge-emerald">Ollama Local</span>
              <span className="badge badge-neutral">PyTorch CPU Vectorized</span>
            </div>

            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc", marginBottom: "6px" }}>
              NEUROCORE Research Platform
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              A computational neuroscience engineering platform investigating whether mathematically simulated biological neural
              networks (Leaky Integrate-and-Fire and Adaptive Exponential ODEs) can perform useful computation, preserve sparse
              associative memories, and complement local Large Language Models without requiring biological tissue.
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
              <button onClick={() => onNavigate("laboratory")} className="btn btn-primary">
                <Activity size={14} /> Open Neural Lab
              </button>
              <button onClick={() => onNavigate("visualization")} className="btn btn-secondary">
                <Layers size={14} /> 3D Cortical Space
              </button>
              <button onClick={() => onNavigate("ai")} className="btn btn-secondary">
                <Bot size={14} /> Hybrid AI Co-Processor
              </button>
              <button onClick={() => onNavigate("experiments")} className="btn btn-secondary">
                <Zap size={14} /> Run Experiments
              </button>
            </div>
          </div>

          {/* SNN Telemetry Quick Box */}
          <div
            style={{
              background: "var(--bg-surface-subtle)",
              border: "1px solid var(--border-default)",
              borderRadius: "4px",
              padding: "14px 18px",
              minWidth: "260px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
              Simulation Engine State
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Active Population:</span>
                <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{metrics?.num_neurons ?? 1000} Neurons</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Biological Step dt:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>0.1 ms</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Dale's Balance:</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>80% E / 20% I</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Synaptic Delay Ring:</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>1.0 – 5.0 ms</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Grid: Hardware, Ollama, and Live Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
        {/* Hardware Card */}
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={15} /> Host Hardware Environment
            </span>
            <span className="badge badge-emerald">Verified</span>
          </div>

          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ color: "var(--text-secondary)", width: "40%" }}>Processor</td>
                <td style={{ fontWeight: 600 }}>{system?.hardware.processor || "Intel Core i7"}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-secondary)" }}>Logical Cores</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{system?.hardware.cpu_count_logical} Threads</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-secondary)" }}>RAM Total</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{system?.hardware.ram_total_gb} GB</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-secondary)" }}>RAM Available</td>
                <td style={{ fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }}>{system?.hardware.ram_available_gb} GB</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-secondary)" }}>PyTorch Backend</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{system?.hardware.torch_version} (Vectorized CPU)</td>
              </tr>
            </tbody>
          </table>
        </GlassCard>

        {/* Local Ollama Integration Card */}
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={15} /> Local Ollama Daemon
            </span>
            <span className={`badge ${system?.ollama.available ? "badge-emerald" : "badge-red"}`}>
              {system?.ollama.available ? "127.0.0.1:11434" : "Disconnected"}
            </span>
          </div>

          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ color: "var(--text-secondary)", width: "40%" }}>Endpoint</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{system?.ollama.endpoint}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-secondary)" }}>Active LLM</td>
                <td style={{ fontWeight: 600, color: "var(--accent-blue)" }}>{system?.ollama.active_model}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-secondary)" }}>Embeddings</td>
                <td>{system?.ollama.active_embed_model}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-secondary)" }}>Detected Models</td>
                <td>{system?.ollama.models_count} installed</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
            {system?.ollama.models.map((m) => (
              <span key={m.name} className="badge badge-neutral">
                {m.name}
              </span>
            ))}
          </div>
        </GlassCard>

        {/* SNN Telemetry Metrics */}
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">
              <Activity size={15} /> Instantaneous Metrics
            </span>
            <span className="badge badge-blue">{metrics?.num_neurons ?? 1000} Neurons</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="stat-card">
              <div className="stat-label">Active Spikes (Step)</div>
              <div className="stat-val">{metrics?.active_spikes_current_step ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Spikes</div>
              <div className="stat-val">{metrics?.total_spikes.toLocaleString() ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Firing Rate</div>
              <div className="stat-val">{metrics?.mean_firing_rate_hz.toFixed(1) ?? "0.0"} Hz</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Membrane V</div>
              <div className="stat-val">{metrics?.mean_membrane_potential_mv.toFixed(1) ?? "-65.0"} mV</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Core Scientific Architecture Section */}
      <GlassCard>
        <div className="panel-header">
          <span className="panel-title">
            <ShieldCheck size={15} /> Scientific Components Implemented
          </span>
          <span className="badge badge-neutral">Numerical ODE Systems</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          <div style={{ background: "var(--bg-surface-subtle)", padding: "14px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>
              1. Differential Equation Solvers
            </h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Leaky Integrate-and-Fire and Brette-Gerstner Adaptive Exponential differential equations with exact 2.0 ms refractory clamping and Dale's principle.
            </p>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "14px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>
              2. Synaptic Plasticity (STDP)
            </h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Bi & Poo (1998) asymmetric timing window modifying real synaptic weights based on pre- and post-synaptic spike timing, stabilized by Turrigiano homeostatic scaling.
            </p>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "14px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>
              3. Recurrent Attractor Memory
            </h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Hopfield/Hebbian recurrent associative storage and recall from 40% occluded or 20% noisy inputs embedded in the synaptic weight matrix W.
            </p>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "14px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>
              4. Hybrid LLM Co-Processor
            </h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Direct scientific comparison between Mode A (LLM Only), Mode B (SNN Only), and Mode C (Hybrid co-processing) using local Ollama models.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
