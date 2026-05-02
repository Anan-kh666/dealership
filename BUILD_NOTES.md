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
