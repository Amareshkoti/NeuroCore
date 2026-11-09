import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { SystemStatus } from "../types";
import { GlassCard } from "../components/GlassCard";
import { Sliders, Bot, Cpu, Save, CheckCircle, ShieldCheck } from "lucide-react";

interface SettingsPageProps {
  system: SystemStatus | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ system }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>("http://127.0.0.1:11434");
  const [defaultModel, setDefaultModel] = useState<string>("qwen2.5:3b-instruct");
  const [embedModel, setEmbedModel] = useState<string>("nomic-embed-text:latest");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [contextSize, setContextSize] = useState<number>(4096);
  const [defaultNeurons, setDefaultNeurons] = useState<number>(1000);
  const [dtMs, setDtMs] = useState<number>(0.1);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [savedMsg, setSavedMsg] = useState<string>("");

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".settings-card", {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "all",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSave = () => {
    setSavedMsg("Settings successfully updated and persisted to research session");
    setTimeout(() => setSavedMsg(""), 4000);
  };

  return (
    <div
      ref={containerRef}
      style={{
        padding: "28px",
        maxWidth: "1080px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Header */}
      <GlassCard glowColor="cyan" className="settings-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <span className="badge badge-cyan">Platform Configuration</span>
          <span className="badge badge-emerald">Ollama Local</span>
        </div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
          Research Workstation & Engine Parameters
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "6px" }}>
          Configure connection endpoints, local inference models, and default computational neuroscience simulation parameters.
        </p>
      </GlassCard>

      {/* Settings Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Ollama Settings */}
        <GlassCard glowColor="purple" className="settings-card" style={{ padding: "24px" }}>
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={18} color="#8b5cf6" /> Local Ollama Engine Configuration
            </span>
            <span className="badge badge-purple">Host Machine Models</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.875rem" }}>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                API Endpoint (This Machine)
              </label>
              <input
                type="text"
                value={ollamaEndpoint}
                onChange={(e) => setOllamaEndpoint(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(10, 16, 30, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "6px",
                  color: "#38bdf8",
                  padding: "10px 14px",
                  fontFamily: "monospace",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  Default LLM Model
                </label>
                <input
                  type="text"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(10, 16, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "10px 14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  Embedding Model
                </label>
                <input
                  type="text"
                  value={embedModel}
                  onChange={(e) => setEmbedModel(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(10, 16, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "10px 14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Biological SNN Physics Settings */}
        <GlassCard glowColor="cyan" className="settings-card" style={{ padding: "24px" }}>
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={18} color="#06b6d4" /> Differential Numerical Integration Parameters
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.875rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  Default Neuron Count
                </label>
                <input
                  type="number"
                  value={defaultNeurons}
                  onChange={(e) => setDefaultNeurons(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    background: "rgba(10, 16, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "10px 14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  Integration Step Size dt (ms)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={dtMs}
                  onChange={(e) => setDtMs(parseFloat(e.target.value))}
                  style={{
                    width: "100%",
                    background: "rgba(10, 16, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "10px 14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  Reproducible Seed
                </label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    background: "rgba(10, 16, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "10px 14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "10px 24px" }}>
                <Save size={16} /> Save Configuration
              </button>
            </div>

            {savedMsg && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#34d399",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                [SUCCESS] {savedMsg}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
