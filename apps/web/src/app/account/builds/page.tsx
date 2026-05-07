import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { formatPrice } from "@/lib/format";
import { BuildRow } from "./build-row";

export const dynamic = "force-dynamic";

export default async function BuildsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/account/builds");
  const builds = await prisma.build.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
          Saved builds
        </h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
          Builds you saved from the configurator. Click one to reload it.
        </p>
      </div>
      {builds.length === 0 ? (
        <div className="rounded-md border border-[var(--color-neutral-200)] bg-white p-8 text-center">
          <p className="text-sm text-[var(--color-neutral-700)]">
            No saved builds yet.
          </p>
          <Link
            href="/models"
            className="mt-4 inline-block text-sm text-[var(--color-graphite)] underline-offset-2 hover:underline"
          >
            Browse models
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {builds.map((b) => {
            const opts = Array.isArray(b.options) ? (b.options as string[]) : [];
            const params = new URLSearchParams();
            params.set("trim", b.trim);
            if (b.exterior) params.set("exterior", b.exterior);
            if (b.interior) params.set("interior", b.interior);
            if (opts.length) params.set("options", opts.join(","));
            const reloadHref = `/models/${b.modelSlug}/build?${params.toString()}`;
            return (
              <BuildRow
                key={b.id}
                id={b.id}
                name={b.name}
                modelSlug={b.modelSlug}
                trim={b.trim}
                total={formatPrice(b.totalAtSave.toString())}
                createdAt={b.createdAt.toISOString()}
                reloadHref={reloadHref}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
