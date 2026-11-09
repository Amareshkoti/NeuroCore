import React, { useState } from "react";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
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

  // Update rolling chart history when metrics arrive
  React.useEffect(() => {
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
        return next.length > 40 ? next.slice(next.length - 40) : next;
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
    setStatusMsg("Stepped 5 steps (0.5 ms biological time)");
  };

  const handleReset = async () => {
    await api.resetSimulation();
    setVHistory([]);
    onRefreshMetrics();
    setStatusMsg("Simulation reset to baseline");
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
    setStatusMsg(`Injected ${stimAmplitude} nA into ${targetCluster} cluster`);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Action Bar */}
      <div
        className="panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!isRunning ? (
            <button onClick={handleStart} className="btn btn-success" style={{ padding: "8px 18px" }}>
              <Play size={16} /> Run Continuous
            </button>
          ) : (
            <button onClick={handlePause} className="btn btn-danger" style={{ padding: "8px 18px" }}>
              <Pause size={16} /> Pause
            </button>
          )}

          <button onClick={handleStep} className="btn btn-secondary" style={{ padding: "8px 14px" }}>
            <FastForward size={16} /> Step (0.5ms)
          </button>

          <button onClick={handleReset} className="btn btn-secondary" style={{ padding: "8px 14px" }}>
            <RotateCcw size={16} /> Reset
          </button>

          <button onClick={onNavigateTo3D} className="btn btn-primary" style={{ padding: "8px 14px" }}>
            <Layers size={16} /> Open 3D Canvas
          </button>
        </div>

        {statusMsg && (
          <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#38bdf8" }}>
            [STATUS] {statusMsg}
          </div>
        )}
      </div>

      {/* Grid: Controls & Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Left Column: Network Sizing & Sensory Stimulation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Network Architecture Configuration */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={16} color="#06b6d4" /> Topology & Population
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.85rem" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Network Size ({numNeurons} Neurons)
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[200, 500, 1000, 2000].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setNumNeurons(sz)}
                      className={`btn ${numNeurons === sz ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, padding: "4px 0", fontSize: "12px" }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Neuron Differential Model
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  style={{ background: "#0a0f1d", border: "1px solid #1e293b", padding: "6px 10px" }}
                >
                  <option value="lif">Leaky Integrate-and-Fire (LIF)</option>
                  <option value="adex">Adaptive Exponential (AdEx - Brette & Gerstner)</option>
                </select>
              </div>

              <div style={{ fontSize: "11px", color: "#94a3b8", background: "#0a0f1d", padding: "10px", borderRadius: "6px" }}>
                <div>• Excitatory Pyramidal: 80% (AMPA kinetics, tau=5ms)</div>
                <div>• Inhibitory Interneurons: 20% (GABA kinetics, tau=10ms)</div>
                <div>• Dale's Principle Strictly Enforced</div>
              </div>

              <button onClick={handleCreate} className="btn btn-secondary" style={{ width: "100%", padding: "8px 0" }}>
                Rebuild Network
              </button>
            </div>
          </div>

          {/* Sensory Stimulation Injection */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Zap size={16} color="#f59e0b" /> Sensory Stimulation
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.85rem" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>Target Population Cluster</label>
                <select
                  value={targetCluster}
                  onChange={(e) => setTargetCluster(e.target.value)}
                  style={{ background: "#0a0f1d", border: "1px solid #1e293b", padding: "6px 10px" }}
                >
                  <option value="sensory">Sensory Afferents (0-15% Cluster)</option>
                  <option value="inhibitory">Inhibitory Pool (Interneurons)</option>
                  <option value="all">Diffuse Cortical Drive (All Neurons)</option>
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Current Amplitude:</span>
                  <span style={{ color: "#f59e0b", fontWeight: 700, fontFamily: "monospace" }}>{stimAmplitude} nA</span>
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

              <button onClick={handleInject} className="btn btn-primary" style={{ width: "100%", padding: "8px 0" }}>
                <Zap size={14} /> Inject Stimulation Pulse
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Physiological Charts & Telemetry */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Stat Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
            <div className="stat-card">
              <div className="stat-label">Active Spikes (Step)</div>
              <div className="stat-val" style={{ color: "#f59e0b" }}>{metrics?.active_spikes_current_step ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Membrane V</div>
              <div className="stat-val" style={{ color: "#38bdf8" }}>{metrics?.mean_membrane_potential_mv.toFixed(1) ?? "-65.0"} mV</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Firing Rate</div>
              <div className="stat-val" style={{ color: "#34d399" }}>{metrics?.mean_firing_rate_hz.toFixed(1) ?? "0.0"} Hz</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Synchrony (Fano)</div>
              <div className="stat-val" style={{ color: "#a78bfa" }}>{metrics?.synchrony_fano_factor.toFixed(2) ?? "1.00"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Spikes</div>
              <div className="stat-val" style={{ color: "#cbd5e1" }}>{metrics?.total_spikes.toLocaleString() ?? 0}</div>
            </div>
          </div>

          {/* Real-time Membrane Potential Oscilloscope Chart */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={16} color="#06b6d4" /> Population Mean Membrane Potential V(t)
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>Rest: -65mV | Threshold: -50mV</span>
            </div>

            <div style={{ width: "100%", height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vHistory}>
                  <XAxis dataKey="t" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis domain={[-75, -45]} stroke="#475569" fontSize={11} unit="mV" />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "#1e293b", fontSize: "12px", color: "#f8fafc" }}
                  />
                  <Line type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Firing Rate History Chart */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={16} color="#10b981" /> Population Firing Rate History (Hz)
              </span>
            </div>

            <div style={{ width: "100%", height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vHistory}>
                  <XAxis dataKey="t" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis stroke="#475569" fontSize={11} unit="Hz" />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "#1e293b", fontSize: "12px", color: "#f8fafc" }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
