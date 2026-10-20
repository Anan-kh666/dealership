"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CameraControls,
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  PerformanceMonitor,
  useProgress,
} from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { CarAsset } from "@/lib/car-assets";
import { GltfCar, preloadCar } from "./gltf-car";
import { MotionProvider, useMotion } from "./motion";
import { PlaceholderCar } from "./placeholder-car";

export type PreviewStep = "trim" | "exterior" | "interior" | "options" | "summary";

interface PreviewCanvasProps {
  asset: CarAsset | null;
  step: PreviewStep;
  bodyHex: string;
  bodyMetallic: boolean;
  interiorHex: string;
  wheelStyle: "standard" | "sport";
}

/** Studio backdrop colour — the floor fades into it through fog. */
const STUDIO = "#ece8e1";
const HDRI = "/hdri/studio_small_09_1k.hdr";

/**
 * Configurator 3D stage.
 *
 * Rendering: photographed studio HDRI (Poly Haven, CC0) plus in-scene strip
 * lights for crisp paint reflections, a blurred reflective showroom floor,
 * contact shadows, ambient occlusion, bloom on the lamps, filmic tone mapping
 * and SMAA. Lower-powered devices get a lighter pipeline automatically.
 *
 * Motion: the car drives in (wheels rolling, brake lights on as it stops,
 * headlights wake), the camera follows the configurator step, doors open for
 * the interior, and the view slowly turns when idle. Reduced-motion users get
 * the final composition without the choreography.
 */
