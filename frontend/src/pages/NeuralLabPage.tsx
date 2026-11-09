import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import { Play, Pause, RotateCcw, FastForward, Zap, Sliders, Activity, Layers, Sparkles } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [numNeurons, setNumNeurons] = useState<number>(1000);
  const [modelType, setModelType] = useState<string>("lif");
  const [stimAmplitude, setStimAmplitude] = useState<number>(2.5);
  const [targetCluster, setTargetCluster] = useState<string>("sensory");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [vHistory, setVHistory] = useState<{ t: number; v: number; rate: number }[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".lab-card", {
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

  // Update rolling chart history when metrics arrive
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
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });
    }
  }, [metrics]);

  const handleStart = async () => {
    await api.startSimulation();
    setStatusMsg("Simulation running continuous ODE stepping");
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
      {/* Action Control Strip */}
      <GlassCard glowColor="cyan" className="lab-card" style={{ padding: "18px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {!isRunning ? (
              <button onClick={handleStart} className="btn btn-success" style={{ padding: "9px 20px" }}>
                <Play size={16} /> Run Continuous
              </button>
            ) : (
              <button onClick={handlePause} className="btn btn-danger" style={{ padding: "9px 20px" }}>
                <Pause size={16} /> Pause Simulation
              </button>
            )}

            <button onClick={handleStep} className="btn btn-secondary" style={{ padding: "9px 16px" }}>
              <FastForward size={16} /> Step (0.5ms)
            </button>

            <button onClick={handleReset} className="btn btn-secondary" style={{ padding: "9px 16px" }}>
              <RotateCcw size={16} /> Reset
            </button>

            <button onClick={onNavigateTo3D} className="btn btn-primary" style={{ padding: "9px 18px" }}>
              <Layers size={16} /> View 3D Cortical Space
            </button>
          </div>

          {statusMsg && (
            <div
              style={{
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#38bdf8",
                background: "rgba(6, 182, 212, 0.1)",
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(6, 182, 212, 0.25)",
              }}
            >
              [TELEMETRY] {statusMsg}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Grid: Controls & Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
        {/* Left Column: Network Sizing & Sensory Stimulation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Network Architecture Configuration */}
          <GlassCard glowColor="purple" className="lab-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={18} color="#a78bfa" /> Topology & Population
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.875rem" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Network Size ({numNeurons} Neurons)
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[200, 500, 1000, 2000].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setNumNeurons(sz)}
                      className={`btn ${numNeurons === sz ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, padding: "6px 0", fontSize: "12px" }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Neuron Differential Equation Model
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(10, 16, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "8px 12px",
                    outline: "none",
                  }}
                >
                  <option value="lif">Leaky Integrate-and-Fire (LIF - Tau_m=20ms)</option>
                  <option value="adex">Adaptive Exponential (AdEx - Brette & Gerstner)</option>
                </select>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  background: "rgba(10, 16, 30, 0.6)",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  lineHeight: 1.6,
                }}
              >
                <div>• Excitatory Pyramidal: 80% (AMPA conductance, tau=5.0ms)</div>
                <div>• Inhibitory Interneurons: 20% (GABA conductance, tau=10.0ms)</div>
                <div>• Dale's Principle strictly respected</div>
              </div>

              <button onClick={handleCreate} className="btn btn-secondary" style={{ width: "100%", padding: "10px 0" }}>
                Rebuild Differential Network
              </button>
            </div>
          </GlassCard>

          {/* Sensory Stimulation Injection */}
          <GlassCard glowColor="amber" className="lab-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Zap size={18} color="#f59e0b" /> Sensory Stimulation Injection
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.875rem" }}>
              <div>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Target Population Cluster
                </label>
                <select
                  value={targetCluster}
                  onChange={(e) => setTargetCluster(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(10, 16, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "8px 12px",
                    outline: "none",
                  }}
                >
                  <option value="sensory">Sensory Afferents (0-15% Cluster)</option>
                  <option value="inhibitory">Inhibitory Pool (Interneurons)</option>
                  <option value="all">Diffuse Cortical Drive (All Neurons)</option>
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
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
                  style={{ width: "100%", accentColor: "#f59e0b" }}
                />
              </div>

              <button onClick={handleInject} className="btn btn-primary" style={{ width: "100%", padding: "10px 0" }}>
                <Zap size={15} /> Inject Stimulation Pulse
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Live Physiological Charts & Telemetry */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Stat Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px" }}>
            <GlassCard glowColor="amber" className="lab-card" style={{ padding: "16px" }}>
              <div className="stat-label">Active Spikes (Step)</div>
              <div className="stat-val" style={{ color: "#f59e0b" }}>{metrics?.active_spikes_current_step ?? 0}</div>
            </GlassCard>
            <GlassCard glowColor="cyan" className="lab-card" style={{ padding: "16px" }}>
              <div className="stat-label">Mean Membrane V</div>
              <div className="stat-val" style={{ color: "#38bdf8" }}>{metrics?.mean_membrane_potential_mv.toFixed(1) ?? "-65.0"} mV</div>
            </GlassCard>
            <GlassCard glowColor="emerald" className="lab-card" style={{ padding: "16px" }}>
              <div className="stat-label">Mean Firing Rate</div>
              <div className="stat-val" style={{ color: "#34d399" }}>{metrics?.mean_firing_rate_hz.toFixed(1) ?? "0.0"} Hz</div>
            </GlassCard>
            <GlassCard glowColor="purple" className="lab-card" style={{ padding: "16px" }}>
              <div className="stat-label">Synchrony (Fano)</div>
              <div className="stat-val" style={{ color: "#c084fc" }}>{metrics?.synchrony_fano_factor.toFixed(2) ?? "1.00"}</div>
            </GlassCard>
            <GlassCard glowColor="none" className="lab-card" style={{ padding: "16px" }}>
              <div className="stat-label">Total Spikes</div>
              <div className="stat-val" style={{ color: "#cbd5e1" }}>{metrics?.total_spikes.toLocaleString() ?? 0}</div>
            </GlassCard>
          </div>

          {/* Real-time Membrane Potential Oscilloscope Chart */}
          <GlassCard glowColor="cyan" className="lab-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={18} color="#06b6d4" /> Population Mean Membrane Potential V(t)
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>Rest: -65.0mV | Threshold: -50.0mV</span>
            </div>

            <div style={{ width: "100%", height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vHistory}>
                  <XAxis dataKey="t" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis domain={[-75, -45]} stroke="#475569" fontSize={11} unit="mV" />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "rgba(6, 182, 212, 0.3)", fontSize: "12px", color: "#f8fafc", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Firing Rate History Chart */}
          <GlassCard glowColor="emerald" className="lab-card" style={{ padding: "24px" }}>
            <div className="panel-header">
              <span className="panel-title">
                <Activity size={18} color="#10b981" /> Population Firing Rate History (Hz)
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Sliding 100ms Window</span>
            </div>

            <div style={{ width: "100%", height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vHistory}>
                  <XAxis dataKey="t" stroke="#475569" fontSize={11} unit="ms" />
                  <YAxis stroke="#475569" fontSize={11} unit="Hz" />
                  <Tooltip
                    contentStyle={{ background: "#0a0f1d", borderColor: "rgba(16, 185, 129, 0.3)", fontSize: "12px", color: "#f8fafc", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
