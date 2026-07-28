"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";

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

/** Deterministic 0..1 hash so the field is stable across renders. */
function unitRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function NetworkField({ intensity = 1 }: { intensity?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { positions, colors, linePositions } = useMemo(() => {
    const count = 56;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < count; i += 1) {
      const r = 2.2 + unitRandom(i * 3 + 1) * 4.8;
      const theta = unitRandom(i * 3 + 2) * Math.PI * 2;
      const phi = Math.acos(2 * unitRandom(i * 3 + 3) - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      const z = r * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      points.push(new THREE.Vector3(x, y, z));

      const cyan = i % 3 !== 0;
      colors[i * 3] = cyan ? 0.4 : 0.62;
      colors[i * 3 + 1] = cyan ? 0.92 : 0.55;
      colors[i * 3 + 2] = cyan ? 1 : 1;
    }

    const connections: number[] = [];
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        if (points[i]!.distanceTo(points[j]!) < 2.35) {
          connections.push(
            points[i]!.x,
            points[i]!.y,
            points[i]!.z,
            points[j]!.x,
            points[j]!.y,
            points[j]!.z,
          );
        }
      }
    }

    return {
      positions,
      colors,
      linePositions: new Float32Array(connections),
    };
  }, []);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04 * intensity + pointer.x * 0.12;
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.08 + pointer.y * 0.08;
    }
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.12 + Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#67e8f9" transparent opacity={0.14} depthWrite={false} />
      </lineSegments>
      <mesh>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.14} />
      </mesh>
      <mesh rotation={[0.4, 0.2, 0.1]}>
        <torusGeometry args={[2.6, 0.008, 12, 160]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.22} />
      </mesh>
      <mesh rotation={[1.2, -0.3, 0.4]}>
        <torusGeometry args={[3.4, 0.005, 12, 180]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

export function PitchBackground({ intensity = 1 }: { intensity?: number }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const webglOk = useSyncExternalStore(
    () => () => {},
    canUseWebGL,
    () => false,
  );
  const enabled = webglOk && !reducedMotion;

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050816]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(34,211,238,0.14),transparent_50%),radial-gradient(ellipse_at_80%_70%,rgba(139,92,246,0.16),transparent_55%),radial-gradient(ellipse_at_50%_100%,rgba(6,182,212,0.08),transparent_45%)]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(103,232,249,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      {enabled ? (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 8.5], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.4} />
          <NetworkField intensity={intensity} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.12),transparent_55%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-[#050816]/40" />
    </div>
  );
}
