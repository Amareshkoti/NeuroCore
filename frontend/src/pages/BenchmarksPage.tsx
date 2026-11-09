import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { SystemStatus } from "../types";
import { api } from "../services/api";
import { loadDefaults } from "../services/settings";
import { Empty, PageHead, Panel, Status, chart, errMsg } from "../components/ui";

type Row = { size: string; stepsPerSec: number; realtime: number; seconds: number };

const SIZES = [100, 500, 1000, 2000, 4000];
const STEPS = 100; // 100 × 0.1 ms = 10 ms of simulated time per size

export const BenchmarksPage: React.FC<{ system: SystemStatus | null; onNetworkRebuilt: () => void }> = ({ system, onNetworkRebuilt }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ msg: "", error: false });

  const sweep = async () => {
    setBusy(true);
    setRows([]);
    const d = loadDefaults();
    try {
      await api.pauseSimulation();
      for (const n of SIZES) {
        setStatus({ msg: `Building and stepping ${n.toLocaleString()} neurons…`, error: false });
        await api.createSimulation({ num_neurons: n, model_type: "lif", excitatory_ratio: 0.8, connection_probability: d.connectionProbability, seed: d.seed });
        // time only the stepping, measured in the browser, so it includes HTTP overhead
        const t0 = performance.now();
        await api.stepSimulation(STEPS);
        const sec = (performance.now() - t0) / 1000;
        setRows((r) => [...r, { size: n.toLocaleString(), stepsPerSec: Math.round(STEPS / sec), realtime: STEPS * 0.0001 / sec, seconds: sec }]);
      }
      await api.createSimulation({ num_neurons: d.numNeurons, model_type: d.modelType, excitatory_ratio: d.excitatoryRatio, connection_probability: d.connectionProbability, seed: d.seed });
      onNetworkRebuilt();
      setStatus({ msg: `Done. The network was rebuilt at your default size of ${d.numNeurons.toLocaleString()} neurons.`, error: false });
    } catch (e) {
      setStatus({ msg: `Benchmark stopped: ${errMsg(e)}`, error: true });
    } finally {
      setBusy(false);
    }
  };

  const hw = system?.hardware;

  return (
    <>
      <PageHead
        title="Benchmarks"
        intro={`How fast this machine integrates the network. Each size runs ${STEPS} steps (10 ms of simulated time) on the CPU solver.`}
      >
        <button className="btn primary" onClick={sweep} disabled={busy}>
          {busy ? "Measuring…" : "Run throughput sweep"}
        </button>
      </PageHead>

      <div className="grid side-l">
        <Panel title="Hardware">
          <table className="kv">
            <tbody>
              <tr><th>Processor</th><td>{hw?.processor ?? "–"}</td></tr>
              <tr><th>Threads</th><td>{hw?.cpu_count_logical ?? "–"}</td></tr>
              <tr><th>Clock</th><td>{hw ? `${Math.round(hw.cpu_freq_mhz)} MHz` : "–"}</td></tr>
              <tr><th>Memory</th><td>{hw ? `${hw.ram_total_gb} GB` : "–"}</td></tr>
              <tr><th>GPU</th><td>{hw ? (hw.cuda_available ? `${hw.cuda_device_name}` : "No CUDA device") : "–"}</td></tr>
              <tr><th>Solver device</th><td>{hw?.recommended_device ?? "–"}</td></tr>
              <tr><th>Backend process</th><td>{system ? `${system.process_resources.memory_rss_mb.toFixed(0)} MB, ${system.process_resources.cpu_percent.toFixed(0)}% CPU` : "–"}</td></tr>
            </tbody>
          </table>
          <p className="caption" style={{ marginTop: 10 }}>Brian2 is used for cross-validation only and does not run on CUDA here.</p>
        </Panel>

        <Panel title="Steps per second" aside="Higher is faster">
          {rows.length ? (
            <>
              <div className="figure" style={{ height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis dataKey="size" {...chart.axis} />
                    <YAxis {...chart.axis} width={60} />
                    <Tooltip {...chart.tooltip} formatter={(v) => `${Number(v).toLocaleString()} steps/s`} labelFormatter={(l) => `${l} neurons`} />
                    <Bar dataKey="stepsPerSec" fill={chart.exc} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="table" style={{ marginTop: 14 }}>
                <thead><tr><th>Neurons</th><th>Steps/s</th><th>Wall time</th><th>Real-time factor</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.size}>
                      <td>{r.size}</td>
                      <td>{r.stepsPerSec.toLocaleString()}</td>
                      <td>{r.seconds.toFixed(3)} s</td>
                      <td>{r.realtime.toFixed(2)}× {r.realtime >= 1 ? "faster than real time" : "of real time"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <Empty>No measurements yet. The sweep pauses and rebuilds the network at each size, then restores your default network.</Empty>
          )}
          <Status {...status} />
        </Panel>
      </div>
    </>
  );
};
