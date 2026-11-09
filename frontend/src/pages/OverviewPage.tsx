import React, { useEffect, useState } from "react";
import { SystemStatus, RealtimeMetrics, ExperimentSummary } from "../types";
import type { NavTab } from "../App";
import { api } from "../services/api";
import { Panel, Reading, Readings, Empty, fmt } from "../components/ui";

interface Props {
  system: SystemStatus | null;
  metrics: RealtimeMetrics | null;
  onNavigate: (tab: NavTab) => void;
}

const STAGES = [
  ["Encode", "Text, vectors or images become input currents (rate, temporal or population code)."],
  ["Simulate", "Leaky integrate-and-fire or AdEx neurons integrate those currents, 0.1 ms per step."],
  ["Adapt", "STDP and homeostatic scaling rewrite synaptic weights from real spike timing."],
  ["Read out", "Firing rates are decoded into an attractor match and population statistics."],
  ["Combine", "The readout is handed to a local Ollama model, or compared against it."],
];

export const OverviewPage: React.FC<Props> = ({ system, metrics, onNavigate }) => {
  const [results, setResults] = useState<ExperimentSummary[] | null>(null);

  useEffect(() => {
    api.getExperimentResults().then(setResults).catch(() => setResults([]));
  }, []);

  const hw = system?.hardware;

  return (
    <>
      <section className="hero">
        <div>
          <h1>Watch simulated neurons compute, learn and remember.</h1>
          <p>
            NEUROCORE runs a spiking network of differential-equation neurons on this machine, lets synapses change
            with spike timing, stores memories as attractors, and tests whether any of it helps a local language model.
            Every spike on this screen comes from the simulator. Nothing here is a brain.
          </p>
          <div className="row" style={{ marginTop: 24 }}>
            <button className="btn primary" onClick={() => onNavigate("laboratory")}>
              Open the neural lab
            </button>
            <button className="btn" onClick={() => onNavigate("visualization")}>
              See the network in 3D
            </button>
            <button className="btn" onClick={() => onNavigate("ai")}>
              Compare with an LLM
            </button>
          </div>
        </div>

        <Panel title="How a request moves through the system">
          <div className="pipeline">
            {STAGES.map(([title, text]) => (
              <div className="stage" key={title}>
                <div>
                  <b>{title}</b>
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <div className="grid cols-3">
        <Panel title="Network right now" aside={metrics ? `step ${metrics.step_count.toLocaleString()}` : undefined}>
          <Readings>
            <Reading label="Excitatory" value={metrics?.num_excitatory ?? "–"} color="var(--exc)" />
            <Reading label="Inhibitory" value={metrics?.num_inhibitory ?? "–"} color="var(--inh)" />
            <Reading label="Synapses" value={metrics?.num_synapses?.toLocaleString() ?? "–"} />
            <Reading label="Mean membrane" value={fmt(metrics?.mean_membrane_potential_mv)} unit="mV" />
            <Reading label="Mean rate" value={fmt(metrics?.mean_firing_rate_hz)} unit="Hz" />
            <Reading label="Fano factor" value={fmt(metrics?.synchrony_fano_factor, 2)} />
          </Readings>
        </Panel>

        <Panel title="This computer">
          <table className="kv">
            <tbody>
              <tr><th>Processor</th><td>{hw?.processor ?? "–"}</td></tr>
              <tr><th>Cores</th><td>{hw ? `${hw.cpu_count_physical} physical, ${hw.cpu_count_logical} logical` : "–"}</td></tr>
              <tr><th>Memory</th><td>{hw ? `${hw.ram_available_gb} of ${hw.ram_total_gb} GB free` : "–"}</td></tr>
              <tr><th>CUDA</th><td>{hw ? (hw.cuda_available ? hw.cuda_device_name : "Not available, running on CPU") : "–"}</td></tr>
              <tr><th>PyTorch</th><td>{hw?.torch_version ?? "–"}</td></tr>
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Local language model"
          aside={system ? <span className={`tag ${system.ollama.available ? "ok" : "inh"}`}>{system.ollama.available ? "Reachable" : "Offline"}</span> : undefined}
        >
          <table className="kv">
            <tbody>
              <tr><th>Endpoint</th><td>{system?.ollama.endpoint ?? "–"}</td></tr>
              <tr><th>Chat model</th><td>{system?.ollama.active_model ?? "–"}</td></tr>
              <tr><th>Embeddings</th><td>{system?.ollama.active_embed_model ?? "–"}</td></tr>
              <tr><th>Installed</th><td>{system ? `${system.ollama.models_count} models` : "–"}</td></tr>
            </tbody>
          </table>
        </Panel>

        <Panel
          className="span-all"
          title="Latest recorded experiments"
          aside={<button className="btn small" onClick={() => onNavigate("experiments")}>Run experiments</button>}
        >
          {results === null ? (
            <Empty>Loading saved results…</Empty>
          ) : results.length === 0 ? (
            <Empty>No experiments recorded yet. Run one from the Experiments page; results are saved as JSON and CSV.</Empty>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr><th>Experiment</th><th>Recorded</th><th>Neurons</th><th>Accuracy</th><th>Wall time</th></tr>
                </thead>
                <tbody>
                  {results.slice(0, 6).map((r) => (
                    <tr key={r.filename}>
                      <td>{r.experiment_name}</td>
                      <td>{new Date(r.timestamp).toLocaleString()}</td>
                      <td>{r.num_neurons ?? "–"}</td>
                      <td>{r.accuracy == null ? "–" : `${(r.accuracy * 100).toFixed(1)}%`}</td>
                      <td>{r.simulation_time_sec == null ? "–" : `${r.simulation_time_sec.toFixed(2)} s`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
};
