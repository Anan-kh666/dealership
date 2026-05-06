"use client";

/* ------------------------------------------------------------------
 * TODO: replace placeholder geometry with real GLB asset.
 *
 * Each model should ship its own glTF body at /public/models/{slug}.glb,
 * loaded via useGLTF from @react-three/drei:
 *
 *   const { scene } = useGLTF(`/models/${modelSlug}.glb`);
 *
 * Materials inside the GLB should expose a "Body" mesh whose material
 * accepts a colour override (the configurator binds bodyHex to it). Wheels
 * should be separate sub-meshes so they can be swapped per trim.
 * ------------------------------------------------------------------ */

import * as React from "react";
import * as THREE from "three";

interface PlaceholderCarProps {
  bodyHex: string;
  /** Visual variant for wheels — derived from trim level since the schema has no wheel entity. */
  wheelStyle: "standard" | "sport";
  /** Interior accent — shown as a thin band on the side. */
  interiorHex: string;
}

export function PlaceholderCar({
  bodyHex,
  wheelStyle,
  interiorHex,
}: PlaceholderCarProps): React.ReactElement {
  const wheelRadius = wheelStyle === "sport" ? 0.42 : 0.36;
  const wheelSegments = wheelStyle === "sport" ? 32 : 16;
  const wheelColor = wheelStyle === "sport" ? "#1a1a1a" : "#2a2a2a";

  return (
    <group position={[0, -0.2, 0]}>
      {/* Lower body */}
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[3.2, 0.55, 1.4]} />
        <meshStandardMaterial
          color={bodyHex}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>
      {/* Cabin / greenhouse */}
      <mesh castShadow receiveShadow position={[0.05, 0.95, 0]}>
        <boxGeometry args={[1.85, 0.6, 1.25]} />
        <meshStandardMaterial
          color={bodyHex}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
      {/* Window band — frosted glass-ish */}
      <mesh position={[0.05, 1.0, 0]}>
        <boxGeometry args={[1.7, 0.35, 1.27]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.2}
          roughness={0.05}
          opacity={0.85}
          transparent
        />
      </mesh>
      {/* Side accent band — shows interior colour subtly */}
      <mesh position={[0, 0.25, 0.71]}>
        <boxGeometry args={[3.0, 0.04, 0.005]} />
        <meshStandardMaterial color={interiorHex} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.25, -0.71]}>
        <boxGeometry args={[3.0, 0.04, 0.005]} />
        <meshStandardMaterial color={interiorHex} roughness={0.6} />
      </mesh>

      {/* Wheels */}
      {wheelPositions.map(([x, z], i) => (
        <group key={i} position={[x, wheelRadius, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry
              args={[wheelRadius, wheelRadius, 0.28, wheelSegments]}
            />
            <meshStandardMaterial color={wheelColor} roughness={0.85} />
          </mesh>
          {/* Hub cap */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.145]}>
            <cylinderGeometry
              args={[wheelRadius * 0.55, wheelRadius * 0.55, 0.02, wheelSegments]}
            />
            <meshStandardMaterial
              color="#cfcfcf"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
        </group>
      ))}

      {/* Ground shadow plane (subtle) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[7, 4]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </group>
  );
}

const wheelPositions: [number, number][] = [
  [-1.15, 0.7],
  [1.15, 0.7],
  [-1.15, -0.7],
  [1.15, -0.7],
];

// Avoid an unused-import warning: THREE is referenced via the JSX namespace
// only, but keeping the explicit import makes type augmentation discoverable.
void THREE;
