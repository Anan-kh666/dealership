# Build notes — monorepo foundation

This document captures what was scaffolded in the foundation pass, what each
follow-up agent will need before they can start, and the decisions made along
the way.

## What was created

### Root

- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.npmrc`
- `.gitignore`, `.env.example`
- `.github/workflows/ci.yml` — install/lint/typecheck/build matrix on Node 20
- `README.md`, `BUILD_NOTES.md`

### `packages/config`

- Shared flat ESLint config (TypeScript + React + Prettier-compatible)
- `tsconfig.base.json`, `tsconfig.next.json`, `tsconfig.node.json`
- Prettier config
- Tailwind v4 preset (`tailwind-preset.css`) with neutral-leaning oklch tokens
  and font-family CSS variables wired to the apps' `next/font` setup

### `packages/db`

- Full Prisma schema as specified in the brief — all 16 models and 12 enums
- `src/index.ts` exports a `PrismaClient` singleton via the `globalThis`
  pattern to avoid hot-reload connection leaks
- `prisma/seed.ts` is a placeholder that logs "seed not implemented yet"
- Scripts: `db:generate`, `db:migrate:dev`, `db:migrate:deploy`, `db:studio`,
  `db:seed`

### `packages/types`

- Zod enums mirroring every Prisma enum
- Zod model schemas for every Prisma model (Decimal columns are typed as
  branded numeric strings to round-trip cleanly with Postgres)
- Form schemas for `vehicleFilters`, `testDriveBooking`, `financeApplication`,
  `tradeInSubmission`, `inquiry`
- `phone`, `email`, `cuid`, `decimalString`, `isoDateTime`, `url` primitives

### `packages/ui`

- shadcn `components.json` configured for the new-york style + neutral palette
- shadcn primitives: `Button`, `Input`, `Label`, `Select`, `Dialog`
- `cn()` utility (clsx + tailwind-merge)
- `styles.css` re-exports Tailwind v4 + the shared preset

### `apps/web` (Next.js 15, App Router)

- Strict TypeScript, RSC by default
- Tailwind v4 via `@tailwindcss/postcss`
- Folder structure: `app/(public)/`, `app/(auth)/`, `app/account/`, `app/admin/`
- Root layout with site header (logo + Models / Stock / Build / Test Drive nav)
  and footer
- Fonts: Fraunces (display) + Geist (body) via `next/font/google`
- Placeholder homepage at `app/(public)/page.tsx`
- `not-found.tsx` and `error.tsx` boundaries
- `next.config.ts` with image remote patterns for Cloudflare R2 and Cloudinary
- Auth.js v5 scaffolded in `src/server/auth.ts` — config + types only,
  providers list is empty
- `src/server/api-client.ts` thin fetch wrapper to the Fastify API

### `apps/api` (Fastify)

- Strict TypeScript, ESM
- Pino logger (pretty-printed in dev)
- `@fastify/cors` allowing the web origin from `AUTH_URL`
- `fastify-type-provider-zod` wired for validation/serialization
- `GET /health` returning `{ status: "ok", timestamp }`
- Route folders `routes/public/`, `routes/customer/`, `routes/admin/` with
  empty plugin scaffolds
- Graceful shutdown on `SIGINT` / `SIGTERM`
- Listens on `process.env.PORT || 4000`
- Smoke test in `src/server.test.ts` exercising `/health` via `inject`

## Environment variables that next agents must set

Copy `.env.example` to `.env` and fill in:

| Var | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | All DB work | Neon Postgres connection string. Required for `db:migrate:dev`. |
| `AUTH_SECRET` | Auth flows | `openssl rand -base64 32`. Needed once the auth-flows agent wires up sessions. |
| `AUTH_URL` | Auth + CORS | Defaults to `http://localhost:3000` for local dev. |
| `RESEND_API_KEY` | Transactional email | Reserved — no sends wired yet. |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` | Image upload | Reserved — no upload paths wired yet. |
| `NEXT_PUBLIC_API_URL` | Web ↔ API | Defaults to `http://localhost:4000`. |
| `REDIS_URL` | Reserved | Optional; not used yet. |
| `PORT` | API | Defaults to `4000`. |

## Decisions and conventions

- **Decimal handling** — Prisma `Decimal` columns are serialized as numeric
  strings on the wire and validated by a `decimalString` brand in
  `@dealership/types`. This avoids JS-number precision loss for prices.
- **Auth providers** — left empty intentionally; the auth-flows agent picks
  the strategy (credentials vs. magic-link vs. OAuth) and wires the Prisma
  adapter.
