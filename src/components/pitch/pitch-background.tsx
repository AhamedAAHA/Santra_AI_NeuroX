"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import "@/components/pitch/pitch-theme.css";

export type PitchMood = "calm" | "signal" | "celebrate";

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function unitRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Signal Constellation — cyan nodes + thin links, slow drift across the full field.
 */
function ConstellationField({ intensity = 1 }: { intensity?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, linePositions } = useMemo(() => {
    const count = 72;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < count; i += 1) {
      const shell = 0.5 + unitRandom(i * 5 + 1) * 0.5;
      const r = (2.2 + unitRandom(i * 5 + 2) * 4.6) * shell;
      const theta = unitRandom(i * 5 + 3) * Math.PI * 2;
      const phi = Math.acos(2 * unitRandom(i * 5 + 4) - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.72;
      const z = r * Math.cos(phi) * 0.95;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      points.push(new THREE.Vector3(x, y, z));

      const hub = i % 6 === 0;
      const mid = i % 3 === 0;
      colors[i * 3] = hub ? 0.38 : mid ? 0.22 : 0.12;
      colors[i * 3 + 1] = hub ? 0.72 : mid ? 0.62 : 0.52;
      colors[i * 3 + 2] = hub ? 0.82 : mid ? 0.72 : 0.62;
    }

    const connections: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const dists: Array<{ j: number; d: number }> = [];
      for (let j = 0; j < count; j += 1) {
        if (i === j) continue;
        const d = points[i]!.distanceTo(points[j]!);
        if (d < 2.85) dists.push({ j, d });
      }
      dists.sort((a, b) => a.d - b.d);
      for (const n of dists.slice(0, 3)) {
        if (n.j < i) continue;
        connections.push(
          points[i]!.x,
          points[i]!.y,
          points[i]!.z,
          points[n.j]!.x,
          points[n.j]!.y,
          points[n.j]!.z,
        );
      }
    }

    return {
      positions,
      colors,
      linePositions: new Float32Array(connections),
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.032 * intensity;
      groupRef.current.rotation.x = Math.sin(t * 0.16) * 0.06;
      groupRef.current.rotation.z = Math.cos(t * 0.12) * 0.025;
    }
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.1 + Math.sin(t * 0.5) * 0.03;
    }
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.45 + Math.sin(t * 0.38) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[0.15, 0.05, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          vertexColors
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

function ConstellationFallback({ mood }: { mood: PitchMood }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: `${5 + unitRandom(i * 3 + 1) * 90}%`,
        top: `${8 + unitRandom(i * 3 + 2) * 78}%`,
        size: unitRandom(i * 3 + 3) > 0.82 ? 3.2 : unitRandom(i * 7) > 0.55 ? 2 : 1.4,
        opacity: 0.2 + unitRandom(i * 11) * 0.4,
      })),
    [],
  );

  const links = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        left: `${10 + unitRandom(i * 13 + 1) * 70}%`,
        top: `${15 + unitRandom(i * 13 + 2) * 60}%`,
        width: 40 + unitRandom(i * 13 + 3) * 90,
        rotate: -35 + unitRandom(i * 13 + 4) * 70,
        opacity: 0.12 + unitRandom(i * 17) * 0.14,
      })),
    [],
  );

  return (
    <div
      className={cn(
        "absolute inset-0",
        mood === "celebrate" ? "opacity-55" : mood === "signal" ? "opacity-45" : "opacity-35",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_30%,rgba(34,211,238,0.08),transparent_48%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_70%,rgba(56,189,248,0.05),transparent_45%)]" />
      {links.map((l, i) => (
        <span
          key={`l-${i}`}
          className="absolute h-px origin-left bg-gradient-to-r from-cyan-300/50 via-sky-300/25 to-transparent"
          style={{
            left: l.left,
            top: l.top,
            width: l.width,
            opacity: l.opacity * 0.6,
            transform: `rotate(${l.rotate}deg)`,
          }}
        />
      ))}
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-cyan-300"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            opacity: d.opacity * 0.7,
            boxShadow: "0 0 6px rgba(56,189,248,0.3)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Pitch background — Signal Constellation only.
 */
export function PitchBackground({
  mood = "calm",
}: {
  mood?: PitchMood;
}) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const webglOk = useSyncExternalStore(
    () => () => {},
    canUseWebGL,
    () => false,
  );
  const enabled3d = webglOk && !reducedMotion;

  const fieldOpacity =
    mood === "celebrate"
      ? "opacity-[0.48]"
      : mood === "signal"
        ? "opacity-[0.4]"
        : "opacity-[0.32]";
  const fieldIntensity = mood === "celebrate" ? 1.15 : mood === "signal" ? 1 : 0.85;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#020617]" />

      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          mood === "celebrate" ? "opacity-50" : "opacity-40",
        )}
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 72% 26%, rgba(34,211,238,0.1), transparent 44%), radial-gradient(ellipse at 18% 62%, rgba(56,189,248,0.06), transparent 42%), radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.03), transparent 55%)",
        }}
      />

      {enabled3d ? (
        <div className={cn("absolute inset-0 transition-opacity duration-700", fieldOpacity)}>
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 0.15, 8.8], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.5} />
            <ConstellationField intensity={fieldIntensity} />
          </Canvas>
        </div>
      ) : (
        <ConstellationFallback mood={mood} />
      )}

      {/* Readability veil — soft center darkening for slide content */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(2,6,23,0.68) 0%, rgba(2,6,23,0.3) 48%, rgba(2,6,23,0.1) 72%, transparent 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#020617]/85 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#020617]/85 to-transparent" />
    </div>
  );
}
