import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { prisma } from "@dealership/db";

const InquiryBody = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?[\d\s-]+$/, "must be a valid phone number"),
  message: z.string().trim().max(2000).optional(),
  stockUnitId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  configurationId: z.string().min(1).optional(),
  source: z.string().trim().min(1).max(80),
});

/**
 * Public inquiry endpoint. Per the design brief, rate-limited to 5/IP/hour.
 * @fastify/rate-limit is registered globally on this plugin scope.
 */
export const inquiriesPublicRoutes: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/inquiries",
    {
      schema: { body: InquiryBody },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 hour",
        },
      },
    },
    async (request, reply) => {
      const b = request.body;
      const inquiry = await prisma.inquiry.create({
        data: {
          name: b.name,
          email: b.email,
          phone: b.phone,
          message: b.message ?? "",
          source: b.source,
          stockUnitId: b.stockUnitId,
          modelId: b.modelId,
          configurationId: b.configurationId,
        },
      });
      return reply.code(201).send({ id: inquiry.id });
    },
  );
};
