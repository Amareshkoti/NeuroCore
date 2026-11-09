import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, StepForward, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
import { loadDefaults } from "../services/settings";
import { LiveRaster } from "../components/LiveRaster";
import { PageHead, Panel, Reading, Readings, Segmented, Slider, Status, chart, errMsg, fmt } from "../components/ui";

interface Props {
  metrics: RealtimeMetrics | null;
  isRunning: boolean;
  onRefreshMetrics: () => void;
  onNetworkRebuilt: () => void;
}

type Sample = { t: number; v: number; rate: number; spikes: number };

export const NeuralLabPage: React.FC<Props> = ({ metrics, isRunning, onRefreshMetrics, onNetworkRebuilt }) => {
  const defaults = loadDefaults();
  const [numNeurons, setNumNeurons] = useState(defaults.numNeurons);
  const [modelType, setModelType] = useState<"lif" | "adex">(defaults.modelType);
  const [amplitude, setAmplitude] = useState(2.5);
  const [target, setTarget] = useState("sensory");
  const [status, setStatus] = useState({ msg: "", error: false });
  const [history, setHistory] = useState<Sample[]>([]);

  useEffect(() => {
    if (!metrics) return;
    setHistory((prev) => {
      if (prev.length && metrics.current_time_ms < prev[prev.length - 1].t) return []; // reset
      if (prev.length && metrics.current_time_ms === prev[prev.length - 1].t) return prev;
      const next = [
        ...prev,
        {
          t: metrics.current_time_ms,
          v: metrics.mean_membrane_potential_mv,
          rate: metrics.mean_firing_rate_hz,
          spikes: metrics.active_spikes_current_step,
        },
      ];
      return next.length > 240 ? next.slice(-240) : next;
    });
  }, [metrics]);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      setStatus({ msg: label, error: false });
    } catch (e) {
      setStatus({ msg: `Request failed: ${errMsg(e)}`, error: true });
    }
  };

  const rebuild = () =>
    run(`Built ${numNeurons.toLocaleString()} ${modelType.toUpperCase()} neurons with seed ${defaults.seed}.`, async () => {
      setStatus({ msg: "Building network…", error: false });
      await api.createSimulation({
        num_neurons: numNeurons,
        model_type: modelType,
        excitatory_ratio: defaults.excitatoryRatio,
        connection_probability: defaults.connectionProbability,
        seed: defaults.seed,
      });
      setHistory([]);
      onNetworkRebuilt();
    });

  const targetLabel: Record<string, string> = {
    sensory: "the sensory group (first 15% of neurons)",
    inhibitory: "every inhibitory neuron",
    all: "every neuron",
  };

  return (
    <>
      <PageHead
        title="Neural lab"
        intro="Build a network, drive it with current and watch how it responds. Readings update from the simulator about 25 times a second."
      >
        {isRunning ? (
          <button className="btn stop" onClick={() => run("Paused.", api.pauseSimulation)}>
            <Pause size={15} /> Pause
          </button>
        ) : (
          <button className="btn run" onClick={() => run("Running.", api.startSimulation)}>
            <Play size={15} /> Run
          </button>
        )}
        <button
          className="btn"
          onClick={() =>
            run("Advanced 0.5 ms (5 steps).", async () => {
              await api.stepSimulation(5);
              onRefreshMetrics();
            })
          }
        >
          <StepForward size={15} /> Step 0.5 ms
        </button>
        <button
          className="btn"
          onClick={() =>
            run("Reset all membranes to rest at −65 mV.", async () => {
              await api.resetSimulation();
              setHistory([]);
              onNetworkRebuilt();
            })
          }
        >
          <RotateCcw size={15} /> Reset
        </button>
      </PageHead>

      <div className="grid side-l">
        <div className="grid" style={{ alignContent: "start" }}>
          <Panel title="Network">
            <div className="field">
              <span>Neurons</span>
              <Segmented
                label="Network size"
                value={numNeurons}
                onChange={setNumNeurons}
                options={[200, 500, 1000, 2000].map((n) => ({ value: n, label: n.toLocaleString() }))}
              />
            </div>
            <div className="field">
              <span>Neuron model</span>
              <Segmented
                label="Neuron model"
                value={modelType}
                onChange={setModelType}
                options={[
                  { value: "lif", label: "Leaky integrate-and-fire" },
                  { value: "adex", label: "Adaptive exponential" },
                ]}
              />
            </div>
            <p className="prose" style={{ fontSize: 13, marginBottom: 14 }}>
              {Math.round(defaults.excitatoryRatio * 100)}% excitatory, {Math.round((1 - defaults.excitatoryRatio) * 100)}%
              inhibitory, {Math.round(defaults.connectionProbability * 100)}% connection probability, 2 ms refractory period,
              1–5 ms synaptic delays. Change the defaults under Settings.
            </p>
            <button className="btn primary block" onClick={rebuild}>
              Build network
            </button>
          </Panel>

          <Panel title="Stimulate">
            <div className="field">
              <span>Target</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="sensory">Sensory group, first 15%</option>
                <option value="inhibitory">Inhibitory neurons</option>
                <option value="all">Whole network</option>
              </select>
            </div>
            <Slider label="Current" value={amplitude} display={`${amplitude.toFixed(1)} nA`} min={0.5} max={5} step={0.1} onChange={setAmplitude} />
            <button
              className="btn primary block"
              onClick={() => run(`Injected ${amplitude.toFixed(1)} nA into ${targetLabel[target]}.`, () => api.injectCurrent(target, amplitude, 20))}
            >
              <Zap size={15} /> Inject current
            </button>
            <Status {...status} />
          </Panel>
        </div>

        <div className="grid" style={{ alignContent: "start" }}>
          <Panel>
            <Readings>
              <Reading label="Spiking this step" value={metrics?.active_spikes_current_step ?? "–"} color="var(--spike)" />
              <Reading label="Mean membrane" value={fmt(metrics?.mean_membrane_potential_mv)} unit="mV" />
              <Reading label="Spread" value={fmt(metrics?.std_membrane_potential_mv)} unit="mV" />
              <Reading label="Mean rate" value={fmt(metrics?.mean_firing_rate_hz)} unit="Hz" />
              <Reading label="Peak rate" value={fmt(metrics?.max_firing_rate_hz, 0)} unit="Hz" />
              <Reading label="Fano factor" value={fmt(metrics?.synchrony_fano_factor, 2)} />
            </Readings>
          </Panel>

          <Panel title="Spike raster" aside="Each dot is one spike. Excitatory rows above the dashed line.">
            <div className="figure" style={{ padding: 0 }}>
              <LiveRaster className="strip-canvas" height={220} isRunning={isRunning} />
            </div>
          </Panel>

          <Panel title="Mean membrane potential" aside="Threshold −50 mV, rest −65 mV">
            <div className="figure" style={{ height: 230 }}>
              <ResponsiveContainer>
                <LineChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="t" {...chart.axis} type="number" domain={["dataMin", "dataMax"]} tickFormatter={(t) => `${Math.round(t)}`} unit=" ms" />
                  <YAxis {...chart.axis} domain={[-72, -48]} unit=" mV" width={66} />
                  <ReferenceLine y={-50} stroke={chart.spike} strokeDasharray="4 4" />
                  <ReferenceLine y={-65} stroke={chart.grid} />
                  <Tooltip {...chart.tooltip} formatter={(v) => `${Number(v).toFixed(2)} mV`} labelFormatter={(t) => `${Number(t).toFixed(1)} ms`} />
                  <Line dataKey="v" stroke={chart.exc} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Population firing rate" aside="Rolling window estimate from the simulator">
            <div className="figure" style={{ height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="t" {...chart.axis} type="number" domain={["dataMin", "dataMax"]} tickFormatter={(t) => `${Math.round(t)}`} unit=" ms" />
                  <YAxis {...chart.axis} unit=" Hz" width={66} />
                  <Tooltip {...chart.tooltip} formatter={(v) => `${Number(v).toFixed(2)} Hz`} labelFormatter={(t) => `${Number(t).toFixed(1)} ms`} />
                  <Line dataKey="rate" stroke={chart.inh} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};
