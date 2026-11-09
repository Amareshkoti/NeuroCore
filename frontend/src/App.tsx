import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Box,
  Database,
  FlaskConical,
  Gauge,
  LayoutGrid,
  Pause,
  Play,
  Settings,
  Waypoints,
} from "lucide-react";
import { OverviewPage } from "./pages/OverviewPage";
import { NeuralLabPage } from "./pages/NeuralLabPage";
import { BrainVisualizationPage } from "./pages/BrainVisualizationPage";
import { LearningEnginePage } from "./pages/LearningEnginePage";
import { NeuralMemoryPage } from "./pages/NeuralMemoryPage";
import { AIIntegrationPage } from "./pages/AIIntegrationPage";
import { ExperimentsPage } from "./pages/ExperimentsPage";
import { BenchmarksPage } from "./pages/BenchmarksPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LiveRaster } from "./components/LiveRaster";
import { fmt } from "./components/ui";
import { api } from "./services/api";
import { live } from "./services/live";
import { SystemStatus, RealtimeMetrics } from "./types";

export type NavTab =
  | "overview"
  | "laboratory"
  | "visualization"
  | "learning"
  | "memory"
  | "ai"
  | "experiments"
  | "benchmarks"
  | "settings";

const NAV: { group: string; items: { id: NavTab; label: string; icon: React.ReactNode }[] }[] = [
  {
    group: "Simulate",
    items: [
      { id: "overview", label: "Overview", icon: <LayoutGrid size={17} /> },
      { id: "laboratory", label: "Neural lab", icon: <Activity size={17} /> },
      { id: "visualization", label: "3D network", icon: <Box size={17} /> },
    ],
  },
  {
    group: "Learn and remember",
    items: [
      { id: "learning", label: "Plasticity", icon: <Waypoints size={17} /> },
      { id: "memory", label: "Memory", icon: <Database size={17} /> },
    ],
  },
  {
    group: "Evaluate",
    items: [
      { id: "ai", label: "Hybrid AI", icon: <Bot size={17} /> },
      { id: "experiments", label: "Experiments", icon: <FlaskConical size={17} /> },
      { id: "benchmarks", label: "Benchmarks", icon: <Gauge size={17} /> },
      { id: "settings", label: "Settings", icon: <Settings size={17} /> },
    ],
  },
];

