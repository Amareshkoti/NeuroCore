import React from "react";
import {
  Activity,
  Layers,
  Sparkles,
  Database,
  Bot,
  FlaskConical,
  Gauge,
  Sliders,
  Compass,
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
    { id: "overview", label: "Overview", icon: <Compass size={16} /> },
    { id: "laboratory", label: "Neural Laboratory", icon: <Activity size={16} /> },
    { id: "visualization", label: "Brain 3D", icon: <Layers size={16} /> },
    { id: "learning", label: "Learning Engine", icon: <Sparkles size={16} /> },
    { id: "memory", label: "Neural Memory", icon: <Database size={16} /> },
    { id: "ai", label: "AI Integration", icon: <Bot size={16} /> },
    { id: "experiments", label: "Experiments", icon: <FlaskConical size={16} /> },
    { id: "benchmarks", label: "Benchmarks", icon: <Gauge size={16} /> },
    { id: "settings", label: "Settings", icon: <Sliders size={16} /> },
  ];

  return (
    <nav
      style={{
        background: "#0a0e1a",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        padding: "0 24px",
        gap: "4px",
        overflowX: "auto",
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
              padding: "12px 16px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: isActive ? "#38bdf8" : "#94a3b8",
              background: isActive ? "rgba(6, 182, 212, 0.08)" : "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid #06b6d4" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
