import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import rateLimit from "@fastify/rate-limit";
import { modelsPublicRoutes } from "./models.js";
import { stockPublicRoutes } from "./stock.js";
import { inquiriesPublicRoutes } from "./inquiries.js";
import { testDrivesPublicRoutes } from "./test-drives.js";

/** Public, unauthenticated routes (model browsing, inventory, test drives). */
export const publicRoutes: FastifyPluginAsyncZod = async (server) => {
  // Rate limiter — applied per-route via `config.rateLimit`. Without a
  // route-level config, no limit is enforced. Stores buckets in-memory;
  // swap for a Redis store once REDIS_URL is wired.
  await server.register(rateLimit, { global: false });

  await server.register(modelsPublicRoutes);
  await server.register(stockPublicRoutes);
  await server.register(inquiriesPublicRoutes);
  await server.register(testDrivesPublicRoutes);
};
