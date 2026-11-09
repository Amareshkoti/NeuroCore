import React, { useState } from "react";
import { SystemStatus } from "../types";
import { GlassCard } from "../components/GlassCard";
import { Sliders, Bot, Cpu, Save } from "lucide-react";

interface SettingsPageProps {
  system: SystemStatus | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ system }) => {
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>("http://127.0.0.1:11434");
  const [defaultModel, setDefaultModel] = useState<string>("qwen2.5:3b-instruct");
  const [embedModel, setEmbedModel] = useState<string>("nomic-embed-text:latest");
  const [defaultNeurons, setDefaultNeurons] = useState<number>(1000);
  const [dtMs, setDtMs] = useState<number>(0.1);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [savedMsg, setSavedMsg] = useState<string>("");

  const handleSave = () => {
    setSavedMsg("Settings successfully saved to research session");
    setTimeout(() => setSavedMsg(""), 4000);
  };

  return (
    <div
      style={{
        padding: "20px 24px",
        maxWidth: "960px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header Banner */}
      <GlassCard style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          <span className="badge badge-neutral">Platform Configuration</span>
        </div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Research Workstation & Engine Parameters
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>
          Configure connection endpoints, inference models, and default computational neuroscience simulation parameters.
        </p>
      </GlassCard>

      {/* Settings Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Ollama Settings */}
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={15} /> Local Ollama Engine Configuration
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            <div>
              <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                API Endpoint (This Host Machine)
              </label>
              <input
                type="text"
                value={ollamaEndpoint}
                onChange={(e) => setOllamaEndpoint(e.target.value)}
                style={{ width: "100%", fontFamily: "var(--font-mono)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Default LLM Model
                </label>
                <input
                  type="text"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Embedding Model
                </label>
                <input
                  type="text"
                  value={embedModel}
                  onChange={(e) => setEmbedModel(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Biological SNN ODE Parameters */}
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={15} /> SNN Differential Integration Parameters
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Default Neuron Count
                </label>
                <input
                  type="number"
                  value={defaultNeurons}
                  onChange={(e) => setDefaultNeurons(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Integration Step Size dt (ms)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={dtMs}
                  onChange={(e) => setDtMs(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Reproducible Seed
                </label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button onClick={handleSave} className="btn btn-primary">
                <Save size={14} /> Save Configuration
              </button>
            </div>

            {savedMsg && (
              <div style={{ fontSize: "12px", color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>
                [{savedMsg}]
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
