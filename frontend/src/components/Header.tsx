import React from "react";
import { SystemStatus, RealtimeMetrics } from "../types";
import { Brain, Activity, Cpu, Bot, CheckCircle, AlertTriangle } from "lucide-react";

interface HeaderProps {
  system: SystemStatus | null;
  metrics: RealtimeMetrics | null;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ system, metrics, isConnected }) => {
  return (
    <header
      style={{
        background: "rgba(13, 18, 29, 0.95)",
        borderBottom: "1px solid #1e293b",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Title & Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)",
          }}
        >
          <Brain size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "0.08em", color: "#f8fafc" }}>
              NEUROCORE
            </h1>
            <span className="badge badge-cyan">v1.0 RESEARCH PROTOTYPE</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Synthetic Biological Computing & Hybrid AI Research Platform
          </p>
        </div>
      </div>

      {/* Real-time Status Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Ollama Status */}
        <div
          style={{
            background: "#0a0f1d",
            border: "1px solid #1e293b",
            borderRadius: "6px",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
          }}
        >
          <Bot size={15} color={system?.ollama.available ? "#10b981" : "#ef4444"} />
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Local Ollama</div>
            <div style={{ fontWeight: 600, color: system?.ollama.available ? "#34d399" : "#f87171" }}>
              {system?.ollama.available ? system.ollama.active_model : "Offline (Check localhost:11434)"}
            </div>
          </div>
        </div>

        {/* Backend & Hardware Status */}
        <div
          style={{
            background: "#0a0f1d",
            border: "1px solid #1e293b",
            borderRadius: "6px",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
          }}
        >
          <Cpu size={15} color="#06b6d4" />
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Host Machine</div>
            <div style={{ fontWeight: 600, color: "#f1f5f9" }}>
              {system?.hardware ? `${system.hardware.cpu_count_logical}T CPU | ${system.hardware.ram_total_gb}GB RAM` : "Profiling..."}
            </div>
          </div>
        </div>

        {/* Live Simulation Clock */}
        <div
          style={{
            background: "#0a0f1d",
            border: "1px solid #1e293b",
            borderRadius: "6px",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
          }}
        >
          <Activity size={15} color={system?.simulation.is_running ? "#10b981" : "#f59e0b"} />
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Simulation Time</div>
            <div style={{ fontWeight: 700, fontFamily: "monospace", color: "#38bdf8" }}>
              {metrics ? `${metrics.current_time_ms.toFixed(1)} ms` : "0.0 ms"}
            </div>
          </div>
        </div>

        {/* WebSocket Connection Light */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: isConnected ? "#10b981" : "#ef4444",
              boxShadow: isConnected ? "0 0 8px #10b981" : "0 0 8px #ef4444",
            }}
          />
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            {isConnected ? "WS Live" : "Reconnecting"}
          </span>
        </div>
      </div>
    </header>
  );
};
