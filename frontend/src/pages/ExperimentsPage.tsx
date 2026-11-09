import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { FlaskConical, Play, CheckCircle, Clock, Zap, FileText, Download } from "lucide-react";

export const ExperimentsPage: React.FC = () => {
  const [runningId, setRunningId] = useState<number | null>(null);
  const [activeResult, setActiveResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const experimentsList = [
    {
      id: 1,
      title: "Experiment 1: Pattern Recognition",
      description: "Classifies structured sensory input patterns using rate coding into an SNN reservoir with linear readout.",
      target: "SNN Reservoir Classifier",
    },
    {
      id: 2,
      title: "Experiment 2: Associative Memory",
      description: "Embeds sparse orthogonal prototypes in synaptic matrix W; tests attractor recall from 40% occluded cues.",
      target: "Recurrent Attractor Network",
    },
    {
      id: 3,
      title: "Experiment 3: Temporal Sequence Learning",
      description: "Tests asymmetric STDP training of sequential transition pathways (A -> B -> C) and autonomous delay replay.",
      target: "Axonal Delay Replay",
    },
    {
      id: 4,
      title: "Experiment 4: STDP Learning",
      description: "Quantifies Long-Term Potentiation (LTP) and Long-Term Depression (LTD) dynamics under paired stimulation.",
      target: "Bi & Poo Synaptic Plasticity",
    },
    {
      id: 5,
      title: "Experiment 5: Noise Resistance",
      description: "Evaluates attractor stability and bit recovery across 10%, 20%, 30%, 40%, and 50% bit-flip corruption noise.",
      target: "Attractor Energy Basins",
    },
    {
      id: 6,
      title: "Experiment 6: Excitatory vs Inhibitory Behaviour",
      description: "Demonstrates how Dale's principle balanced inhibition prevents epileptic runaway synchronization.",
      target: "Cortical E/I Balance",
    },
    {
      id: 7,
      title: "Experiment 7: SNN vs Conventional Feedforward ANN",
      description: "Direct empirical benchmark between Spiking Neural Network and standard PyTorch MLP on the identical dataset.",
      target: "PyTorch MLP vs SNN",
    },
    {
      id: 8,
      title: "Experiment 8: LLM-Only vs Neural-Only vs Hybrid AI",
      description: "Comparative study across Mode A, Mode B, and Mode C hybrid processing using the local Ollama instance.",
      target: "Hybrid Intelligence",
    },
  ];

  const fetchHistory = async () => {
    try {
      const data = await api.getExperimentResults();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRun = async (expId: number) => {
    setRunningId(expId);
    setStatusMsg(`Running Experiment ${expId}...`);
    try {
      const res = await api.runExperiment(expId, 250);
      setActiveResult(res);
      setStatusMsg(`Experiment ${expId} finished successfully`);
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Experiment ${expId} failed: ${err.message || err}`);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Banner */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <span className="badge badge-purple">Scientific Verification Engine</span>
              <span className="badge badge-cyan">Reproducible Seeds</span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc" }}>
              Experimental Research Protocol Suite
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
              Automated execution of 8 neuroscience experiments logging spike counts, firing rates, synaptic weights, simulation time, and accuracy to CSV and JSON.
            </p>
          </div>

          {statusMsg && (
            <div style={{ fontSize: "12px", color: "#38bdf8", fontFamily: "monospace" }}>
              [STATUS] {statusMsg}
            </div>
          )}
        </div>
      </div>

      {/* Grid: 8 Experiments List + Active Result Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Left Column: Experiments Catalog */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f8fafc", marginBottom: "4px" }}>
            Available Research Protocols
          </h3>

          {experimentsList.map((exp) => (
            <div
              key={exp.id}
              className="panel"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                borderColor: runningId === exp.id ? "#06b6d4" : "#1e293b",
                background: runningId === exp.id ? "rgba(6, 182, 212, 0.05)" : "#0d121d",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.9rem" }}>{exp.title}</span>
                <span className="badge badge-cyan">{exp.target}</span>
              </div>

              <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.4 }}>{exp.description}</p>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  onClick={() => handleRun(exp.id)}
                  disabled={runningId !== null}
                  className="btn btn-primary"
                  style={{ padding: "4px 14px", fontSize: "11px" }}
                >
                  <Play size={12} /> {runningId === exp.id ? "Running..." : "Run Protocol"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Live Output & Recent Logs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Active Result View */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <FlaskConical size={16} color="#06b6d4" /> Experiment Execution Telemetry
              </span>
              {activeResult && <span className="badge badge-emerald">COMPLETED</span>}
            </div>

            {activeResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                  <div className="stat-card">
                    <div className="stat-label">Accuracy / Overlap</div>
                    <div className="stat-val" style={{ color: "#34d399" }}>
                      {(activeResult.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Simulation Time</div>
                    <div className="stat-val" style={{ color: "#38bdf8" }}>
                      {activeResult.simulation_time_sec}s
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Spikes</div>
                    <div className="stat-val" style={{ color: "#f59e0b" }}>
                      {activeResult.total_spikes?.toLocaleString() ?? "N/A"}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Memory RSS</div>
                    <div className="stat-val" style={{ color: "#cbd5e1" }}>
                      {activeResult.final_memory_mb} MB
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#07090e",
                    padding: "12px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#94a3b8",
                    maxHeight: "350px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {JSON.stringify(activeResult, null, 2)}
                </div>
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                Select any experiment protocol on the left and click "Run Protocol" to view real-time metrics and results.
              </div>
            )}
          </div>

          {/* Historical Saved Results */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <FileText size={16} color="#8b5cf6" /> Saved Artifacts (experiments/results/)
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
              {history.length > 0 ? (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#0a0f1d",
                      border: "1px solid #1e293b",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "11px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#f1f5f9" }}>{item.experiment_name}</div>
                      <div style={{ color: "#94a3b8", fontFamily: "monospace" }}>{item.timestamp}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="badge badge-cyan">{(item.accuracy * 100).toFixed(0)}% Acc</span>
                      <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>{item.simulation_time_sec}s</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", padding: "16px" }}>
                  No historical experiment runs logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