export default function PreviewCanvas(props: PreviewCanvasProps): React.ReactElement {
  const { asset } = props;
  const reduced = usePrefersReducedMotion();
  // Effects tier is chosen once (switching it later recompiles shaders and
  // flashes); at runtime a struggling device only drops resolution.
  const [hq, setHq] = React.useState(true);
  const [dprCap, setDprCap] = React.useState(2);
  // The canvas stays invisible until the car has rendered a few frames, so
  // shader compilation never flashes black.
  const [ready, setReady] = React.useState(false);
  const markReady = React.useCallback(() => setReady(true), []);

  React.useEffect(() => {
    const small = window.matchMedia("(max-width: 767px)").matches;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    if (small || weak) setHq(false);
  }, []);

  const url = asset?.url;
  React.useEffect(() => {
    if (url) preloadCar(url);
  }, [url]);

  return (
    <WebGlErrorBoundary>
      <div className="relative h-full w-full" style={{ background: STUDIO }}>
        <Canvas
          flat
          dpr={[1, Math.min(dprCap, hq ? 2 : 1.5)]}
          gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
          camera={{ position: reduced ? [4.4, 1.5, 4.6] : [9, 4.2, 10], fov: 32, near: 0.1, far: 60 }}
          style={{
            opacity: ready ? 1 : 0,
            transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          aria-label="Interactive 3D preview of your configuration. Drag to rotate, scroll or pinch to zoom."
        >
          <PerformanceMonitor onDecline={() => setDprCap(1)} />
          <color attach="background" args={[STUDIO]} />
          <fog attach="fog" args={[STUDIO, 11, 24]} />
          <MotionProvider reduced={reduced} onReady={markReady}>
            <Studio hq={hq} />
            <Vehicle {...props} />
            <CameraDirector
              step={props.step}
              reduced={reduced}
              hasDoors={Boolean(asset?.rig?.doors?.length)}
            />
          </MotionProvider>
          {hq ? (
            <EffectComposer multisampling={0} enableNormalPass={false}>
              <N8AO halfRes aoRadius={0.45} intensity={1.6} distanceFalloff={0.6} />
              <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.15} intensity={0.55} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
              <SMAA />
              <Vignette offset={0.28} darkness={0.38} />
            </EffectComposer>
          ) : (
            <EffectComposer multisampling={0} enableNormalPass={false}>
              <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.15} intensity={0.45} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
              <SMAA />
            </EffectComposer>
          )}
        </Canvas>

        {/* Covers the model + HDRI download and shader warm-up. */}
        {ready ? null : <LoadingOverlay />}

        {asset?.credit ? (
          <p className="pointer-events-auto absolute bottom-2 left-3 right-3 text-[10px] leading-snug text-[var(--color-neutral-500)]">
            3D model:{" "}
            <a href={asset.credit.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              &ldquo;{asset.credit.title}&rdquo;
            </a>{" "}
            by {asset.credit.author},{" "}
            <a href={asset.credit.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {asset.credit.license}
            </a>
            {asset.credit.modified ? " (modified)" : ""}. Illustrative — final vehicle may differ.
          </p>
        ) : null}
      </div>
    </WebGlErrorBoundary>
  );
}

/* ------------------------------------------------------------------ */
/* Studio: lighting, floor, shadows                                    */
/* ------------------------------------------------------------------ */

function Studio({ hq }: { hq: boolean }): React.ReactElement {
  return (
    <>
      <Environment files={HDRI} environmentIntensity={0.85}>
        {/* Overhead softbox and side strips give the paint long, clean highlights. */}
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 2.4, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[12, 0.6, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[12, 0.6, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 2.2, 7]} scale={[12, 0.5, 1]} />
        <Lightformer form="ring" intensity={1.2} position={[4, 4, -6]} scale={2.5} />
      </Environment>
      <directionalLight position={[4, 7, 5]} intensity={0.6} />

      {/* Glossy showroom floor with soft, blurred reflections. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          color="#e2ddd5"
          // 1024 renders black on some GPUs (seen on SwiftShader); with this
          // much blur 512 is visually identical.
          resolution={hq ? 512 : 256}
          blur={[520, 160]}
          mixBlur={1}
          mixStrength={hq ? 0.95 : 0.6}
          mixContrast={1}
          roughness={0.85}
          metalness={0.35}
          depthScale={1.15}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.3}
          mirror={0.35}
        />
      </mesh>
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.8}
        scale={9}
        blur={2}
        far={2.2}
        resolution={hq ? 1024 : 512}
        color="#1b1a18"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Vehicle + drive-in                                                  */
/* ------------------------------------------------------------------ */

function Vehicle({
  asset,
  bodyHex,
  bodyMetallic,
  interiorHex,
  wheelStyle,
}: PreviewCanvasProps): React.ReactElement {
  const placeholder = (
    <DriveIn key="placeholder">
      <PlaceholderCar bodyHex={bodyHex} interiorHex={interiorHex} wheelStyle={wheelStyle} />
    </DriveIn>
  );
  if (!asset) return placeholder;
  return (
    <ModelErrorBoundary fallback={placeholder}>
      <React.Suspense fallback={null}>
        <DriveIn key={asset.url}>
          <GltfCar
            asset={asset}
            bodyHex={bodyHex}
            bodyMetallic={bodyMetallic}
            interiorHex={interiorHex}
            wheelStyle={wheelStyle}
          />
        </DriveIn>
      </React.Suspense>
    </ModelErrorBoundary>
  );
}

const DRIVE_FROM = -7.5;
const DRIVE_SECONDS = 2.8;

/**
 * Rolls the car in from stage left and brakes to a stop. It lives inside the
 * Suspense boundary, so the entrance always plays on a fully loaded car.
 */
function DriveIn({ children }: { children: React.ReactNode }): React.ReactElement {
  const motion = useMotion();
  const group = React.useRef<THREE.Group>(null);
  const elapsed = React.useRef(0);
  const lastX = React.useRef(DRIVE_FROM);
  const frames = React.useRef(0);

  React.useLayoutEffect(() => {
    const m = motion.current;
    if (m.reduced) {
      m.lightsOn = 1;
      lastX.current = 0;
      group.current?.position.set(0, 0, 0);
    } else {
      m.lightsOn = 0;
      group.current?.position.set(DRIVE_FROM, 0, 0);
    }
  }, [motion]);

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g) return;
    const m = motion.current;
    // Reveal the canvas after a few rendered frames (shaders compiled), and
    // only start the entrance from then on.
    if (frames.current < 3) {
      frames.current += 1;
      if (frames.current === 3) m.onReady();
      return;
    }
    if (m.reduced) {
      g.position.x = 0;
      m.lightsOn = 1;
      return;
    }
    const dt = Math.min(rawDt, 0.05);
    elapsed.current += dt;
    const p = Math.min(1, elapsed.current / DRIVE_SECONDS);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic: arrive and settle
    const x = DRIVE_FROM * (1 - eased);
    m.travel += x - lastX.current;
    lastX.current = x;
    g.position.x = x;
    // Brake lights during the last part of the approach, then fade.
    m.braking =
      p > 0.45 && p < 1 ? Math.sin(((p - 0.45) / 0.55) * Math.PI) : Math.max(0, m.braking - dt * 3);
    // Headlights wake once stopped.
    if (p >= 1) m.lightsOn = Math.min(1, m.lightsOn + dt * 1.8);
  });

  return <group ref={group}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

type View = { pos: [number, number, number]; target: [number, number, number] };

/** Camera framing per configurator step (car nose points along +X). */
const VIEWS: Record<PreviewStep, View> = {
  trim: { pos: [4.6, 1.45, 4.4], target: [0, 0.5, 0] },
  exterior: { pos: [5.6, 1.15, 2.1], target: [0, 0.55, 0] },
  // High over the driver's door, looking down through the side glass.
  interior: { pos: [1.15, 2.35, 3.05], target: [0.05, 0.5, 0] },
  options: { pos: [-4.7, 1.55, 4.1], target: [0, 0.5, 0] },
  summary: { pos: [4.9, 1.9, 5.1], target: [0, 0.45, 0] },
};

const IDLE_SECONDS = 6;

function CameraDirector({
  step,
  reduced,
  hasDoors,
}: {
  step: PreviewStep;
  reduced: boolean;
  hasDoors: boolean;
}): React.ReactElement {
  const controls = React.useRef<React.ComponentRef<typeof CameraControls>>(null);
  const motion = useMotion();
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const scene = useThree((s) => s.scene);
  const idleSince = React.useRef(0);
  const clock = React.useRef(0);

  // Views are composed for a ~1.4:1 frame; narrower canvases (the portrait
  // desktop pane, phones) pull the camera back so the whole car fits.
  const reach = Math.min(2.3, Math.max(1, 1.4 / aspect));

  React.useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const v = VIEWS[step];
    const [tx, ty, tz] = v.target;
    const [px, py, pz] = v.pos;
    void c.setLookAt(
      tx + (px - tx) * reach,
      ty + (py - ty) * reach,
      tz + (pz - tz) * reach,
      tx,
      ty,
      tz,
      !reduced,
    );
    idleSince.current = clock.current;
    motion.current.doorsTarget = step === "interior" && hasDoors ? 1 : 0;
  }, [step, reach, reduced, hasDoors, motion]);

  // Development-only handle for visual QA scripts (camera placement).
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return undefined;
    const w = window as unknown as { __configuratorCamera?: unknown; __configuratorScene?: unknown };
    w.__configuratorCamera = controls.current;
    w.__configuratorScene = scene;
    return () => {
      delete w.__configuratorCamera;
      delete w.__configuratorScene;
    };
  }, [scene]);

  React.useEffect(() => {
    const c = controls.current;
    if (!c) return undefined;
    const wake = (): void => {
      idleSince.current = clock.current;
    };
    c.addEventListener("controlstart", wake);
    c.addEventListener("control", wake);
    return () => {
      c.removeEventListener("controlstart", wake);
      c.removeEventListener("control", wake);
    };
  }, []);

  useFrame((_, dt) => {
    clock.current += dt;
    const c = controls.current;
    if (!c || reduced) return;
    // Slow showroom turntable once the entrance is over and nobody is
    // touching the car.
    const m = motion.current;
    if (m.lightsOn < 1) idleSince.current = clock.current;
    if (clock.current - idleSince.current > IDLE_SECONDS && step !== "interior") {
      void c.rotate(dt * 0.1, 0, false);
    }
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.9}
      minDistance={2.6}
      maxDistance={12}
      minPolarAngle={Math.PI / 7}
      maxPolarAngle={Math.PI / 2.08}
      truckSpeed={0}
    />
  );
}

/* ------------------------------------------------------------------ */
/* UI helpers                                                          */
/* ------------------------------------------------------------------ */

/** Progress for the .glb / HDRI download, drawn over the canvas until ready. */
function LoadingOverlay(): React.ReactElement {
  const { active, progress } = useProgress();
  // Downloads finished but first frames not drawn yet: shaders compiling.
  const pct = active ? Math.round(progress) : 100;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3"
    >
      <div className="h-1 w-40 overflow-hidden rounded-full bg-[var(--color-neutral-200)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-200"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
        Preparing your car{active ? ` · ${pct}%` : "…"}
      </span>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** A broken or missing model file falls back to the placeholder car. */
class ModelErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.warn("[configurator] 3D model failed to load, using placeholder", error);
  }

  override render(): React.ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** If WebGL is unavailable (old devices, some VMs), show a calm fallback. */
class WebGlErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): React.ReactNode {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-warm)] p-6 text-center">
          <p className="max-w-xs text-sm text-[var(--color-neutral-600)]">
            The 3D preview isn&rsquo;t supported on this device. Your selections and price still
            update as you configure.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
