import type {
  AppStatus,
  InquiryStatus,
  StockStatus,
  TestDriveStatus,
  TradeInStatus,
} from "@dealership/db";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

interface StatusMeta {
  label: string;
  tone: Tone;
  /** Customer-facing explanation (account + tracker pages). */
  description: string;
}

export const TEST_DRIVE_STATUS: Record<TestDriveStatus, StatusMeta> = {
  REQUESTED: {
    label: "Requested",
    tone: "info",
    description: "We've received your booking and will confirm it shortly.",
  },
  CONFIRMED: {
    label: "Confirmed",
    tone: "success",
    description: "Your car will be prepared and waiting when you arrive.",
  },
  COMPLETED: { label: "Completed", tone: "neutral", description: "Thanks for driving with us." },
  CANCELED: { label: "Cancelled", tone: "danger", description: "This booking was cancelled." },
  NO_SHOW: {
    label: "Missed",
    tone: "warning",
    description: "We missed you — book another time that suits you.",
  },
};

export const APP_STATUS: Record<AppStatus, StatusMeta> = {
  SUBMITTED: {
    label: "Submitted",
    tone: "info",
    description: "We've received your application and will send it to our panel banks.",
  },
  UNDER_REVIEW: {
    label: "Under review",
    tone: "warning",
    description: "The banks are assessing your application — usually two working days.",
  },
  APPROVED: {
    label: "Approved",
    tone: "success",
    description: "Approved. We'll be in touch to arrange signing and collection.",
  },
  REJECTED: {
    label: "Not approved",
    tone: "danger",
    description: "The banks couldn't approve this application. We'll call to discuss options.",
  },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral", description: "This application was withdrawn." },
};

export const TRADE_IN_STATUS: Record<TradeInStatus, StatusMeta> = {
  SUBMITTED: {
    label: "Submitted",
    tone: "info",
    description: "We've received your details and photos.",
  },
  REVIEWING: {
    label: "Reviewing",
    tone: "warning",
    description: "Our appraiser is reviewing your car against current market data.",
  },
  QUOTED: { label: "Quote ready", tone: "success", description: "Your valuation is ready." },
  ACCEPTED: {
    label: "Accepted",
    tone: "success",
    description: "Quote accepted — we'll arrange the inspection and handover.",
  },
  REJECTED: { label: "Closed", tone: "neutral", description: "This valuation request is closed." },
};

export const INQUIRY_STATUS: Record<InquiryStatus, StatusMeta> = {
  NEW: { label: "New", tone: "info", description: "Received — we usually reply within a day." },
  CONTACTED: { label: "Contacted", tone: "warning", description: "We've been in touch." },
  IN_PROGRESS: { label: "In progress", tone: "warning", description: "We're working on it." },
  CLOSED: { label: "Closed", tone: "neutral", description: "Resolved." },
};

export const STOCK_STATUS: Record<StockStatus, StatusMeta> = {
  AVAILABLE: { label: "Available", tone: "success", description: "On the lot." },
  IN_TRANSIT: { label: "In transit", tone: "info", description: "On its way to the showroom." },
  RESERVED: { label: "Reserved", tone: "warning", description: "Held for a customer." },
  SOLD: { label: "Sold", tone: "neutral", description: "Sold." },
};

/** Ordered steps for the customer-facing trade-in progress tracker. */
export const TRADE_IN_STEPS: TradeInStatus[] = ["SUBMITTED", "REVIEWING", "QUOTED", "ACCEPTED"];
