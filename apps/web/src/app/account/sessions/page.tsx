import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { readSessionTokenFromCookie } from "@/server/sessions";
import { SessionsList } from "./sessions-list";

export const dynamic = "force-dynamic";

export default async function SessionsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/account/sessions");
  const current = await readSessionTokenFromCookie();
  const rows = await prisma.session.findMany({
    where: { userId: session.user.id },
    orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      sessionToken: true,
      deviceLabel: true,
      lastIp: true,
      lastSeenAt: true,
      createdAt: true,
      expires: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
          Active sessions
        </h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
          Sign out individual devices, or sign out everywhere except this one.
        </p>
      </div>
      <SessionsList
        sessions={rows.map((r) => ({
          id: r.id,
          deviceLabel: r.deviceLabel ?? "Unknown device",
          lastIp: r.lastIp ?? null,
          lastSeenAt: (r.lastSeenAt ?? r.createdAt).toISOString(),
          createdAt: r.createdAt.toISOString(),
          isCurrent: r.sessionToken === current,
        }))}
      />
    </div>
  );
}
