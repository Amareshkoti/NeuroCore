import React, { useEffect, useState } from "react";
import { NeuralNetworkCanvas } from "../visualization/NeuralNetworkCanvas";
import { api } from "../services/api";
import { NeuronVisualData, SynapticEdgeVisualData, RealtimeMetrics } from "../types";
import { GlassCard } from "../components/GlassCard";
import { RefreshCw, Play, Pause, Zap, Layers } from "lucide-react";

interface BrainVisualizationPageProps {
  metrics: RealtimeMetrics | null;
  isRunning: boolean;
}

export const BrainVisualizationPage: React.FC<BrainVisualizationPageProps> = ({
  metrics,
  isRunning,
}) => {
  const [neurons, setNeurons] = useState<NeuronVisualData[]>([]);
  const [edges, setEdges] = useState<SynapticEdgeVisualData[]>([]);
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronVisualData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      style={{
        padding: "20px 24px",
        maxWidth: "1440px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Top Control Strip */}
      <GlassCard style={{ padding: "10px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              3D Cortical WebGL View
            </span>
            <span className="badge badge-neutral">{neurons.length} Neurons</span>
            <span className="badge badge-neutral">{edges.length} Synapses</span>
            {selectedNeuron && (
              <span className="badge badge-blue">
                Neuron #{selectedNeuron.id} ({selectedNeuron.is_exc ? "Excitatory Pyramidal" : "Inhibitory Interneuron"})
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => (isRunning ? api.pauseSimulation() : api.startSimulation())}
              className={`btn ${isRunning ? "btn-danger" : "btn-success"}`}
              style={{ padding: "5px 12px", fontSize: "12px" }}
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
              {isRunning ? "Pause" : "Run"}
            </button>

            <button
              onClick={handleInject}
              className="btn btn-primary"
              style={{ padding: "5px 12px", fontSize: "12px" }}
            >
              <Zap size={13} /> Inject Pulse
            </button>

            <button
              onClick={fetchNetworkTopology}
              className="btn btn-secondary"
              style={{ padding: "5px 12px", fontSize: "12px" }}
              title="Refresh topology"
            >
              <RefreshCw size={13} /> Reload Mesh
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main 3D Canvas Box */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "4px",
          minHeight: "560px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <NeuralNetworkCanvas
          neurons={neurons}
          edges={edges}
          metrics={metrics}
          onSelectNeuron={setSelectedNeuron}
        />
      </div>

      {/* Info Footers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">Navigation Controls</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            • <strong>Rotate:</strong> Left mouse button drag<br />
            • <strong>Zoom:</strong> Mouse wheel up / down<br />
            • <strong>Inspect:</strong> Click any neuron point to query instantaneous membrane potential and phenotype.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">Spatial Coordinate Model</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Neurons are distributed within an ellipsoidal 3D coordinate space modeling cortical laminar depth.
            Cyan nodes represent excitatory pyramidal neurons (AMPA); crimson nodes represent inhibitory interneurons (GABA).
          </p>
        </GlassCard>

        <GlassCard>
          <div className="panel-header">
            <span className="panel-title">Electrical Fidelity</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Action potentials are visualized instantaneously upon differential threshold crossing.
            No artificial animation or pseudo-activity is injected.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
