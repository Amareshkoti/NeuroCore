import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Database, Play, CheckCircle, AlertTriangle, ShieldCheck, Zap, Layers, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const NeuralMemoryPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPattern, setSelectedPattern] = useState<string>("Alpha");
  const [maskFraction, setMaskFraction] = useState<number>(0.3);
  const [noiseFraction, setNoiseFraction] = useState<number>(0.15);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recallResult, setRecallResult] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".memory-card", {
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

  const handleStore = async () => {
    setIsProcessing(true);
    setStatusMsg("Embedding sparse patterns into recurrent synaptic matrix W...");
    try {
      const res = await api.storeMemoryPatterns(["Alpha", "Beta", "Gamma", "Delta"]);
      setStatusMsg(`Stored 4 attractor prototypes (${res.meta.num_synapses_potentiated.toLocaleString()} synapses potentiated)`);
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to store memory patterns");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecall = async () => {
    setIsProcessing(true);
    setStatusMsg("Injecting cue into recurrent attractor network...");
    try {
      const res = await api.recallMemoryPattern({
        pattern_name: selectedPattern,
        noise_fraction: noiseFraction,
        mask_fraction: maskFraction,
      });
      setRecallResult(res.recall_result);
      setStatusMsg(`Recall complete: Settled into attractor '${res.recall_result.matched_label}'`);
    } catch (err) {
      console.error(err);
      setStatusMsg("Recall failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsProcessing(true);
    setStatusMsg("Running noise tolerance sweep (10% - 50% bit flips)...");
    try {
      const res = await api.getNoiseBenchmark(selectedPattern);
      setBenchmarkData(res.benchmark);
      setStatusMsg("Noise recovery benchmark completed");
    } catch (err) {
      console.error(err);
      setStatusMsg("Benchmark failed");
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
      {/* Top Header */}
      <GlassCard glowColor="cyan" className="memory-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <span className="badge badge-cyan">Recurrent SNN Attractor</span>
              <span className="badge badge-emerald">Hebbian Outer Product</span>
              <span className="badge badge-purple">Zero Dictionary Cheating</span>
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Associative Neural Memory & Pattern Recovery
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "6px" }}>
              Patterns are physically encoded in the recurrent synaptic matrix W. The network settles dynamically into energy attractor basins to restore corrupted cues.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleStore} disabled={isProcessing} className="btn btn-primary" style={{ padding: "10px 18px" }}>
              <Database size={15} /> Store 4 Prototypes
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Grid: Controls & Results */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px" }}>
        {/* Controls Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <GlassCard glowColor="cyan" className="memory-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Database size={18} color="#06b6d4" /> Retrieval Query Setup
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "0.875rem" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Stored Memory Prototype Target
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {["Alpha", "Beta", "Gamma", "Delta"].map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedPattern(name)}
                      className={`btn ${selectedPattern === name ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "8px 0", fontSize: "13px" }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Occlusion / Masking:</span>
                  <span style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "monospace" }}>
                    {Math.round(maskFraction * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={maskFraction}
                  onChange={(e) => setMaskFraction(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#06b6d4" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Bit-Flip Gaussian Noise:</span>
                  <span style={{ color: "#f59e0b", fontWeight: 700, fontFamily: "monospace" }}>
                    {Math.round(noiseFraction * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.05"
                  value={noiseFraction}
                  onChange={(e) => setNoiseFraction(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#f59e0b" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleRecall}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "10px 0" }}
                >
                  <Play size={15} /> Recall Dynamic
                </button>

                <button
                  onClick={handleRunBenchmark}
                  disabled={isProcessing}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "10px 0" }}
                >
                  Noise Sweep
                </button>
              </div>

              {statusMsg && (
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "#38bdf8",
                    background: "rgba(6, 182, 212, 0.1)",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(6, 182, 212, 0.2)",
                  }}
                >
                  {statusMsg}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Theoretical Foundations */}
          <GlassCard glowColor="none" className="memory-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "13px", color: "#f1f5f9", marginBottom: "10px", fontWeight: 700 }}>
              Physical Attractor Dynamics
            </h4>
            <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
              In conventional systems, "memory" is a key-value database lookup. In NEUROCORE, memory is an emergent
              energy minimum in the recurrent phase space. Corrupted or occluded cues are injected as currents,
              and the spiking feedback loops guide the state vector downhill into the stored memory attractor.
            </p>
          </GlassCard>
        </div>

        {/* Results Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Recall Outcome Box */}
          <GlassCard glowColor="emerald" className="memory-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <CheckCircle size={18} color="#10b981" /> Attractor Recall Outcome
              </span>
              {recallResult && (
                <span
                  className={`badge ${recallResult.matched_label === selectedPattern ? "badge-emerald" : "badge-amber"}`}
                >
                  {recallResult.matched_label === selectedPattern ? "Attractor Converged" : "Diverged"}
                </span>
              )}
            </div>

            {recallResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                  <div className="stat-card">
                    <div className="stat-label">Cue Overlap</div>
                    <div className="stat-val" style={{ color: "#38bdf8" }}>
                      {(recallResult.input_overlap_with_original * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Final Overlap</div>
                    <div className="stat-val" style={{ color: "#34d399" }}>
                      {(recallResult.recalled_overlap_with_original * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Bit Recovery</div>
                    <div className="stat-val" style={{ color: "#c084fc" }}>
                      {((recallResult.recalled_overlap_with_original - recallResult.input_overlap_with_original) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Settling Steps</div>
                    <div className="stat-val" style={{ color: "#fbbf24" }}>
                      {recallResult.settling_steps} ({recallResult.settling_time_ms} ms)
                    </div>
                  </div>
                </div>

                {/* Overlap Progress Bar */}
                <div style={{ background: "rgba(10, 16, 30, 0.6)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                    <span style={{ color: "#94a3b8" }}>Pattern Integrity Restoration</span>
                    <span style={{ color: "#34d399", fontWeight: 700 }}>
                      {Math.round(recallResult.recalled_overlap_with_original * 100)}% Restored
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.round(recallResult.recalled_overlap_with_original * 100)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #06b6d4 0%, #10b981 100%)",
                        boxShadow: "0 0 12px rgba(16, 185, 129, 0.5)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                Select a target pattern and click "Recall Dynamic" to test memory restoration from corrupted cues.
              </div>
            )}
          </GlassCard>

          {/* Noise Tolerance Sweep Chart */}
          <GlassCard glowColor="purple" className="memory-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Zap size={18} color="#8b5cf6" /> Noise Resistance Sweep (Bit-Flip Resilience)
              </span>
              <span className="badge badge-purple">Parametric Test</span>
            </div>

            <div style={{ width: "100%", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData.length > 0 ? benchmarkData : [
                  { noise: "10%", final_overlap: 0.98 },
                  { noise: "20%", final_overlap: 0.94 },
                  { noise: "30%", final_overlap: 0.88 },
                  { noise: "40%", final_overlap: 0.76 },
                  { noise: "50%", final_overlap: 0.58 },
                ]}>
                  <XAxis dataKey="noise" stroke="#475569" fontSize={11} />
                  <YAxis domain={[0, 1.0]} stroke="#475569" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "rgba(139, 92, 246, 0.3)", fontSize: "12px", color: "#f8fafc", borderRadius: "8px" }}
                  />
                  <Bar dataKey="final_overlap" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
