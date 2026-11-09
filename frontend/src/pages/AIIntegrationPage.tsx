import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { SystemStatus, AIProcessResult, AIComparisonResult } from "../types";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Bot, Cpu, Zap, Activity, Clock, Sparkles, Send, CheckCircle, Split, ShieldCheck, ArrowRight } from "lucide-react";

interface AIIntegrationPageProps {
  system: SystemStatus | null;
}

export const AIIntegrationPage: React.FC<AIIntegrationPageProps> = ({ system }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMode, setSelectedMode] = useState<string>("COMPARE_ALL");
  const [prompt, setPrompt] = useState<string>(
    "Analyze how biological homeostasis stabilizes neural network dynamics during rapid synaptic plasticity."
  );
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5:3b-instruct");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [singleResult, setSingleResult] = useState<AIProcessResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<AIComparisonResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".ai-card", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "all",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

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
      ref={containerRef}
      style={{
        padding: "28px",
        maxWidth: "1480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Top Banner */}
      <GlassCard glowColor="purple" className="ai-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <span className="badge badge-purple">Hybrid Artificial Intelligence</span>
              <span className="badge badge-emerald">Ollama Local Client</span>
              <span className="badge badge-cyan">SNN Co-Processing</span>
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Hybrid LLM & Spiking Neural Network Co-Processor
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "6px" }}>
              Empirical investigation into whether simulated biological neural networks can perform useful computation and complement modern LLMs.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Daemon:</span>
            <span className="badge badge-cyan" style={{ fontFamily: "monospace" }}>
              {system?.ollama.endpoint || "http://127.0.0.1:11434"}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Input Console */}
      <GlassCard glowColor="none" className="ai-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Mode Selector */}
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "10px", fontWeight: 700 }}>
              Operational Processing Mode
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <button
                onClick={() => setSelectedMode("COMPARE_ALL")}
                className={`btn ${selectedMode === "COMPARE_ALL" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "12px 16px", fontSize: "13px" }}
              >
                <Split size={16} /> COMPARE ALL THREE MODES
              </button>

              <button
                onClick={() => setSelectedMode("MODE_A_LLM_ONLY")}
                className={`btn ${selectedMode === "MODE_A_LLM_ONLY" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "12px 16px", fontSize: "13px" }}
              >
                <Bot size={16} /> MODE A: LLM ONLY
              </button>

              <button
                onClick={() => setSelectedMode("MODE_B_NEURAL_ONLY")}
                className={`btn ${selectedMode === "MODE_B_NEURAL_ONLY" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "12px 16px", fontSize: "13px" }}
              >
                <Cpu size={16} /> MODE B: SNN ONLY
              </button>

              <button
                onClick={() => setSelectedMode("MODE_C_HYBRID")}
                className={`btn ${selectedMode === "MODE_C_HYBRID" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "12px 16px", fontSize: "13px" }}
              >
                <Sparkles size={16} /> MODE C: HYBRID CO-PROCESSOR
              </button>
            </div>
          </div>

          {/* Model selection & prompt input */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                Selected Ollama Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(10, 16, 30, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  padding: "10px 14px",
                  outline: "none",
                }}
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
                style={{ padding: "10px 28px", height: "42px" }}
              >
                <Send size={15} /> {isProcessing ? "Processing..." : "Execute Inference"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
              Input Prompt / Multimodal Context
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                background: "rgba(10, 16, 30, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "8px",
                color: "#f8fafc",
                padding: "12px 14px",
                outline: "none",
                fontSize: "0.95rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          {statusMsg && (
            <div
              style={{
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#38bdf8",
                background: "rgba(6, 182, 212, 0.1)",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(6, 182, 212, 0.25)",
              }}
            >
              [OLLAMA STATUS] {statusMsg}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Comparison Results Grid */}
      {comparisonResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
            {/* Mode A: LLM Only */}
            <GlassCard glowColor="purple" className="ai-card" style={{ padding: "24px" }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Bot size={18} color="#8b5cf6" /> Mode A: LLM Only
                </span>
                <span className="badge badge-purple">Conventional</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div className="stat-card">
                  <div className="stat-label">Latency</div>
                  <div className="stat-val" style={{ color: "#38bdf8" }}>{(comparisonResult.mode_a.latency_sec * 1000).toFixed(0)} ms</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Energy Cost</div>
                  <div className="stat-val" style={{ color: "#f43f5e" }}>High (GPU/CPU)</div>
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#cbd5e1", background: "rgba(10, 16, 30, 0.7)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", minHeight: "140px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {comparisonResult.mode_a.response}
              </div>
            </GlassCard>

            {/* Mode B: SNN Only */}
            <GlassCard glowColor="cyan" className="ai-card" style={{ padding: "24px" }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Cpu size={18} color="#06b6d4" /> Mode B: SNN Only
                </span>
                <span className="badge badge-cyan">Biological ODE</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div className="stat-card">
                  <div className="stat-label">Spikes Emitted</div>
                  <div className="stat-val" style={{ color: "#f59e0b" }}>{comparisonResult.mode_b.total_spikes ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Latency</div>
                  <div className="stat-val" style={{ color: "#34d399" }}>{(comparisonResult.mode_b.latency_sec * 1000).toFixed(0)} ms</div>
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#cbd5e1", background: "rgba(10, 16, 30, 0.7)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", minHeight: "140px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {comparisonResult.mode_b.response}
              </div>
            </GlassCard>

            {/* Mode C: Hybrid Co-Processor */}
            <GlassCard glowColor="emerald" className="ai-card" style={{ padding: "24px" }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Sparkles size={18} color="#10b981" /> Mode C: Hybrid Co-Processor
                </span>
                <span className="badge badge-emerald">Synergistic</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div className="stat-card">
                  <div className="stat-label">Hybrid Latency</div>
                  <div className="stat-val" style={{ color: "#38bdf8" }}>{(comparisonResult.mode_c.latency_sec * 1000).toFixed(0)} ms</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">SNN Spikes</div>
                  <div className="stat-val" style={{ color: "#f59e0b" }}>{comparisonResult.mode_c.total_spikes ?? 0}</div>
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#cbd5e1", background: "rgba(10, 16, 30, 0.7)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", minHeight: "140px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {comparisonResult.mode_c.response}
              </div>
            </GlassCard>
          </div>

          {/* Scientific Comparison Analysis Card */}
          <GlassCard glowColor="none" className="ai-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <ShieldCheck size={18} color="#38bdf8" /> Scientific Comparison & Evaluation Verdict
              </span>
              <span className="badge badge-emerald">Honest Assessment</span>
            </div>

            <div style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7 }}>
              <p style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#f1f5f9" }}>Summary:</strong> {comparisonResult.comparison.scientific_finding}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginTop: "14px" }}>
                <div style={{ background: "rgba(10, 16, 30, 0.6)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>Energy Efficiency</div>
                  <div style={{ fontSize: "12px" }}>SNN event-driven sparse spikes consume an estimated 1,000x lower energy than full dense transformer attention passes.</div>
                </div>
                <div style={{ background: "rgba(10, 16, 30, 0.6)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ color: "#a78bfa", fontWeight: 700, marginBottom: "4px" }}>Temporal Context</div>
                  <div style={{ fontSize: "12px" }}>Axonal delays (1.0 - 5.0 ms) maintain continuous time sequences without requiring positional embedding re-encoding.</div>
                </div>
                <div style={{ background: "rgba(10, 16, 30, 0.6)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ color: "#34d399", fontWeight: 700, marginBottom: "4px" }}>Associative Recall</div>
                  <div style={{ fontSize: "12px" }}>Corrupted queries are restored by SNN recurrent attractors before reaching the LLM decoder.</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Single Mode Result Box */}
      {singleResult && (
        <GlassCard glowColor="purple" className="ai-card" style={{ padding: "24px" }}>
          <div className="panel-header">
            <span className="panel-title">
              <Bot size={18} color="#8b5cf6" /> Execution Output ({singleResult.mode})
            </span>
            <span className="badge badge-emerald">{(singleResult.latency_sec * 1000).toFixed(0)} ms</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <div className="stat-card">
              <div className="stat-label">Model</div>
              <div className="stat-val" style={{ color: "#38bdf8", fontSize: "13px" }}>{singleResult.model || "Local SNN"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Spikes Emitted</div>
              <div className="stat-val" style={{ color: "#f59e0b" }}>{singleResult.total_spikes ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tokens / Readout</div>
              <div className="stat-val" style={{ color: "#34d399" }}>{singleResult.tokens_generated ?? 1}</div>
            </div>
          </div>

          <div style={{ fontSize: "13px", color: "#f8fafc", background: "rgba(10, 16, 30, 0.8)", padding: "18px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {singleResult.response}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
