import type { Metadata } from "next";
import { Container } from "@dealership/ui/components/container";
import { TradeInFlow } from "@/components/trade-in/flow";

export const metadata: Metadata = {
  title: "Trade-in valuation",
  description:
    "Tell us about your car and we'll send you a valuation within one business day.",
};

export const dynamic = "force-dynamic";

export default function TradeInPage(): React.ReactElement {
  return (
    <div className="bg-[var(--color-surface-warm)] pb-24 pt-28 md:pt-36">
      <Container>
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Trade-in
          </p>
          <h1
            className="mt-3 font-[family-name:var(--font-display)] text-[clamp(40px,5vw,64px)] leading-[1.05] tracking-[-0.02em] text-[var(--color-graphite)]"
          >
            What&rsquo;s your car worth?
          </h1>
          <p className="mt-4 text-[var(--color-neutral-700)]">
            A few minutes of detail and a handful of photos. We&rsquo;ll send your
            valuation within one business day.
          </p>
        </header>
        <TradeInFlow />
      </Container>
    </div>
  );
}
