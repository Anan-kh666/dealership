import type { ColorType, Prisma, PrismaClient } from "@dealership/db";
import type { OptionDefinition, Vehicle } from "./schema";

/*
 * Writes a vehicle into the catalogue tables. Matching is by natural keys
 * (model slug, trim name, option name, colour name + type, stock VIN), so
 * running it again only changes what changed in vehicle.json — saved
 * configurations, leads and stock keep pointing at the same rows.
 */

type Tx = Prisma.TransactionClient;

export interface DbResult {
  created: boolean;
  trims: number;
  stockCreated: number;
  warnings: string[];
}

const money = (n: number): string => n.toFixed(2);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function upsertOption(tx: Tx, def: OptionDefinition): Promise<string> {
  const data = {
    description: def.description || null,
    category: def.category,
    price: money(def.price),
  };
  const existing = await tx.option.findFirst({ where: { name: def.name }, select: { id: true } });
  if (existing) {
    await tx.option.update({ where: { id: existing.id }, data });
    return existing.id;
  }
  return (await tx.option.create({ data: { name: def.name, ...data } })).id;
}

async function upsertColor(
  tx: Tx,
  c: { name: string; hex: string; metallic?: boolean },
  type: ColorType,
  warnings: string[],
): Promise<string> {
  const existing = await tx.color.findFirst({ where: { name: c.name, type } });
  const data = { hexCode: c.hex.toUpperCase(), isMetallic: c.metallic ?? false };
  if (!existing) return (await tx.color.create({ data: { name: c.name, type, ...data } })).id;
  if (existing.hexCode.toUpperCase() !== data.hexCode || existing.isMetallic !== data.isMetallic) {
    // Colours are shared by name across vehicles; the last one synced wins.
    warnings.push(`Colour "${c.name}" was ${existing.hexCode}, now ${data.hexCode} for every vehicle using it.`);
    await tx.color.update({ where: { id: existing.id }, data });
  }
  return existing.id;
}

