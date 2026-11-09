import React from "react";
import { SystemStatus, RealtimeMetrics } from "../types";
import { Brain, Cpu, Bot, HardDrive, Shield } from "lucide-react";

interface HeaderProps {
  system: SystemStatus | null;
  metrics: RealtimeMetrics | null;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ system, metrics, isConnected }) => {
  return (
    <header
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Platform Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            background: "#1e293b",
            width: "32px",
            height: "32px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border-default)",
          }}
        >
          <Brain size={18} color="#94a3b8" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.02em", color: "#f8fafc" }}>
              NEUROCORE
            </span>
            <span className="badge badge-neutral" style={{ fontSize: "10px" }}>
              v1.0.0 Research Platform
            </span>
            <span className={`badge ${isConnected ? "badge-emerald" : "badge-red"}`} style={{ fontSize: "10px" }}>
              {isConnected ? "Engine Connected" : "Connecting..."}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Computational Neuroscience & Hybrid Intelligence Architecture
          </div>
        </div>
      </div>

      {/* Hardware & Telemetry Readouts */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Local Ollama Status */}
        <div
          style={{
            background: "var(--bg-surface-subtle)",
            border: "1px solid var(--border-muted)",
            borderRadius: "4px",
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Bot size={14} color={system?.ollama.available ? "#10b981" : "#f43f5e"} />
          <div style={{ fontSize: "11px" }}>
            <span style={{ color: "var(--text-muted)" }}>LLM: </span>
            <span style={{ fontWeight: 600, color: system?.ollama.available ? "var(--text-primary)" : "#f87171" }}>
              {system?.ollama.available ? system.ollama.active_model : "Offline"}
            </span>
          </div>
        </div>

        {/* CPU / RAM Telemetry */}
        <div
          style={{
            background: "var(--bg-surface-subtle)",
            border: "1px solid var(--border-muted)",
            borderRadius: "4px",
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Cpu size={14} color="#94a3b8" />
          <div style={{ fontSize: "11px" }}>
            <span style={{ color: "var(--text-muted)" }}>CPU: </span>
            <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {system?.process_resources.cpu_percent.toFixed(0) ?? 0}%
            </span>
          </div>
        </div>

        {/* Live Spikes / Time Telemetry */}
        <div
          style={{
            background: "var(--bg-surface-subtle)",
            border: "1px solid var(--border-muted)",
            borderRadius: "4px",
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>t=</span>
            <span style={{ fontWeight: 600 }}>{metrics?.current_time_ms.toFixed(1) ?? "0.0"}ms</span>
            <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>spikes=</span>
            <span style={{ fontWeight: 600 }}>{metrics?.total_spikes.toLocaleString() ?? 0}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
