"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function CoreSystem() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);
  const nodes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius = 1.72 + (index % 3) * 0.18;
        return {
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle * 1.7) * 0.22,
            Math.sin(angle) * radius,
          ),
          scale: 0.03 + (index % 4) * 0.006,
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = time * 0.22;
      group.current.rotation.x = Math.sin(time * 0.35) * 0.08;
    }
    if (core.current) {
      core.current.rotation.x = time * 0.34;
      core.current.rotation.y = time * 0.48;
    }
    if (ringA.current) ringA.current.rotation.z = time * 0.36;
    if (ringB.current) ringB.current.rotation.x = Math.PI / 2 + time * 0.24;
    if (ringC.current) ringC.current.rotation.y = Math.PI / 2 - time * 0.28;
  });

  return (
    <group ref={group} scale={0.88}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.92, 2]} />
        <meshStandardMaterial
          color="#8eefff"
          emissive="#2fd7ff"
          emissiveIntensity={0.42}
          roughness={0.18}
          metalness={0.52}
        />
      </mesh>
      <mesh scale={1.05}>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.18} />
      </mesh>
      <mesh ref={ringA} rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
        <torusGeometry args={[1.42, 0.014, 32, 256]} />
        <meshBasicMaterial color="#53f4ff" transparent opacity={0.92} depthWrite={false} />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 2, 0.5, 0.1]} renderOrder={2}>
        <torusGeometry args={[1.68, 0.011, 32, 256]} />
        <meshBasicMaterial color="#8b7cff" transparent opacity={0.78} depthWrite={false} />
      </mesh>
      <mesh ref={ringC} rotation={[0.18, Math.PI / 2, 0.18]} renderOrder={2}>
        <torusGeometry args={[1.78, 0.01, 32, 256]} />
        <meshBasicMaterial color="#ff65dd" transparent opacity={0.65} depthWrite={false} />
      </mesh>
      {nodes.map((node, index) => (
        <mesh key={index} position={node.position} scale={node.scale} renderOrder={1}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={index % 2 ? "#9ca8ff" : "#54f4ff"}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

export function HeroVisual() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        WebkitMaskImage:
          "radial-gradient(ellipse 72% 68% at 50% 48%, #000 42%, transparent 78%)",
        maskImage:
          "radial-gradient(ellipse 72% 68% at 50% 48%, #000 42%, transparent 78%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(83,244,255,0.1),transparent_58%)]" />
      <Canvas
        camera={{ position: [0, 0.12, 6.4], fov: 34 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 4, 4]} intensity={3.2} color="#63f7ff" />
        <pointLight position={[-4, -2, 3]} intensity={1.4} color="#ad78ff" />
        <CoreSystem />
      </Canvas>
    </div>
  );
}
