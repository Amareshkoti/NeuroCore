import React, { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { api } from "../services/api";
import { ExperimentSummary } from "../types";
import { Empty, PageHead, Panel, Status, errMsg } from "../components/ui";

const EXPERIMENTS = [
  { id: 1, title: "Pattern recognition", text: "Rate-coded input patterns drive the network; a linear readout of firing rates classifies them." },
  { id: 2, title: "Associative memory", text: "Patterns stored in recurrent weights are recalled from cues with 40% of the bits hidden." },
  { id: 3, title: "Sequence learning", text: "Asymmetric STDP links A → B → C; the test is whether the sequence replays on its own." },
  { id: 4, title: "STDP learning", text: "Paired pre/post stimulation at fixed offsets, measuring potentiation and depression." },
  { id: 5, title: "Noise resistance", text: "Recall accuracy as 10% to 50% of the cue's bits are flipped." },
  { id: 6, title: "Excitation versus inhibition", text: "An all-excitatory network against an 80/20 balanced one: runaway synchrony or stable firing." },
  { id: 7, title: "Spiking network versus MLP", text: "The spiking network and a PyTorch multilayer perceptron on the same dataset." },
  { id: 8, title: "LLM, network, hybrid", text: "Modes A, B and C on a fixed prompt through local Ollama. Takes one to two minutes." },
];

// show the scalar results of a run; nested objects are flattened one level
function flatten(obj: Record<string, unknown>): [string, string][] {
  const out: [string, string][] = [];
  const show = (v: unknown) => (typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(4)) : String(v));
  for (const [k, v] of Object.entries(obj)) {
    if (["experiment_name", "timestamp"].includes(k)) continue;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
        if (v2 === null || typeof v2 !== "object") out.push([`${k} / ${k2}`, show(v2)]);
      }
    } else if (!Array.isArray(v)) out.push([k, show(v)]);
    else if (v.length <= 8 && v.every((x) => typeof x !== "object")) out.push([k, v.map(show).join(", ")]);
  }
  return out;
}

const label = (k: string) => k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const ExperimentsPage: React.FC = () => {
  const [running, setRunning] = useState<number | null>(null);
  const [neurons, setNeurons] = useState(250);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<ExperimentSummary[]>([]);
  const [status, setStatus] = useState({ msg: "", error: false });

  const loadHistory = () => api.getExperimentResults().then(setHistory).catch(() => setHistory([]));
  useEffect(() => {
    loadHistory();
  }, []);

  const run = async (id: number) => {
    setRunning(id);
    setStatus({ msg: `Running experiment ${id}…`, error: false });
    const t0 = performance.now();
    try {
      setResult(await api.runExperiment(id, neurons));
      setStatus({ msg: `Experiment ${id} finished in ${((performance.now() - t0) / 1000).toFixed(1)} s and was saved to experiments/results.`, error: false });
      loadHistory();
    } catch (e) {
      setStatus({ msg: `Experiment ${id} failed: ${errMsg(e)}`, error: true });
    } finally {
      setRunning(null);
    }
  };

  return (
    <>
      <PageHead
        title="Experiments"
        intro="Eight fixed protocols with seed 42. Each run records network size, spikes, rates, timing and memory use to JSON and CSV."
      >
        <label className="row" style={{ fontSize: 14, color: "var(--ink-2)" }}>
          Neurons
          <select value={neurons} onChange={(e) => setNeurons(+e.target.value)} style={{ width: 110 }}>
            {[100, 250, 500, 1000].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </PageHead>

      <div className="grid cols-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
        {EXPERIMENTS.map((e) => (
          <Panel key={e.id} title={`${e.id}. ${e.title}`}>
            <p className="prose" style={{ marginBottom: 14, minHeight: 66 }}>{e.text}</p>
            <button className="btn block" disabled={running !== null} onClick={() => run(e.id)}>
              <Play size={14} /> {running === e.id ? "Running…" : "Run"}
            </button>
          </Panel>
        ))}
      </div>

      <Status {...status} />
      <div style={{ height: 18 }} />

      <div className="grid cols-2">
        <Panel title={result ? String(result.experiment_name ?? "Result") : "Result"}>
          {result ? (
            <table className="kv">
              <tbody>
                {flatten(result).map(([k, v]) => (
                  <tr key={k}><th>{label(k)}</th><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Run an experiment to see its measurements here.</Empty>
          )}
        </Panel>

        <Panel title="Saved runs" aside={`${history.length} most recent`}>
          {history.length ? (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead><tr><th>Experiment</th><th>Accuracy</th><th>Time</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.filename} title={h.filename}>
                      <td>{h.experiment_name}<div className="caption" style={{ marginTop: 2 }}>{new Date(h.timestamp).toLocaleString()}</div></td>
                      <td>{h.accuracy == null ? "–" : `${(h.accuracy * 100).toFixed(1)}%`}</td>
                      <td>{h.simulation_time_sec == null ? "–" : `${h.simulation_time_sec.toFixed(2)} s`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No saved runs yet.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
};
