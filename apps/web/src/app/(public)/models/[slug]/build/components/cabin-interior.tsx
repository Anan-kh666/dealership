"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { damp } from "./motion";

/**
 * Cabin volume in the car's normalised frame (nose → +X, lateral → Z,
 * wheels on y = 0). Derived from the cabin glass and tunable per model.
 */
export interface CabinSpec {
  /** Rear and front ends of the greenhouse (x). Front = windscreen base. */
  x0: number;
  x1: number;
  /** Inner cabin width (z extent). */
  width: number;
  /** Window line (bottom of the side glass) and roof height (y). */
  belt: number;
  roof: number;
  /** Seat rows: 1 for coupés, 2 for saloons / SUVs. */
  rows: 1 | 2;
}

/**
 * Vertical layout from the window line, in units of the greenhouse height H
 * (belt → roof). Real cars: seat cushion ≈ 0.4 m and floor ≈ 0.75 m below
 * the sill, greenhouse ≈ 0.45 m tall.
 */
export function cabinLevels(c: Pick<CabinSpec, "belt" | "roof">): {
  H: number;
  floor: number;
  cushionTop: number;
} {
  const H = Math.max(0.2, c.roof - c.belt);
  return {
    H,
    floor: Math.max(0.24, c.belt - 1.65 * H),
    cushionTop: Math.max(0.42, c.belt - 0.95 * H),
  };
}

/** Driver sits on the right: Malaysian market, right-hand drive. */
const DRIVER_Z = 1; // +Z is the car's right side

/* ------------------------------------------------------------------ */
/* Generated textures (no downloads, nothing trademarked)              */
/* ------------------------------------------------------------------ */

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!];
}

/** Fine pebbled leather grain, used as a bump map. */
function leatherGrain(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // Soften into pebbles.
  g.filter = "blur(1.2px)";
  g.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  return t;
}

/** Diamond quilting with stitch lines for seat inserts, as a bump map. */
function quilting(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#9a9a9a";
  g.fillRect(0, 0, 256, 256);
  const step = 64;
  for (let y = -step; y < 256 + step; y += step) {
    for (let x = -step; x < 256 + step; x += step) {
      // Each diamond puffs up towards its centre.
      const grd = g.createRadialGradient(x + step / 2, y + step / 2, 2, x + step / 2, y + step / 2, step * 0.62);
      grd.addColorStop(0, "#d8d8d8");
      grd.addColorStop(1, "#7a7a7a");
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(x + step / 2, y);
      g.lineTo(x + step, y + step / 2);
      g.lineTo(x + step / 2, y + step);
      g.lineTo(x, y + step / 2);
      g.closePath();
      g.fill();
    }
  }
  // Stitch seams.
  g.strokeStyle = "#3a3a3a";
  g.lineWidth = 3;
  for (let k = -256; k < 512; k += step) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 256, 256); g.stroke();
    g.beginPath(); g.moveTo(k, 256); g.lineTo(k + 256, 0); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 3);
  return t;
}

