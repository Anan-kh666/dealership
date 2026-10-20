import type { DefaultSession } from "next-auth";
import type { Role } from "@dealership/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}