const TAB_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));
const tabFromHash = (): NavTab => {
  const h = window.location.hash.replace("#", "") as NavTab;
  return TAB_IDS.includes(h) ? h : "overview";
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(tabFromHash);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  // bumps whenever the network is rebuilt so views reload topology
  const [networkVersion, setNetworkVersion] = useState(0);

  const navigate = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setActiveTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const fetchSystem = () => api.getSystemStatus().then(setSystem).catch(() => setSystem(null));
    fetchSystem();
    const id = setInterval(fetchSystem, 5000);
    return () => clearInterval(id);
  }, []);

  // Neuron phenotypes for colouring the raster; reloaded when the network changes size.
  const loadPhenotypes = useCallback(async () => {
    try {
      const payload = await api.getNeuralNetwork3D(1);
      live.setPhenotypes(payload.neurons.map((n) => n.is_exc));
    } catch {
      /* backend not reachable yet; retried on reconnect */
    }
  }, []);

  useEffect(() => {
    if (isConnected) loadPhenotypes();
  }, [isConnected, networkVersion, loadPhenotypes]);

  useEffect(() => {
    if (metrics && live.numNeurons && metrics.num_neurons !== live.numNeurons) loadPhenotypes();
  }, [metrics, loadPhenotypes]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      ws = api.createSimulationWebSocket((packet) => {
        if (packet.metrics) {
          setMetrics(packet.metrics);
          live.push(packet.spike_events ?? [], packet.metrics.current_time_ms);
        }
        if (typeof packet.is_running === "boolean") setIsRunning(packet.is_running);
      });
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => {
        setIsConnected(false);
        if (!closed) retry = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  const refreshMetrics = useCallback(async () => {
    try {
      setMetrics(await api.getNeuralActivity());
    } catch {
      /* stream will update shortly */
    }
  }, []);

  const onNetworkRebuilt = useCallback(() => {
    live.clear();
    setNetworkVersion((v) => v + 1);
    refreshMetrics();
  }, [refreshMetrics]);

  const toggleRun = async () => {
    if (isRunning) await api.pauseSimulation();
    else await api.startSimulation();
    setIsRunning(!isRunning);
  };

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark">
            <NeuronGlyph />
            <span className="brand-name">NEUROCORE</span>
          </div>
          <div className="brand-sub">Spiking neural network research workstation</div>
        </div>

        <nav className="nav" aria-label="Sections">
          {NAV.map((g) => (
            <React.Fragment key={g.group}>
              <div className="nav-group">{g.group}</div>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  aria-current={activeTab === item.id ? "page" : undefined}
                  onClick={() => navigate(item.id)}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="rail-foot">
          <div>
            <span className={`dot ${isConnected ? "on" : "off"}`} />
            {isConnected ? "Simulator connected" : "Simulator offline"}
          </div>
          <div>
            <span className={`dot ${system?.ollama.available ? "on" : "off"}`} />
            {system?.ollama.available ? system.ollama.active_model : "Ollama not detected"}
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="strip">
          <LiveRaster isRunning={isRunning} />
          <div className="strip-bar">
            <button className={`btn small ${isRunning ? "stop" : "run"}`} onClick={toggleRun} disabled={!isConnected}>
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              {isRunning ? "Pause" : "Run"}
            </button>
            <span>
              t = <b>{fmt(metrics?.current_time_ms, 1)}</b> ms
            </span>
            <span>
              <b>{metrics?.num_neurons?.toLocaleString() ?? "–"}</b> neurons
            </span>
            <span>
              <b>{fmt(metrics?.mean_firing_rate_hz, 1)}</b> Hz mean rate
            </span>
            <span>
              <b>{metrics?.total_spikes?.toLocaleString() ?? "–"}</b> spikes so far
            </span>
            <span className="grow" />
            <span className="strip-note">
              <span className="legend">
                <span><i style={{ background: "var(--exc)" }} />Excitatory</span>
                <span><i style={{ background: "var(--inh)" }} />Inhibitory</span>
                <span>Last 250 ms of simulated time</span>
              </span>
            </span>
          </div>
        </div>

        <main className="page">
          {!isConnected && (
            <div className="status err" style={{ marginTop: 0, marginBottom: 22 }}>
              Cannot reach the simulator at 127.0.0.1:8000. Start it with <b>python scripts/run_server.py</b>; this
              page reconnects on its own.
            </div>
          )}
          {activeTab === "overview" && <OverviewPage system={system} metrics={metrics} onNavigate={navigate} />}
          {activeTab === "laboratory" && (
            <NeuralLabPage
              metrics={metrics}
              isRunning={isRunning}
              onRefreshMetrics={refreshMetrics}
              onNetworkRebuilt={onNetworkRebuilt}
            />
          )}
          {activeTab === "visualization" && (
            <BrainVisualizationPage metrics={metrics} isRunning={isRunning} networkVersion={networkVersion} />
          )}
          {activeTab === "learning" && <LearningEnginePage metrics={metrics} onRefreshMetrics={refreshMetrics} />}
          {activeTab === "memory" && <NeuralMemoryPage />}
          {activeTab === "ai" && <AIIntegrationPage system={system} />}
          {activeTab === "experiments" && <ExperimentsPage />}
          {activeTab === "benchmarks" && <BenchmarksPage system={system} onNetworkRebuilt={onNetworkRebuilt} />}
          {activeTab === "settings" && <SettingsPage system={system} />}
        </main>
      </div>
    </div>
  );
};

// Pyramidal cell silhouette: soma, apical dendrite, axon.
const NeuronGlyph = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <path d="M13 3 L13 9 M13 6 L9 2 M13 6 L17 2.5 M13 19 L13 25 M13 22 L9.5 24.5" stroke="#231a3d" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M13 8.5 L18 18.5 L8 18.5 Z" fill="#4a3aa8" />
    <circle cx="13" cy="25" r="1.4" fill="#d99a06" />
  </svg>
);

export default App;
