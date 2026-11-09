import React, { useState } from "react";
import { api } from "../services/api";
import { Database, Play, CheckCircle, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
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
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Header */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <span className="badge badge-cyan">Recurrent SNN Attractor</span>
              <span className="badge badge-emerald">Hebbian Outer Product</span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc" }}>
              Associative Neural Memory & Pattern Recovery
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
              Patterns are physically encoded in the recurrent synaptic matrix W. The network settles dynamically into energy attractor basins to restore corrupted cues.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleStore} disabled={isProcessing} className="btn btn-primary">
              <Database size={15} /> Store 4 Prototypes
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Controls & Results */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Controls Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Database size={16} color="#06b6d4" /> Retrieval Query Setup
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.85rem" }}>
              {/* Pattern Selector */}
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Target Stored Prototype
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["Alpha", "Beta", "Gamma", "Delta"].map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedPattern(name)}
                      className={`btn ${selectedPattern === name ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, padding: "5px 0", fontSize: "12px" }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mask Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#94a3b8" }}>Partial Occlusion (Mask):</span>
                  <span style={{ color: "#f59e0b", fontFamily: "monospace", fontWeight: 700 }}>
                    {(maskFraction * 100).toFixed(0)}%
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

              {/* Noise Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#94a3b8" }}>Bit-Flip Corruption Noise:</span>
                  <span style={{ color: "#f87171", fontFamily: "monospace", fontWeight: 700 }}>
                    {(noiseFraction * 100).toFixed(0)}%
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

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  onClick={handleRecall}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "8px 0" }}
                >
                  <Play size={14} /> Trigger Recall
                </button>
                <button
                  onClick={handleRunBenchmark}
                  disabled={isProcessing}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "8px 0" }}
                >
                  <Zap size={14} /> Noise Benchmark
                </button>
              </div>

              {statusMsg && (
                <div style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", textAlign: "center" }}>
                  {statusMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Recall Outcome Card */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <CheckCircle size={16} color="#10b981" /> Dynamic Attractor Settling Outcome
              </span>
              {recallResult && (
                <span className={`badge ${recallResult.matched_label === selectedPattern ? "badge-emerald" : "badge-red"}`}>
                  {recallResult.matched_label === selectedPattern ? "CORRECT ATTRACTOR" : "BASIN DRIFT"}
                </span>
              )}
            </div>

            {recallResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                  <div className="stat-card">
                    <div className="stat-label">Settled Attractor Basin</div>
                    <div className="stat-val" style={{ color: "#38bdf8" }}>{recallResult.matched_label}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Cosine Overlap</div>
                    <div className="stat-val" style={{ color: "#34d399" }}>{(recallResult.cosine_similarity * 100).toFixed(1)}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Hamming Fidelity</div>
                    <div className="stat-val" style={{ color: "#a78bfa" }}>{(recallResult.hamming_similarity * 100).toFixed(1)}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Recurrent Spikes Emitted</div>
                    <div className="stat-val" style={{ color: "#f59e0b" }}>{recallResult.total_settling_spikes}</div>
                  </div>
                </div>

                {/* Similarity Bars Across Stored Prototypes */}
                <div>
                  <h4 style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                    Attractor Energy Basin Similarities
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(recallResult.all_similarities || {}).map(([key, val]: any) => (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                          <span style={{ color: key === selectedPattern ? "#38bdf8" : "#cbd5e1", fontWeight: key === selectedPattern ? 700 : 400 }}>
                            {key} {key === selectedPattern ? "(Target)" : ""}
                          </span>
                          <span style={{ fontFamily: "monospace", color: "#f1f5f9" }}>{(val * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.max(0, Math.min(100, val * 100))}%`,
                              height: "100%",
                              background: key === selectedPattern ? "#06b6d4" : "#475569",
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                Select a target pattern and click "Trigger Recall" to stimulate the recurrent SNN.
              </div>
            )}
          </div>

          {/* Noise Tolerance Benchmark Chart */}
          {benchmarkData.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">
                  <ShieldCheck size={16} color="#06b6d4" /> Noise Resistance Benchmark: Recall vs Input Noise
                </span>
              </div>

              <div style={{ width: "100%", height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={benchmarkData}>
                    <XAxis dataKey="noise_fraction" stroke="#475569" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <YAxis stroke="#475569" fontSize={11} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip
                      contentStyle={{ background: "#0a0f1d", borderColor: "#1e293b", fontSize: "12px", color: "#f8fafc" }}
                      formatter={(val: any) => [`${(val * 100).toFixed(1)}%`, "Recovered Overlap"]}
                      labelFormatter={(label: any) => `Noise: ${(label * 100).toFixed(0)}%`}
                    />
                    <Bar dataKey="recovered_similarity" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
