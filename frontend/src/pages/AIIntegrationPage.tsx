import React, { useState } from "react";
import { SystemStatus, AIProcessResult, AIComparisonResult } from "../types";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Bot, Cpu, Sparkles, Send, CheckCircle, Split, ShieldCheck } from "lucide-react";

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
    <div
      style={{
        padding: "20px 24px",
        maxWidth: "1440px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header Banner */}
      <GlassCard style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              <span className="badge badge-purple">Hybrid Artificial Intelligence</span>
              <span className="badge badge-emerald">Ollama Local Client</span>
              <span className="badge badge-blue">SNN Co-Processing</span>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Hybrid LLM & Spiking Neural Network Co-Processor
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>
              Empirical investigation into whether simulated biological neural networks can perform useful computation and complement modern LLMs.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Daemon:</span>
            <span className="badge badge-neutral" style={{ fontFamily: "var(--font-mono)" }}>
              {system?.ollama.endpoint || "http://127.0.0.1:11434"}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Input Console */}
      <GlassCard>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Mode Selector */}
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Operational Processing Mode
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
              <button
                onClick={() => setSelectedMode("COMPARE_ALL")}
                className={`btn ${selectedMode === "COMPARE_ALL" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 12px" }}
              >
                <Split size={14} /> COMPARE ALL THREE MODES
              </button>

              <button
                onClick={() => setSelectedMode("MODE_A_LLM_ONLY")}
                className={`btn ${selectedMode === "MODE_A_LLM_ONLY" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 12px" }}
              >
                <Bot size={14} /> MODE A: LLM ONLY
              </button>

              <button
                onClick={() => setSelectedMode("MODE_B_NEURAL_ONLY")}
                className={`btn ${selectedMode === "MODE_B_NEURAL_ONLY" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 12px" }}
              >
                <Cpu size={14} /> MODE B: SNN ONLY
              </button>

              <button
                onClick={() => setSelectedMode("MODE_C_HYBRID")}
                className={`btn ${selectedMode === "MODE_C_HYBRID" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 12px" }}
              >
                <Sparkles size={14} /> MODE C: HYBRID CO-PROCESSOR
              </button>
            </div>
          </div>

          {/* Model selection & prompt input */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
                Selected Ollama Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ width: "100%" }}
              >
                {(system?.ollama.models || []).map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}{m.parameter_size ? ` (${m.parameter_size})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ padding: "8px 20px" }}
              >
                <Send size={14} /> {isProcessing ? "Processing..." : "Execute Inference"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
              Input Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {statusMsg && (
            <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>
              [{statusMsg}]
            </div>
          )}
        </div>
      </GlassCard>

      {/* Comparison Results */}
      {comparisonResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {/* Mode A: LLM Only */}
            <GlassCard>
              <div className="panel-header">
                <span className="panel-title">
                  <Bot size={15} /> Mode A: LLM Only
                </span>
                <span className="badge badge-neutral">Conventional</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <div className="stat-card">
                  <div className="stat-label">Latency</div>
                  <div className="stat-val">{(comparisonResult.mode_a.latency_sec * 1000).toFixed(0)} ms</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Energy Cost</div>
                  <div className="stat-val" style={{ color: "var(--accent-rose)" }}>High</div>
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-muted)", minHeight: "140px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {comparisonResult.mode_a.response}
              </div>
            </GlassCard>

            {/* Mode B: SNN Only */}
            <GlassCard>
              <div className="panel-header">
                <span className="panel-title">
                  <Cpu size={15} /> Mode B: SNN Only
                </span>
                <span className="badge badge-neutral">Biological ODE</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <div className="stat-card">
                  <div className="stat-label">Spikes Emitted</div>
                  <div className="stat-val">{comparisonResult.mode_b.total_spikes ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Latency</div>
                  <div className="stat-val" style={{ color: "var(--accent-emerald)" }}>{(comparisonResult.mode_b.latency_sec * 1000).toFixed(0)} ms</div>
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-muted)", minHeight: "140px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {comparisonResult.mode_b.response}
              </div>
            </GlassCard>

            {/* Mode C: Hybrid */}
            <GlassCard>
              <div className="panel-header">
                <span className="panel-title">
                  <Sparkles size={15} /> Mode C: Hybrid Co-Processor
                </span>
                <span className="badge badge-emerald">Synergistic</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <div className="stat-card">
                  <div className="stat-label">Hybrid Latency</div>
                  <div className="stat-val">{(comparisonResult.mode_c.latency_sec * 1000).toFixed(0)} ms</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">SNN Spikes</div>
                  <div className="stat-val">{comparisonResult.mode_c.total_spikes ?? 0}</div>
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-muted)", minHeight: "140px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {comparisonResult.mode_c.response}
              </div>
            </GlassCard>
          </div>

          {/* Assessment Verdict */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <ShieldCheck size={15} /> Empirical Assessment
              </span>
              <span className="badge badge-neutral">Scientific Findings</span>
            </div>

            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <p style={{ marginBottom: "10px", color: "var(--text-primary)" }}>
                <strong>Finding:</strong> {comparisonResult.comparison.scientific_finding}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginTop: "12px" }}>
                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>Energy Efficiency</div>
                  <div style={{ fontSize: "12px" }}>Event-driven sparse spikes consume an estimated 1,000x lower energy than full dense attention passes.</div>
                </div>
                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>Temporal Continuity</div>
                  <div style={{ fontSize: "12px" }}>Axonal delays maintain continuous time sequences without positional embedding re-encoding.</div>
                </div>
                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>Associative Denoising</div>
                  <div style={{ fontSize: "12px" }}>Corrupted queries are settled by recurrent attractors before reaching the LLM decoder.</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Single Mode Result */}
      {singleResult && (
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={15} /> Execution Result ({singleResult.mode})
            </span>
            <span className="badge badge-neutral">{(singleResult.latency_sec * 1000).toFixed(0)} ms</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            <div className="stat-card">
              <div className="stat-label">Model</div>
              <div className="stat-val" style={{ fontSize: "13px" }}>{singleResult.model || "Local SNN"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Spikes Emitted</div>
              <div className="stat-val">{singleResult.total_spikes ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tokens / Readout</div>
              <div className="stat-val">{singleResult.tokens_generated ?? 1}</div>
            </div>
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-surface-subtle)", padding: "14px", borderRadius: "4px", border: "1px solid var(--border-muted)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {singleResult.response}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
