import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { loggerOptions } from "./lib/logger.js";
import { healthRoute } from "./routes/health.js";
import { publicRoutes } from "./routes/public/index.js";
import { customerRoutes } from "./routes/customer/index.js";
import { adminRoutes } from "./routes/admin/index.js";

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({ logger: loggerOptions }).withTypeProvider<ZodTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  const webOrigin = process.env.AUTH_URL ?? "http://localhost:3000";
  await server.register(cors, {
    origin: [webOrigin],
    credentials: true,
  });

  await server.register(healthRoute);
  await server.register(publicRoutes, { prefix: "/public" });
  await server.register(customerRoutes, { prefix: "/customer" });
  await server.register(adminRoutes, { prefix: "/admin" });

  return server;
}
