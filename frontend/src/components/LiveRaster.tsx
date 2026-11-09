import React, { useEffect, useRef } from "react";
import { live } from "../services/live";

// Scrolling spike raster: one dot per spike reported by the backend.
// x = time (most recent at the right edge), y = neuron, excitatory rows on top.
export const LiveRaster: React.FC<{ className?: string; height?: number; isRunning: boolean }> = ({
  className = "strip-canvas",
  height,
  isRunning,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const n = live.numNeurons;
      const tEnd = live.latestT;
      const win = live.windowMs;
      const padY = 6;
      const plotH = h - padY * 2;

      // 50 ms time grid
      ctx.strokeStyle = "#ece4eb";
      ctx.lineWidth = 1;
      const first = Math.ceil((tEnd - win) / 50) * 50;
      for (let t = first; t <= tEnd; t += 50) {
        const x = Math.round(((t - (tEnd - win)) / win) * w) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      if (!n || live.events.length === 0) {
        ctx.fillStyle = "#8a7f98";
        ctx.font = "500 13px 'Public Sans', sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(
          runningRef.current ? "Network is running. No spikes in the last 250 ms." : "Simulation paused. Press Run to stream spikes from the network.",
          28,
          h / 2,
        );
        return;
      }

      // excitatory / inhibitory boundary
      const nExc = live.isExc.filter(Boolean).length;
      const yBoundary = padY + (nExc / n) * plotH;
      ctx.strokeStyle = "#ddd2dc";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(0, yBoundary + 0.5);
      ctx.lineTo(w, yBoundary + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      const dotW = Math.max(1.4, w / (win * 10)); // one 0.1 ms step, at least 1.4 px
      const dotH = Math.max(1.2, plotH / n);
      for (const [t, id] of live.events) {
        const x = ((t - (tEnd - win)) / win) * w;
        const y = padY + ((live.row[id] ?? id) / n) * plotH;
        ctx.fillStyle = live.isExc[id] ? "#4a3aa8" : "#c42f63";
        ctx.fillRect(x, y, dotW, dotH);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className={className} style={height ? { height } : undefined} aria-label="Live spike raster" role="img" />;
};
