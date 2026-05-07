import { NextResponse } from "next/server";
import { prisma } from "@dealership/db";
import {
  clearSessionCookie,
  readSessionTokenFromCookie,
} from "@/server/sessions";

/**
 * POST /sign-out — destroys the current Session row and clears the
 * cookie, then redirects to the home page. The form on the header
 * dropdown posts here.
 */
export async function POST(): Promise<NextResponse> {
  const token = await readSessionTokenFromCookie();
  if (token) {
    await prisma.session
      .delete({ where: { sessionToken: token } })
      .catch(() => undefined);
  }
  await clearSessionCookie();
  return NextResponse.redirect(
    new URL("/", process.env.AUTH_URL ?? "http://localhost:3000"),
    303,
  );
}
