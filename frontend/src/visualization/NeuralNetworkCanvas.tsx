import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { NeuronVisualData, SynapticEdgeVisualData, RealtimeMetrics } from "../types";
import { RotateCw, ZoomIn, ZoomOut, Eye, RefreshCw, Cpu, Activity } from "lucide-react";

interface NeuralNetworkCanvasProps {
  neurons: NeuronVisualData[];
  edges: SynapticEdgeVisualData[];
  metrics: RealtimeMetrics | null;
  onSelectNeuron?: (neuron: NeuronVisualData | null) => void;
}

export const NeuralNetworkCanvas: React.FC<NeuralNetworkCanvasProps> = ({
  neurons,
  edges,
  metrics,
  onSelectNeuron,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronVisualData | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showSynapses, setShowSynapses] = useState<boolean>(true);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const neuronPointsRef = useRef<THREE.Points | null>(null);
  const edgeLinesRef = useRef<THREE.LineSegments | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060a);
    scene.fog = new THREE.FogExp2(0x04060a, 0.003);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 50, 220);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Reference Grid / Equatorial Ring
    const ringGeo = new THREE.RingGeometry(110, 112, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 4. Mouse Orbit Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      // Orbit camera around center
      scene.rotation.y += deltaX * 0.005;
      scene.rotation.x += deltaY * 0.005;

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(50, Math.min(500, camera.position.z + e.deltaY * 0.2));
    };

    // Raycasting for neuron selection
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 4.0 };
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (neuronPointsRef.current) {
        const intersects = raycaster.intersectObject(neuronPointsRef.current);
        if (intersects.length > 0 && intersects[0].index !== undefined) {
          const idx = intersects[0].index;
          if (neurons[idx]) {
            setSelectedNeuron(neurons[idx]);
            if (onSelectNeuron) onSelectNeuron(neurons[idx]);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("click", onClick);

    // Resize Handler
    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // 5. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && sceneRef.current) {
        sceneRef.current.rotation.y += 0.0015;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  // Update Neurons Mesh
  useEffect(() => {
    if (!sceneRef.current || neurons.length === 0) return;
    const scene = sceneRef.current;

    // Remove existing points
    if (neuronPointsRef.current) {
      scene.remove(neuronPointsRef.current);
      neuronPointsRef.current.geometry.dispose();
    }

    const n = neurons.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const neuron = neurons[i];
      positions[i * 3] = neuron.x;
      positions[i * 3 + 1] = neuron.y;
      positions[i * 3 + 2] = neuron.z;

      // Color coding:
      // Spiking = intense gold (1.0, 0.9, 0.2)
      // Excitatory = cyan (0.1, 0.8, 1.0)
      // Inhibitory = crimson (1.0, 0.2, 0.3)
      if (neuron.spiked) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.2;
      } else if (neuron.is_exc) {
        // Excitatory potential tint
        const vNorm = THREE.MathUtils.clamp((neuron.v + 70) / 25, 0, 1);
        colors[i * 3] = 0.05 + 0.1 * vNorm;
        colors[i * 3 + 1] = 0.5 + 0.5 * vNorm;
        colors[i * 3 + 2] = 0.9;
      } else {
        // Inhibitory interneuron
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 0.3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    neuronPointsRef.current = points;
  }, [neurons]);

  // Update Synaptic Connections Mesh
  useEffect(() => {
    if (!sceneRef.current || !showSynapses || edges.length === 0 || neurons.length === 0) {
      if (edgeLinesRef.current && sceneRef.current) {
        edgeLinesRef.current.visible = false;
      }
      return;
    }
    const scene = sceneRef.current;

    if (edgeLinesRef.current) {
      scene.remove(edgeLinesRef.current);
      edgeLinesRef.current.geometry.dispose();
    }

    // Lookup table for coordinates
    const coordMap = new Map<number, [number, number, number]>();
    neurons.forEach((nr) => coordMap.set(nr.id, [nr.x, nr.y, nr.z]));

    const linePositions: number[] = [];
    const lineColors: number[] = [];

    for (let e = 0; e < edges.length; e++) {
      const edge = edges[e];
      const p1 = coordMap.get(edge.source);
      const p2 = coordMap.get(edge.target);

      if (p1 && p2) {
        linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
        // Excitatory synapse = faint cyan, Inhibitory synapse = faint purple/red
        const alpha = Math.min(0.4, edge.weight * 0.3);
        if (edge.is_exc) {
          lineColors.push(0.1, 0.4, 0.6, 0.1, 0.4, 0.6);
        } else {
          lineColors.push(0.5, 0.1, 0.3, 0.5, 0.1, 0.3);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });

    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    lineSegments.visible = showSynapses;
    scene.add(lineSegments);
    edgeLinesRef.current = lineSegments;
  }, [edges, neurons, showSynapses]);

  const handleResetCamera = () => {
    if (cameraRef.current && sceneRef.current) {
      cameraRef.current.position.set(0, 50, 220);
      cameraRef.current.lookAt(0, 0, 0);
      sceneRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "550px" }}>
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="canvas-container" style={{ width: "100%", height: "100%" }} />

      {/* Top Floating Control Bar */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          display: "flex",
          gap: "8px",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`btn ${autoRotate ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "4px 10px", fontSize: "11px" }}
          title="Toggle Auto Rotation"
        >
          <RotateCw size={13} className={autoRotate ? "spin" : ""} />
          {autoRotate ? "Rotating" : "Static"}
        </button>

        <button
          onClick={() => setShowSynapses(!showSynapses)}
          className={`btn ${showSynapses ? "btn-secondary" : "btn-danger"}`}
          style={{ padding: "4px 10px", fontSize: "11px" }}
          title="Toggle Synaptic Edges"
        >
          <Eye size={13} />
          {showSynapses ? "Synapses On" : "Synapses Off"}
        </button>

        <button
          onClick={handleResetCamera}
          className="btn btn-secondary"
          style={{ padding: "4px 10px", fontSize: "11px" }}
          title="Reset Camera View"
        >
          <RefreshCw size={13} />
          Reset View
        </button>
      </div>

      {/* Top Right Live Telemetry Badge */}
      {metrics && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(10, 15, 29, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid #1e293b",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            fontFamily: "ui-monospace, monospace",
            display: "flex",
            gap: "14px",
            zIndex: 10,
          }}
        >
          <div>
            <span style={{ color: "#94a3b8" }}>Neurons: </span>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>{metrics.num_neurons}</span>
          </div>
          <div>
            <span style={{ color: "#94a3b8" }}>Synapses: </span>
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>{metrics.num_synapses.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ color: "#94a3b8" }}>Active Spikes: </span>
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>{metrics.active_spikes_current_step}</span>
          </div>
        </div>
      )}

      {/* Selected Neuron Inspector Overlay */}
      {selectedNeuron && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(13, 18, 29, 0.92)",
            backdropFilter: "blur(10px)",
            border: "1px solid #06b6d4",
            borderRadius: "8px",
            padding: "14px",
            minWidth: "260px",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.2)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
              <Cpu size={14} color="#06b6d4" /> Neuron #{selectedNeuron.id}
            </span>
            <span className={`badge ${selectedNeuron.is_exc ? "badge-cyan" : "badge-red"}`}>
              {selectedNeuron.is_exc ? "Pyramidal (Exc)" : "Interneuron (Inh)"}
            </span>
          </div>

          <div style={{ fontSize: "11px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontFamily: "monospace" }}>
            <div>
              <span style={{ color: "#94a3b8" }}>Potential: </span>
              <span style={{ color: selectedNeuron.v > -55 ? "#f59e0b" : "#38bdf8", fontWeight: 700 }}>
                {selectedNeuron.v} mV
              </span>
            </div>
            <div>
              <span style={{ color: "#94a3b8" }}>Firing Rate: </span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>{selectedNeuron.rate} Hz</span>
            </div>
            <div>
              <span style={{ color: "#94a3b8" }}>Position: </span>
              <span style={{ color: "#cbd5e1" }}>
                ({selectedNeuron.x}, {selectedNeuron.y}, {selectedNeuron.z})
              </span>
            </div>
            <div>
              <span style={{ color: "#94a3b8" }}>Current State: </span>
              <span style={{ color: selectedNeuron.spiked ? "#fbbf24" : "#94a3b8" }}>
                {selectedNeuron.spiked ? "ACTION POTENTIAL" : "Subthreshold"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setSelectedNeuron(null)}
            className="btn btn-secondary"
            style={{ width: "100%", marginTop: "10px", padding: "3px 0", fontSize: "10px" }}
          >
            Close Inspector
          </button>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          background: "rgba(10, 15, 29, 0.8)",
          backdropFilter: "blur(6px)",
          border: "1px solid #1e293b",
          borderRadius: "6px",
          padding: "6px 10px",
          fontSize: "11px",
          display: "flex",
          gap: "12px",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#06b6d4" }} />
          <span style={{ color: "#94a3b8" }}>Excitatory (80%)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
          <span style={{ color: "#94a3b8" }}>Inhibitory (20%)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fbbf24" }} />
          <span style={{ color: "#94a3b8" }}>Action Potential Spike</span>
        </div>
      </div>
    </div>
  );
};
