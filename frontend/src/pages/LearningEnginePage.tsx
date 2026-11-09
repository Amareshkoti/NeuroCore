import React, { useState } from "react";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
import { Sparkles, Activity, Sliders, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
    setStatusMsg("Plasticity parameters updated");
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
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Page Header */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <span className="badge badge-purple">Synaptic Plasticity</span>
              <span className="badge badge-cyan">Bi & Poo (1998)</span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc" }}>
              Spike-Timing-Dependent Plasticity & Homeostatic Engine
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
              Continuous online modification of synaptic weights based on pre- and post-synaptic spike timing.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
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
        </div>
      </div>

      {/* Main Grid: Controls + Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Controls Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={16} color="#8b5cf6" /> Plasticity Parameters
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.85rem" }}>
              {/* STDP Enable */}
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#f1f5f9" }}>
                <input
                  type="checkbox"
                  checked={stdpEnabled}
                  onChange={(e) => setStdpEnabled(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#06b6d4" }}
                />
                Enable Spike-Timing-Dependent Plasticity
              </label>

              {/* Homeostatic Enable */}
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#f1f5f9" }}>
                <input
                  type="checkbox"
                  checked={homeostaticEnabled}
                  onChange={(e) => setHomeostaticEnabled(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#10b981" }}
                />
                Enable Homeostatic Synaptic Scaling (Turrigiano)
              </label>

              {/* A+ (LTP) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#94a3b8" }}>LTP Amplitude (A+):</span>
                  <span style={{ color: "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>{aPlus}</span>
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

              {/* A- (LTD) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#94a3b8" }}>LTD Amplitude (A-):</span>
                  <span style={{ color: "#f87171", fontFamily: "monospace", fontWeight: 700 }}>{aMinus}</span>
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

              <button onClick={handleApply} className="btn btn-primary" style={{ width: "100%", padding: "8px 0" }}>
                Apply Parameters
              </button>

              {statusMsg && (
                <div style={{ fontSize: "11px", color: "#34d399", fontFamily: "monospace", textAlign: "center" }}>
                  {statusMsg}
                </div>
              )}
            </div>
          </div>

          {/* Plasticity Event Counters */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={16} color="#06b6d4" /> Cumulative Plasticity Counters
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "#0a0f1d", padding: "10px 14px", borderRadius: "6px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ArrowUpRight size={16} color="#38bdf8" />
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>LTP Events (Potentiation)</span>
                </div>
                <span style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "monospace" }}>
                  {metrics?.stdp_ltp_events?.toLocaleString() ?? 0}
                </span>
              </div>

              <div style={{ background: "#0a0f1d", padding: "10px 14px", borderRadius: "6px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ArrowDownRight size={16} color="#f87171" />
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>LTD Events (Depression)</span>
                </div>
                <span style={{ color: "#f87171", fontWeight: 700, fontFamily: "monospace" }}>
                  {metrics?.stdp_ltd_events?.toLocaleString() ?? 0}
                </span>
              </div>

              <div style={{ background: "#0a0f1d", padding: "10px 14px", borderRadius: "6px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Net Weight Delta (dW)</span>
                <span style={{ color: (metrics?.stdp_net_weight_change ?? 0) >= 0 ? "#34d399" : "#f87171", fontWeight: 700, fontFamily: "monospace" }}>
                  {(metrics?.stdp_net_weight_change ?? 0).toFixed(5)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scientific Curves */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Theoretical Bi & Poo STDP Curve */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Sparkles size={16} color="#06b6d4" /> STDP Window: ΔW vs Δt (t_post - t_pre)
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                Δt &gt; 0: LTP | Δt &lt; 0: LTD
              </span>
            </div>

            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stdpCurveData}>
                  <XAxis dataKey="dt" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "#1e293b", fontSize: "12px", color: "#f8fafc" }}
                  />
                  <Line type="monotone" dataKey="dw" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Longitudinal Mean Weight Evolution */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={16} color="#34d399" /> Mean Synaptic Weight Evolution Over Time
              </span>
              <span style={{ fontSize: "11px", color: "#34d399", fontFamily: "monospace" }}>
                Current Mean: {metrics?.mean_synaptic_weight.toFixed(4) ?? "0.0000"}
              </span>
            </div>

            <div style={{ width: "100%", height: "220px" }}>
              {weightTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightTrendData}>
                    <XAxis dataKey="step" stroke="#475569" fontSize={11} unit="step" />
                    <YAxis stroke="#475569" fontSize={11} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#0a0f1d", borderColor: "#1e293b", fontSize: "12px", color: "#f8fafc" }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8", fontSize: "13px" }}>
                  Simulation is compiling initial weight trajectory data...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