export async function writeVehicle(
  prisma: PrismaClient,
  args: {
    slug: string;
    vehicle: Vehicle;
    catalog: OptionDefinition[];
    heroImage: string;
    imageUrl: (src: string) => string;
    resetStock: boolean;
  },
): Promise<DbResult> {
  const { slug, vehicle: v, heroImage, imageUrl } = args;
  const warnings: string[] = [];

  // Options this vehicle uses: its own definitions win over the shared catalogue.
  const defs = new Map(args.catalog.map((o) => [o.name, o] as const));
  for (const o of v.options) defs.set(o.name, o);
  const usedOptions = new Set(v.trims.flatMap((t) => t.options.map((o) => o.name)));
  for (const s of v.stock) s.options.forEach((o) => usedOptions.add(o));
  const missing = [...usedOptions].filter((n) => !defs.has(n));
  if (missing.length) {
    throw new Error(
      `Unknown option(s): ${missing.map((n) => `"${n}"`).join(", ")}. Define them in this vehicle's "options" or in _shared/options.json.`,
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const optionIds = new Map<string, string>();
      for (const name of usedOptions) optionIds.set(name, await upsertOption(tx, defs.get(name)!));

      const extIds = new Map<string, string>();
      for (const c of v.colors.exterior) extIds.set(c.name, await upsertColor(tx, c, "EXTERIOR", warnings));
      const intIds = new Map<string, string>();
      for (const c of v.colors.interior) intIds.set(c.name, await upsertColor(tx, c, "INTERIOR", warnings));

      // ------------------------------------------------------------ model
      const modelData = {
        make: v.make,
        name: v.name,
        year: v.year,
        bodyType: v.bodyType,
        description: v.description,
        startingPrice: money(Math.min(...v.trims.map((t) => t.price))),
        heroImage,
        isActive: v.published,
        isFeatured: v.featured,
        displayOrder: v.displayOrder,
        highlights: v.highlights,
        metaTitle: v.seo.title ?? null,
        metaDescription: v.seo.description ?? null,
      };
      const before = await tx.model.findUnique({ where: { slug }, select: { id: true } });
      const model = await tx.model.upsert({
        where: { slug },
        update: modelData,
        create: { slug, ...modelData },
      });

      await tx.modelImage.deleteMany({ where: { modelId: model.id } });
      if (v.images.length) {
        await tx.modelImage.createMany({
          data: v.images.map((img, i) => ({
            modelId: model.id,
            url: imageUrl(img.src),
            altText: img.alt,
            type: img.type,
            order: i + 1,
          })),
        });
      }

      // ------------------------------------------------------------ trims
      const trimIds = new Map<string, string>();
      for (const [i, t] of v.trims.entries()) {
        const data = {
          price: money(t.price),
          engineSize: t.engineSize,
          horsepower: t.horsepower,
          torque: t.torque,
          transmission: t.transmission,
          fuelType: t.fuelType,
          drivetrain: t.drivetrain,
          fuelEconomy: t.fuelEconomy,
          zeroToHundred: t.zeroToHundred,
          topSpeed: t.topSpeed,
          seats: t.seats,
          doors: t.doors,
          cargoCapacity: t.cargoCapacity,
          features: t.features,
          displayOrder: i + 1,
        };
        const trim = await tx.trim.upsert({
          where: { modelId_name: { modelId: model.id, name: t.name } },
          update: data,
          create: { modelId: model.id, name: t.name, ...data },
        });
        trimIds.set(t.name, trim.id);

        await tx.optionOnTrim.deleteMany({ where: { trimId: trim.id } });
        if (t.options.length) {
          await tx.optionOnTrim.createMany({
            data: t.options.map((o) => ({ trimId: trim.id, optionId: optionIds.get(o.name)!, isStandard: o.standard })),
          });
        }
        await tx.trimColor.deleteMany({ where: { trimId: trim.id } });
        await tx.trimColor.createMany({
          data: [
            ...v.colors.exterior.map((c) => ({ trimId: trim.id, colorId: extIds.get(c.name)!, upcharge: money(c.upcharge) })),
            ...v.colors.interior.map((c) => ({ trimId: trim.id, colorId: intIds.get(c.name)!, upcharge: money(c.upcharge) })),
          ],
        });
      }

      // Trims removed from vehicle.json: delete unless stock or saved builds use them.
      const stale = await tx.trim.findMany({
        where: { modelId: model.id, name: { notIn: [...trimIds.keys()] } },
        select: { id: true, name: true, _count: { select: { stockUnits: true, configurations: true } } },
      });
      for (const t of stale) {
        if (t._count.stockUnits || t._count.configurations) {
          warnings.push(`Trim "${t.name}" is no longer in vehicle.json but stock or saved builds use it — left in place.`);
        } else {
          await tx.trim.delete({ where: { id: t.id } });
        }
      }

      // ------------------------------------------------------------ stock
      let stockCreated = 0;
      const images = v.images.map((img) => ({ url: imageUrl(img.src), alt: img.alt, type: img.type }));
      const exteriors = images.filter((img) => img.type === "EXTERIOR");
      for (const s of v.stock) {
        const existing = await tx.stockUnit.findUnique({ where: { vin: s.vin }, select: { id: true } });
        // Staff manage stock in the admin after it's created; only the seed resets it.
        if (existing && !args.resetStock) continue;

        const trim = v.trims.find((t) => t.name === s.trim)!;
        const ext = v.colors.exterior.find((c) => c.name === s.exteriorColor)!;
        const optionsTotal = s.options.reduce((sum, n) => sum + defs.get(n)!.price, 0);
        const day = 24 * 60 * 60 * 1000;
        const inTransit = s.status === "IN_TRANSIT";
        const data = {
          slug: `${slug}-${slugify(s.trim)}-${slugify(s.exteriorColor)}-${s.vin.slice(-4).toLowerCase()}`,
          trimId: trimIds.get(s.trim)!,
          exteriorColorId: extIds.get(s.exteriorColor)!,
          interiorColorId: intIds.get(s.interiorColor)!,
          installedOptions: s.options.map((n) => optionIds.get(n)!),
          totalPrice: money(trim.price + ext.upcharge + optionsTotal),
          status: s.status,
          arrivalDate: !inTransit && s.arrivedDaysAgo !== undefined ? new Date(Date.now() - s.arrivedDaysAgo * day) : null,
          expectedDelivery: inTransit && s.expectedInDays !== undefined ? new Date(Date.now() + s.expectedInDays * day) : null,
          daysOnLot: inTransit ? 0 : (s.arrivedDaysAgo ?? 0),
        };
        const unit = await tx.stockUnit.upsert({ where: { vin: s.vin }, update: data, create: { vin: s.vin, ...data } });
        if (!existing) stockCreated += 1;

        // Photos: the model's gallery, cover rotated so sibling units differ.
        const seq = Number.parseInt(s.vin.slice(-7), 10) || 0;
        const cover = exteriors.length ? exteriors[seq % exteriors.length] : undefined;
        const picks = (cover ? [cover, ...images.filter((img) => img !== cover)] : images).slice(0, 6);
        await tx.stockImage.deleteMany({ where: { stockUnitId: unit.id } });
        if (picks.length) {
          await tx.stockImage.createMany({
            data: picks.map((img, i) => ({
              stockUnitId: unit.id,
              url: img.url,
              altText: i === 0 ? `${v.name} ${s.trim} in ${s.exteriorColor}` : img.alt,
              order: i + 1,
            })),
          });
        }
      }

      return { created: !before, trims: trimIds.size, stockCreated, warnings };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}

/** Hide models whose folder was deleted (rows stay: leads and stock reference them). */
export async function hideMissingModels(prisma: PrismaClient, slugs: string[]): Promise<string[]> {
  const gone = await prisma.model.findMany({
    where: { slug: { notIn: slugs }, isActive: true },
    select: { slug: true },
  });
  if (gone.length) {
    await prisma.model.updateMany({ where: { slug: { in: gone.map((m) => m.slug) } }, data: { isActive: false } });
  }
  return gone.map((m) => m.slug);
}
