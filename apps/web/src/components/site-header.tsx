import { auth } from "@/server/auth";
import { SiteHeaderClient } from "./site-header-client";

/**
 * Server wrapper around the header so the signed-in/out state is
 * computed on the server (no client-side flash) and passed in.
 */
export async function SiteHeader(): Promise<React.ReactElement> {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }
    : null;
  return <SiteHeaderClient user={user} />;
}
