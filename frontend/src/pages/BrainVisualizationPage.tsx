import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Zap } from "lucide-react";
import { NeuralNetworkCanvas } from "../visualization/NeuralNetworkCanvas";
import { api } from "../services/api";
import { NeuronVisualData, SynapticEdgeVisualData, RealtimeMetrics } from "../types";
import { PageHead, Panel, Slider, Status, errMsg } from "../components/ui";

interface Props {
  metrics: RealtimeMetrics | null;
  isRunning: boolean;
  networkVersion: number;
}

export const BrainVisualizationPage: React.FC<Props> = ({ metrics, isRunning, networkVersion }) => {
  const [neurons, setNeurons] = useState<NeuronVisualData[]>([]);
  const [edges, setEdges] = useState<SynapticEdgeVisualData[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showSynapses, setShowSynapses] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [amplitude, setAmplitude] = useState(3);
  const [status, setStatus] = useState({ msg: "", error: false });

  const load = useCallback(async (withEdges: boolean) => {
    try {
      const data = await api.getNeuralNetwork3D(withEdges ? 1500 : 1);
      setNeurons(data.neurons);
      if (withEdges) setEdges(data.edges);
    } catch (e) {
      setStatus({ msg: `Could not load the network: ${errMsg(e)}`, error: true });
    }
  }, []);

  useEffect(() => {
    setSelectedId(null);
    load(true);
  }, [networkVersion, load]);

  // membrane potentials and rates refresh twice a second while running; spikes arrive via the live stream
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => load(false), 500);
    return () => clearInterval(id);
  }, [isRunning, load]);

  // weights change under STDP; refresh the drawn synapses every few seconds
  useEffect(() => {
    if (!isRunning || !metrics?.stdp_enabled) return;
    const id = setInterval(() => load(true), 4000);
    return () => clearInterval(id);
  }, [isRunning, metrics?.stdp_enabled, load]);

  const selected = neurons.find((n) => n.id === selectedId) ?? null;
  const conn = useMemo(() => {
    if (selectedId === null) return { out: [], in: [] as SynapticEdgeVisualData[] };
    return {
      out: edges.filter((e) => e.source === selectedId).sort((a, b) => b.weight - a.weight),
      in: edges.filter((e) => e.target === selectedId).sort((a, b) => b.weight - a.weight),
    };
  }, [edges, selectedId]);

  return (
    <>
      <PageHead
        title="3D network"
        intro="Neurons placed in a cortical volume. Dots flash ochre when the simulator reports a spike and darken as their membrane depolarises."
      >
        <button className={`btn ${isRunning ? "stop" : "run"}`} onClick={() => (isRunning ? api.pauseSimulation() : api.startSimulation())}>
          {isRunning ? <Pause size={15} /> : <Play size={15} />}
          {isRunning ? "Pause" : "Run"}
        </button>
      </PageHead>

      <div className="grid side-l" style={{ gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
        <div className="canvas3d">
          <NeuralNetworkCanvas
            neurons={neurons}
            edges={edges}
            showSynapses={showSynapses}
            autoRotate={autoRotate}
            selectedId={selectedId}
            onSelect={setSelectedId}
            resetToken={resetToken}
          />
          <div className="overlay" style={{ left: 14, bottom: 14 }}>
            <div className="legend">
              <span><i style={{ background: "var(--exc)" }} />Excitatory</span>
              <span><i style={{ background: "var(--inh)" }} />Inhibitory</span>
              <span><i style={{ background: "var(--spike)" }} />Spiked in the last 12 ms</span>
            </div>
          </div>
          <div className="overlay" style={{ right: 14, top: 14, fontSize: 12.5, color: "var(--ink-2)" }}>
            Drag to rotate, scroll to zoom, click a neuron to inspect it
          </div>
        </div>

        <div className="grid" style={{ alignContent: "start" }}>
          <Panel title="View">
            <label className="check">
              <input type="checkbox" checked={showSynapses} onChange={(e) => setShowSynapses(e.target.checked)} />
              Show the {edges.length.toLocaleString()} strongest synapses of each type
            </label>
            <label className="check">
              <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
              Rotate slowly
            </label>
            <button className="btn small" onClick={() => setResetToken((t) => t + 1)}>
              <RotateCcw size={14} /> Reset camera
            </button>
          </Panel>

          <Panel title="Stimulate">
            <Slider label="Current into sensory group" value={amplitude} display={`${amplitude.toFixed(1)} nA`} min={0.5} max={5} step={0.1} onChange={setAmplitude} />
            <button
              className="btn primary block"
              onClick={() =>
                api
                  .injectCurrent("sensory", amplitude, 20)
                  .then(() => setStatus({ msg: `Injected ${amplitude.toFixed(1)} nA. Press Run if the network is paused.`, error: false }))
                  .catch((e) => setStatus({ msg: errMsg(e), error: true }))
              }
            >
              <Zap size={15} /> Inject current
            </button>
            <Status {...status} />
          </Panel>

          <Panel title={selected ? `Neuron ${selected.id}` : "Inspector"} aside={selected ? <span className={`tag ${selected.is_exc ? "exc" : "inh"}`}>{selected.is_exc ? "Excitatory" : "Inhibitory"}</span> : undefined}>
            {selected ? (
              <>
                <table className="kv">
                  <tbody>
                    <tr><th>Membrane</th><td>{selected.v.toFixed(2)} mV</td></tr>
                    <tr><th>Firing rate</th><td>{selected.rate.toFixed(1)} Hz</td></tr>
                    <tr><th>Position</th><td>{selected.x.toFixed(0)}, {selected.y.toFixed(0)}, {selected.z.toFixed(0)}</td></tr>
                    <tr><th>Drawn outputs</th><td>{conn.out.length}{conn.out[0] ? `, strongest w = ${conn.out[0].weight}` : ""}</td></tr>
                    <tr><th>Drawn inputs</th><td>{conn.in.length}{conn.in[0] ? `, strongest w = ${conn.in[0].weight}` : ""}</td></tr>
                  </tbody>
                </table>
                <p className="caption">Outgoing synapses are drawn in ochre, incoming in ink. Only the strongest excitatory and inhibitory synapses are drawn.</p>
              </>
            ) : (
              <p className="prose">Click any neuron to read its membrane potential, rate and connections.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
};
