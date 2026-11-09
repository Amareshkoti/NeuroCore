import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { NeuralNetworkCanvas } from "../visualization/NeuralNetworkCanvas";
import { api } from "../services/api";
import { NeuronVisualData, SynapticEdgeVisualData, RealtimeMetrics } from "../types";
import { GlassCard } from "../components/GlassCard";
import { RefreshCw, Play, Pause, Zap, Cpu, Sparkles, Layers, Eye } from "lucide-react";

interface BrainVisualizationPageProps {
  metrics: RealtimeMetrics | null;
  isRunning: boolean;
}

export const BrainVisualizationPage: React.FC<BrainVisualizationPageProps> = ({
  metrics,
  isRunning,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [neurons, setNeurons] = useState<NeuronVisualData[]>([]);
  const [edges, setEdges] = useState<SynapticEdgeVisualData[]>([]);
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronVisualData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".viz-card", {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "all",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const fetchNetworkTopology = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNeuralNetwork3D(1200);
      setNeurons(data.neurons);
      setEdges(data.edges);
    } catch (err) {
      console.error("Failed to load 3D network topology", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkTopology();
  }, []);

  const handleInject = async () => {
    await api.injectCurrent("sensory", 3.0, 20.0);
  };

  return (
    <div
      ref={containerRef}
      style={{
        padding: "24px",
        maxWidth: "1600px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Top Banner & Control Strip */}
      <GlassCard glowColor="cyan" className="viz-card" style={{ padding: "14px 24px" }}>
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
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#f8fafc", letterSpacing: "-0.01em" }}>
              3D Cortical WebGL Canvas
            </span>
            <span className="badge badge-cyan">{neurons.length} Neurons In View</span>
            <span className="badge badge-purple">{edges.length} Synaptic Fibers</span>
            {selectedNeuron && (
              <span className="badge badge-emerald">
                Focused: Neuron #{selectedNeuron.id} ({selectedNeuron.is_exc ? "Excitatory Pyramidal" : "Inhibitory Interneuron"})
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => (isRunning ? api.pauseSimulation() : api.startSimulation())}
              className={`btn ${isRunning ? "btn-danger" : "btn-success"}`}
              style={{ padding: "7px 16px", fontSize: "13px" }}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              {isRunning ? "Pause Sim" : "Resume Sim"}
            </button>

            <button
              onClick={handleInject}
              className="btn btn-primary"
              style={{ padding: "7px 16px", fontSize: "13px" }}
            >
              <Zap size={14} /> Inject Sensory Burst
            </button>

            <button
              onClick={fetchNetworkTopology}
              className="btn btn-secondary"
              style={{ padding: "7px 14px", fontSize: "13px" }}
              title="Refresh 3D mesh"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main 3D Canvas Box */}
      <GlassCard glowColor="none" className="viz-card" style={{ padding: "6px", minHeight: "600px", position: "relative" }}>
        <NeuralNetworkCanvas
          neurons={neurons}
          edges={edges}
          metrics={metrics}
          onSelectNeuron={setSelectedNeuron}
        />
      </GlassCard>

      {/* Bottom Info Bar: 3 Spatial Explainer Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "18px",
        }}
      >
        <GlassCard glowColor="cyan" className="viz-card" style={{ padding: "18px 20px" }}>
          <h4 style={{ fontSize: "13px", color: "#06b6d4", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
            Spatial Navigation & Controls
          </h4>
          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
            • <strong style={{ color: "#f1f5f9" }}>Orbit Camera:</strong> Click and drag left mouse button.
            <br />
            • <strong style={{ color: "#f1f5f9" }}>Optical Zoom:</strong> Scroll wheel forwards / backwards.
            <br />
            • <strong style={{ color: "#f1f5f9" }}>Neuron Inspection:</strong> Hover or click any neuron node to inspect
            instantaneous membrane potential, firing frequency, and phenotype.
          </p>
        </GlassCard>

        <GlassCard glowColor="purple" className="viz-card" style={{ padding: "18px 20px" }}>
          <h4 style={{ fontSize: "13px", color: "#8b5cf6", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
            Biological Ellipsoid Architecture
          </h4>
          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
            Neurons are distributed within an ellipsoidal 3D coordinate space modeling cortical laminar depth.
            Excitatory pyramidal neurons (cyan) drive forward and recurrent excitation, while inhibitory interneurons (crimson)
            counterbalance runaway dynamics per Dale's principle.
          </p>
        </GlassCard>

        <GlassCard glowColor="emerald" className="viz-card" style={{ padding: "18px 20px" }}>
          <h4 style={{ fontSize: "13px", color: "#10b981", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
            Real-Time Electrical Fidelity
          </h4>
          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
            Spikes flash luminous gold on the exact simulation step an action potential threshold crossing occurs.
            No artificial animation or pseudo-activity is generated: the WebGL shaders directly reflect the Python ODE state.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
