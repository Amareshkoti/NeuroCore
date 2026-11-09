import React, { useEffect, useState } from "react";
import { NeuralNetworkCanvas } from "../visualization/NeuralNetworkCanvas";
import { api } from "../services/api";
import { NeuronVisualData, SynapticEdgeVisualData, RealtimeMetrics } from "../types";
import { RefreshCw, Play, Pause, Zap, Cpu, Sparkles } from "lucide-react";

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
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Top Banner & Control Strip */}
      <div
        className="panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          padding: "10px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f8fafc" }}>
            3D Cortical WebGL Canvas
          </span>
          <span className="badge badge-cyan">{neurons.length} Neurons In View</span>
          <span className="badge badge-purple">{edges.length} Synaptic Fibers</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => (isRunning ? api.pauseSimulation() : api.startSimulation())}
            className={`btn ${isRunning ? "btn-danger" : "btn-success"}`}
            style={{ padding: "5px 14px", fontSize: "12px" }}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            {isRunning ? "Pause Sim" : "Resume Sim"}
          </button>

          <button
            onClick={handleInject}
            className="btn btn-primary"
            style={{ padding: "5px 14px", fontSize: "12px" }}
          >
            <Zap size={13} /> Inject Sensory Burst
          </button>

          <button
            onClick={fetchNetworkTopology}
            className="btn btn-secondary"
            style={{ padding: "5px 12px", fontSize: "12px" }}
            title="Refresh 3D mesh"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div style={{ position: "relative", minHeight: "560px" }}>
        <NeuralNetworkCanvas
          neurons={neurons}
          edges={edges}
          metrics={metrics}
          onSelectNeuron={setSelectedNeuron}
        />
      </div>

      {/* Bottom Info Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <div className="panel" style={{ padding: "12px 16px" }}>
          <h4 style={{ fontSize: "12px", color: "#06b6d4", marginBottom: "4px", textTransform: "uppercase" }}>
            Interaction Controls
          </h4>
          <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
            • <strong style={{ color: "#f1f5f9" }}>Rotate:</strong> Click and drag left mouse button.
            <br />
            • <strong style={{ color: "#f1f5f9" }}>Zoom:</strong> Scroll wheel up/down.
            <br />
            • <strong style={{ color: "#f1f5f9" }}>Select Neuron:</strong> Click any neuron point to inspect biological membrane potential, firing frequency, and phenotype.
          </p>
        </div>

        <div className="panel" style={{ padding: "12px 16px" }}>
          <h4 style={{ fontSize: "12px", color: "#8b5cf6", marginBottom: "4px", textTransform: "uppercase" }}>
            Spatial Architecture
          </h4>
          <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
            Neurons are distributed within an ellipsoidal 3D coordinate space modeling cortical laminar depth.
            Excitatory pyramidal neurons (cyan) provide forward and recurrent excitation; inhibitory interneurons (crimson)
            counterbalance runaway dynamics per Dale's principle.
          </p>
        </div>

        <div className="panel" style={{ padding: "12px 16px" }}>
          <h4 style={{ fontSize: "12px", color: "#10b981", marginBottom: "4px", textTransform: "uppercase" }}>
            Real-Time Electrical Fidelity
          </h4>
          <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
            Spikes flash gold on the exact simulation step an action potential threshold crossing occurs.
            No fake activity is generated for visual effect—the visualization renders actual differential equation states.
          </p>
        </div>
      </div>
    </div>
  );
};