- **Tailwind v4** — using CSS-first configuration via `@theme` blocks rather
  than `tailwind.config.ts`. The shared preset lives at
  `packages/config/src/tailwind-preset.css` and is imported through
  `@dealership/ui/styles.css`.
- **shadcn install** — primitives are checked in directly under
  `packages/ui/src/components/` rather than re-running `shadcn add` per app.
  Consumers import via package exports (`@dealership/ui/components/button`).
- **No `any`** — `noUncheckedIndexedAccess` and `strict` are on at the base
  tsconfig level. ESLint forbids `any`. Prefer `unknown` and narrow.
- **Generated Prisma client** is gitignored under `packages/db/src/generated/`
  if the agent that wires migrations chooses to relocate it; today the default
  output is used.
- **Conventional Commits** — final foundation commit is
  `chore: scaffold monorepo foundation`.

## Design system

The first design pass landed alongside the homepage. Aesthetic direction is
"Editorial Premium" — Polestar.com meets Porsche.com — graphite + warm
off-white surfaces with a single bronze accent.

### Tokens — single source of truth

- `packages/ui/src/tokens.ts` exports tokens for non-CSS consumers (Framer
  Motion configs, server renderers).
- `packages/config/src/tailwind-preset.css` mirrors them inside the Tailwind v4
  `@theme` block. **If you change one side, change the other.**

Tokens cover: brand colors (graphite, surface-warm, bronze accent + accent-deep),
a 50–900 neutral scale, semantic success/warning/error, font families wired to
`next/font` CSS variables, display letter-spacing of `-0.02em`, four shadow
levels (`--shadow-1` through `--shadow-4`), radii (sm 6 / md 10 / lg 16 / xl 24),
motion durations (quick 150ms, standard 250ms, reveal 400ms) and easings.

We did not introduce new spacing stops — Tailwind v4's default 4px scale
already covers the brief's 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 stops
via `p-1` … `p-32`.

### Components added in `packages/ui`

Built alongside (not replacing) the existing shadcn primitives:

- `components/container.tsx` — max-width 1440px with responsive horizontal
  padding (16 / 24 / 48). Polymorphic `as` prop.
- `components/section.tsx` — vertical rhythm wrapper. `variant` (default | warm
  | dark) and `spacing` (tight | default | loose).
- `components/brand-button.tsx` — `BrandButton` with editorial-premium variants
  and sm/md/lg sizes. Built on Radix Slot, uses brand tokens directly. The
  shadcn `Button` is left untouched — it remains the unstyled foundation.

  **Variant visibility audit** (every variant must be legible against every
  Section background unless flagged hero-only):

  | Variant     | White bg | Warm bg | Dark bg | Notes |
  | ---         | :---:    | :---:   | :---:   | --- |
  | `primary`   | ✓        | ✓       | ✓       | Bronze fill, white text. |
  | `secondary` | ✓        | ✓       | ✓       | Graphite fill, white text. |
  | `ghost-dark`| ✓        | ✓       | ✗       | Graphite outline. Light backgrounds only. |
  | `hero-only` | ✗        | ✗       | ✓       | White outline. Use only over a dark image hero or `Section variant="dark"`. |
- `components/card.tsx` — base card + `CardHeader` / `CardTitle` /
  `CardContent`. Optional `interactive` flag for hover-lift.
- `components/model-card.tsx` — composition for the model lineup. Accepts the
  image as a `ReactNode` slot (so apps pass `next/image`) and an optional
  `linkComponent` (so apps pass `next/link`) — keeps the package
  framework-agnostic.
- `components/stock-card.tsx` — same pattern, with badge variants (`available`
  / `in-transit` / `arriving-soon`).

The `cn` import inside the new components drops the `.js` extension because
Next.js webpack does not resolve it under `transpilePackages`. The existing
shadcn primitives still use `.js` — leave them until they are actually
imported by an app.

**Tailwind v4 source scanning.** Tailwind v4's auto-detection does not reach
into workspace packages by default — classes that only appear inside
`packages/ui/src/components/*.tsx` (e.g. the BrandButton color variants)
get silently dropped. `packages/ui/src/styles.css` adds explicit `@source`
directives for `./components` and `./lib`. If you add another source folder
to the package, add a matching `@source` line.

### Homepage — `apps/web/src/app/(public)/page.tsx`

Sections, top to bottom: `Hero` → `Lineup` → `FindMatch` → `AvailableNow` →
`Financing` → `TrustStrip` → `BlogTeaser`. Footer is layout-level.

