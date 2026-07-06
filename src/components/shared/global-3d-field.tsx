"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { useSettings } from "@/settings/settings-context";

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function IntelligenceField() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const nodes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const angle = (index / 28) * Math.PI * 2;
        const band = index % 4;
        const radius = 2.6 + band * 0.42;
        return {
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle * 1.9) * 0.75,
            Math.sin(angle) * radius,
          ),
          scale: 0.018 + band * 0.006,
          color: band % 2 ? "#9b8cff" : "#67f6ff",
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.045;
      groupRef.current.rotation.x = Math.sin(time * 0.18) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.065;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.16) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[3.2, -0.4, 0]} rotation={[0.15, -0.25, 0]}>
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.05, 0.008, 10, 180]} />
          <meshBasicMaterial color="#70f4ff" transparent opacity={0.28} />
        </mesh>
        <mesh rotation={[1.3, 0.35, 0.2]}>
          <torusGeometry args={[3.75, 0.006, 10, 180]} />
          <meshBasicMaterial color="#9b7cff" transparent opacity={0.2} />
        </mesh>
        <mesh rotation={[1.9, -0.2, -0.35]}>
          <torusGeometry args={[4.35, 0.004, 10, 180]} />
          <meshBasicMaterial color="#ff6dde" transparent opacity={0.13} />
        </mesh>
      </group>
      <mesh>
        <icosahedronGeometry args={[0.58, 1]} />
        <meshBasicMaterial color="#6beeff" wireframe transparent opacity={0.22} />
      </mesh>
      {nodes.map((node, index) => (
        <mesh key={index} position={node.position} scale={node.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.58} />
        </mesh>
      ))}
    </group>
  );
}

export function Global3DField() {
  const { settings } = useSettings();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);

  if (reducedMotion || !settings.experience.animations || !settings.experience.particleBackground) return null;

  return (
    <div className="global-3d-field pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-50" aria-hidden>
      <Canvas
        camera={{ position: [0, 0.2, 9], fov: 34 }}
        dpr={[1, 1.2]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          gl.setClearAlpha(0);
          scene.background = null;
        }}
      >
        <pointLight position={[3.5, 4, 3]} intensity={2.3} color="#67f6ff" />
        <pointLight position={[-3, -2, 2]} intensity={0.9} color="#a071ff" />
        <IntelligenceField />
      </Canvas>
    </div>
  );
}
