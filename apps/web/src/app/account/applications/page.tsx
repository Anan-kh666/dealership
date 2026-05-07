import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/sign-in?callbackUrl=/account/applications");
  const rows = await prisma.financeApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
        Financing applications
      </h1>
      {rows.length === 0 ? (
        <div className="rounded-md border border-[var(--color-neutral-200)] bg-white p-8 text-center">
          <p className="text-sm text-[var(--color-neutral-700)]">
            No financing applications yet.
          </p>
          <Link
            href="/financing/apply"
            className="mt-4 inline-block text-sm text-[var(--color-graphite)] underline-offset-2 hover:underline"
          >
            Start one
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const dt = r.createdAt.toLocaleDateString("en-MY", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <li
                key={r.id}
                className="rounded-md border border-[var(--color-neutral-200)] bg-white p-4"
              >
                <Link
                  href={`/account/applications/${r.id}`}
                  className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em] text-[var(--color-graphite)] hover:text-[var(--color-accent)]"
                >
                  {r.referenceNumber}
                </Link>
                <p className="text-sm text-[var(--color-neutral-600)]">
                  {r.vehicleLabel ?? "Vehicle"} · submitted {dt} ·{" "}
                  {r.status.toLowerCase().replace("_", " ")}
                </p>
                <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
                  {r.tenureYears}-year loan · {formatPrice(r.downPayment.toString())} down ·{" "}
                  est. {formatPrice(r.estimatedMonthly.toString())}/mo
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
