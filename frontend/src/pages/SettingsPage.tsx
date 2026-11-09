import React, { useState } from "react";
import { SystemStatus } from "../types";
import { Defaults, loadDefaults, saveDefaults } from "../services/settings";
import { PageHead, Panel, Segmented, Slider, Status } from "../components/ui";

export const SettingsPage: React.FC<{ system: SystemStatus | null }> = ({ system }) => {
  const [d, setD] = useState<Defaults>(loadDefaults);
  const [status, setStatus] = useState({ msg: "", error: false });
  const set = <K extends keyof Defaults>(k: K, v: Defaults[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = () =>
    setStatus(
      saveDefaults(d)
        ? { msg: "Saved. New networks built from the lab will use these values.", error: false }
        : { msg: "This browser blocked local storage, so the values last only until you reload.", error: true },
    );

  return (
    <>
      <PageHead title="Settings" intro="Defaults for new networks, and the language model the backend is configured to use." />

      <div className="grid cols-2">
        <Panel title="New network defaults">
          <label className="field">
            <span>Neurons</span>
            <input type="number" min={50} max={10000} value={d.numNeurons} onChange={(e) => set("numNeurons", Math.max(50, Math.min(10000, +e.target.value || 50)))} />
          </label>
          <div className="field">
            <span>Neuron model</span>
            <Segmented label="Neuron model" value={d.modelType} onChange={(v) => set("modelType", v)} options={[{ value: "lif", label: "Leaky integrate-and-fire" }, { value: "adex", label: "Adaptive exponential" }]} />
          </div>
          <Slider label="Excitatory share" value={d.excitatoryRatio} display={`${Math.round(d.excitatoryRatio * 100)}%`} min={0.5} max={1} step={0.05} onChange={(v) => set("excitatoryRatio", v)} />
          <Slider label="Connection probability" value={d.connectionProbability} display={`${(d.connectionProbability * 100).toFixed(1)}%`} min={0.005} max={0.1} step={0.005} onChange={(v) => set("connectionProbability", v)} />
          <label className="field">
            <span>Random seed</span>
            <input type="number" value={d.seed} onChange={(e) => set("seed", parseInt(e.target.value) || 0)} />
          </label>
          <button className="btn primary" onClick={save}>Save defaults</button>
          <Status {...status} />
        </Panel>

        <Panel title="Language model">
          <table className="kv">
            <tbody>
              <tr><th>Endpoint</th><td>{system?.ollama.endpoint ?? "–"}</td></tr>
              <tr><th>Chat model</th><td>{system?.ollama.active_model ?? "–"}</td></tr>
              <tr><th>Embedding model</th><td>{system?.ollama.active_embed_model ?? "–"}</td></tr>
              <tr><th>Status</th><td>{system ? (system.ollama.available ? "Reachable" : "Not reachable") : "–"}</td></tr>
            </tbody>
          </table>
          <p className="prose" style={{ marginTop: 14 }}>
            These come from the backend. To change them, set <strong>OLLAMA_ENDPOINT</strong>, <strong>OLLAMA_DEFAULT_MODEL</strong> and{" "}
            <strong>OLLAMA_DEFAULT_EMBED_MODEL</strong> in <strong>.env</strong> and restart the server. The model can also be picked per request on the Hybrid AI page.
          </p>
          <p className="prose" style={{ marginTop: 10 }}>The integration step is fixed at 0.1 ms in the simulator.</p>
        </Panel>
      </div>
    </>
  );
};
