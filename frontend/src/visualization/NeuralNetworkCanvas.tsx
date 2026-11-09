import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { NeuronVisualData, SynapticEdgeVisualData } from "../types";
import { live } from "../services/live";

interface Props {
  neurons: NeuronVisualData[];
  edges: SynapticEdgeVisualData[];
  showSynapses: boolean;
  autoRotate: boolean;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  resetToken: number;
}

const EXC = new THREE.Color("#4a3aa8");
const INH = new THREE.Color("#c42f63");
const SPIKE = new THREE.Color("#e3a008");
const REST = new THREE.Color("#d8d0e6");
const FLASH_MS = 12; // a spike is drawn in ochre and fades back over 12 ms of simulated time

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.beginPath();
  g.arc(32, 32, 28, 0, Math.PI * 2);
  g.fillStyle = "#fff";
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const NeuralNetworkCanvas: React.FC<Props> = ({
  neurons,
  edges,
  showSynapses,
  autoRotate,
  selectedId,
  onSelect,
  resetToken,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const three = useRef<{
    scene: THREE.Scene;
    group: THREE.Group;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    points?: THREE.Points;
    lines?: THREE.LineSegments;
    highlight?: THREE.LineSegments;
  } | null>(null);
  const neuronsRef = useRef(neurons);
  neuronsRef.current = neurons;
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  // scene setup, once
  useEffect(() => {
    const container = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
    camera.position.set(0, 40, 215);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // faint reference ring at the equator
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(118, 118.8, 128),
      new THREE.MeshBasicMaterial({ color: "#e6dde6", side: THREE.DoubleSide }),
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    three.current = { scene, group, camera, renderer };

    // orbit with pointer drag, zoom with wheel, click to select
    const dom = renderer.domElement;
    let dragging = false;
    let moved = 0;
    let last = { x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      last = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      group.rotation.y += dx * 0.006;
      group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + dy * 0.006, -1.3, 1.3);
      last = { x: e.clientX, y: e.clientY };
    };
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 3.5 };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (moved > 5 || !three.current?.points) return;
      const rect = dom.getBoundingClientRect();
      const m = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(m, camera);
      const hit = raycaster.intersectObject(three.current.points)[0];
      onSelectRef.current(hit?.index !== undefined ? neuronsRef.current[hit.index]?.id ?? null : null);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.multiplyScalar(1 + Math.sign(e.deltaY) * 0.08);
      const d = camera.position.length();
      if (d < 70) camera.position.setLength(70);
      if (d > 700) camera.position.setLength(700);
    };
    dom.addEventListener("pointerdown", down);
    dom.addEventListener("pointermove", move);
    dom.addEventListener("pointerup", up);
    dom.addEventListener("wheel", wheel, { passive: false });

    const ro = new ResizeObserver(() => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    let raf = 0;
    const color = new THREE.Color();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = three.current;
      if (!t) return;
      if (autoRotateRef.current && !dragging) group.rotation.y += 0.0012;

      // recolour from live spike times and the latest membrane potentials
      const pts = t.points;
      const ns = neuronsRef.current;
      if (pts && ns.length) {
        const col = pts.geometry.getAttribute("color") as THREE.BufferAttribute;
        const size = pts.geometry.getAttribute("size") as THREE.BufferAttribute;
        const now = live.latestT;
        for (let i = 0; i < ns.length; i++) {
          const n = ns[i];
          const base = n.is_exc ? EXC : INH;
          // depolarisation from −70 to −50 mV moves the dot from pale to full colour
          const depol = THREE.MathUtils.clamp((n.v + 70) / 20, 0, 1);
          color.copy(REST).lerp(base, 0.45 + 0.55 * depol);
          const since = now - (live.lastSpikeT[n.id] ?? -Infinity);
          let s = n.id === selectedRef.current ? 11 : 5.2;
          if (since >= 0 && since < FLASH_MS) {
            const k = 1 - since / FLASH_MS;
            color.lerp(SPIKE, k);
            s += 4 * k;
          }
          col.setXYZ(i, color.r, color.g, color.b);
          size.setX(i, s);
        }
        col.needsUpdate = true;
        size.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointerdown", down);
      dom.removeEventListener("pointermove", move);
      dom.removeEventListener("pointerup", up);
      dom.removeEventListener("wheel", wheel);
      renderer.dispose();
      container.removeChild(dom);
      three.current = null;
    };
  }, []);

  // neuron geometry, rebuilt only when the population changes
  const count = neurons.length;
  const firstId = neurons[0]?.id;
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    if (t.points) {
      t.group.remove(t.points);
      t.points.geometry.dispose();
    }
    if (!count) return;
    const pos = new Float32Array(count * 3);
    neuronsRef.current.forEach((n, i) => pos.set([n.x, n.y, n.z], i * 3));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(count).fill(5.2), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: dotTexture() } },
      vertexShader: `
        attribute float size; attribute vec3 color; varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map; varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          if (tex.a < 0.5) discard;
          gl_FragColor = vec4(vColor, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    t.points = new THREE.Points(geo, mat);
    t.group.add(t.points);
  }, [count, firstId]);

  // synapses
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    if (t.lines) {
      t.group.remove(t.lines);
      t.lines.geometry.dispose();
      t.lines = undefined;
    }
    if (!showSynapses || !edges.length || !neurons.length) return;
    const byId = new Map(neurons.map((n) => [n.id, n]));
    const pos: number[] = [];
    const col: number[] = [];
    const maxW = Math.max(...edges.map((e) => e.weight), 1e-6);
    const c = new THREE.Color();
    for (const e of edges) {
      const a = byId.get(e.source);
      const b = byId.get(e.target);
      if (!a || !b) continue;
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      // stronger synapses are drawn darker
      c.set("#ffffff").lerp(e.is_exc ? EXC : INH, 0.1 + 0.35 * (e.weight / maxW));
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    t.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true }));
    t.group.add(t.lines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, showSynapses, count, firstId]);

  // connections of the selected neuron
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    if (t.highlight) {
      t.group.remove(t.highlight);
      t.highlight.geometry.dispose();
      t.highlight = undefined;
    }
    if (selectedId === null) return;
    const byId = new Map(neuronsRef.current.map((n) => [n.id, n]));
    const pos: number[] = [];
    const col: number[] = [];
    for (const e of edges) {
      if (e.source !== selectedId && e.target !== selectedId) continue;
      const a = byId.get(e.source);
      const b = byId.get(e.target);
      if (!a || !b) continue;
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const c = e.source === selectedId ? SPIKE : new THREE.Color("#231a3d");
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    if (!pos.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    t.highlight = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true }));
    t.group.add(t.highlight);
  }, [selectedId, edges]);

  useEffect(() => {
    const t = three.current;
    if (!t || resetToken === 0) return;
    t.camera.position.set(0, 40, 215);
    t.camera.lookAt(0, 0, 0);
    t.group.rotation.set(0, 0, 0);
  }, [resetToken]);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, touchAction: "none" }} />;
};
