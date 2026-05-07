import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TradeInsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/account/trade-ins");
  const rows = await prisma.tradeIn.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
        Trade-in quotes
      </h1>
      {rows.length === 0 ? (
        <div className="rounded-md border border-[var(--color-neutral-200)] bg-white p-8 text-center">
          <p className="text-sm text-[var(--color-neutral-700)]">
            No trade-in quotes yet.
          </p>
          <Link
            href="/trade-in"
            className="mt-4 inline-block text-sm text-[var(--color-graphite)] underline-offset-2 hover:underline"
          >
            Get a quote
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-[var(--color-neutral-200)] bg-white p-4"
            >
              <p className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em] text-[var(--color-graphite)]">
                {r.year} {r.make} {r.model}
              </p>
              <p className="text-sm text-[var(--color-neutral-600)]">
                {r.mileage.toLocaleString("en-MY")} km · {r.condition} · submitted{" "}
                {r.createdAt.toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {r.status.toLowerCase()}
              </p>
              {r.estimatedValue ? (
                <p className="mt-1 text-sm text-[var(--color-graphite)]">
                  Quoted {formatPrice(r.estimatedValue.toString())}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
