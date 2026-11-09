import React, { useState, useEffect } from "react";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Play, Pause, RotateCcw, FastForward, Zap, Sliders, Activity, Layers } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface NeuralLabPageProps {
  metrics: RealtimeMetrics | null;
  isRunning: boolean;
  onRefreshMetrics: () => void;
  onNavigateTo3D: () => void;
}

export const NeuralLabPage: React.FC<NeuralLabPageProps> = ({
  metrics,
  isRunning,
  onRefreshMetrics,
  onNavigateTo3D,
}) => {
  const [numNeurons, setNumNeurons] = useState<number>(1000);
  const [modelType, setModelType] = useState<string>("lif");
  const [stimAmplitude, setStimAmplitude] = useState<number>(2.5);
  const [targetCluster, setTargetCluster] = useState<string>("sensory");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [vHistory, setVHistory] = useState<{ t: number; v: number; rate: number }[]>([]);

  useEffect(() => {
    if (metrics) {
      setVHistory((prev) => {
        const next = [
          ...prev,
          {
            t: Math.round(metrics.current_time_ms),
            v: metrics.mean_membrane_potential_mv,
            rate: metrics.mean_firing_rate_hz,
          },
        ];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
    }
  }, [metrics]);

  const handleStart = async () => {
    await api.startSimulation();
    setStatusMsg("Simulation running");
  };

  const handlePause = async () => {
    await api.pauseSimulation();
    setStatusMsg("Simulation paused");
  };

  const handleStep = async () => {
    await api.stepSimulation(5);
    onRefreshMetrics();
    setStatusMsg("Stepped 5 biological steps (0.5 ms dt)");
  };

  const handleReset = async () => {
    await api.resetSimulation();
    setVHistory([]);
    onRefreshMetrics();
    setStatusMsg("Membrane potentials reset to rest (-65.0 mV)");
  };

  const handleCreate = async () => {
    setStatusMsg(`Reconfiguring network to ${numNeurons} neurons (${modelType.toUpperCase()})...`);
    await api.createSimulation({
      num_neurons: numNeurons,
      model_type: modelType,
      excitatory_ratio: 0.8,
      connection_probability: 0.03,
      seed: 42,
    });
    setVHistory([]);
    onRefreshMetrics();
    setStatusMsg(`Initialized ${numNeurons} neurons (${modelType.toUpperCase()})`);
  };

  const handleInject = async () => {
    await api.injectCurrent(targetCluster, stimAmplitude, 20.0);
    setStatusMsg(`Injected ${stimAmplitude} nA somatic pulse into ${targetCluster} cluster`);
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
      {/* Control Strip */}
      <GlassCard style={{ padding: "12px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {!isRunning ? (
              <button onClick={handleStart} className="btn btn-success">
                <Play size={14} /> Run Simulation
              </button>
            ) : (
              <button onClick={handlePause} className="btn btn-danger">
                <Pause size={14} /> Pause
              </button>
            )}

            <button onClick={handleStep} className="btn btn-secondary">
              <FastForward size={14} /> Step (0.5ms)
            </button>

            <button onClick={handleReset} className="btn btn-secondary">
              <RotateCcw size={14} /> Reset
            </button>

            <button onClick={onNavigateTo3D} className="btn btn-secondary">
              <Layers size={14} /> View 3D Space
            </button>
          </div>

          {statusMsg && (
            <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>
              [{statusMsg}]
            </div>
          )}
        </div>
      </GlassCard>

      {/* Grid: Controls & Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "16px" }}>
        {/* Left Column: Sizing & Injection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Topology Configuration */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={15} /> Topology Configuration
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Network Size ({numNeurons} Neurons)
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[200, 500, 1000, 2000].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setNumNeurons(sz)}
                      className={`btn ${numNeurons === sz ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, padding: "5px 0", fontSize: "12px" }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Neuron Differential ODE Model
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="lif">Leaky Integrate-and-Fire (LIF)</option>
                  <option value="adex">Adaptive Exponential (AdEx - Brette & Gerstner)</option>
                </select>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface-subtle)",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-muted)",
                  lineHeight: 1.6,
                }}
              >
                <div>• Excitatory Pyramidal: 80% (AMPA kinetics, tau=5.0ms)</div>
                <div>• Inhibitory Interneurons: 20% (GABA kinetics, tau=10.0ms)</div>
                <div>• Refractory period: 2.0ms clamping</div>
              </div>

              <button onClick={handleCreate} className="btn btn-secondary" style={{ width: "100%" }}>
                Rebuild Network
              </button>
            </div>
          </GlassCard>

          {/* Sensory Current Injection */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Zap size={15} /> Sensory Stimulation Injection
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div>
                <label style={{ color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Target Population Cluster
                </label>
                <select
                  value={targetCluster}
                  onChange={(e) => setTargetCluster(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="sensory">Sensory Afferents (0-15% Cluster)</option>
                  <option value="inhibitory">Inhibitory Pool (Interneurons)</option>
                  <option value="all">Diffuse Cortical Drive (All Neurons)</option>
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Current Amplitude:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{stimAmplitude} nA</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={stimAmplitude}
                  onChange={(e) => setStimAmplitude(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <button onClick={handleInject} className="btn btn-primary" style={{ width: "100%" }}>
                <Zap size={14} /> Inject Stimulation Pulse
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Charts & Telemetry */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            <div className="stat-card">
              <div className="stat-label">Active Spikes</div>
              <div className="stat-val">{metrics?.active_spikes_current_step ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Membrane V</div>
              <div className="stat-val">{metrics?.mean_membrane_potential_mv.toFixed(1) ?? "-65.0"} mV</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Firing Rate</div>
              <div className="stat-val">{metrics?.mean_firing_rate_hz.toFixed(1) ?? "0.0"} Hz</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Synchrony (Fano)</div>
              <div className="stat-val">{metrics?.synchrony_fano_factor.toFixed(2) ?? "1.00"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Spikes</div>
              <div className="stat-val">{metrics?.total_spikes.toLocaleString() ?? 0}</div>
            </div>
          </div>

          {/* Oscilloscope Chart */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={15} /> Population Mean Membrane Potential V(t)
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Rest: -65.0mV | Threshold: -50.0mV
              </span>
            </div>

            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vHistory}>
                  <XAxis dataKey="t" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis domain={[-75, -45]} stroke="#475569" fontSize={11} unit="mV" />
                  <Tooltip
                    contentStyle={{ background: "#0d121f", borderColor: "#1f293d", fontSize: "12px", color: "#f8fafc", borderRadius: "4px" }}
                  />
                  <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Firing Rate History Chart */}
          <GlassCard>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={15} /> Firing Rate History (Hz)
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>100ms Rolling Average</span>
            </div>

            <div style={{ width: "100%", height: "160px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vHistory}>
                  <XAxis dataKey="t" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis stroke="#475569" fontSize={11} unit="Hz" />
                  <Tooltip
                    contentStyle={{ background: "#0d121f", borderColor: "#1f293d", fontSize: "12px", color: "#f8fafc", borderRadius: "4px" }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
