import type { Metadata } from "next";
import { prisma } from "@dealership/db";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { FinancingFlow } from "@/components/financing/flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apply for car financing — Malaysia",
  description:
    "Apply for hire-purchase financing in minutes. Submit your details and we'll match you with offers from our partner banks.",
};

interface PreselectedVehicle {
  id: string;
  label: string;
  price: number;
}

async function loadPreselected(
  vehicleId: string | undefined,
): Promise<PreselectedVehicle | null> {
  if (!vehicleId) return null;
  const unit = await prisma.stockUnit.findUnique({
    where: { id: vehicleId },
    include: { trim: { include: { model: true } } },
  });
  if (!unit) return null;
  return {
    id: unit.id,
    label: `${unit.trim.model.year} ${unit.trim.model.name} ${unit.trim.name}`,
    price: Number(unit.totalPrice),
  };
}

export default async function FinancingApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>;
}): Promise<React.ReactElement> {
  const { vehicleId } = await searchParams;
  const preselected = await loadPreselected(vehicleId);

  return (
    <Section spacing="default">
      <Container>
        <div className="pt-12 md:pt-20">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
            Financing application
          </p>
          <h1
            className="mt-2 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
            style={{ fontSize: "clamp(36px, 5vw, 52px)", lineHeight: 1.05 }}
          >
            Apply for financing
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-neutral-700)]">
            Most applications take about ten minutes. Your progress is saved
            automatically — close the tab and pick up where you left off.
          </p>
        </div>

        <div className="mt-12">
          <FinancingFlow preselected={preselected} />
        </div>
      </Container>
    </Section>
  );
}
