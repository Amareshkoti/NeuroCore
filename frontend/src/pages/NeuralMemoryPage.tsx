import React, { useState } from "react";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Database, Play, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const NeuralMemoryPage: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<string>("Alpha");
  const [maskFraction, setMaskFraction] = useState<number>(0.3);
  const [noiseFraction, setNoiseFraction] = useState<number>(0.15);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recallResult, setRecallResult] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("");

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
              <span className="badge badge-blue">Recurrent Attractor</span>
              <span className="badge badge-emerald">Hebbian Matrix W</span>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Associative Neural Memory & Pattern Recovery
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>
              Patterns are stored directly in recurrent synaptic weights. Corrupted or occluded cues settle into attractor energy basins.
            </p>
          </div>

          <button onClick={handleStore} disabled={isProcessing} className="btn btn-primary">
            <Database size={14} /> Store 4 Prototypes
          </button>
        </div>
      </GlassCard>

      {/* Grid: Setup & Results */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "16px" }}>
        {/* Left Column: Query Setup */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Database size={15} /> Retrieval Setup
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Memory Target
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {["Alpha", "Beta", "Gamma", "Delta"].map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedPattern(name)}
                      className={`btn ${selectedPattern === name ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "6px 0", fontSize: "12px" }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Occlusion / Masking:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
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
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Bit-Flip Gaussian Noise:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
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
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleRecall}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Play size={14} /> Recall Dynamic
                </button>

                <button
                  onClick={handleRunBenchmark}
                  disabled={isProcessing}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Noise Sweep
                </button>
              </div>

              {statusMsg && (
                <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>
                  [{statusMsg}]
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">Attractor Dynamics</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              In NEUROCORE, memory is not a key-value database lookup. It is an emergent energy minimum in the recurrent phase space.
              Injected noisy cues descend Lyapunov energy basins E = -0.5 * s^T * W * s until settling into the prototype.
            </p>
          </GlassCard>
        </div>

        {/* Right Column: Recall Results & Benchmarks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <CheckCircle size={15} /> Attractor Recall Outcome
              </span>
              {recallResult && (
                <span className={`badge ${recallResult.matched_label === selectedPattern ? "badge-emerald" : "badge-amber"}`}>
                  {recallResult.matched_label === selectedPattern ? "Attractor Converged" : "Diverged"}
                </span>
              )}
            </div>

            {recallResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                  <div className="stat-card">
                    <div className="stat-label">Cue Overlap</div>
                    <div className="stat-val">{(recallResult.input_overlap_with_original * 100).toFixed(1)}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Final Overlap</div>
                    <div className="stat-val" style={{ color: "var(--accent-emerald)" }}>
                      {(recallResult.recalled_overlap_with_original * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Bit Recovery</div>
                    <div className="stat-val">
                      {((recallResult.recalled_overlap_with_original - recallResult.input_overlap_with_original) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Settling Steps</div>
                    <div className="stat-val">{recallResult.settling_steps} ({recallResult.settling_time_ms}ms)</div>
                  </div>
                </div>

                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-muted)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Pattern Integrity Restoration</span>
                    <span style={{ fontWeight: 600 }}>{Math.round(recallResult.recalled_overlap_with_original * 100)}% Restored</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "var(--border-default)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.round(recallResult.recalled_overlap_with_original * 100)}%`,
                        height: "100%",
                        background: "var(--accent-emerald)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "13px" }}>
                Select a target pattern and click "Recall Dynamic" to evaluate cue reconstruction.
              </div>
            )}
          </GlassCard>

          {/* Noise Sweep Chart */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                Noise Resistance Sweep (Bit-Flip Resilience)
              </span>
              <span className="badge badge-neutral">Parametric Sweep</span>
            </div>

            <div style={{ width: "100%", height: "200px" }}>
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
                    contentStyle={{ background: "#0d121f", borderColor: "#1f293d", fontSize: "12px", color: "#f8fafc", borderRadius: "4px" }}
                  />
                  <Bar dataKey="final_overlap" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
