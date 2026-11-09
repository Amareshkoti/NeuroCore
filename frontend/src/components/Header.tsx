import React from "react";
import { SystemStatus, RealtimeMetrics } from "../types";
import { Brain, Activity, Cpu, Bot, Radio } from "lucide-react";

interface HeaderProps {
  system: SystemStatus | null;
  metrics: RealtimeMetrics | null;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ system, metrics, isConnected }) => {
  return (
    <header
      style={{
        background: "rgba(8, 12, 22, 0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Mission Statement */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          className="pulse-glow"
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(6, 182, 212, 0.4)",
            transform: "rotate(-3deg)",
          }}
        >
          <Brain size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                background: "linear-gradient(90deg, #f8fafc 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              NEUROCORE
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: "10px" }}>
              Antigravity Spatial OS
            </span>
          </div>
          <p style={{ fontSize: "0.76rem", color: "#94a3b8", letterSpacing: "0.02em" }}>
            Synthetic Biological Computing & Hybrid AI Workstation
          </p>
        </div>
      </div>

      {/* Real-time Floating Glass Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Local Ollama Status */}
        <div
          style={{
            background: "rgba(16, 24, 44, 0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            borderRadius: "10px",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
          }}
        >
          <Bot size={16} color={system?.ollama.available ? "#10b981" : "#f43f5e"} />
          <div>
            <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Local Ollama
            </div>
            <div style={{ fontWeight: 700, fontSize: "12px", color: system?.ollama.available ? "#34d399" : "#fda4af" }}>
              {system?.ollama.available ? system.ollama.active_model : "Disconnected"}
            </div>
          </div>
        </div>

        {/* Host Machine Telemetry */}
        <div
          style={{
            background: "rgba(16, 24, 44, 0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            borderRadius: "10px",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
          }}
        >
          <Cpu size={16} color="#06b6d4" />
          <div>
            <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Compute Grid
            </div>
            <div style={{ fontWeight: 700, fontSize: "12px", color: "#f1f5f9" }}>
              {system?.hardware ? `${system.hardware.cpu_count_logical}T CPU · ${system.hardware.ram_total_gb}GB` : "Profiling..."}
            </div>
          </div>
        </div>

        {/* Biological Clock */}
        <div
          style={{
            background: "rgba(16, 24, 44, 0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            borderRadius: "10px",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
          }}
        >
          <Activity size={16} color={system?.simulation.is_running ? "#10b981" : "#f59e0b"} />
          <div>
            <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Sim Time
            </div>
            <div style={{ fontWeight: 800, fontSize: "12px", fontFamily: "monospace", color: "#38bdf8" }}>
              {metrics ? `${metrics.current_time_ms.toFixed(1)} ms` : "0.0 ms"}
            </div>
          </div>
        </div>

        {/* WebSocket Signal */}
        <div
          style={{
            background: "rgba(16, 24, 44, 0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            borderRadius: "10px",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Radio size={14} color={isConnected ? "#10b981" : "#f43f5e"} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: isConnected ? "#34d399" : "#fda4af" }}>
            {isConnected ? "WS 25FPS" : "Reconnecting"}
          </span>
        </div>
      </div>
    </header>
  );
};
