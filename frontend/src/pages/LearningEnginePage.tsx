import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { RealtimeMetrics } from "../types";
import { api } from "../services/api";
import { Empty, PageHead, Panel, Reading, Readings, Slider, Status, chart, errMsg, fmt } from "../components/ui";

interface Props {
  metrics: RealtimeMetrics | null;
  onRefreshMetrics: () => void;
}

const TAU = 20; // ms, matches backend/learning/stdp.py

export const LearningEnginePage: React.FC<Props> = ({ metrics, onRefreshMetrics }) => {
  const [stdp, setStdp] = useState(metrics?.stdp_enabled ?? true);
  const [homeo, setHomeo] = useState(metrics?.homeostatic_enabled ?? false);
  const [aPlus, setAPlus] = useState(0.008);
  const [aMinus, setAMinus] = useState(0.0085);
  const [status, setStatus] = useState({ msg: "", error: false });

  const apply = async () => {
    try {
      await api.configureLearning({ stdp_enabled: stdp, homeostatic_enabled: homeo, a_plus: aPlus, a_minus: aMinus });
      onRefreshMetrics();
      setStatus({
        msg: `Applied. STDP ${stdp ? "on" : "off"}, homeostasis ${homeo ? "on" : "off"}, A+ ${aPlus.toFixed(4)}, A− ${aMinus.toFixed(4)}.`,
        error: false,
      });
    } catch (e) {
      setStatus({ msg: `Could not apply: ${errMsg(e)}`, error: true });
    }
  };

  const kernel = useMemo(() => {
    const pts = [];
    for (let dt = -60; dt <= 60; dt += 1) {
      if (dt === 0) continue;
      pts.push({ dt, dw: dt > 0 ? aPlus * Math.exp(-dt / TAU) : -aMinus * Math.exp(dt / TAU) });
    }
    return pts;
  }, [aPlus, aMinus]);

  const trend = (metrics?.recent_mean_weight_trend ?? []).map((w, i, arr) => ({
    step: (metrics?.step_count ?? 0) - (arr.length - 1 - i) * 50,
    w,
  }));

  const ltp = metrics?.stdp_ltp_events ?? 0;
  const ltd = metrics?.stdp_ltd_events ?? 0;

  return (
    <>
      <PageHead
        title="Plasticity"
        intro="Synapses strengthen when the input neuron fires just before the output neuron, and weaken when it fires just after. Turn learning on, run the network, and watch the weights move."
      />

      <div className="grid side-l">
        <div className="grid" style={{ alignContent: "start" }}>
          <Panel title="Learning rules">
            <label className="check">
              <input type="checkbox" checked={stdp} onChange={(e) => setStdp(e.target.checked)} />
              Spike-timing-dependent plasticity
            </label>
            <label className="check">
              <input type="checkbox" checked={homeo} onChange={(e) => setHomeo(e.target.checked)} />
              Homeostatic scaling toward 5 Hz
            </label>
            <Slider label="Potentiation A+" value={aPlus} display={aPlus.toFixed(4)} min={0.001} max={0.03} step={0.0005} onChange={setAPlus} />
            <Slider label="Depression A−" value={aMinus} display={aMinus.toFixed(4)} min={0.001} max={0.03} step={0.0005} onChange={setAMinus} />
            <button className="btn primary block" onClick={apply}>
              Apply to the network
            </button>
            <Status {...status} />
          </Panel>

          <Panel title="The rule">
            <div className="eq">Δw = A₊ e<sup>−Δt/τ</sup> for Δt &gt; 0, &nbsp; −A₋ e<sup>Δt/τ</sup> for Δt &lt; 0</div>
            <div className="prose">
              <p>Δt is post-synaptic spike time minus pre-synaptic spike time, τ = 20 ms (Bi and Poo, 1998). A₋ slightly larger than A₊ keeps uncorrelated activity from inflating every weight.</p>
              <p>Homeostatic scaling multiplies each neuron's input weights toward a target rate every 10 steps (Turrigiano, 2008).</p>
            </div>
          </Panel>
        </div>

        <div className="grid" style={{ alignContent: "start" }}>
          <Panel aside={metrics?.stdp_enabled ? <span className="tag ok">Learning is on</span> : <span className="tag">Learning is off</span>}>
            <Readings>
              <Reading label="Potentiation events" value={ltp.toLocaleString()} color="var(--exc)" />
              <Reading label="Depression events" value={ltd.toLocaleString()} color="var(--inh)" />
              <Reading label="Net weight change" value={fmt(metrics?.stdp_net_weight_change, 4)} />
              <Reading label="Mean weight" value={fmt(metrics?.mean_synaptic_weight, 4)} />
            </Readings>
          </Panel>

          <Panel title="Mean synaptic weight over time" aside="Sampled every 50 steps by the simulator">
            {trend.length < 2 ? (
              <Empty>No weight samples yet. Enable STDP, apply, then press Run.</Empty>
            ) : (
              <div className="figure" style={{ height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis dataKey="step" {...chart.axis} />
                    <YAxis {...chart.axis} domain={["auto", "auto"]} width={70} tickFormatter={(v) => v.toFixed(4)} />
                    <Tooltip {...chart.tooltip} formatter={(v) => Number(v).toFixed(5)} labelFormatter={(s) => `step ${s}`} />
                    <Line dataKey="w" stroke={chart.exc} strokeWidth={2} dot={{ r: 2.5, fill: chart.exc }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel title="Learning window for these settings" aside="Computed from the rule, not measured">
            <div className="figure" style={{ height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={kernel} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="dt" {...chart.axis} type="number" domain={[-60, 60]} unit=" ms" ticks={[-60, -40, -20, 0, 20, 40, 60]} />
                  <YAxis {...chart.axis} width={70} tickFormatter={(v) => v.toFixed(3)} />
                  <ReferenceLine y={0} stroke={chart.ink} />
                  <ReferenceLine x={0} stroke={chart.grid} />
                  <Tooltip {...chart.tooltip} formatter={(v) => Number(v).toFixed(5)} labelFormatter={(d) => `Δt = ${d} ms`} />
                  <Line dataKey="dw" stroke={chart.inh} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};
