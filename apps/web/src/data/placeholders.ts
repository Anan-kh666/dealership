/**
 * Hardcoded placeholder content for the homepage. Replaced as feature data
 * lands in the database.
 *
 * Already replaced:
 * - `lineup` / `Model` — the homepage Lineup section now reads from
 *   `prisma.model` (see seed at `packages/db/prisma/seed.ts`).
 *
 * Still placeholder until the relevant feature agent ships:
 * - `inStock` / `StockUnit` — the Available Now homepage row. The
 *   stock-data agent will replace this with `StockUnit` rows.
 * - `bodyTypes` — homepage filter shortcuts (display-only).
 * - `blogPosts` / `BlogPost` — the blog teaser row.
 * - `HERO_IMAGE`, `FINANCING_IMAGE` — section background imagery.
 *
 * Names imply but do not infringe — pure fiction.
 */

export type StockUnit = {
  slug: string;
  trim: string;
  colorName: string;
  colorHex: string;
  price: string;
  image: string;
  alt: string;
  badge: "available" | "in-transit" | "arriving-soon";
};

export const inStock: StockUnit[] = [
  {
    slug: "aurora-suv-pearl-2026",
    trim: "Aurora SUV Premium",
    colorName: "Pearl White",
    colorHex: "#EEEAE1",
    price: "RM 178,800",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=85&auto=format&fit=crop",
    alt: "Aurora SUV Premium in pearl white, side profile",
    badge: "available",
  },
  {
    slug: "meridian-1-5-graphite",
    trim: "Meridian 1.5 Executive",
    colorName: "Graphite",
    colorHex: "#2A2A2A",
    price: "RM 102,400",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=85&auto=format&fit=crop",
    alt: "Meridian Executive sedan in graphite, three-quarter rear",
    badge: "available",
  },
  {
    slug: "lumen-ev-bronze",
    trim: "Lumen EV Long Range",
    colorName: "Sienna Bronze",
    colorHex: "#B08D57",
    price: "RM 226,500",
    image:
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&q=85&auto=format&fit=crop",
    alt: "Lumen EV Long Range in sienna bronze",
    badge: "in-transit",
  },
  {
    slug: "halcyon-cx-deep-blue",
    trim: "Halcyon CX Sport",
    colorName: "Deep Marine",
    colorHex: "#1F2C3A",
    price: "RM 149,900",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85&auto=format&fit=crop",
    alt: "Halcyon CX Sport crossover in deep marine blue",
    badge: "arriving-soon",
  },
];

export type BodyTypeFilter = {
  label: string;
  query: string;
  icon: "Car" | "CarFront" | "Truck" | "Zap";
};

export const bodyTypes: BodyTypeFilter[] = [
  { label: "Sedan", query: "Sedan", icon: "Car" },
  { label: "SUV", query: "SUV", icon: "CarFront" },
  { label: "Hatchback", query: "Hatchback", icon: "Truck" },
  { label: "Electric", query: "EV", icon: "Zap" },
];

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  alt: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "what-changes-when-you-go-electric",
    title: "What changes when you go electric — and what doesn't",
    excerpt:
      "We took a Lumen EV up to Genting and back over a long weekend. Here's an honest read on charging, range, and what your daily routine actually looks like in Klang Valley.",
    date: "April 22, 2026",
    readTime: "6 min read",
    image:
      "https://images.unsplash.com/photo-1671785253964-bdb43087ed99?w=1200&q=85&auto=format&fit=crop",
    alt: "White electric vehicle connected to a public charging station",
  },
  {
    slug: "first-1000-km-aurora-suv",
    title: "The first 1,000 km in an Aurora SUV",
    excerpt:
      "A weekend run-in is one thing — a thousand klicks of Bangsar school runs and weekend Penang trips is another. Notes on cabin noise, ride quality, and the things that only show up after a month.",
    date: "April 9, 2026",
    readTime: "8 min read",
    image:
      "https://images.unsplash.com/photo-1562705841-c4934bb2b31b?w=1200&q=85&auto=format&fit=crop",
    alt: "Black SUV travelling along an open dirt road at first light",
  },
  {
    slug: "service-without-the-surprise",
    title: "Service without the surprise: what we cover, plainly",
    excerpt:
      "Five years, sixty thousand kilometres, no asterisks. We break down what an after-sales package actually pays for and where most owners are still paying out of pocket.",
    date: "March 28, 2026",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&q=85&auto=format&fit=crop",
    alt: "Technician's hands topping up engine oil during a service inspection",
  },
];

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2400&q=85&auto=format&fit=crop";

export const FINANCING_IMAGE =
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&q=85&auto=format&fit=crop";
