import { cn } from "@dealership/ui/lib/cn";
import type { Tone } from "@/lib/status";

const TONE: Record<Tone, string> = {
  neutral:
    "border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
  info: "border-[#1F2C3A]/15 bg-[#1F2C3A]/[0.06] text-[#1F2C3A]",
  success:
    "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  warning:
    "border-[var(--color-warning)]/25 bg-[var(--color-warning)]/10 text-[oklch(0.5_0.12_60)]",
  danger: "border-[var(--color-error)]/20 bg-[var(--color-error)]/10 text-[var(--color-error)]",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]",
        TONE[tone],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