Notable decisions:

- **Header** is a Client Component (`apps/web/src/components/site-header.tsx`)
  with a `scrollY > 80` listener that swaps it from transparent (over the
  hero) to white-with-shadow (after scroll), shrinking from 80px to 64px. The
  layout, footer, and all sections remain server-rendered.
- **Header is `fixed`** (was `sticky`) so it can overlay the full-bleed hero.
  Routes without a full-bleed hero need their own top padding — downstream
  agents should add `pt-20` to their wrappers.
- **Framer Motion** is used in three places, per the brief: hero text reveal
  (staggered children, 80ms delay, 400ms duration), section reveals on scroll
  (`apps/web/src/components/reveal.tsx` — opacity + 8px translate, viewport
  `once: true`), and ModelCard hover (CSS-only, see component). Reduced motion
  is respected via `useReducedMotion`.
- **Carousels** (mobile lineup, desktop+mobile available-now) are CSS-only
  using `snap-x snap-mandatory` + `overflow-x-auto`. The available-now row
  uses `min-w-[calc((100%-72px)/4)]` on desktop so the fourth card peeks.
- **Placeholder data** lives in `apps/web/src/data/placeholders.ts` —
  `lineup`, `inStock`, `bodyTypes`, `blogPosts`, plus `HERO_IMAGE` and
  `FINANCING_IMAGE`. Names ("Meridian", "Aurora", "Halcyon CX", "Lumen EV",
  "Continental GT 2026") are fictional. Replace this file once the
  models/stock agents seed the database.
- **Image domain**: `images.unsplash.com` was added to
  `apps/web/next.config.ts` `remotePatterns`.

### New runtime dependencies

- `framer-motion` — added to `apps/web` for hero reveal and scroll-triggered
  section reveals.
- `lucide-react` — added to `apps/web` directly (was previously only a
  `packages/ui` dependency) so the icon imports inside app-level homepage
  components don't reach across the workspace boundary at build time.

## Models pages

The public-facing model browse + detail pages live at:

- `apps/web/src/app/(public)/models/page.tsx` — browse grid with filter
  chips (`bodyType`, `fuelType` URL params). Server Component; chips are a
  client island (`apps/web/src/components/models/filter-chips.tsx`).
- `apps/web/src/app/(public)/models/[slug]/page.tsx` — full detail page:
  hero gallery (client island), title block, highlights, trim comparison,
  specs accordion, image grid (client island, lightbox), CTA banner,
  similar models. Includes `generateMetadata` and Vehicle JSON-LD.

Both pages query Prisma directly via the `@dealership/db` singleton — no
intermediate fetch hop. Both are `dynamic = "force-dynamic"` so the build
does not require a live `DATABASE_URL`.

### Data-fetching pattern

| Surface | Source | Why |
| --- | --- | --- |
| Next.js Server Components | `prisma` direct from `@dealership/db` | SSR speed — no HTTP roundtrip. |
| Mobile / third-party / admin | Fastify routes under `/public/models` | Stable JSON contract, Zod-validated. |

Both consumers exist intentionally. Don't proxy one through the other.

### Public Fastify routes

Registered in `apps/api/src/routes/public/models.ts` and mounted under the
existing `/public` prefix (set in `apps/api/src/server.ts`):

- `GET /public/models` — list. Zod-validated query: `bodyType`, `fuelType`,
  `priceMax`, `make`. Returns model summary + first image + trim count.
- `GET /public/models/:slug` — full model with trims (options + colors) and
  ordered images. 404 on miss.

Decimal columns are stringified before serialization (Prisma `Decimal` →
string, matching the `decimalString` brand in `@dealership/types`).

### Reusable UI components added

In `packages/ui/src/components/`:

- `accordion.tsx` — Radix Accordion wrapped to brand tokens. Adds the
  `@radix-ui/react-accordion` runtime dep.
- `spec-row.tsx` — label / value row with optional trim tag, used in the
  trim comparison and the specs accordion.

The shadcn `dialog.tsx` import path was changed from `../lib/cn.js` to
`../lib/cn` so it resolves under `transpilePackages` when the new image
gallery imports it. The other shadcn primitives still keep `.js` until
they're imported by an app.

## Seed data

`packages/db/prisma/seed.ts` now seeds 5 Malaysian-market models matching
the names already in `apps/web/src/data/placeholders.ts`:

