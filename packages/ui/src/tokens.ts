/**
 * Design tokens — single source of truth for non-CSS consumers (Framer Motion,
 * inline-style fallbacks, server-side renderers). The Tailwind v4 @theme block
 * at packages/config/src/tailwind-preset.css mirrors these values; if you
 * change one side, change the other.
 */

export const colors = {
  primary: "#1A1A1A",
  surface: "#FFFFFF",
  surfaceWarm: "#F8F6F2",
  accent: "#B08D57",
  accentDeep: "#8C6F44",

  neutral: {
    50: "#FAFAF8",
    100: "#F2F1EE",
    200: "#E4E2DD",
    300: "#CDCAC3",
    400: "#9E9C96",
    500: "#6B6B6B",
    600: "#525252",
    700: "#3D3D3D",
    800: "#2A2A2A",
    900: "#1A1A1A",
  },

  semantic: {
    success: "#1F7A4D",
    warning: "#C8841A",
    error: "#B22222",
  },
} as const;

export const fonts = {
  display: "var(--font-fraunces)",
  body: "var(--font-geist-sans)",
} as const;

export const letterSpacing = {
  display: "-0.02em",
  body: "0",
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
  32: "128px",
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
} as const;

export const shadows = {
  1: "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 1px 0 rgb(0 0 0 / 0.04)",
  2: "0 4px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
  3: "0 12px 24px -6px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.08)",
  4: "0 24px 48px -12px rgb(0 0 0 / 0.18), 0 8px 16px -8px rgb(0 0 0 / 0.10)",
} as const;

/** Motion tokens — durations are in seconds for Framer Motion. */
export const motion = {
  duration: {
    quick: 0.15,
    standard: 0.25,
    reveal: 0.4,
  },
  durationMs: {
    quick: 150,
    standard: 250,
    reveal: 400,
  },
  easing: {
    out: [0.16, 1, 0.3, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
  },
} as const;

export const layout = {
  containerMax: "1440px",
  containerPaddingMobile: "16px",
  containerPaddingTablet: "24px",
  containerPaddingDesktop: "48px",
} as const;

export const tokens = {
  colors,
  fonts,
  letterSpacing,
  spacing,
  radii,
  shadows,
  motion,
  layout,
} as const;

export type Tokens = typeof tokens;
