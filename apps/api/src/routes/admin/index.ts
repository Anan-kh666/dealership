import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

/** Staff/admin routes (inventory CRUD, lead management, dashboards). */
export const adminRoutes: FastifyPluginAsyncZod = async (_server) => {
  // Routes registered here by feature agents.
};
