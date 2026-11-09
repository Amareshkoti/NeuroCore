import React, { useState } from "react";
import { SystemStatus, AIProcessResult, AIComparisonResult } from "../types";
import { api } from "../services/api";
import { Bot, Cpu, Zap, Activity, Clock, Sparkles, Send, CheckCircle, Split } from "lucide-react";

interface AIIntegrationPageProps {
  system: SystemStatus | null;
}

export const AIIntegrationPage: React.FC<AIIntegrationPageProps> = ({ system }) => {
  const [selectedMode, setSelectedMode] = useState<string>("COMPARE_ALL");
  const [prompt, setPrompt] = useState<string>(
    "Analyze how biological homeostasis stabilizes neural network dynamics during rapid synaptic plasticity."
  );
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5:3b-instruct");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [singleResult, setSingleResult] = useState<AIProcessResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<AIComparisonResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const availableModels = system?.ollama.models || [];

  const handleProcess = async () => {
    setIsProcessing(true);
    setStatusMsg(`Executing ${selectedMode} via local Ollama daemon...`);
    try {
      const res = await api.processAI({
        mode: selectedMode,
        prompt: prompt,
        model: selectedModel,
      });

      if (selectedMode === "COMPARE_ALL") {
        setComparisonResult(res as AIComparisonResult);
        setSingleResult(null);
      } else {
        setSingleResult(res as AIProcessResult);
        setComparisonResult(null);
      }
      setStatusMsg("Inference completed successfully");
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Execution failed: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Banner */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <span className="badge badge-purple">Hybrid Artificial Intelligence</span>
              <span className="badge badge-emerald">Ollama Local Client</span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc" }}>
              Hybrid LLM & Spiking Neural Network Co-Processor
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
              Empirical investigation into whether simulated biological neural networks can perform useful computation and complement modern LLMs.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Daemon:</span>
            <span className="badge badge-cyan" style={{ fontFamily: "monospace" }}>
              {system?.ollama.endpoint || "http://127.0.0.1:11434"}
            </span>
          </div>
        </div>
      </div>

      {/* Input Console */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Mode Selector */}
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Operational Processing Mode
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              <button
                onClick={() => setSelectedMode("COMPARE_ALL")}
                className={`btn ${selectedMode === "COMPARE_ALL" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 14px", fontSize: "12px" }}
              >
                <Split size={15} /> COMPARE ALL THREE MODES
              </button>

              <button
                onClick={() => setSelectedMode("MODE_A_LLM_ONLY")}
                className={`btn ${selectedMode === "MODE_A_LLM_ONLY" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 14px", fontSize: "12px" }}
              >
                <Bot size={15} /> MODE A: LLM ONLY
              </button>

              <button
                onClick={() => setSelectedMode("MODE_B_NEURAL_ONLY")}
                className={`btn ${selectedMode === "MODE_B_NEURAL_ONLY" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 14px", fontSize: "12px" }}
              >
                <Activity size={15} /> MODE B: SNN ONLY
              </button>

              <button
                onClick={() => setSelectedMode("MODE_C_HYBRID")}
                className={`btn ${selectedMode === "MODE_C_HYBRID" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 14px", fontSize: "12px" }}
              >
                <Sparkles size={15} /> MODE C: HYBRID CO-PROCESSOR
              </button>
            </div>
          </div>

          {/* Model and Prompt Input */}
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Local Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ background: "#0a0f1d", border: "1px solid #1e293b", padding: "8px 12px" }}
              >
                {availableModels.length > 0 ? (
                  availableModels.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.parameter_size || "local"})
                    </option>
                  ))
                ) : (
                  <option value="qwen2.5:3b-instruct">qwen2.5:3b-instruct</option>
                )}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Input Query / Scientific Prompt
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter scientific prompt or test hypothesis..."
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{ padding: "0 22px" }}
                >
                  <Send size={15} /> {isProcessing ? "Processing..." : "Run"}
                </button>
              </div>
            </div>
          </div>

          {statusMsg && (
            <div style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace" }}>
              [TELEMETRY] {statusMsg}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Results Card (When COMPARE_ALL is selected) */}
      {comparisonResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Comparison Summary Banner */}
          <div className="panel" style={{ background: "rgba(10, 15, 29, 0.95)", borderColor: "#334155" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Split size={16} color="#06b6d4" /> Empirical Three-Mode Scientific Comparison
              </span>
              <span className="badge badge-cyan">Fastest: {comparisonResult.comparison.fastest_mode}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "14px" }}>
              <div className="stat-card">
                <div className="stat-label">Mode A (LLM Only) Latency</div>
                <div className="stat-val" style={{ color: "#a78bfa" }}>
                  {comparisonResult.mode_a.latency_sec}s
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Mode B (SNN Only) Latency</div>
                <div className="stat-val" style={{ color: "#34d399" }}>
                  {comparisonResult.mode_b.latency_sec}s
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Mode C (Hybrid) Latency</div>
                <div className="stat-val" style={{ color: "#38bdf8" }}>
                  {comparisonResult.mode_c.latency_sec}s
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Biological Energy Cost</div>
                <div className="stat-val" style={{ color: "#f59e0b" }}>
                  {comparisonResult.comparison.energy_cost_spikes.mode_c.toLocaleString()} Spikes
                </div>
              </div>
            </div>

            <div style={{ background: "#07090e", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5 }}>
              <strong style={{ color: "#38bdf8" }}>Empirical Finding: </strong>
              {comparisonResult.comparison.scientific_finding}
            </div>
          </div>

          {/* 3 Columns: Mode A vs Mode B vs Mode C */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
            {/* Mode A: LLM Only */}
            <div className="panel" style={{ borderTop: "3px solid #8b5cf6" }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Bot size={15} color="#8b5cf6" /> Mode A: LLM Only
                </span>
                <span className="badge badge-purple">{comparisonResult.mode_a.latency_sec}s</span>
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
                Direct generation via local {comparisonResult.mode_a.model} with zero neural simulation.
              </div>
              <div
                style={{
                  background: "#07090e",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  color: "#f1f5f9",
                  maxHeight: "350px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {comparisonResult.mode_a.response}
              </div>
            </div>

            {/* Mode B: SNN Only */}
            <div className="panel" style={{ borderTop: "3px solid #10b981" }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Activity size={15} color="#10b981" /> Mode B: SNN Only
                </span>
                <span className="badge badge-emerald">{comparisonResult.mode_b.latency_sec}s</span>
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
                Input encoded into {comparisonResult.mode_b.num_neurons} neurons; settled into attractor basin:{" "}
                <strong style={{ color: "#34d399" }}>{comparisonResult.mode_b.matched_attractor}</strong>.
              </div>
              <div
                style={{
                  background: "#07090e",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  color: "#f1f5f9",
                  maxHeight: "350px",
                  overflowY: "auto",
                  fontFamily: "monospace",
                }}
              >
                {comparisonResult.mode_b.response}
              </div>
            </div>

            {/* Mode C: Hybrid */}
            <div className="panel" style={{ borderTop: "3px solid #06b6d4" }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Sparkles size={15} color="#06b6d4" /> Mode C: Hybrid Co-Processor
                </span>
                <span className="badge badge-cyan">{comparisonResult.mode_c.latency_sec}s</span>
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
                LLM response conditioned by SNN attractor affinity:{" "}
                <strong style={{ color: "#38bdf8" }}>
                  {comparisonResult.mode_c.neural_modulation?.matched_attractor}
                </strong>
                .
              </div>
              <div
                style={{
                  background: "#07090e",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  color: "#f1f5f9",
                  maxHeight: "350px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {comparisonResult.mode_c.response}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Mode Result (When a specific mode was selected) */}
      {singleResult && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <CheckCircle size={16} color="#10b981" /> {singleResult.mode} Response
            </span>
            <span className="badge badge-cyan">{singleResult.latency_sec}s Latency</span>
          </div>

          <div
            style={{
              background: "#07090e",
              padding: "16px",
              borderRadius: "6px",
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#f8fafc",
              whiteSpace: "pre-wrap",
            }}
          >
            {singleResult.response}
          </div>

          {singleResult.neural_modulation && (
            <div style={{ marginTop: "16px", background: "#0a0f1d", padding: "12px", borderRadius: "6px", border: "1px solid #1e293b", fontSize: "12px" }}>
              <span style={{ color: "#06b6d4", fontWeight: 700 }}>Neural Co-Processor Metrics: </span>
              <span style={{ color: "#cbd5e1" }}>
                Attractor: {singleResult.neural_modulation.matched_attractor} | Spikes: {singleResult.neural_modulation.total_spikes} | Firing Rate: {singleResult.neural_modulation.mean_firing_rate_hz.toFixed(1)} Hz
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
