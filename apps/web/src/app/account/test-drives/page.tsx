import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { TestDriveRow } from "./test-drive-row";

export const dynamic = "force-dynamic";

export default async function TestDrivesPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/account/test-drives");
  const rows = await prisma.testDrive.findMany({
    where: { userId: session.user.id },
    orderBy: { scheduledAt: "desc" },
    include: { model: true, stockUnit: { include: { trim: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
          Test drives
        </h1>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-md border border-[var(--color-neutral-200)] bg-white p-8 text-center">
          <p className="text-sm text-[var(--color-neutral-700)]">
            No test drives yet.
          </p>
          <Link
            href="/test-drive"
            className="mt-4 inline-block text-sm text-[var(--color-graphite)] underline-offset-2 hover:underline"
          >
            Schedule one
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const isUpcoming =
              r.scheduledAt.getTime() > Date.now() &&
              (r.status === "REQUESTED" || r.status === "CONFIRMED");
            const modelLabel = r.model
              ? r.model.name
              : r.stockUnit
                ? r.stockUnit.trim.name
                : "Vehicle";
            return (
              <TestDriveRow
                key={r.id}
                id={r.id}
                modelLabel={modelLabel}
                scheduledAt={r.scheduledAt.toISOString()}
                status={r.status}
                modelSlug={r.model?.slug ?? null}
                isUpcoming={isUpcoming}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
