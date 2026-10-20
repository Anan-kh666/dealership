import { getSessionUser } from "@/server/session";
import { isStaffRole } from "@/server/auth.config";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/**
 * Public-site frame: header, main landmark, footer. Used by the (public),
 * (auth) and /account layouts. /admin renders its own shell instead.
 */
export async function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  let headerUser: { name: string | null; isStaff: boolean } | null = null;
  try {
    const user = await getSessionUser();
    if (user) headerUser = { name: user.name ?? null, isStaff: isStaffRole(user.role) };
  } catch {
    // A misconfigured AUTH_SECRET shouldn't take the whole site down.
  }

  return (
    <>
      <SiteHeader user={headerUser} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
