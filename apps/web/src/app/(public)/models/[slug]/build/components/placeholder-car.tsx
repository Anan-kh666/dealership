"use client";

/* ------------------------------------------------------------------
 * Stylised stand-in for models without a real .glb (see models/README.md).
 * Shares the stage's motion state, so it drives in with rolling wheels,
 * fades between colours and lights up just like a real model.
 * ------------------------------------------------------------------ */

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { damp, useMotion } from "./motion";

interface PlaceholderCarProps {
  bodyHex: string;
  /** Visual variant for wheels — derived from trim level since the schema has no wheel entity. */
  wheelStyle: "standard" | "sport";
  /** Interior colour — visible through the glass as the seat tone. */
  interiorHex: string;
}

const WHEEL_X = 1.18;
const TRACK_Z = 0.74;

export function PlaceholderCar({
  bodyHex,
  wheelStyle,
  interiorHex,
}: PlaceholderCarProps): React.ReactElement {
  const sport = wheelStyle === "sport";
  const wheelRadius = sport ? 0.4 : 0.36;
  const rideHeight = sport ? 0.1 : 0.14;
  const motion = useMotion();

  const paint = React.useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: bodyHex,
        metalness: 0.6,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      }),
    // Created once; colour is eased in the frame loop below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const seats = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: interiorHex, roughness: 0.7 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const head = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#fff6e6", toneMapped: false }),
    [],
  );
  const tail = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5a0b0b", emissive: "#ff1a1a", toneMapped: false }),
    [],
  );
  React.useEffect(
    () => () => {
      for (const m of [paint, seats, head, tail]) m.dispose();
    },
    [paint, seats, head, tail],
  );

  const bodyTarget = React.useMemo(() => new THREE.Color(), []);
  const seatTarget = React.useMemo(() => new THREE.Color(), []);
  const wheels = React.useRef<(THREE.Group | null)[]>([]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const m = motion.current;
    const k = damp(7, dt);
    paint.color.lerp(bodyTarget.set(bodyHex), k);
    seats.color.lerp(seatTarget.set(interiorHex), k);
    head.emissiveIntensity = 5 * m.lightsOn;
    tail.emissiveIntensity = 0.8 * m.lightsOn + 4 * m.braking;
    for (const w of wheels.current) if (w) w.rotation.z = -m.travel / wheelRadius;
  });

  return (
    <group>
      {/* Lower body */}
      <RoundedBox
        args={[3.4, 0.5, 1.5]}
        radius={0.1}
        smoothness={6}
        position={[0, wheelRadius + rideHeight + 0.1, 0]}
        material={paint}
      />

      {/* Glasshouse: pillars in paint, tinted glass inset */}
      <group position={[-0.12, wheelRadius + rideHeight + 0.56, 0]}>
        <RoundedBox args={[1.95, 0.46, 1.34]} radius={0.12} smoothness={6} material={paint} />
        <RoundedBox args={[1.99, 0.3, 1.36]} radius={0.08} smoothness={4} position={[0, 0.03, 0]}>
          <meshPhysicalMaterial
            color="#0d1014"
            metalness={0.1}
            roughness={0.05}
            transmission={0.15}
            transparent
            opacity={0.92}
          />
        </RoundedBox>
        <mesh position={[0.15, -0.08, 0]} material={seats}>
          <boxGeometry args={[1.2, 0.18, 1.0]} />
        </mesh>
      </group>

      {/* Lights */}
      {[TRACK_Z - 0.18, -(TRACK_Z - 0.18)].map((z) => (
        <React.Fragment key={z}>
          <mesh position={[1.7, wheelRadius + rideHeight + 0.2, z]} material={head}>
            <boxGeometry args={[0.02, 0.07, 0.34]} />
          </mesh>
          <mesh position={[-1.7, wheelRadius + rideHeight + 0.22, z]} material={tail}>
            <boxGeometry args={[0.02, 0.06, 0.38]} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Wheels — the outer group holds position, the inner one rolls. */}
      {WHEEL_POSITIONS.map(([x, side], i) => (
        <group key={`${x}-${side}`} position={[x, wheelRadius, side * TRACK_Z]}>
          <group
            ref={(g) => {
              wheels.current[i] = g;
            }}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[wheelRadius, wheelRadius, 0.3, 40]} />
              <meshStandardMaterial color="#151515" roughness={0.9} />
            </mesh>
            {/* Spoked rim so the rotation reads */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.151]}>
              <cylinderGeometry
                args={[wheelRadius * 0.68, wheelRadius * 0.68, 0.01, sport ? 10 : 5]}
              />
              <meshStandardMaterial
                color={sport ? "#2b2b2b" : "#c9c9c9"}
                metalness={0.9}
                roughness={0.25}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

const WHEEL_POSITIONS: [number, 1 | -1][] = [
  [-WHEEL_X, 1],
  [WHEEL_X, 1],
  [-WHEEL_X, -1],
  [WHEEL_X, -1],
];
