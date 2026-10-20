import type { Role } from "@prisma/client";

/**
 * Editorial + account seed data, kept apart from the vehicle catalogue in
 * `seed.ts` so the long-form copy doesn't drown out the inventory logic.
 *
 * Blog `content` uses a deliberately tiny markup that the web app renders
 * without a Markdown dependency:
 *   - blank line  → paragraph break
 *   - "## Title"  → section heading
 *   - "- item"    → bullet list item (consecutive lines form one list)
 *   - "> quote"   → pull quote
 */

const img = (id: string): string =>
  `https://images.unsplash.com/${id}?w=1600&q=85&auto=format&fit=crop`;

export interface BlogPostSeed {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  publishedAt: string;
  tags: string[];
  metaDescription: string;
  content: string;
}

export const BLOG_POSTS: BlogPostSeed[] = [
  {
    slug: "what-changes-when-you-go-electric",
    title: "What changes when you go electric — and what doesn't",
    excerpt:
      "We took a Lumen EV up to Genting and back over a long weekend. Here's an honest read on charging, range, and what your daily routine actually looks like in the Klang Valley.",
    coverImage: img("photo-1671785253964-bdb43087ed99"),
    authorName: "Aisyah Rahman",
    publishedAt: "2026-04-22T09:00:00+08:00",
    tags: ["Electric", "Ownership", "Lumen EV"],
    metaDescription:
      "An honest, long-weekend look at owning an EV in Malaysia — charging at home and on the road, real-world range, and running costs.",
    content: `Most of the questions we hear about electric cars aren't really about the car. They're about routine: where you'll charge, how far you can go, and whether a trip up a mountain on a public holiday will end with you stranded at a rest stop. So we booked out a Lumen EV Long Range for four days and drove it the way our customers do.

## The daily drive barely changes

From a condo in Mont Kiara to an office in Bangsar South, the Lumen used between 9 and 11 percent of its battery a day — traffic included. Regenerative braking does a lot of the work in stop-start jams, which is exactly where a petrol engine is least efficient.

If you have a parking bay with a dedicated charger, you will almost never visit a public station on weekdays. Plug in overnight on a 7 kW wallbox and you wake up to a full battery every morning.

- Typical weekday use: 35–55 km
- Overnight top-up on a 7 kW wallbox: roughly 2 hours
- Approximate home electricity cost: RM 4–6 per day on a domestic tariff

## The long weekend takes a little planning

Genting Highlands is a 1,700-metre climb, and climbing is where batteries work hardest. We left KL at 92 percent and arrived at the top with 71 percent. On the way down, regeneration recovered almost a third of what we had spent.

> The descent is the part nobody tells you about. You arrive at the bottom with more range than you expected.

We stopped once on the North–South Expressway to fast-charge from 38 to 80 percent. It took 24 minutes — long enough for a teh tarik and a roti canai, not long enough to get bored.

## What doesn't change

Servicing still matters. Tyres, brakes, cabin filters, and the 12-volt battery all need attention. The difference is that there is no oil to change and far fewer moving parts to wear. Our EV service plan is priced accordingly.

The cars also still need to be test-driven. Instant torque feels different to a petrol engine, and one-pedal driving takes about ten minutes to get used to. Book a drive, and we'll take you on a route that includes a proper climb.`,
  },
  {
    slug: "first-1000-km-aurora-suv",
    title: "The first 1,000 km in an Aurora SUV",
    excerpt:
      "A weekend run-in is one thing — a thousand klicks of school runs and a Penang trip is another. Notes on cabin noise, ride quality, and the things that only show up after a month.",
    coverImage: img("photo-1562705841-c4934bb2b31b"),
    authorName: "Daniel Tan",
    publishedAt: "2026-04-09T09:00:00+08:00",
    tags: ["Aurora SUV", "Long-term test", "Family"],
    metaDescription:
      "A month and 1,000 km with the Aurora SUV hybrid: cabin noise, ride comfort, real-world fuel economy, and what a family actually uses.",
    content: `A test drive tells you whether you like a car. A month tells you whether you can live with it. We handed an Aurora SUV Premium to one of our sales consultants and his family of five, and asked them to keep notes.

## Week one: the school run

The first thing the family noticed was the quiet. At low speeds the hybrid system runs on electric power alone, so the morning run through Petaling Jaya happens in near-silence. The second thing they noticed was the third row — usable for children, and folds flat in about four seconds when it isn't needed.

## Week two: the highway

A Friday-night drive to Penang is the real test of a family car. Over 360 km of the North–South Expressway, the Aurora averaged 16.8 km/L with the air-conditioning set to 22°C and five people on board. Adaptive cruise control did most of the work between Ipoh and Butterworth.

- Average economy over 1,000 km: 15.9 km/L
- Longest single stint: 4 hours 10 minutes
- Complaints from the back row: one, about the cup holders

## Week three: the little things

After a few weeks the details start to matter. The wireless charging pad keeps a phone cool, which matters in Malaysian heat. The powered tailgate can be opened with a foot under the rear bumper — useful with a toddler in one arm. The 360° camera made the narrow car park at Gurney Plaza a non-event.

## Week four: what we'd change

Not everything is perfect. The infotainment takes a few seconds to wake on a cold start, and the second-row USB ports are only USB-C. Neither is a deal-breaker, and both are the kind of thing you only learn after a month. That's why we publish these notes.`,
  },
  {
    slug: "service-without-the-surprise",
    title: "Service without the surprise: what we cover, plainly",
    excerpt:
      "Five years, unlimited kilometres, no asterisks. We break down what an after-sales package actually pays for and where most owners are still paying out of pocket.",
    coverImage: img("photo-1487754180451-c456f719a1fc"),
    authorName: "Farid Ismail",
    publishedAt: "2026-03-28T09:00:00+08:00",
    tags: ["After-sales", "Warranty", "Ownership"],
    metaDescription:
      "Exactly what our warranty and complimentary service plan cover, what they don't, and how to keep your cover valid.",
    content: `Warranty brochures are written by lawyers. This article is written by our service manager, and it says the same thing in fewer words.

## What's included with every new car

- Five-year, unlimited-mileage manufacturer warranty
- Eight-year battery warranty on hybrid and electric models
- Three years of scheduled servicing: parts, lubricants, and labour
- 24-hour roadside assistance anywhere in Peninsular Malaysia

## What the service plan pays for

Every scheduled service on the maintenance calendar is covered — oil and filter changes, brake fluid, coolant, cabin and engine air filters, spark plugs where applicable, and the full multi-point inspection. You pay nothing at the counter for those visits.

## What you still pay for

Wear-and-tear parts are not covered by any manufacturer warranty, here or anywhere else. That means tyres, brake pads and discs, wiper blades, and bulbs. We'd rather tell you now than at the service desk.

> If a part fails because it was badly made, that's our problem. If it wears out because it did its job, that's maintenance.

## Keeping your cover valid

Service your car on schedule — every 10,000 km or 6 months, whichever comes first — at any authorised service centre. Keep the digital service record we send after each visit. That's it. You don't need to use our showroom, and you don't need to buy accessories from us.

Book a service any time by WhatsApp or through your account. Courtesy cars are available for any job expected to take longer than four hours.`,
  },
  {
    slug: "how-hire-purchase-works-in-malaysia",
    title: "How hire-purchase actually works in Malaysia",
    excerpt:
      "Flat rates, effective rates, and why the number on the brochure isn't the number on your statement. A plain-language guide to financing a new car.",
    coverImage: img("photo-1556761175-5973dc0f32e7"),
    authorName: "Mei Ling Wong",
    publishedAt: "2026-03-12T09:00:00+08:00",
    tags: ["Financing", "Guides"],
    metaDescription:
      "A plain-language guide to Malaysian car hire-purchase: flat vs effective rates, down payments, tenure, and what banks look at.",
    content: `Almost every new car in Malaysia is bought on hire-purchase. The process is straightforward once you understand how the interest is calculated — which is different from most other loans.

## Flat rate, not reducing balance

Malaysian car loans quote a flat interest rate. Interest is calculated on the original loan amount for the full tenure, then spread evenly across every monthly instalment. A 2.5% flat rate over nine years works out to an effective annual rate of roughly 4.6%.

Our financing calculator uses the same flat-rate method the banks do, so the monthly figure you see is the one you'll be quoted.

## The four numbers that matter

- Vehicle price — the on-the-road price, including registration and road tax
- Down payment — at least 10% of the price; more reduces your instalment and interest
- Tenure — up to nine years for new cars
- Interest rate — typically between 2.2% and 3.5% flat, depending on your profile

## What banks look at

Banks assess your debt service ratio: the share of your monthly income already committed to loans. Most will approve if total commitments, including the new car, stay under 60–70% of net income. They will also ask for your IC, three months of payslips, and recent bank statements.

## How we help

We submit one application to several panel banks at once and come back with the best offer — usually within two working days. There's no fee for this, and no obligation to accept.`,
  },
];

export interface UserSeed {
  email: string;
  name: string;
  phone: string;
  role: Role;
  /** Plain-text password, hashed at seed time. Dev/demo only. */
  password: string;
}

/**
 * Demo accounts. Passwords can be overridden through env vars so a shared
 * staging database never ends up with the documented defaults.
 */
export function seedUsers(): UserSeed[] {
  return [
    {
      email: "admin@dealership.my",
      name: "Showroom Admin",
      phone: "+60123456789",
      role: "ADMIN",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!",
    },
    {
      email: "customer@example.com",
      name: "Demo Customer",
      phone: "+60198765432",
      role: "CUSTOMER",
      password: process.env.SEED_CUSTOMER_PASSWORD ?? "Customer12345!",
    },
  ];
}
