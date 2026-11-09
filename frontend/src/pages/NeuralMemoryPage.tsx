import React, { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, Cell } from "recharts";
import { api } from "../services/api";
import { NoisePoint, RecallResult } from "../types";
import { Empty, PageHead, Panel, Reading, Readings, Segmented, Slider, Status, chart, errMsg, fmt } from "../components/ui";

const PATTERNS = ["Alpha", "Beta", "Gamma", "Delta"];

type Recall = { result: RecallResult; original: number[]; cue: number[]; settled: number[]; pattern: string };

export const NeuralMemoryPage: React.FC = () => {
  const [pattern, setPattern] = useState("Alpha");
  const [mask, setMask] = useState(0.3);
  const [noise, setNoise] = useState(0.15);
  const [busy, setBusy] = useState(false);
  const [stored, setStored] = useState(false);
  const [recall, setRecall] = useState<Recall | null>(null);
  const [sweep, setSweep] = useState<NoisePoint[]>([]);
  const [status, setStatus] = useState({ msg: "", error: false });

  const act = async (pending: string, fn: () => Promise<string>) => {
    setBusy(true);
    setStatus({ msg: pending, error: false });
    try {
      setStatus({ msg: await fn(), error: false });
    } catch (e) {
      setStatus({ msg: `Failed: ${errMsg(e)}`, error: true });
    } finally {
      setBusy(false);
    }
  };

  const store = () =>
    act("Writing four patterns into the recurrent weights…", async () => {
      const res = await api.storeMemoryPatterns(PATTERNS);
      setStored(true);
      return `Stored ${res.meta.num_patterns_stored} patterns. ${res.meta.num_synapses_potentiated.toLocaleString()} synapses were strengthened.`;
    });

  const doRecall = () =>
    act("Presenting the cue for 25 ms, then letting the network settle for 40 ms…", async () => {
      if (!stored) await api.storeMemoryPatterns(PATTERNS);
      const res = await api.recallMemoryPattern({ pattern_name: pattern, noise_fraction: noise, mask_fraction: mask });
      setStored(true);
      setRecall({ result: res.recall_result, original: res.original, cue: res.cue, settled: res.settled_rates_hz, pattern });
      const ok = res.recall_result.matched_label === pattern;
      return ok
        ? `Closest stored pattern after settling: ${pattern} (cosine ${res.recall_result.cosine_similarity.toFixed(2)}).`
        : `Closest stored pattern after settling: ${res.recall_result.matched_label}, not ${pattern}. Try less corruption.`;
    });

  const doSweep = () =>
    act("Recalling at 10%, 20%, 30%, 40% and 50% bit flips…", async () => {
      if (!stored) await api.storeMemoryPatterns(PATTERNS);
      const res = await api.getNoiseBenchmark(pattern);
      setStored(true);
      setSweep(res.benchmark);
      const correct = res.benchmark.filter((p) => p.is_correct_attractor).length;
      return `Correct attractor in ${correct} of ${res.benchmark.length} noise levels.`;
    });

  const sims = recall ? Object.entries(recall.result.all_similarities).map(([label, s]) => ({ label, s })) : [];

  return (
    <>
      <PageHead
        title="Memory"
        intro="Patterns are written into the recurrent synaptic weights, not into a lookup table. A damaged cue is presented to the network and its own dynamics pull activity back toward the nearest stored pattern."
      >
        <button className="btn primary" disabled={busy} onClick={store}>
          {stored ? "Store patterns again" : "Store four patterns"}
        </button>
      </PageHead>

      <div className="grid side-l">
        <div className="grid" style={{ alignContent: "start" }}>
          <Panel title="Cue">
            <div className="field">
              <span>Pattern to recall</span>
              <Segmented label="Pattern" value={pattern} onChange={setPattern} options={PATTERNS.map((p) => ({ value: p, label: p }))} />
            </div>
            <Slider label="Hide part of the cue" value={mask} display={`${Math.round(mask * 100)}%`} min={0} max={0.8} step={0.05} onChange={setMask} />
            <Slider label="Flip random bits" value={noise} display={`${Math.round(noise * 100)}%`} min={0} max={0.5} step={0.05} onChange={setNoise} />
            <div className="row">
              <button className="btn primary" style={{ flex: 1 }} disabled={busy} onClick={doRecall}>
                Recall
              </button>
              <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={doSweep}>
                Noise sweep
              </button>
            </div>
            <Status {...status} />
          </Panel>

          <Panel title="Why this counts as memory">
            <div className="prose">
              <p>Storing uses a Hebbian outer product: neurons active together in a pattern get stronger mutual excitation.</p>
              <div className="eq">W ← W + η (p pᵀ)</div>
              <p>Recall runs the spiking network. The answer is read from the firing rates it settles into, compared with each stored pattern by cosine similarity.</p>
            </div>
          </Panel>
        </div>

        <div className="grid" style={{ alignContent: "start" }}>
          <Panel
            title="Recall"
            aside={
              recall ? (
                <span className={`tag ${recall.result.matched_label === recall.pattern ? "ok" : "inh"}`}>
                  {recall.result.matched_label === recall.pattern ? `Closest match: ${recall.pattern}` : `Closest match: ${recall.result.matched_label}`}
                </span>
              ) : undefined
            }
          >
            {recall ? (
              <>
                <div className="grid cols-3" style={{ gap: 14, marginBottom: 16 }}>
                  <PatternGrid title="Stored pattern" values={recall.original} color="#231a3d" />
                  <PatternGrid title="Cue given to the network" values={recall.cue} color="#c42f63" diff={recall.original} />
                  <PatternGrid title="Settled firing" values={recall.settled} color="#4a3aa8" />
                </div>
                <Readings>
                  <Reading label="Cosine similarity" value={fmt(recall.result.cosine_similarity, 3)} />
                  <Reading label="Hamming similarity" value={fmt(recall.result.hamming_similarity, 3)} />
                  <Reading label="Settled rate" value={fmt(recall.result.settled_firing_rate_hz)} unit="Hz" />
                  <Reading label="Spikes used" value={recall.result.total_settling_spikes.toLocaleString()} />
                </Readings>
                <div className="figure" style={{ height: 170, marginTop: 16 }}>
                  <ResponsiveContainer>
                    <BarChart data={sims} layout="vertical" margin={{ top: 6, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid stroke={chart.grid} horizontal={false} />
                      <XAxis type="number" {...chart.axis} domain={[0, 1]} />
                      <YAxis type="category" dataKey="label" {...chart.axis} width={60} />
                      <Tooltip {...chart.tooltip} formatter={(v) => Number(v).toFixed(3)} />
                      <Bar dataKey="s" name="Similarity" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                        {sims.map((d) => (
                          <Cell key={d.label} fill={d.label === recall.result.matched_label ? chart.exc : "#cfc6dd"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="caption">Similarity of the settled firing to every stored pattern. The highest one is the network's answer.</p>
              </>
            ) : (
              <Empty>Pick a pattern, damage the cue, then press Recall. Patterns are stored automatically the first time.</Empty>
            )}
          </Panel>

          <Panel title="Noise sweep" aside={sweep.length ? `Pattern ${pattern}` : undefined}>
            {sweep.length ? (
              <div className="figure" style={{ height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={sweep.map((p) => ({ ...p, pct: `${Math.round(p.noise_fraction * 100)}%` }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis dataKey="pct" {...chart.axis} />
                    <YAxis {...chart.axis} domain={[0, 1]} width={44} />
                    <Tooltip {...chart.tooltip} formatter={(v) => Number(v).toFixed(3)} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Line dataKey="input_cue_similarity" name="Cue vs stored" stroke={chart.inh} strokeWidth={2} isAnimationActive={false} />
                    <Line dataKey="recovered_similarity" name="Settled vs stored" stroke={chart.exc} strokeWidth={2} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty>Run a noise sweep to measure how much corruption the network can repair.</Empty>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
};

// One square per neuron. For the cue, cells that differ from the stored pattern get an outline.
const PatternGrid: React.FC<{ title: string; values: number[]; color: string; diff?: number[] }> = ({ title, values, color, diff }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !values.length) return;
    const cols = Math.ceil(Math.sqrt(values.length));
    const rows = Math.ceil(values.length / cols);
    const cell = 10;
    c.width = cols * cell;
    c.height = rows * cell;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f4eff4";
    g.fillRect(0, 0, c.width, c.height);
    const max = Math.max(...values, 1e-6);
    values.forEach((v, i) => {
      const x = (i % cols) * cell;
      const y = Math.floor(i / cols) * cell;
      const a = Math.min(1, v / max);
      if (a > 0.02) {
        g.globalAlpha = 0.15 + 0.85 * a;
        g.fillStyle = color;
        g.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        g.globalAlpha = 1;
      }
      if (diff && Math.round(diff[i]) !== Math.round(v)) {
        g.strokeStyle = "#d99a06";
        g.lineWidth = 1.5;
        g.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
      }
    });
  }, [values, color, diff]);
  return (
    <figure>
      <canvas ref={ref} style={{ width: "100%", imageRendering: "pixelated", borderRadius: 6, display: "block" }} />
      <figcaption className="caption">{title}</figcaption>
    </figure>
  );
};