/** Generic infotainment screen: map tiles, media card, climate bar. */
function infotainment(): THREE.CanvasTexture {
  const [c, g] = canvas(512, 288);
  const bg = g.createLinearGradient(0, 0, 0, 288);
  bg.addColorStop(0, "#0d1520");
  bg.addColorStop(1, "#070a0f");
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 288);
  // Map panel with a route.
  g.fillStyle = "#121c28";
  g.fillRect(16, 16, 300, 220);
  g.strokeStyle = "#1e2d3e";
  g.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    g.beginPath(); g.moveTo(16, 30 + i * 24); g.lineTo(316, 20 + i * 26); g.stroke();
    g.beginPath(); g.moveTo(30 + i * 34, 16); g.lineTo(40 + i * 30, 236); g.stroke();
  }
  g.strokeStyle = "#3aa0ff";
  g.lineWidth = 5;
  g.beginPath(); g.moveTo(60, 220); g.bezierCurveTo(120, 160, 160, 170, 210, 110); g.lineTo(280, 50); g.stroke();
  g.fillStyle = "#ffffff";
  g.beginPath(); g.arc(60, 220, 7, 0, Math.PI * 2); g.fill();
  // Media card.
  g.fillStyle = "#162231";
  g.fillRect(332, 16, 164, 104);
  g.fillStyle = "#c79a5b";
  g.fillRect(344, 30, 56, 56);
  g.fillStyle = "#cfd6de";
  g.fillRect(410, 38, 70, 8);
  g.fillStyle = "#6c7a8a";
  g.fillRect(410, 54, 50, 6);
  g.fillStyle = "#3aa0ff";
  g.fillRect(344, 100, 100, 4);
  // Climate / shortcut bar.
  g.fillStyle = "#101823";
  g.fillRect(0, 248, 512, 40);
  g.fillStyle = "#cfd6de";
  g.font = "bold 18px sans-serif";
  g.fillText("22°", 20, 275);
  g.fillText("22°", 456, 275);
  for (let i = 0; i < 5; i++) {
    g.fillStyle = i === 1 ? "#3aa0ff" : "#2a3846";
    g.fillRect(110 + i * 62, 258, 44, 20);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Digital instrument cluster: two rings and a centre readout. */
function cluster(): THREE.CanvasTexture {
  const [c, g] = canvas(512, 160);
  g.fillStyle = "#06080b";
  g.fillRect(0, 0, 512, 160);
  const ring = (x: number, frac: number, color: string): void => {
    g.lineWidth = 8;
    g.strokeStyle = "#1a2230";
    g.beginPath(); g.arc(x, 82, 58, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
    g.strokeStyle = color;
    g.beginPath(); g.arc(x, 82, 58, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * frac)); g.stroke();
  };
  ring(100, 0.32, "#3aa0ff");
  ring(412, 0.68, "#c79a5b");
  g.fillStyle = "#e6ebf0";
  g.font = "bold 44px sans-serif";
  g.textAlign = "center";
  g.fillText("0", 256, 92);
  g.font = "16px sans-serif";
  g.fillStyle = "#7d8a99";
  g.fillText("km/h", 256, 116);
  g.fillText("P  R  N  D", 256, 146);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

interface CabinMaterials {
  leather: THREE.MeshPhysicalMaterial;
  quilted: THREE.MeshPhysicalMaterial;
  softTouch: THREE.MeshStandardMaterial;
  pianoBlack: THREE.MeshPhysicalMaterial;
  aluminium: THREE.MeshStandardMaterial;
  carpet: THREE.MeshStandardMaterial;
  screen: THREE.MeshStandardMaterial;
  cluster: THREE.MeshStandardMaterial;
  ambient: THREE.MeshStandardMaterial;
}

function useCabinMaterials(): CabinMaterials {
  const mats = React.useMemo<CabinMaterials>(() => {
    const grain = leatherGrain();
    const quilt = quilting();
    const leather = new THREE.MeshPhysicalMaterial({
      color: "#262626",
      roughness: 0.55,
      sheen: 0.25,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#d9d2c8"),
      bumpMap: grain,
      bumpScale: 0.6,
    });
    const quilted = leather.clone();
    quilted.bumpMap = quilt;
    quilted.bumpScale = 2.2;
    return {
      leather,
      quilted,
      softTouch: new THREE.MeshStandardMaterial({ color: "#1c1d1f", roughness: 0.82, bumpMap: grain, bumpScale: 0.25 }),
      pianoBlack: new THREE.MeshPhysicalMaterial({ color: "#050506", roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04 }),
      aluminium: new THREE.MeshStandardMaterial({ color: "#b8bcc1", metalness: 1, roughness: 0.32 }),
      carpet: new THREE.MeshStandardMaterial({ color: "#1d1d1e", roughness: 1 }),
      screen: new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: infotainment(), emissiveIntensity: 0.9, roughness: 0.15 }),
      cluster: new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: cluster(), emissiveIntensity: 0.9, roughness: 0.15 }),
      ambient: new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#c79a5b", emissiveIntensity: 2, toneMapped: false }),
    };
  }, []);

  React.useEffect(
    () => () => {
      for (const m of Object.values(mats)) {
        for (const tex of [m.map, m.bumpMap, m.emissiveMap]) tex?.dispose();
        m.dispose();
      }
    },
    [mats],
  );
  return mats;
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function Seat({
  mats,
  width,
  scale,
  bench = false,
}: {
  mats: CabinMaterials;
  width: number;
  /** Size of a person-sized seat relative to a 0.42-unit-wide bucket. */
  scale: number;
  bench?: boolean;
}): React.ReactElement {
  // Height and depth follow the occupant (scale); only width varies.
  const s = scale;
  const cushionD = 0.42 * s;
  const backH = (bench ? 0.5 : 0.56) * s;
  const bolster = bench ? 0 : 0.055 * s;
  return (
    <group>
      {/* Cushion: insert + side bolsters */}
      <RoundedBox args={[cushionD, 0.1 * s, width - bolster * 2]} radius={0.035 * s} smoothness={4} position={[0, 0.05 * s, 0]} material={mats.quilted} />
      {bolster > 0
        ? [-1, 1].map((side) => (
            <RoundedBox
              key={side}
              args={[cushionD, 0.15 * s, bolster]}
              radius={0.025 * s}
              smoothness={4}
              position={[0, 0.07 * s, side * (width / 2 - bolster / 2)]}
              material={mats.leather}
            />
          ))
        : null}
      {/* Backrest, reclined ~18° */}
      <group position={[-cushionD / 2 + 0.04 * s, 0.08 * s, 0]} rotation={[0, 0, 0.32]}>
        <RoundedBox args={[0.1 * s, backH, width - bolster * 2]} radius={0.035 * s} smoothness={4} position={[0, backH / 2, 0]} material={mats.quilted} />
        {bolster > 0
          ? [-1, 1].map((side) => (
              <RoundedBox
                key={side}
                args={[0.16 * s, backH * 0.92, bolster]}
                radius={0.03 * s}
                smoothness={4}
                position={[0.02 * s, backH * 0.47, side * (width / 2 - bolster / 2)]}
                material={mats.leather}
              />
            ))
          : null}
        {/* Headrest(s) on posts */}
        {(bench ? [-0.32, 0, 0.32] : [0]).map((zf) => (
          <group key={zf} position={[0, backH + 0.07 * s, zf * width]}>
            <RoundedBox args={[0.09 * s, 0.16 * s, 0.24 * s]} radius={0.035 * s} smoothness={4} position={[0.01 * s, 0.05 * s, 0]} material={mats.leather} />
            {[-0.06, 0.06].map((pz) => (
              <mesh key={pz} position={[0, -0.04 * s, pz * s]} material={mats.aluminium}>
                <cylinderGeometry args={[0.006 * s, 0.006 * s, 0.08 * s, 8]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

function SteeringWheel({ mats, radius }: { mats: CabinMaterials; radius: number }): React.ReactElement {
  return (
    <group>
      <mesh material={mats.leather} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius, radius * 0.11, 16, 48]} />
      </mesh>
      {/* Three spokes */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
        <mesh key={a} material={mats.softTouch} rotation={[a + Math.PI / 2, 0, 0]} position={[0, Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5]}>
          <boxGeometry args={[radius * 0.08, radius * 0.95, radius * 0.18]} />
        </mesh>
      ))}
      {/* Hub */}
      <mesh material={mats.pianoBlack} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.32, radius * 0.32, radius * 0.18, 32]} />
      </mesh>
      <mesh material={mats.aluminium} position={[radius * 0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.12, radius * 0.12, 0.004, 24]} />
      </mesh>
      {/* Column */}
      <mesh material={mats.softTouch} position={[-radius * 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.12, radius * 0.16, radius * 1.1, 16]} />
      </mesh>
    </group>
  );
}

export function CabinInterior({
  cabin,
  interiorHex,
}: {
  cabin: CabinSpec;
  interiorHex: string;
}): React.ReactElement {
  const mats = useCabinMaterials();

  // Ease the leather towards the selected interior colour.
  const target = React.useMemo(() => new THREE.Color(interiorHex), [interiorHex]);
  React.useLayoutEffect(() => {
    mats.leather.color.copy(target);
    mats.quilted.color.copy(target);
    // Run once: later changes ease in below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mats]);
  useFrame((_, dt) => {
    const k = damp(7, Math.min(dt, 0.1));
    mats.leather.color.lerp(target, k);
    mats.quilted.color.lerp(target, k);
  });

  const { x0, x1, width, belt, roof, rows } = cabin;
  const L = x1 - x0;
  const { H, floor, cushionTop } = cabinLevels(cabin);
  const seatW = width * 0.36;
  // Person-sized seats, capped so the headrest clears the roof lining.
  const seatScale = Math.min(seatW / 0.42, (roof - 0.07 - cushionTop) / 0.76);
  const dashRear = x1 - 0.1 * L; // driver-facing edge of the dashboard
  const frontSeatX = x1 - (rows === 2 ? 0.42 : 0.5) * L;
  const rearSeatX = x1 - 0.8 * L;
  const seatZ = width * 0.24;

  return (
    <group name="CabinInterior">
      {/* Carpet */}
      <mesh position={[(x0 + x1) / 2, floor, 0]} rotation-x={-Math.PI / 2} material={mats.carpet}>
        <planeGeometry args={[L * 1.05, width]} />
      </mesh>

      {/* Front seats */}
      {[-1, 1].map((side) => (
        <group key={side} position={[frontSeatX, cushionTop - 0.1 * seatScale, side * seatZ]}>
          <Seat mats={mats} width={seatW} scale={seatScale} />
        </group>
      ))}

      {/* Rear bench */}
      {rows === 2 ? (
        <group position={[rearSeatX, cushionTop - 0.08, 0]}>
          <Seat mats={mats} width={width * 0.86} scale={seatScale * 0.95} bench />
        </group>
      ) : null}

      {/* Centre console with armrest and gear selector */}
      <group position={[(dashRear + frontSeatX) / 2 + 0.05, floor, 0]}>
        <RoundedBox args={[dashRear - frontSeatX + 0.12, (cushionTop - floor) * 0.9, width * 0.16]} radius={0.03} smoothness={4} position={[0, (cushionTop - floor) * 0.45, 0]} material={mats.softTouch} />
        <RoundedBox args={[0.22, 0.05, width * 0.17]} radius={0.02} smoothness={4} position={[-(dashRear - frontSeatX) / 2 + 0.05, (cushionTop - floor) * 0.92, 0]} material={mats.leather} />
        <RoundedBox args={[0.16, 0.012, width * 0.1]} radius={0.004} smoothness={2} position={[(dashRear - frontSeatX) / 4, (cushionTop - floor) * 0.91, 0]} material={mats.pianoBlack} />
        <mesh position={[(dashRear - frontSeatX) / 4, (cushionTop - floor) * 0.91 + 0.04, 0]} material={mats.aluminium}>
          <cylinderGeometry args={[0.018, 0.024, 0.07, 20]} />
        </mesh>
      </group>

      {/* Dashboard */}
      <group>
        <RoundedBox args={[x1 - dashRear + 0.12, H * 0.42, width]} radius={0.05} smoothness={5} position={[dashRear + (x1 - dashRear) / 2 - 0.02, belt - H * 0.12, 0]} material={mats.softTouch} />
        {/* Piano-black centre stack */}
        <RoundedBox args={[0.05, H * 0.5, width * 0.2]} radius={0.015} smoothness={3} position={[dashRear - 0.01, belt - H * 0.42, 0]} material={mats.pianoBlack} />
        {/* Brushed trim strip + ambient light line */}
        <mesh position={[dashRear - 0.012, belt - H * 0.05, 0]} material={mats.aluminium}>
          <boxGeometry args={[0.012, 0.014, width * 0.94]} />
        </mesh>
        <mesh position={[dashRear - 0.014, belt - H * 0.1, 0]} material={mats.ambient}>
          <boxGeometry args={[0.004, 0.004, width * 0.9]} />
        </mesh>
        {/* Floating infotainment screen */}
        <group position={[dashRear + 0.02, belt + H * 0.2, 0]} rotation={[0, 0, -0.14]}>
          <RoundedBox args={[0.02, H * 0.42, width * 0.3]} radius={0.008} smoothness={3} material={mats.pianoBlack} />
          <mesh position={[-0.011, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.screen}>
            <planeGeometry args={[width * 0.28, H * 0.38]} />
          </mesh>
        </group>
        {/* Instrument cluster behind the wheel */}
        <group position={[dashRear + 0.04, belt + H * 0.1, DRIVER_Z * seatZ]} rotation={[0, 0, -0.2]}>
          <RoundedBox args={[0.03, H * 0.28, width * 0.26]} radius={0.01} smoothness={3} material={mats.pianoBlack} />
          <mesh position={[-0.016, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.cluster}>
            <planeGeometry args={[width * 0.24, H * 0.24]} />
          </mesh>
        </group>
        {/* Air vents */}
        {[-0.42, -0.1, 0.1, 0.42].map((zf) => (
          <RoundedBox key={zf} args={[0.015, H * 0.07, width * 0.1]} radius={0.006} smoothness={2} position={[dashRear - 0.012, belt - H * 0.22, zf * width]} material={mats.pianoBlack} />
        ))}
      </group>

      {/* Steering wheel (right-hand drive) */}
      <group position={[dashRear - 0.14, belt - H * 0.02, DRIVER_Z * seatZ]} rotation={[0, 0, -0.42]}>
        <SteeringWheel mats={mats} radius={0.17 * (width / 1.3)} />
      </group>

      {/* Door cards with armrests */}
      {[-1, 1].map((side) => (
        <group key={side} position={[(x0 + x1) / 2 + 0.05 * L, (floor + belt) / 2, side * (width / 2 - 0.015)]}>
          <RoundedBox args={[L * 0.82, belt - floor, 0.03]} radius={0.012} smoothness={3} material={mats.softTouch} />
          <RoundedBox args={[L * 0.5, 0.04, 0.07]} radius={0.015} smoothness={3} position={[0.05 * L, (belt - floor) * 0.08, -side * 0.035]} material={mats.leather} />
          <mesh position={[0.05 * L, (belt - floor) * 0.36, -side * 0.017]} material={mats.aluminium}>
            <boxGeometry args={[L * 0.6, 0.008, 0.004]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