- Meridian 1.5 (sedan, RM 96,800 — 2 trims)
- Aurora SUV (family SUV hybrid, RM 168,000 — 3 trims)
- Halcyon CX (compact crossover hybrid, RM 142,500 — 2 trims)
- Lumen EV (electric sedan, RM 218,000 — 3 trims)
- Continental GT 2026 (flagship coupé, RM 488,000 — 2 trims)

Inventory: **5 models · 12 trims · 12 shared options · ~9 colors · ~32
images · trim-color upcharges (Pearl White +0, metallic / Deep Marine
+RM 1,500, premium accent +RM 3,500)**.

The seed is idempotent — it deletes-then-recreates each model by slug so
re-running `pnpm db:seed` is safe. Image URLs are reused from the
already-verified `placeholders.ts` set so we don't reintroduce the
broken-Unsplash issue from earlier commits. **Do not** add
`plus.unsplash.com` URLs — they 401 in production.

### How to run the seed

```bash
# 1. Make sure DATABASE_URL is set in .env (Postgres 16 recommended).
cp .env.example .env
# edit DATABASE_URL — for local dev:
#   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16
#   then DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres

# 2. Generate the Prisma client (only required once after schema changes):
pnpm db:generate

# 3. Apply the migration. The first init migration SQL is checked in at
#    packages/db/prisma/migrations/0001_init/migration.sql — running
#    db:migrate:dev will create _prisma_migrations and run it.
pnpm db:migrate:dev

# 4. Seed.
pnpm db:seed
```

### What was assumed because Docker / DATABASE_URL was unavailable

- The seed has not been executed against a real database in this branch.
  Code and types compile (`pnpm typecheck`, `pnpm build` both green),
  but the next operator should run `pnpm db:migrate:dev && pnpm db:seed`
  once a Postgres instance is reachable.
- The initial migration SQL was generated up-front via
  `prisma migrate diff --from-empty --to-schema-datamodel` so the
  migration is already on disk; `db:migrate:dev` will apply it.

## Homepage updates

- `apps/web/src/components/home/lineup.tsx` is now an async Server
  Component fetching from `prisma.model` directly. The mobile snap-scroll
  and desktop grid layouts are preserved.
- `apps/web/src/components/site-footer.tsx` is async and pulls
  `{ slug, name }` from `prisma.model` for the Vehicles column. It
  catches DB errors and degrades gracefully (renders without the column
  links) so the layout still works during local dev without `DATABASE_URL`.
- The homepage page (`apps/web/src/app/(public)/page.tsx`) is marked
  `dynamic = "force-dynamic"` for the same reason.
- `apps/web/src/data/placeholders.ts` no longer exports `lineup` or the
  `Model` type. Still placeholder until other agents land:
  `inStock`/`StockUnit` (Available Now row), `bodyTypes` (homepage
  filter shortcuts), `blogPosts`, `HERO_IMAGE`, `FINANCING_IMAGE`. Header
  comment in the file enumerates this.

## Stock pages

The public stock inventory pages live at:

- `apps/web/src/app/(public)/stock/page.tsx` — browse grid with a sidebar
  filter (model, trim, body type, fuel type, exterior color, price range,
  monthly-payment range), sort dropdown, and "Load more" pagination
  (24 per page). The sidebar is a client island
  (`apps/web/src/components/stock/filter-sidebar.tsx`); on mobile it
  appears inside a bottom-sheet drawer triggered by a "Filters" button.
