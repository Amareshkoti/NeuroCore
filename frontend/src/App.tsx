import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { OverviewPage } from "./pages/OverviewPage";
import { NeuralLabPage } from "./pages/NeuralLabPage";
import { BrainVisualizationPage } from "./pages/BrainVisualizationPage";
import { LearningEnginePage } from "./pages/LearningEnginePage";
import { NeuralMemoryPage } from "./pages/NeuralMemoryPage";
import { AIIntegrationPage } from "./pages/AIIntegrationPage";
import { ExperimentsPage } from "./pages/ExperimentsPage";
import { BenchmarksPage } from "./pages/BenchmarksPage";
import { SettingsPage } from "./pages/SettingsPage";
import { api } from "./services/api";
import { SystemStatus, RealtimeMetrics } from "./types";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Poll system profile periodically
  const fetchSystem = async () => {
    try {
      const data = await api.getSystemStatus();
      setSystem(data);
    } catch (err) {
      console.error("Failed to fetch system status", err);
    }
  };

  useEffect(() => {
    fetchSystem();
    const interval = setInterval(fetchSystem, 4000);
    return () => clearInterval(interval);
  }, []);

  // Connect WebSocket for live simulation streaming
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connect = () => {
      try {
        ws = api.createSimulationWebSocket((packet) => {
          setIsConnected(true);
          if (packet.metrics) {
            setMetrics(packet.metrics);
          }
          if (typeof packet.is_running === "boolean") {
            setIsRunning(packet.is_running);
          }
        });

        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        };
        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
        wsRef.current = ws;
      } catch (e) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const handleRefreshMetrics = async () => {
    try {
      const m = await api.getNeuralActivity();
      setMetrics(m);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Top Laboratory Header */}
      <Header system={system} metrics={metrics} isConnected={isConnected} />

      {/* Primary Tab Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Research Canvas */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "overview" && (
          <OverviewPage
            system={system}
            metrics={metrics}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "laboratory" && (
          <NeuralLabPage
            metrics={metrics}
            isRunning={isRunning}
            onRefreshMetrics={handleRefreshMetrics}
            onNavigateTo3D={() => setActiveTab("visualization")}
          />
        )}

        {activeTab === "visualization" && (
          <BrainVisualizationPage metrics={metrics} isRunning={isRunning} />
        )}

        {activeTab === "learning" && (
          <LearningEnginePage metrics={metrics} onRefreshMetrics={handleRefreshMetrics} />
        )}

        {activeTab === "memory" && <NeuralMemoryPage />}

        {activeTab === "ai" && <AIIntegrationPage system={system} />}

        {activeTab === "experiments" && <ExperimentsPage />}

        {activeTab === "benchmarks" && <BenchmarksPage system={system} metrics={metrics} />}

        {activeTab === "settings" && <SettingsPage system={system} />}
      </main>
    </div>
  );
};

export default App;
