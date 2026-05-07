export const body = {
  backgroundColor: "#f7f5f1",
  fontFamily: "Helvetica, Arial, sans-serif",
} as const;

export const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
} as const;

export const h1 = {
  fontSize: "32px",
  fontWeight: 300,
  letterSpacing: "-0.02em",
  margin: "0 0 16px",
  color: "#1a1a1a",
} as const;

export const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#333",
  margin: "0 0 12px",
} as const;

export const link = {
  color: "#B08D57",
  textDecoration: "underline",
} as const;

export const buttonStyle = {
  backgroundColor: "#B08D57",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  fontWeight: 600,
} as const;

export const muted = {
  fontSize: "12px",
  color: "#888",
  margin: "16px 0 0",
} as const;

export const hr = { borderColor: "#eee", margin: "24px 0" } as const;

export const DEALERSHIP_NAME = "Dealership";
