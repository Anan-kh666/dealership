"use client";

import * as React from "react";

/**
 * Mutable animation state shared between the stage (which drives the car in
 * and moves the camera) and the car models (which spin wheels, open doors and
 * light up). Plain mutable fields read inside `useFrame` — no React renders
 * per frame.
 */
export interface MotionState {
  /** Distance the car has travelled, in scene units — drives wheel rotation. */
  travel: number;
  /** Target door opening, 0 (closed) → 1 (open). Cars ease towards it. */
  doorsTarget: number;
  /** 0 → 1 once the drive-in finishes; cars ramp their lights with it. */
  lightsOn: number;
  /** Braking intensity during the drive-in (brake lights). */
  braking: number;
  /** True when the user prefers reduced motion. */
  reduced: boolean;
  /** Called once the car has rendered its first frames. */
  onReady: () => void;
}

const MotionContext = React.createContext<React.RefObject<MotionState> | null>(null);

export function MotionProvider({
  reduced,
  onReady,
  children,
}: {
  reduced: boolean;
  onReady: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  const ref = React.useRef<MotionState>({
    travel: 0,
    doorsTarget: 0,
    lightsOn: reduced ? 1 : 0,
    braking: 0,
    reduced,
    onReady,
  });
  ref.current.reduced = reduced;
  ref.current.onReady = onReady;
  return <MotionContext.Provider value={ref}>{children}</MotionContext.Provider>;
}

export function useMotion(): React.RefObject<MotionState> {
  const ctx = React.useContext(MotionContext);
  if (!ctx) throw new Error("useMotion must be used inside <MotionProvider>");
  return ctx;
}

/** Frame-rate independent exponential smoothing factor. */
export function damp(lambda: number, dt: number): number {
  return 1 - Math.exp(-lambda * dt);
}
