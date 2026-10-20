import type { MetadataRoute } from "next";
import { prisma, StockStatus } from "@dealership/db";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const STATIC: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/models", priority: 0.9, changeFrequency: "weekly" },
  { path: "/stock", priority: 0.9, changeFrequency: "daily" },
  { path: "/build", priority: 0.8, changeFrequency: "weekly" },
  { path: "/test-drive", priority: 0.8, changeFrequency: "monthly" },
  { path: "/financing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/financing/apply", priority: 0.6, changeFrequency: "monthly" },
  { path: "/trade-in", priority: 0.7, changeFrequency: "monthly" },
  { path: "/after-sales", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/about/team", priority: 0.4, changeFrequency: "yearly" },
  { path: "/careers", priority: 0.4, changeFrequency: "monthly" },
  { path: "/press", priority: 0.3, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC.map((s) => ({
    url: `${base}${s.path}`,
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));

  try {
    const [models, units, posts] = await Promise.all([
      prisma.model.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.stockUnit.findMany({
        where: { status: { in: [StockStatus.AVAILABLE, StockStatus.IN_TRANSIT] } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { publishedAt: { not: null, lte: new Date() } },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    for (const m of models) {
      entries.push({ url: `${base}/models/${m.slug}`, lastModified: m.updatedAt, priority: 0.8 });
      entries.push({ url: `${base}/models/${m.slug}/build`, lastModified: m.updatedAt, priority: 0.6 });
    }
    for (const u of units) {
      entries.push({ url: `${base}/stock/${u.slug}`, lastModified: u.updatedAt, priority: 0.7 });
    }
    for (const p of posts) {
      entries.push({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 });
    }
  } catch {
    // Without a DB, still serve the static routes.
  }
  return entries;
}
