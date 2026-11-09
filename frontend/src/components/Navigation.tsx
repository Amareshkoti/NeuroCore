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
    { id: "overview", label: "Overview", icon: <Compass size={15} /> },
    { id: "laboratory", label: "Neural Lab", icon: <Activity size={15} /> },
    { id: "visualization", label: "Brain 3D", icon: <Layers size={15} /> },
    { id: "learning", label: "Plasticity Engine", icon: <Sparkles size={15} /> },
    { id: "memory", label: "Neural Memory", icon: <Database size={15} /> },
    { id: "ai", label: "Hybrid AI", icon: <Bot size={15} /> },
    { id: "experiments", label: "Experiments", icon: <FlaskConical size={15} /> },
    { id: "benchmarks", label: "Benchmarks", icon: <Gauge size={15} /> },
    { id: "settings", label: "Settings", icon: <Sliders size={15} /> },
  ];

  return (
    <div
      style={{
        padding: "12px 28px 0 28px",
        background: "rgba(4, 6, 10, 0.4)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        overflowX: "auto",
      }}
    >
      <nav
        style={{
          display: "flex",
          gap: "8px",
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
                gap: "8px",
                padding: "10px 16px",
                fontSize: "0.83rem",
                fontWeight: 700,
                color: isActive ? "#ffffff" : "#94a3b8",
                background: isActive
                  ? "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)"
                  : "transparent",
                border: "1px solid",
                borderColor: isActive ? "rgba(6, 182, 212, 0.5)" : "transparent",
                borderBottom: isActive ? "2px solid #06b6d4" : "2px solid transparent",
                borderRadius: "10px 10px 0 0",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: isActive ? "0 -4px 18px rgba(6, 182, 212, 0.25)" : "none",
                transform: isActive ? "translateY(0px)" : "translateY(1px)",
              }}
            >
              <span style={{ color: isActive ? "#38bdf8" : "#64748b" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
