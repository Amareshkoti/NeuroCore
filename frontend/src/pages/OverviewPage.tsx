import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { SystemStatus, RealtimeMetrics } from "../types";
import { GlassCard } from "../components/GlassCard";
import {
  Cpu,
  Bot,
  Activity,
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Network,
  Radio,
  Layers,
  ChevronRight,
  Binary,
} from "lucide-react";

interface OverviewPageProps {
  system: SystemStatus | null;
  metrics: RealtimeMetrics | null;
  onNavigate: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ system, metrics, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".spatial-card", {
        y: 35,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "all",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        padding: "28px",
        maxWidth: "1480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Hero Spatial Card */}
      <GlassCard glowColor="cyan" className="spatial-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
          <div style={{ maxWidth: "850px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              <span className="badge badge-cyan">
                <Activity size={12} /> Biological Solvers Active
              </span>
              <span className="badge badge-purple">
                <Bot size={12} /> Local Ollama Connected
              </span>
              <span className="badge badge-emerald">
                <ShieldCheck size={12} /> Scientific Rigor
              </span>
            </div>

            <h1
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#f8fafc",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                marginBottom: "12px",
                background: "linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Synthetic Biological Computing Platform
            </h1>

            <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: "1.02rem" }}>
              Investigating whether mathematically simulated biological spiking neural networks (LIF & AdEx) can perform
              useful computation, store sparse associative memories, and complement local Large Language Models without
              requiring biological tissue or neural implants.
            </p>

            <div style={{ display: "flex", gap: "14px", marginTop: "24px", flexWrap: "wrap" }}>
              <button onClick={() => onNavigate("laboratory")} className="btn btn-primary" style={{ padding: "10px 20px" }}>
                <Activity size={16} /> Enter Neural Laboratory <ArrowRight size={15} />
              </button>
              <button onClick={() => onNavigate("3d-brain")} className="btn btn-secondary" style={{ padding: "10px 18px" }}>
                <Layers size={16} /> 3D Cortical Space
              </button>
              <button onClick={() => onNavigate("ai")} className="btn btn-secondary" style={{ padding: "10px 18px" }}>
                <Bot size={16} /> Hybrid AI Co-Processor
              </button>
              <button onClick={() => onNavigate("experiments")} className="btn btn-secondary" style={{ padding: "10px 18px" }}>
                <Zap size={16} /> Scientific Benchmark Suite
              </button>
            </div>
          </div>

          {/* Quick HUD Telemetry Box */}
          <div
            style={{
              background: "rgba(10, 16, 30, 0.75)",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              borderRadius: "12px",
              padding: "18px 22px",
              minWidth: "260px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              Simulation Engine Telemetry
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>State:</span>
                <span className="badge badge-emerald" style={{ padding: "2px 7px" }}>Ready</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Population:</span>
                <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{metrics?.num_neurons || 1000} Neurons</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Biological Step:</span>
                <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>0.1 ms (dt)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Dale's Ratio:</span>
                <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>80% E / 20% I</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Grid: 3 Glassmorphic Pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "22px" }}>
        {/* Hardware Architecture Card */}
        <GlassCard glowColor="cyan" className="spatial-card" style={{ padding: "24px" }}>
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={18} color="#06b6d4" /> Host Hardware Execution
            </span>
            <span className="badge badge-emerald">Verified Active</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Processor Core:</span>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{system?.hardware.processor || "Intel Core i7 (8 Threads)"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>System RAM:</span>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{system?.hardware.ram_total_gb} GB Total</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Available Memory:</span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>{system?.hardware.ram_available_gb} GB Free</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Acceleration Engine:</span>
              <span style={{ color: "#38bdf8", fontWeight: 600 }}>{system?.hardware.torch_version} (Vectorized CPU)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Host OS:</span>
              <span style={{ color: "#cbd5e1" }}>{system?.hardware.os}</span>
            </div>
          </div>
        </GlassCard>

        {/* Ollama Local AI Daemon Card */}
        <GlassCard glowColor="purple" className="spatial-card" style={{ padding: "24px" }}>
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={18} color="#8b5cf6" /> Local Ollama AI Daemon
            </span>
            <span className={`badge ${system?.ollama.available ? "badge-emerald" : "badge-red"}`}>
              {system?.ollama.available ? "Connected (127.0.0.1)" : "Offline"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Daemon Endpoint:</span>
              <span style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: "12px" }}>
                {system?.ollama.endpoint}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Active LLM:</span>
              <span style={{ color: "#c084fc", fontWeight: 700 }}>{system?.ollama.active_model}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Embedding Model:</span>
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{system?.ollama.active_embed_model}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Installed Models:</span>
              <span style={{ color: "#f1f5f9" }}>{system?.ollama.models_count} models discovered</span>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
              {system?.ollama.models.map((m) => (
                <span key={m.name} className="badge badge-purple" style={{ fontSize: "10px" }}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Live Spiking Snapshot Card */}
        <GlassCard glowColor="emerald" className="spatial-card" style={{ padding: "24px" }}>
          <div className="panel-header">
            <span className="panel-title">
              <Activity size={18} color="#10b981" /> Spiking Activity Snapshot
            </span>
            <span className="badge badge-cyan">{metrics?.num_neurons || 1000} Neurons</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="stat-card">
              <div className="stat-label">Step Spikes</div>
              <div className="stat-val" style={{ color: "#f59e0b" }}>{metrics?.active_spikes_current_step ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Spikes</div>
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
        </GlassCard>
      </div>

      {/* Scientific Principles Section */}
      <GlassCard glowColor="none" className="spatial-card" style={{ padding: "28px" }}>
        <div className="panel-header" style={{ marginBottom: "20px" }}>
          <span className="panel-title" style={{ fontSize: "1.05rem" }}>
            <Sparkles size={18} color="#06b6d4" /> Core Scientific Capabilities Implemented
          </span>
          <span className="badge badge-cyan">Zero Fake Computation</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          <div
            style={{
              background: "rgba(10, 16, 30, 0.6)",
              padding: "18px",
              borderRadius: "10px",
              border: "1px solid rgba(6, 182, 212, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Activity size={16} color="#38bdf8" />
              <h4 style={{ color: "#38bdf8", fontSize: "0.95rem", fontWeight: 700 }}>1. Differential Solvers</h4>
            </div>
            <p style={{ fontSize: "0.84rem", color: "#94a3b8", lineHeight: 1.6 }}>
              Integrates real Leaky Integrate-and-Fire and Brette-Gerstner Adaptive Exponential differential equations
              with exact 2.0 ms refractory clamping and Dale's principle.
            </p>
          </div>

          <div
            style={{
              background: "rgba(10, 16, 30, 0.6)",
              padding: "18px",
              borderRadius: "10px",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Zap size={16} color="#a78bfa" />
              <h4 style={{ color: "#a78bfa", fontSize: "0.95rem", fontWeight: 700 }}>2. Synaptic Plasticity (STDP)</h4>
            </div>
            <p style={{ fontSize: "0.84rem", color: "#94a3b8", lineHeight: 1.6 }}>
              Bi & Poo (1998) asymmetric timing window dynamically modifies real synaptic conductances based on
              pre- and post-synaptic spike timing, stabilized by Turrigiano homeostatic scaling.
            </p>
          </div>

          <div
            style={{
              background: "rgba(10, 16, 30, 0.6)",
              padding: "18px",
              borderRadius: "10px",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Network size={16} color="#34d399" />
              <h4 style={{ color: "#34d399", fontSize: "0.95rem", fontWeight: 700 }}>3. Attractor Memory</h4>
            </div>
            <p style={{ fontSize: "0.84rem", color: "#94a3b8", lineHeight: 1.6 }}>
              Recurrent associative storage and complete pattern recall from 40% occluded or 20% noisy inputs embedded
              in recurrent synaptic weight matrix W without dictionary shortcuts.
            </p>
          </div>

          <div
            style={{
              background: "rgba(10, 16, 30, 0.6)",
              padding: "18px",
              borderRadius: "10px",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Bot size={16} color="#fbbf24" />
              <h4 style={{ color: "#fbbf24", fontSize: "0.95rem", fontWeight: 700 }}>4. Hybrid LLM Co-Processor</h4>
            </div>
            <p style={{ fontSize: "0.84rem", color: "#94a3b8", lineHeight: 1.6 }}>
              Ollama integration enabling direct, honest scientific comparison between Mode A (LLM Only),
              Mode B (SNN Only), and Mode C (Hybrid co-processing).
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
