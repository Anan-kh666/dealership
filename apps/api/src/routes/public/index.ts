import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

/** Public, unauthenticated routes (model browsing, inventory, blog). */
export const publicRoutes: FastifyPluginAsyncZod = async (_server) => {
  // Routes registered here by feature agents.
};
