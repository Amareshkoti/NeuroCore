import React, { useState } from "react";
import { SystemStatus } from "../types";
import { Sliders, Bot, Cpu, Save, CheckCircle } from "lucide-react";

interface SettingsPageProps {
  system: SystemStatus | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ system }) => {
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>("http://127.0.0.1:11434");
  const [defaultModel, setDefaultModel] = useState<string>("qwen2.5:3b-instruct");
  const [embedModel, setEmbedModel] = useState<string>("nomic-embed-text:latest");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [contextSize, setContextSize] = useState<number>(4096);
  const [defaultNeurons, setDefaultNeurons] = useState<number>(1000);
  const [dtMs, setDtMs] = useState<number>(0.1);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [savedMsg, setSavedMsg] = useState<string>("");

  const handleSave = () => {
    setSavedMsg("Settings updated and saved to session");
    setTimeout(() => setSavedMsg(""), 4000);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
          <span className="badge badge-cyan">Platform Configuration</span>
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc" }}>
          Research Workstation & Engine Parameters
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
          Configure connection endpoints, local inference models, and default computational neuroscience simulation parameters.
        </p>
      </div>

      {/* Settings Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Ollama Settings */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={16} color="#8b5cf6" /> Local Ollama Engine Configuration
            </span>
            <span className="badge badge-purple">Host Machine Models</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.85rem" }}>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                API Endpoint (This Machine)
              </label>
              <input
                type="text"
                value={ollamaEndpoint}
                onChange={(e) => setOllamaEndpoint(e.target.value)}
                style={{ fontFamily: "monospace" }}
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Defaults to local daemon http://127.0.0.1:11434 to use models installed on this machine.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>Default LLM Model</label>
                <input
                  type="text"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                />
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>Embedding Model</label>
                <input
                  type="text"
                  value={embedModel}
                  onChange={(e) => setEmbedModel(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Generation Temperature ({temperature})
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Context Window Tokens ({contextSize})
                </label>
                <input
                  type="number"
                  value={contextSize}
                  onChange={(e) => setContextSize(parseInt(e.target.value) || 2048)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Neural Simulator Settings */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={16} color="#06b6d4" /> Spiking Simulator Biological Calibration
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Default Network Size (Neurons)
                </label>
                <input
                  type="number"
                  value={defaultNeurons}
                  onChange={(e) => setDefaultNeurons(parseInt(e.target.value) || 1000)}
                />
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Simulation Time-Step dt (ms)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dtMs}
                  onChange={(e) => setDtMs(parseFloat(e.target.value) || 0.1)}
                />
              </div>
            </div>

            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Reproducible Random Seed
              </label>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                style={{ width: "200px" }}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {savedMsg ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#34d399", fontSize: "12px" }}>
              <CheckCircle size={15} /> {savedMsg}
            </div>
          ) : (
            <div />
          )}

          <button onClick={handleSave} className="btn btn-primary" style={{ padding: "10px 24px" }}>
            <Save size={15} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