- `apps/web/src/app/(public)/stock/[slug]/page.tsx` — full detail page:
  image gallery (client island), quick-facts row, title block, three CTAs
  (Test Drive / Get Financing / Reserve-or-Inquire dialog), tabbed content
  (overview, specs, what's included), finance widget placeholder, trust
  strip, similar in-stock units, sticky desktop top bar, sticky mobile CTA
  bar, JSON-LD `Vehicle` + `Offer`, and `generateMetadata`. `notFound()`
  on missing slug.

Both pages query Prisma directly via `@dealership/db` for SSR speed and
are marked `dynamic = "force-dynamic"` so the build doesn't require a
live `DATABASE_URL`.

The public list hides `SOLD` and `RESERVED` units by default — only
`AVAILABLE` and `IN_TRANSIT` are visible.

### Similar-units logic — page, not API

The "similar in-stock units" block on the detail page computes its own
results inside the Server Component (three Prisma queries, narrowing
each round). Reasoning: keeping it on the page lets the SSR fetch
finish in one render with no API hop, and there is no other consumer
yet that needs the same logic. If a mobile client later needs it,
extract to `apps/api/src/routes/public/stock.ts`.

### In-memory rate-limit fallback

Both the Fastify `POST /public/inquiries` route and the Next.js
`POST /api/public/inquiries` route handler enforce **5 requests per IP
per hour**. The Next handler uses an in-process `Map` because the web
app is a single-instance Next server today; the Fastify route uses
`@fastify/rate-limit` with its in-memory store. Both should switch to a
shared Redis backend once `REDIS_URL` is wired (the Fastify rate-limit
plugin accepts a `redis` client option; the Next handler should be
swapped for an Upstash-style limiter or moved behind the Fastify route).

The `POST /public/stock/:id/view` endpoint similarly tracks "1 view per
IP per stock unit per hour" via an in-memory `Map` with a 5-minute
sweeper, ready to be swapped for Redis.

### Public Fastify routes

Registered in `apps/api/src/routes/public/`:

- `GET /public/stock` — Zod-validated query: `model`, `trim`, `bodyType`,
  `fuelType`, `color`, `priceMin`, `priceMax`, `sort`
  (`newest` / `price-asc` / `price-desc` / `days-on-lot`), `page`,
  `limit` (default 24, max 48), `includeUnavailable` (default false).
  Returns `{ items, total, hasMore }`. Each item includes trim+model,
  exterior color, and the first image.
- `GET /public/stock/:slug` — full stock unit with trim (model + options),
  exterior + interior color, all images.
- `POST /public/inquiries` — Zod-validated; rate-limited 5/IP/hour.
- `POST /public/stock/:id/view` — increments `StockUnit.views`
  fire-and-forget; rate-limited to 1 per IP per stock unit per hour
  (in-memory until Redis is added).

The `@fastify/rate-limit` plugin is registered globally for the public
plugin scope with `global: false`, so individual routes opt in via
`config.rateLimit`.

### Seed inventory

`packages/db/prisma/seed.ts` now appends **15 stock units across 5
models**:

- Meridian 1.5 — 4 units (Standard / Executive, mixed colors)
- Aurora SUV — 3 units (Comfort / Premium / Reserve)
- Halcyon CX — 3 units (Active / Sport)
- Lumen EV — 2 units (Long Range / Performance)
- Continental GT — 3 units (GT V8 / GT Speed)

Status distribution: 11 `AVAILABLE`, 2 `IN_TRANSIT`, 1 `RESERVED`,
1 `SOLD` so every status renders somewhere on the public surface.
VINs are deterministic (`WBA{model_code}{year}{seq}`, 17 chars) and
stock units are upserted by `vin` so re-running is safe.

Stock units carry no schema-level cascade from `Trim`, so the model
rebuild step now wipes `stockImage` and `stockUnit` first; the
upsert re-creates everything cleanly.

### New components in `packages/ui`

- `slider.tsx` — wraps `@radix-ui/react-slider` (added as a runtime dep)
  with the brand tokens. Used for both range sliders in the filter
  sidebar.
- `color-swatch.tsx` — round swatch with optional click handler and
  selection ring. Sizes: `sm` / `md` / `lg`.
- `status-badge.tsx` — pill for `StockStatus`, with optional
  `daysOnLot` (surfaces "Xd on lot" once past 14 days) and
  `daysUntilDelivery` (composes "Arriving in X days" for IN_TRANSIT).
- `filter-drawer.tsx` — Radix-Dialog-based bottom-sheet wrapper used as
  the mobile filter trigger.

### `packages/types`

- `finance.ts` — `monthlyPayment` and `priceForMonthly` plus
  `FINANCE_DEFAULTS` (84-month term, 3.5% APR, 10% down). Used by the
  filter sidebar's monthly-payment slider and the detail-page "Est.
  RM X/mo" line.
- `index.ts` no longer uses `.js` extensions on its own re-exports —
  Next.js webpack does not resolve `.js` for TS files in workspace
  packages under `transpilePackages`. Same fix that the design-system
  agent applied to the UI package's `cn` import.

## Out of scope (handed to other agents)

- Real page UIs beyond the placeholder homepage
- Real API routes beyond `/health`
- Auth flows (sign-in, sign-up, sessions, providers)
- Seed data
- Image upload + R2 wiring
- Configurator state, finance math, payment integration
- Admin dashboard
- Deploy targets (Vercel, Fly.io, etc.) and any associated workflows

## Verification checklist (run locally before merging downstream work)

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
pnpm dev               # web on :3000, api on :4000
curl http://localhost:4000/health
open http://localhost:3000
```

`pnpm db:migrate:dev` only runs once you have a real `DATABASE_URL`.
