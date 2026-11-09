import React, { useState } from "react";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Sparkles, Activity, Sliders } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface LearningEnginePageProps {
  metrics: RealtimeMetrics | null;
  onRefreshMetrics: () => void;
}

export const LearningEnginePage: React.FC<LearningEnginePageProps> = ({
  metrics,
  onRefreshMetrics,
}) => {
  const [stdpEnabled, setStdpEnabled] = useState<boolean>(true);
  const [homeostaticEnabled, setHomeostaticEnabled] = useState<boolean>(false);
  const [aPlus, setAPlus] = useState<number>(0.008);
  const [aMinus, setAMinus] = useState<number>(0.0085);
  const [statusMsg, setStatusMsg] = useState<string>("");

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
              <span className="badge badge-purple">Synaptic Plasticity</span>
              <span className="badge badge-blue">Bi & Poo (1998)</span>
              <span className="badge badge-emerald">Turrigiano Scaling</span>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Spike-Timing-Dependent Plasticity & Homeostatic Engine
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>
              Continuous modification of synaptic conductances based on millisecond pre- and post-synaptic spike timing.
            </p>
          </div>

          <button
            onClick={() => {
              setStdpEnabled(!stdpEnabled);
              handleApply();
            }}
            className={`btn ${stdpEnabled ? "btn-primary" : "btn-secondary"}`}
          >
            <Sparkles size={14} /> {stdpEnabled ? "STDP Learning Active" : "STDP Paused"}
          </button>
        </div>
      </GlassCard>

      {/* Main Grid: Controls + Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "16px" }}>
        {/* Controls Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={15} /> Plasticity Parameters
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={stdpEnabled}
                  onChange={(e) => setStdpEnabled(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
                <span>Enable STDP Weight Updates</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={homeostaticEnabled}
                  onChange={(e) => setHomeostaticEnabled(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
                <span>Enable Synaptic Scaling (Homeostasis)</span>
              </label>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>LTP Amplitude (A+):</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{aPlus.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.03"
                  step="0.001"
                  value={aPlus}
                  onChange={(e) => setAPlus(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>LTD Amplitude (A-):</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{aMinus.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.03"
                  step="0.001"
                  value={aMinus}
                  onChange={(e) => setAMinus(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <button onClick={handleApply} className="btn btn-primary" style={{ width: "100%" }}>
                Apply Parameters
              </button>

              {statusMsg && (
                <div style={{ fontSize: "12px", color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>
                  [{statusMsg}]
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">Biological Learning Rule</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <div style={{ marginBottom: "6px" }}>
                • <strong>Pre before Post (dt &gt; 0):</strong> Potentiation (LTP). Synapse strengthens because presynaptic spike drove the output.
              </div>
              <div style={{ marginBottom: "6px" }}>
                • <strong>Post before Pre (dt &lt; 0):</strong> Depression (LTD). Synapse weakens due to acausal firing.
              </div>
              <div>
                • <strong>Homeostasis:</strong> Multiplicatively scales dendritic weights toward target rate (5.0 Hz).
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* STDP Kernel Curve */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={15} /> Synaptic Modification Window Δw(Δt)
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Tau_plus = 20ms | Tau_minus = 20ms
              </span>
            </div>

            <div style={{ width: "100%", height: "230px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stdpCurveData}>
                  <XAxis dataKey="dt" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis stroke="#475569" fontSize={11} domain={[-0.015, 0.015]} />
                  <Tooltip
                    contentStyle={{ background: "#0d121f", borderColor: "#1f293d", fontSize: "12px", color: "#f8fafc", borderRadius: "4px" }}
                  />
                  <Line type="monotone" dataKey="dw" stroke="#8b5cf6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Mean Synaptic Weight Evolution */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={15} /> Mean Synaptic Weight Evolution
              </span>
              <span className="badge badge-neutral">Differential Data</span>
            </div>

            <div style={{ width: "100%", height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightTrendData.length > 0 ? weightTrendData : [{ step: 0, weight: 0.15 }, { step: 100, weight: 0.152 }]}>
                  <XAxis dataKey="step" stroke="#475569" fontSize={11} unit="st" />
                  <YAxis stroke="#475569" fontSize={11} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#0d121f", borderColor: "#1f293d", fontSize: "12px", color: "#f8fafc", borderRadius: "4px" }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
