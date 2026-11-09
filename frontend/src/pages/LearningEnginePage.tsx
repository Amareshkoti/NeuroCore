import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Sparkles, Activity, Sliders, CheckCircle, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface LearningEnginePageProps {
  metrics: RealtimeMetrics | null;
  onRefreshMetrics: () => void;
}

export const LearningEnginePage: React.FC<LearningEnginePageProps> = ({
  metrics,
  onRefreshMetrics,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stdpEnabled, setStdpEnabled] = useState<boolean>(true);
  const [homeostaticEnabled, setHomeostaticEnabled] = useState<boolean>(false);
  const [aPlus, setAPlus] = useState<number>(0.008);
  const [aMinus, setAMinus] = useState<number>(0.0085);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".learn-card", {
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

  const handleApply = async () => {
    setStatusMsg("Updating plasticity parameters...");
    await api.configureLearning({
      stdp_enabled: stdpEnabled,
      homeostatic_enabled: homeostaticEnabled,
      a_plus: aPlus,
      a_minus: aMinus,
    });
    onRefreshMetrics();
    setStatusMsg("Synaptic plasticity parameters updated in engine");
  };

  // Generate theoretical Bi & Poo STDP curve data points for visualization
  const stdpCurveData = React.useMemo(() => {
    const points = [];
    for (let dt = -40; dt <= 40; dt += 2) {
      if (dt === 0) continue;
      let dw = 0;
      if (dt > 0) {
        dw = aPlus * Math.exp(-dt / 20.0);
      } else {
        dw = -aMinus * Math.exp(dt / 20.0);
      }
      points.push({ dt, dw: parseFloat(dw.toFixed(5)) });
    }
    return points;
  }, [aPlus, aMinus]);

  const weightTrendData = (metrics?.recent_mean_weight_trend || []).map((w, idx) => ({
    step: idx * 50,
    weight: parseFloat(w.toFixed(4)),
  }));

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
      {/* Page Header */}
      <GlassCard glowColor="purple" className="learn-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <span className="badge badge-purple">Synaptic Plasticity</span>
              <span className="badge badge-cyan">Bi & Poo (1998) Curve</span>
              <span className="badge badge-emerald">Turrigiano Homeostasis</span>
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Spike-Timing-Dependent Plasticity & Homeostatic Engine
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "6px" }}>
              Continuous online modification of synaptic weights based on millisecond pre- and post-synaptic spike timing.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                setStdpEnabled(!stdpEnabled);
                handleApply();
              }}
              className={`btn ${stdpEnabled ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "10px 18px" }}
            >
              <Sparkles size={15} /> {stdpEnabled ? "STDP Learning Active" : "STDP Learning Paused"}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main Grid: Controls + Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px" }}>
        {/* Controls Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <GlassCard glowColor="purple" className="learn-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={18} color="#8b5cf6" /> Plasticity Parameters
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "0.875rem" }}>
              {/* STDP Enable */}
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#f1f5f9" }}>
                <input
                  type="checkbox"
                  checked={stdpEnabled}
                  onChange={(e) => setStdpEnabled(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#8b5cf6" }}
                />
                <span style={{ fontWeight: 600 }}>Enable STDP Weight Updates</span>
              </label>

              {/* Homeostatic Enable */}
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#f1f5f9" }}>
                <input
                  type="checkbox"
                  checked={homeostaticEnabled}
                  onChange={(e) => setHomeostaticEnabled(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#10b981" }}
                />
                <span style={{ fontWeight: 600 }}>Enable Synaptic Scaling (Homeostasis)</span>
              </label>

              {/* A+ Potentiation */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>LTP Amplitude (A+):</span>
                  <span style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "monospace" }}>{aPlus.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.03"
                  step="0.001"
                  value={aPlus}
                  onChange={(e) => setAPlus(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#06b6d4" }}
                />
              </div>

              {/* A- Depression */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>LTD Amplitude (A-):</span>
                  <span style={{ color: "#f43f5e", fontWeight: 700, fontFamily: "monospace" }}>{aMinus.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.03"
                  step="0.001"
                  value={aMinus}
                  onChange={(e) => setAMinus(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#f43f5e" }}
                />
              </div>

              <button onClick={handleApply} className="btn btn-primary" style={{ width: "100%", padding: "10px 0" }}>
                Apply Plasticity Configuration
              </button>

              {statusMsg && (
                <div style={{ fontSize: "12px", color: "#34d399", fontFamily: "monospace" }}>
                  [OK] {statusMsg}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Biological Learning Rules Card */}
          <GlassCard glowColor="none" className="learn-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "13px", color: "#f1f5f9", marginBottom: "10px", fontWeight: 700 }}>
              The Bi & Poo STDP Rule
            </h4>
            <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
              <div style={{ marginBottom: "6px" }}>
                • <strong style={{ color: "#38bdf8" }}>Pre before Post (dt &gt; 0):</strong> Potentiation (LTP). Synapse strengthens because presynaptic spike caused postsynaptic response.
              </div>
              <div style={{ marginBottom: "6px" }}>
                • <strong style={{ color: "#f43f5e" }}>Post before Pre (dt &lt; 0):</strong> Depression (LTD). Synapse weakens because firing was acausal.
              </div>
              <div>
                • <strong style={{ color: "#34d399" }}>Homeostasis:</strong> Normalizes total dendritic conductance to target firing rate (5.0 Hz).
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* STDP Theoretical Kernel Curve */}
          <GlassCard glowColor="purple" className="learn-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={18} color="#8b5cf6" /> Synaptic Modification Window Δw(Δt)
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>Tau_plus=20ms | Tau_minus=20ms</span>
            </div>

            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stdpCurveData}>
                  <XAxis dataKey="dt" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis stroke="#475569" fontSize={11} domain={[-0.015, 0.015]} />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "rgba(139, 92, 246, 0.3)", fontSize: "12px", color: "#f8fafc", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="dw" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Real Synaptic Weight Trend Chart */}
          <GlassCard glowColor="cyan" className="learn-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={18} color="#06b6d4" /> Mean Synaptic Weight Evolution Over Time
              </span>
              <span className="badge badge-cyan">Real Simulation Data</span>
            </div>

            <div style={{ width: "100%", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightTrendData.length > 0 ? weightTrendData : [{ step: 0, weight: 0.15 }, { step: 100, weight: 0.152 }]}>
                  <XAxis dataKey="step" stroke="#475569" fontSize={11} unit="st" />
                  <YAxis stroke="#475569" fontSize={11} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "rgba(6, 182, 212, 0.3)", fontSize: "12px", color: "#f8fafc", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
