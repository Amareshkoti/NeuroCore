import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { FlaskConical, Play, CheckCircle, Clock } from "lucide-react";

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
              <span className="badge badge-purple">Scientific Verification</span>
              <span className="badge badge-neutral">Reproducible Seeds</span>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Automated Neuroscience Experiments & Benchmarks
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>
              Eight scientific experiments with metric logging, CSV/JSON recording, and direct validation.
            </p>
          </div>

          {statusMsg && (
            <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>
              [{statusMsg}]
            </div>
          )}
        </div>
      </GlassCard>

      {/* Grid: 8 Experiments List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
        {experimentsList.map((exp) => (
          <GlassCard
            key={exp.id}
            style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span className="badge badge-blue">EXP {exp.id}</span>
                <span className="badge badge-neutral">{exp.target}</span>
              </div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                {exp.title}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
                {exp.description}
              </p>
            </div>

            <button
              onClick={() => handleRun(exp.id)}
              disabled={runningId !== null}
              className={`btn ${runningId === exp.id ? "btn-secondary" : "btn-primary"}`}
              style={{ width: "100%" }}
            >
              {runningId === exp.id ? <Clock size={13} /> : <Play size={13} />}
              {runningId === exp.id ? "Executing..." : "Run Experiment"}
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Active Experiment Results Panel */}
      {activeResult && (
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">
              <CheckCircle size={15} color="#10b981" /> Experiment Results: {activeResult.experiment_name}
            </span>
            <span className="badge badge-emerald">Completed</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "14px" }}>
            <div className="stat-card">
              <div className="stat-label">Execution Time</div>
              <div className="stat-val">{activeResult.metrics.execution_time_sec.toFixed(3)}s</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Neurons</div>
              <div className="stat-val">{activeResult.metrics.network_size}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Spikes Recorded</div>
              <div className="stat-val">{activeResult.metrics.spikes_emitted.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Firing Rate</div>
              <div className="stat-val">{activeResult.metrics.mean_firing_rate_hz.toFixed(1)} Hz</div>
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-surface-subtle)",
              border: "1px solid var(--border-default)",
              borderRadius: "4px",
              padding: "12px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-primary)",
              maxHeight: "240px",
              overflowY: "auto",
            }}
          >
            {JSON.stringify(activeResult, null, 2)}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
