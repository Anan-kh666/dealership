"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { PlaceholderCar } from "./placeholder-car";

interface PreviewCanvasProps {
  bodyHex: string;
  interiorHex: string;
  wheelStyle: "standard" | "sport";
}

export default function PreviewCanvas({
  bodyHex,
  interiorHex,
  wheelStyle,
}: PreviewCanvasProps): React.ReactElement {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      camera={{ position: [3.6, 2.2, 4.4], fov: 35 }}
      style={{ background: "var(--color-surface-warm, #F8F6F2)" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[5, 6, 4]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment preset="studio" />
      <PlaceholderCar
        bodyHex={bodyHex}
        interiorHex={interiorHex}
        wheelStyle={wheelStyle}
      />
      <OrbitControls
        enablePan={false}
        enableZoom
        autoRotate={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.5}
        maxDistance={9}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
