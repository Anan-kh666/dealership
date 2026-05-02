import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const HealthResponse = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
});

export const healthRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/health",
    {
      schema: {
        response: { 200: HealthResponse },
      },
    },
    async () => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    }),
  );
};
