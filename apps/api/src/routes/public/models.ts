import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  prisma,
  BodyType,
  FuelType,
  type Prisma,
} from "@dealership/db";

const BodyTypeSchema = z.nativeEnum(BodyType);
const FuelTypeSchema = z.nativeEnum(FuelType);

const ModelsQuery = z.object({
  bodyType: BodyTypeSchema.optional(),
  fuelType: FuelTypeSchema.optional(),
  priceMax: z.coerce.number().positive().optional(),
  make: z.string().min(1).optional(),
});

const SlugParams = z.object({
  slug: z.string().min(1),
});

/**
 * Public model browse + detail routes. The Next.js Server Components on
 * /models and /models/[slug] query Prisma directly for SSR speed; these
 * routes exist for non-Next clients (mobile app, third-party integrations,
 * future admin tooling).
 */
export const modelsPublicRoutes: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/models",
    {
      schema: {
        querystring: ModelsQuery,
      },
    },
    async (request) => {
      const q = request.query;
      const where: Prisma.ModelWhereInput = { isActive: true };
      if (q.bodyType) where.bodyType = q.bodyType;
      if (q.make) where.make = { equals: q.make, mode: "insensitive" };
      if (q.priceMax) where.startingPrice = { lte: q.priceMax };
      if (q.fuelType) where.trims = { some: { fuelType: q.fuelType } };

      const models = await prisma.model.findMany({
        where,
        orderBy: [{ displayOrder: "asc" }, { startingPrice: "asc" }],
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          _count: { select: { trims: true } },
        },
      });

      return models.map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        make: m.make,
        year: m.year,
        bodyType: m.bodyType,
        startingPrice: m.startingPrice.toString(),
        currency: m.currency,
        heroImage: m.heroImage,
        highlights: m.highlights,
        firstImage: m.images[0]
          ? {
              id: m.images[0].id,
              url: m.images[0].url,
              altText: m.images[0].altText,
              type: m.images[0].type,
            }
          : null,
        trimCount: m._count.trims,
      }));
    },
  );

  server.get(
    "/models/:slug",
    {
      schema: {
        params: SlugParams,
      },
    },
    async (request, reply) => {
      const { slug } = request.params;
      const model = await prisma.model.findUnique({
        where: { slug },
        include: {
          trims: {
            orderBy: [{ displayOrder: "asc" }, { price: "asc" }],
            include: {
              options: { include: { option: true } },
              trimColors: { include: { color: true } },
            },
          },
          images: { orderBy: { order: "asc" } },
        },
      });

      if (!model) {
        return reply.code(404).send({ error: "Model not found" });
      }

      return {
        ...model,
        startingPrice: model.startingPrice.toString(),
        trims: model.trims.map((t) => ({
          ...t,
          price: t.price.toString(),
          options: t.options.map((o) => ({
            ...o,
            option: { ...o.option, price: o.option.price.toString() },
          })),
          trimColors: t.trimColors.map((tc) => ({
            ...tc,
            upcharge: tc.upcharge.toString(),
          })),
        })),
      };
    },
  );
};
