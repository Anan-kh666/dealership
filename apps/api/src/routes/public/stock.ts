import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  prisma,
  BodyType,
  FuelType,
  StockStatus,
  type Prisma,
} from "@dealership/db";

const StockSort = z.enum(["newest", "price-asc", "price-desc", "days-on-lot"]);

const StockQuery = z.object({
  model: z.string().min(1).optional(),
  trim: z.string().min(1).optional(),
  bodyType: z.nativeEnum(BodyType).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  color: z.string().min(1).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().positive().optional(),
  sort: StockSort.default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(24),
  /** Include SOLD/RESERVED in results. Defaults to false (public-safe). */
  includeUnavailable: z.coerce.boolean().default(false),
});

const SlugParams = z.object({ slug: z.string().min(1) });
const IdParams = z.object({ id: z.string().min(1) });

function orderByForSort(sort: z.infer<typeof StockSort>): Prisma.StockUnitOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ totalPrice: "asc" }];
    case "price-desc":
      return [{ totalPrice: "desc" }];
    case "days-on-lot":
      return [{ daysOnLot: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ arrivalDate: "desc" }, { createdAt: "desc" }];
  }
}

/**
 * Public stock browse + detail routes. The Next.js Server Components on
 * /stock and /stock/[slug] query Prisma directly for SSR speed; these
 * routes exist for non-Next clients.
 */
export const stockPublicRoutes: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/stock",
    {
      schema: { querystring: StockQuery },
    },
    async (request) => {
      const q = request.query;
      const where: Prisma.StockUnitWhereInput = {};

      if (q.includeUnavailable) {
        // No status filter — return everything.
      } else {
        where.status = { in: [StockStatus.AVAILABLE, StockStatus.IN_TRANSIT] };
      }

      const modelWhere: Prisma.ModelWhereInput = {};
      const trimWhere: Prisma.TrimWhereInput = {};
      if (q.model) modelWhere.slug = q.model;
      if (q.bodyType) modelWhere.bodyType = q.bodyType;
      if (q.trim) trimWhere.name = { equals: q.trim, mode: "insensitive" };
      if (q.fuelType) trimWhere.fuelType = q.fuelType;
      if (Object.keys(modelWhere).length > 0) trimWhere.model = modelWhere;
      if (Object.keys(trimWhere).length > 0) where.trim = trimWhere;

      // exteriorColor is referenced by FK only (no Prisma relation field on
      // StockUnit), so we look up the color ID by name and filter on the ID.
      if (q.color) {
        const c = await prisma.color.findFirst({
          where: { name: { equals: q.color, mode: "insensitive" } },
          select: { id: true },
        });
        if (!c) return { items: [], total: 0, hasMore: false };
        where.exteriorColorId = c.id;
      }
      if (q.priceMin !== undefined || q.priceMax !== undefined) {
        where.totalPrice = {};
        if (q.priceMin !== undefined) where.totalPrice.gte = q.priceMin;
        if (q.priceMax !== undefined) where.totalPrice.lte = q.priceMax;
      }

      const [items, total] = await Promise.all([
        prisma.stockUnit.findMany({
          where,
          orderBy: orderByForSort(q.sort),
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            trim: { include: { model: true } },
            images: { orderBy: { order: "asc" }, take: 1 },
          },
        }),
        prisma.stockUnit.count({ where }),
      ]);

      // Hydrate exterior color separately to avoid two relation includes
      // tripping schema includes that don't exist as named relations.
      const colorIds = Array.from(new Set(items.map((i) => i.exteriorColorId)));
      const colors = await prisma.color.findMany({ where: { id: { in: colorIds } } });
      const colorById = new Map(colors.map((c) => [c.id, c] as const));

      return {
        items: items.map((i) => ({
          id: i.id,
          slug: i.slug,
          vin: i.vin,
          status: i.status,
          totalPrice: i.totalPrice.toString(),
          arrivalDate: i.arrivalDate?.toISOString() ?? null,
          expectedDelivery: i.expectedDelivery?.toISOString() ?? null,
          daysOnLot: i.daysOnLot,
          trim: {
            id: i.trim.id,
            name: i.trim.name,
            fuelType: i.trim.fuelType,
            model: {
              id: i.trim.model.id,
              slug: i.trim.model.slug,
              name: i.trim.model.name,
              bodyType: i.trim.model.bodyType,
              year: i.trim.model.year,
            },
          },
          exteriorColor: colorById.get(i.exteriorColorId)
            ? {
                name: colorById.get(i.exteriorColorId)!.name,
                hexCode: colorById.get(i.exteriorColorId)!.hexCode,
              }
            : null,
          firstImage: i.images[0]
            ? {
                id: i.images[0].id,
                url: i.images[0].url,
                altText: i.images[0].altText,
              }
            : null,
        })),
        total,
        hasMore: q.page * q.limit < total,
      };
    },
  );

  server.get(
    "/stock/:slug",
    { schema: { params: SlugParams } },
    async (request, reply) => {
      const { slug } = request.params;
      const unit = await prisma.stockUnit.findUnique({
        where: { slug },
        include: {
          trim: {
            include: {
              model: true,
              options: { include: { option: true } },
            },
          },
          images: { orderBy: { order: "asc" } },
        },
      });
      if (!unit) return reply.code(404).send({ error: "Stock unit not found" });

      const [exteriorColor, interiorColor] = await Promise.all([
        prisma.color.findUnique({ where: { id: unit.exteriorColorId } }),
        prisma.color.findUnique({ where: { id: unit.interiorColorId } }),
      ]);

      return {
        ...unit,
        totalPrice: unit.totalPrice.toString(),
        arrivalDate: unit.arrivalDate?.toISOString() ?? null,
        expectedDelivery: unit.expectedDelivery?.toISOString() ?? null,
        trim: {
          ...unit.trim,
          price: unit.trim.price.toString(),
          options: unit.trim.options.map((o) => ({
            ...o,
            option: { ...o.option, price: o.option.price.toString() },
          })),
        },
        exteriorColor,
        interiorColor,
      };
    },
  );

  // ============ View tracking ============
  // Fire-and-forget view counter. Rate-limited to 1 per IP per stock unit per
  // hour using an in-memory Map (Redis-ready: drop in a Redis client when
  // REDIS_URL is wired up).
  const viewSeen = new Map<string, number>();
  const VIEW_TTL_MS = 60 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [k, ts] of viewSeen.entries()) {
      if (now - ts > VIEW_TTL_MS) viewSeen.delete(k);
    }
  }, 5 * 60 * 1000).unref?.();

  server.post(
    "/stock/:id/view",
    { schema: { params: IdParams } },
    async (request, reply) => {
      const { id } = request.params;
      const ip = request.ip;
      const key = `${ip}:${id}`;
      const last = viewSeen.get(key);
      const now = Date.now();
      if (!last || now - last > VIEW_TTL_MS) {
        viewSeen.set(key, now);
        // Fire and forget.
        prisma.stockUnit
          .update({ where: { id }, data: { views: { increment: 1 } } })
          .catch(() => {
            /* ignore — unit may not exist; view count is non-critical */
          });
      }
      return reply.code(204).send();
    },
  );
};
