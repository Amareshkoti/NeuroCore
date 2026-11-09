import React, { useEffect, useState } from "react";
import { SystemStatus, AIProcessResult, AIComparisonResult } from "../types";
import { api } from "../services/api";
import { Empty, PageHead, Panel, Reading, Readings, Segmented, Status, errMsg, fmt } from "../components/ui";

type Mode = "COMPARE_ALL" | "MODE_A_LLM_ONLY" | "MODE_B_NEURAL_ONLY" | "MODE_C_HYBRID";

const MODES: { value: Mode; label: string; path: string }[] = [
  { value: "COMPARE_ALL", label: "Compare all three", path: "Runs A, B and C on the same prompt, one after another." },
  { value: "MODE_A_LLM_ONLY", label: "A: LLM only", path: "Prompt → Ollama → answer. No neurons involved." },
  { value: "MODE_B_NEURAL_ONLY", label: "B: Network only", path: "Prompt → embedding → input currents → spiking network → attractor readout." },
  { value: "MODE_C_HYBRID", label: "C: Hybrid", path: "Prompt → spiking network → readout statistics added to the LLM prompt → answer." },
];

const latency = (s?: number) => (s === undefined ? "–" : s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);

export const AIIntegrationPage: React.FC<{ system: SystemStatus | null }> = ({ system }) => {
  const [mode, setMode] = useState<Mode>("COMPARE_ALL");
  const [prompt, setPrompt] = useState("Explain how homeostatic plasticity keeps a recurrent network stable while STDP is changing its weights.");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [single, setSingle] = useState<AIProcessResult | null>(null);
  const [compare, setCompare] = useState<AIComparisonResult | null>(null);
  const [status, setStatus] = useState({ msg: "", error: false });

  useEffect(() => {
    if (!model && system?.ollama.active_model) setModel(system.ollama.active_model);
  }, [system, model]);

  const usesLLM = mode !== "MODE_B_NEURAL_ONLY";
  const llmOffline = usesLLM && system && !system.ollama.available;

  const execute = async () => {
    setBusy(true);
    const t0 = performance.now();
    setStatus({ msg: usesLLM ? `Running on ${model}. Local models can take a minute.` : "Running the spiking network…", error: false });
    try {
      const res = await api.processAI({ mode, prompt, model: model || undefined });
      if (mode === "COMPARE_ALL") {
        setCompare(res as AIComparisonResult);
        setSingle(null);
      } else {
        setSingle(res as AIProcessResult);
        setCompare(null);
      }
      setStatus({ msg: `Finished in ${((performance.now() - t0) / 1000).toFixed(1)} s.`, error: false });
    } catch (e) {
      setStatus({ msg: `Request failed: ${errMsg(e)}`, error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead
        title="Hybrid AI"
        intro="Send one prompt through a local language model, through the spiking network, or through both, and compare what each path produced and what it cost."
      />

      <Panel>
        <div className="field">
          <span>Processing path</span>
          <Segmented label="Mode" value={mode} onChange={setMode} options={MODES.map(({ value, label }) => ({ value, label }))} />
        </div>
        <p className="prose" style={{ marginBottom: 16 }}>{MODES.find((m) => m.value === mode)!.path}</p>

        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) 260px", alignItems: "end" }}>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Prompt</span>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
          </label>
          <div>
            <label className="field">
              <span>Ollama model</span>
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!usesLLM}>
                {(system?.ollama.models ?? []).length === 0 && <option value="">No models found</option>}
                {(system?.ollama.models ?? []).map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                    {m.parameter_size ? ` (${m.parameter_size})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn primary block" disabled={busy || !prompt.trim()} onClick={execute}>
              {busy ? "Running…" : "Run prompt"}
            </button>
          </div>
        </div>
        {llmOffline && <Status error msg="Ollama is not reachable, so modes A and C will report an error instead of an answer. Start Ollama and refresh." />}
        <Status {...status} />
      </Panel>

      <div style={{ height: 18 }} />

      {compare && <Comparison r={compare} />}
      {single && <SingleResult r={single} />}
      {!compare && !single && <Empty>Results appear here: the answer from each path, its latency, and how many spikes the network used.</Empty>}
    </>
  );
};

const Comparison: React.FC<{ r: AIComparisonResult }> = ({ r }) => {
  const rows = [
    { name: "A: LLM only", res: r.mode_a, spikes: r.comparison.energy_cost_spikes.mode_a, attractor: "–", text: r.mode_a.response },
    { name: "B: Network only", res: r.mode_b, spikes: r.comparison.energy_cost_spikes.mode_b, attractor: r.mode_b.matched_attractor ?? "–", text: r.mode_b.response },
    {
      name: "C: Hybrid",
      res: r.mode_c,
      spikes: r.comparison.energy_cost_spikes.mode_c,
      attractor: r.mode_c.neural_modulation?.matched_attractor ?? "–",
      text: r.mode_c.response,
    },
  ];
  return (
    <div className="grid">
      <Panel title="Side by side" aside={`Fastest: ${r.comparison.fastest_mode}`}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>Path</th><th>Latency</th><th>Tokens</th><th>Spikes</th><th>Attractor</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td><b>{row.name}</b></td>
                  <td>{latency(row.res.latency_sec)}</td>
                  <td>{row.res.tokens_generated ?? "–"}</td>
                  <td>{row.spikes.toLocaleString()}</td>
                  <td>{row.attractor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="prose" style={{ marginTop: 14 }}>
          <strong>Backend note.</strong> {r.comparison.scientific_finding} Hybrid latency minus LLM-only latency:{" "}
          {r.comparison.latency_overhead_c_vs_a_sec.toFixed(2)} s. Answer quality is not scored here; use Experiment 8 for a recorded comparison.
        </p>
      </Panel>
      <div className="grid cols-3">
        {rows.map((row) => (
          <Panel key={row.name} title={row.name} aside={latency(row.res.latency_sec)}>
            <div className="response">{row.text || "(empty response)"}</div>
          </Panel>
        ))}
      </div>
    </div>
  );
};

const SingleResult: React.FC<{ r: AIProcessResult }> = ({ r }) => {
  const nm = r.neural_modulation;
  return (
    <Panel title="Result" aside={r.model ?? "Spiking network"}>
      <Readings>
        <Reading label="Latency" value={latency(r.latency_sec)} />
        <Reading label="Tokens" value={r.tokens_generated ?? "–"} />
        <Reading label="Spikes" value={(r.total_spikes ?? nm?.total_spikes ?? 0).toLocaleString()} color="var(--spike)" />
        <Reading label="Attractor" value={(r.matched_attractor ?? nm?.matched_attractor ?? "–").replace(/_/g, " ")} />
        <Reading label="Overlap" value={fmt(r.attractor_overlap ?? nm?.attractor_overlap, 3)} />
      </Readings>
      <div className="response" style={{ marginTop: 16 }}>{r.response || "(empty response)"}</div>
    </Panel>
  );
};
