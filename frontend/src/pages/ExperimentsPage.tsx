import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { FlaskConical, Play, CheckCircle, Clock, Zap, FileText, Download, Activity, Sparkles, ShieldCheck } from "lucide-react";

export const ExperimentsPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
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
      glow: "cyan" as const,
    },
    {
      id: 2,
      title: "Experiment 2: Associative Memory",
      description: "Embeds sparse orthogonal prototypes in synaptic matrix W; tests attractor recall from 40% occluded cues.",
      target: "Recurrent Attractor Network",
      glow: "purple" as const,
    },
    {
      id: 3,
      title: "Experiment 3: Temporal Sequence Learning",
      description: "Tests asymmetric STDP training of sequential transition pathways (A -> B -> C) and autonomous delay replay.",
      target: "Axonal Delay Replay",
      glow: "amber" as const,
    },
    {
      id: 4,
      title: "Experiment 4: STDP Learning",
      description: "Quantifies Long-Term Potentiation (LTP) and Long-Term Depression (LTD) dynamics under paired stimulation.",
      target: "Bi & Poo Synaptic Plasticity",
      glow: "purple" as const,
    },
    {
      id: 5,
      title: "Experiment 5: Noise Resistance",
      description: "Evaluates attractor stability and bit recovery across 10%, 20%, 30%, 40%, and 50% bit-flip corruption noise.",
      target: "Attractor Energy Basins",
      glow: "emerald" as const,
    },
    {
      id: 6,
      title: "Experiment 6: Excitatory vs Inhibitory Behaviour",
      description: "Demonstrates how Dale's principle balanced inhibition prevents epileptic runaway synchronization.",
      target: "Cortical E/I Balance",
      glow: "cyan" as const,
    },
    {
      id: 7,
      title: "Experiment 7: SNN vs Conventional Feedforward ANN",
      description: "Direct empirical benchmark between Spiking Neural Network and standard PyTorch MLP on the identical dataset.",
      target: "PyTorch MLP vs SNN",
      glow: "amber" as const,
    },
    {
      id: 8,
      title: "Experiment 8: LLM-Only vs Neural-Only vs Hybrid AI",
      description: "Comparative study across Mode A, Mode B, and Mode C hybrid processing using the local Ollama instance.",
      target: "Hybrid Intelligence",
      glow: "emerald" as const,
    },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".exp-card", {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: "power3.out",
        clearProps: "all",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

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
      <GlassCard glowColor="purple" className="exp-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <span className="badge badge-purple">Scientific Verification Engine</span>
              <span className="badge badge-cyan">Reproducible Seeds</span>
              <span className="badge badge-emerald">Real Logging</span>
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Automated Neuroscience Experiments & Benchmarks
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "6px" }}>
              All 8 required scientific milestones with real metric collection, CSV/JSON archiving, and honest evaluation.
            </p>
          </div>

          {statusMsg && (
            <div
              style={{
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#38bdf8",
                background: "rgba(6, 182, 212, 0.1)",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid rgba(6, 182, 212, 0.25)",
              }}
            >
              [RUNNER] {statusMsg}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Grid: 8 Experiments List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
        {experimentsList.map((exp) => (
          <GlassCard
            key={exp.id}
            glowColor={exp.glow}
            className="exp-card"
            style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span className="badge badge-cyan" style={{ fontSize: "10px" }}>EXP {exp.id}</span>
                <span className="badge badge-purple" style={{ fontSize: "10px" }}>{exp.target}</span>
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>
                {exp.title}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "16px" }}>
                {exp.description}
              </p>
            </div>

            <button
              onClick={() => handleRun(exp.id)}
              disabled={runningId !== null}
              className={`btn ${runningId === exp.id ? "btn-secondary" : "btn-primary"}`}
              style={{ width: "100%", padding: "10px 0" }}
            >
              {runningId === exp.id ? <Clock size={15} /> : <Play size={15} />}
              {runningId === exp.id ? "Executing Simulation..." : "Run Experiment"}
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Active Experiment Detailed Results Panel */}
      {activeResult && (
        <GlassCard glowColor="emerald" className="exp-card" style={{ padding: "24px" }}>
          <div className="panel-header">
            <span className="panel-title">
              <CheckCircle size={18} color="#10b981" /> Experiment Results: {activeResult.experiment_name}
            </span>
            <span className="badge badge-emerald">Verified Execution</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <div className="stat-card">
              <div className="stat-label">Execution Time</div>
              <div className="stat-val" style={{ color: "#38bdf8" }}>{activeResult.metrics.execution_time_sec.toFixed(3)} s</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Neurons</div>
              <div className="stat-val" style={{ color: "#a78bfa" }}>{activeResult.metrics.network_size}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Spikes Recorded</div>
              <div className="stat-val" style={{ color: "#f59e0b" }}>{activeResult.metrics.spikes_emitted.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Firing Rate</div>
              <div className="stat-val" style={{ color: "#34d399" }}>{activeResult.metrics.mean_firing_rate_hz.toFixed(1)} Hz</div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(10, 16, 30, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "16px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#38bdf8",
              maxHeight: "260px",
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
