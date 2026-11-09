import React from "react";
import { SystemStatus, RealtimeMetrics } from "../types";
import { Cpu, HardDrive, Bot, Activity, Zap, ShieldCheck, ArrowRight } from "lucide-react";

interface OverviewPageProps {
  system: SystemStatus | null;
  metrics: RealtimeMetrics | null;
  onNavigate: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ system, metrics, onNavigate }) => {
  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Banner */}
      <div
        className="panel"
        style={{
          background: "linear-gradient(135deg, rgba(13, 18, 29, 0.95), rgba(15, 23, 42, 0.9))",
          borderColor: "#06b6d4",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "800px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <span className="badge badge-cyan">Biological Simulation Active</span>
            <span className="badge badge-purple">Hybrid Co-Processing</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", marginBottom: "8px" }}>
            Synthetic Biological Computing Research Station
          </h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.6, fontSize: "0.95rem" }}>
            Investigating whether mathematically simulated biological spiking neural networks can perform useful
            computation, preserve associative memory, and complement local Large Language Models without biological tissue.
          </p>

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button onClick={() => onNavigate("laboratory")} className="btn btn-primary">
              <Activity size={16} /> Enter Neural Lab
            </button>
            <button onClick={() => onNavigate("ai")} className="btn btn-secondary">
              <Bot size={16} /> Test Hybrid AI
            </button>
            <button onClick={() => onNavigate("experiments")} className="btn btn-secondary">
              <Zap size={16} /> Run Scientific Experiments
            </button>
          </div>
        </div>
      </div>

      {/* Grid: System Hardware & Ollama Status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Hardware Card */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={16} color="#06b6d4" /> Host Hardware Profile
            </span>
            <span className="badge badge-emerald">Verified</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Processor:</span>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{system?.hardware.processor || "Intel Core i7 (8 Threads)"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>RAM Total:</span>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{system?.hardware.ram_total_gb} GB</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>RAM Available:</span>
              <span style={{ color: "#34d399", fontWeight: 600 }}>{system?.hardware.ram_available_gb} GB</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>PyTorch Engine:</span>
              <span style={{ color: "#38bdf8", fontWeight: 600 }}>{system?.hardware.torch_version} (Vectorized CPU)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Operating System:</span>
              <span style={{ color: "#cbd5e1" }}>{system?.hardware.os}</span>
            </div>
          </div>
        </div>

        {/* Ollama Local Integration Card */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={16} color="#8b5cf6" /> Local Ollama AI Daemon
            </span>
            <span className={`badge ${system?.ollama.available ? "badge-emerald" : "badge-red"}`}>
              {system?.ollama.available ? "Connected (Local)" : "Disconnected"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Endpoint:</span>
              <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>{system?.ollama.endpoint}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Active LLM:</span>
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>{system?.ollama.active_model}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Embedding Model:</span>
              <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{system?.ollama.active_embed_model}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Installed Models:</span>
              <span style={{ color: "#f1f5f9" }}>{system?.ollama.models_count} models ready</span>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
              {system?.ollama.models.map((m) => (
                <span key={m.name} className="badge badge-purple" style={{ fontSize: "10px" }}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulation Snapshot */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Activity size={16} color="#10b981" /> Spiking Simulation State
            </span>
            <span className="badge badge-cyan">{metrics?.num_neurons || 1000} Neurons</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="stat-card">
              <div className="stat-label">Active Spikes (Step)</div>
              <div className="stat-val" style={{ color: "#f59e0b" }}>{metrics?.active_spikes_current_step ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Spikes Emitted</div>
              <div className="stat-val" style={{ color: "#38bdf8" }}>{metrics?.total_spikes.toLocaleString() ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Firing Rate</div>
              <div className="stat-val" style={{ color: "#34d399" }}>{metrics?.mean_firing_rate_hz.toFixed(1) ?? "0.0"} Hz</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Potential</div>
              <div className="stat-val" style={{ color: "#cbd5e1" }}>{metrics?.mean_membrane_potential_mv.toFixed(1) ?? "-65.0"} mV</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Principles Section */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            <ShieldCheck size={16} color="#06b6d4" /> Core Scientific Capabilities Implemented
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#0a0f1d", padding: "14px", borderRadius: "6px", border: "1px solid #1e293b" }}>
            <h4 style={{ color: "#38bdf8", fontSize: "0.9rem", marginBottom: "6px" }}>1. Differential Solvers</h4>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Integrates real Leaky Integrate-and-Fire and Adaptive Exponential differential equations with exact refractory enforcement.
            </p>
          </div>

          <div style={{ background: "#0a0f1d", padding: "14px", borderRadius: "6px", border: "1px solid #1e293b" }}>
            <h4 style={{ color: "#a78bfa", fontSize: "0.9rem", marginBottom: "6px" }}>2. Synaptic Plasticity (STDP)</h4>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Bi & Poo (1998) asymmetric timing window modifying actual synaptic weights based on pre- and post-synaptic spike timing.
            </p>
          </div>

          <div style={{ background: "#0a0f1d", padding: "14px", borderRadius: "6px", border: "1px solid #1e293b" }}>
            <h4 style={{ color: "#34d399", fontSize: "0.9rem", marginBottom: "6px" }}>3. Recurrent Attractor Memory</h4>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Recurrent associative storage and recall from 40% occluded or 20% noisy inputs embedded in the synaptic weight matrix W.
            </p>
          </div>

          <div style={{ background: "#0a0f1d", padding: "14px", borderRadius: "6px", border: "1px solid #1e293b" }}>
            <h4 style={{ color: "#f59e0b", fontSize: "0.9rem", marginBottom: "6px" }}>4. Hybrid LLM Co-Processor</h4>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Ollama integration enabling direct scientific comparison between Mode A (LLM Only), Mode B (SNN Only), and Mode C (Hybrid).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
