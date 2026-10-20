import "server-only";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "./auth";
import { isStaffRole } from "./auth.config";

export type SessionUser = Session["user"];

/** The signed-in user, or null. Safe to call from any server context. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user?.id ? session.user : null;
}

/** For pages under /account: the user, or a redirect to sign-in. */
export async function requireUser(callbackUrl = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** For pages and actions under /admin: a staff user, or a redirect. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!isStaffRole(user.role)) redirect("/account");
  return user;
}

export { safeCallbackUrl } from "@/lib/safe-url";
