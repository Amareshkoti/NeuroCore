import React from "react";
import {
  Compass,
  Activity,
  Layers,
  Sparkles,
  Database,
  Bot,
  FlaskConical,
  Gauge,
  Sliders,
} from "lucide-react";

export type NavTab =
  | "overview"
  | "laboratory"
  | "visualization"
  | "learning"
  | "memory"
  | "ai"
  | "experiments"
  | "benchmarks"
  | "settings";

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Compass size={14} /> },
    { id: "laboratory", label: "Neural Lab", icon: <Activity size={14} /> },
    { id: "visualization", label: "3D Brain", icon: <Layers size={14} /> },
    { id: "learning", label: "Plasticity Engine", icon: <Sparkles size={14} /> },
    { id: "memory", label: "Neural Memory", icon: <Database size={14} /> },
    { id: "ai", label: "Hybrid AI", icon: <Bot size={14} /> },
    { id: "experiments", label: "Experiments", icon: <FlaskConical size={14} /> },
    { id: "benchmarks", label: "Benchmarks", icon: <Gauge size={14} /> },
    { id: "settings", label: "Settings", icon: <Sliders size={14} /> },
  ];

  return (
    <div
      style={{
        padding: "0 24px",
        background: "var(--bg-canvas)",
        borderBottom: "1px solid var(--border-default)",
        overflowX: "auto",
      }}
    >
      <nav
        style={{
          display: "flex",
          gap: "4px",
          minWidth: "max-content",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 14px",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                background: isActive ? "var(--bg-surface)" : "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
                borderRadius: "4px 4px 0 0",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <span style={{ color: isActive ? "var(--accent-blue)" : "var(--text-muted)" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
