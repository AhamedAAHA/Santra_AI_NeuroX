"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

// Pure canvas 2D — no WebGL, guaranteed transparent background
function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Node definitions — relative to canvas size
    const NODE_COUNT = 18;
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const layer = i % 3;
      const r = 0.25 + layer * 0.1;
      return {
        bx: 0.5 + Math.cos(angle) * r,
        by: 0.5 + Math.sin(angle) * r * 0.65,
        phase: i * 0.52,
        color: i % 3 === 0 ? "#53f4ff" : i % 3 === 1 ? "#a78bfa" : "#f472b6",
        size: 2.5 + layer * 1.2,
      };
    });

    // Inner hub nodes
    const hubNodes = Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      return {
        bx: 0.5 + Math.cos(angle) * 0.13,
        by: 0.5 + Math.sin(angle) * 0.085,
        phase: i * 1.1,
        color: "#53f4ff",
        size: 1.8,
      };
    });

    const allNodes = [...nodes, ...hubNodes];

    // Connection pairs
    const connections: Array<[number, number]> = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      connections.push([i, (i + 1) % NODE_COUNT]);
      if (i % 3 === 0) connections.push([i, (i + 6) % NODE_COUNT]);
      if (i < 6) connections.push([NODE_COUNT + i, i * 3]);
    }

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // Draw connections
      connections.forEach(([a, b]) => {
        const na = allNodes[a];
        const nb = allNodes[b];
        const ax = na.bx * W;
        const ay = na.by * H + Math.sin(t + na.phase) * H * 0.018;
        const bx = nb.bx * W;
        const by = nb.by * H + Math.sin(t + nb.phase) * H * 0.018;
        const alpha = 0.08 + Math.sin(t * 1.2 + na.phase) * 0.04;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(83,244,255,${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });

      // Draw nodes
      allNodes.forEach((n) => {
        const x = n.bx * W;
        const y = n.by * H + Math.sin(t * 1.6 + n.phase) * H * 0.018;
        const pulse = 0.85 + Math.sin(t * 2.2 + n.phase) * 0.15;
        const r = n.size * pulse;
        const alpha = 0.55 + Math.sin(t * 1.8 + n.phase) * 0.25;

        // Glow halo — use simple hardcoded rgba per color
        const glowColor =
          n.color === "#53f4ff"
            ? `rgba(83,244,255,${(alpha * 0.2).toFixed(2)})`
            : n.color === "#a78bfa"
              ? `rgba(167,139,250,${(alpha * 0.2).toFixed(2)})`
              : `rgba(244,114,182,${(alpha * 0.2).toFixed(2)})`;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(x, y, r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const dotColor =
          n.color === "#53f4ff"
            ? `rgba(83,244,255,${alpha.toFixed(2)})`
            : n.color === "#a78bfa"
              ? `rgba(167,139,250,${alpha.toFixed(2)})`
              : `rgba(244,114,182,${alpha.toFixed(2)})`;
        ctx.fillStyle = dotColor;
        ctx.fill();
      });

      // Central orb
      const cx = W * 0.5;
      const cy = H * 0.5;
      const orbR = Math.min(W, H) * 0.055;
      const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 3.5);
      orbGrad.addColorStop(0, "rgba(83,244,255,0.22)");
      orbGrad.addColorStop(0.45, "rgba(83,244,255,0.09)");
      orbGrad.addColorStop(1, "rgba(83,244,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(cx - orbR * 0.3, cy - orbR * 0.3, 0, cx, cy, orbR);
      coreGrad.addColorStop(0, "rgba(180,248,255,0.9)");
      coreGrad.addColorStop(0.6, "rgba(83,244,255,0.7)");
      coreGrad.addColorStop(1, "rgba(40,180,220,0.4)");
      ctx.fillStyle = coreGrad;
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ background: "transparent" }}
      aria-hidden
    />
  );
}

export function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
      {/* Very subtle radial atmosphere — low opacity */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(83,244,255,0.05) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 70% 70%, rgba(168,85,247,0.05) 0%, transparent 70%)",
        }}
      />
      {/* Faint grid */}
      <div className="intelligence-grid absolute inset-0 opacity-[0.12]" />
      {/* 2D Canvas neural animation — guaranteed transparent */}
      <NeuralCanvas />
      {/* Rotating outer orbital rings via CSS */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        {[
          { size: "55%", border: "rgba(83,244,255,0.14)", duration: 18, reverse: false },
          { size: "70%", border: "rgba(168,85,247,0.10)", duration: 24, reverse: true },
          { size: "85%", border: "rgba(244,114,182,0.07)", duration: 32, reverse: false },
        ].map((ring, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: ring.size,
              paddingBottom: ring.size,
              border: `1px solid ${ring.border}`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ rotate: ring.reverse ? -360 : 360 }}
            transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </motion.div>
    </div>
  );
}
