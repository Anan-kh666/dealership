import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { modelsPublicRoutes } from "./models.js";

/** Public, unauthenticated routes (model browsing, inventory, blog). */
export const publicRoutes: FastifyPluginAsyncZod = async (server) => {
  await server.register(modelsPublicRoutes);
};
