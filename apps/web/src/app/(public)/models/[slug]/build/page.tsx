import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  prisma,
  ColorType,
  type Color,
  type Model,
  type Option,
  type OptionOnTrim,
  type Trim,
  type TrimColor,
} from "@dealership/db";
import { auth } from "@/server/auth";
import { ConfiguratorClient, type ConfiguratorModel } from "./configurator-client";

export const dynamic = "force-dynamic";

type FullTrim = Trim & {
  options: (OptionOnTrim & { option: Option })[];
  trimColors: (TrimColor & { color: Color })[];
};
type FullModel = Model & { trims: FullTrim[] };

async function getModel(slug: string): Promise<FullModel | null> {
  return prisma.model.findUnique({
    where: { slug },
    include: {
      trims: {
        orderBy: [{ displayOrder: "asc" }, { price: "asc" }],
        include: {
          options: { include: { option: true } },
          trimColors: { include: { color: true } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await prisma.model.findUnique({
    where: { slug },
    select: { name: true, year: true, heroImage: true },
  });
  if (!model) return { title: "Configure" };
  return {
    title: `Build your ${model.year} ${model.name}`,
    description: `Configure trim, colour, interior, and options for the ${model.name}.`,
    openGraph: {
      title: `Build your ${model.year} ${model.name}`,
      images: [{ url: model.heroImage }],
    },
  };
}

export default async function BuildPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const [model, session] = await Promise.all([getModel(slug), auth()]);
  if (!model || model.trims.length === 0) notFound();

  const serializable: ConfiguratorModel = {
    id: model.id,
    slug: model.slug,
    name: model.name,
    year: model.year,
    heroImage: model.heroImage,
    currency: model.currency,
    trims: model.trims.map((t, i) => ({
      id: t.id,
      name: t.name,
      price: t.price.toString(),
      displayOrder: t.displayOrder,
      // Visual hint only — top-priced trim gets the sport wheels in the 3D preview.
      wheelStyle:
        i === model.trims.length - 1 && model.trims.length > 1 ? "sport" : "standard",
      features: t.features,
      seats: t.seats,
      doors: t.doors,
      horsepower: t.horsepower,
      drivetrain: t.drivetrain,
      fuelType: t.fuelType,
      transmission: t.transmission,
      exteriorColors: t.trimColors
        .filter((tc) => tc.color.type === ColorType.EXTERIOR)
        .map((tc) => ({
          id: tc.color.id,
          name: tc.color.name,
          hexCode: tc.color.hexCode,
          isMetallic: tc.color.isMetallic,
          upcharge: tc.upcharge.toString(),
        })),
      interiorColors: t.trimColors
        .filter((tc) => tc.color.type === ColorType.INTERIOR)
        .map((tc) => ({
          id: tc.color.id,
          name: tc.color.name,
          hexCode: tc.color.hexCode,
          isMetallic: tc.color.isMetallic,
          upcharge: tc.upcharge.toString(),
        })),
      standardFeatures: t.options
        .filter((o) => o.isStandard)
        .map((o) => ({ id: o.option.id, name: o.option.name })),
      options: t.options
        .filter((o) => !o.isStandard)
        .map((o) => ({
          id: o.option.id,
          name: o.option.name,
          description: o.option.description ?? null,
          category: o.option.category,
          price: o.option.price.toString(),
          image: o.option.image ?? null,
        })),
    })),
  };

  return (
    <ConfiguratorClient
      model={serializable}
      isSignedIn={Boolean(session?.user)}
    />
  );
}
