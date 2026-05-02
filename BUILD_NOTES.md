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

## Test drive booking

The `/test-drive` standalone booking page and supporting public API routes
landed alongside this section.

### What was built

- `apps/web/src/app/(public)/test-drive/page.tsx` — Server Component shell.
  Reads `modelId` / `stockUnitId` / `slug` query params, fetches the prefilled
  vehicle directly from Prisma, and pre-loads the model + in-stock lists for
  the chooser. Marked `dynamic = "force-dynamic"`.
- `apps/web/src/app/(public)/test-drive/test-drive-flow.tsx` — top-level
  Client Component island. Step routing, persistent header card, progress
  dots, focus-on-heading on step change.
- `steps/{vehicle,datetime,details,confirmation,success}-step.tsx` — five
  step components.
- `apps/web/src/app/(public)/test-drive/calendar.tsx` — small custom 7-column
  calendar grid. `role="grid"`, day buttons are `role="gridcell"`, arrow
  keys move selection across non-disabled cells.
- `apps/web/src/stores/test-drive-store.ts` — Zustand store with the
  `persist` middleware writing to **`sessionStorage`** (short-lived form
  data, not `localStorage`). Resets on successful submit.
- `apps/web/src/lib/test-drive/{holidays,slots,phone}.ts` — shared helpers.
  The MY 2026 holiday list is duplicated server-side at
  `apps/api/src/lib/holidays.ts` — keep these two in sync until we move the
  list to a DB-backed admin config.
- `apps/api/src/routes/public/test-drives.ts` — three Fastify routes:
  - `GET /public/test-drives/availability?date=YYYY-MM-DD` — slot list in
    Asia/Kuala_Lumpur, excludes lunch (12:30–13:30), excludes
    `REQUESTED|CONFIRMED` bookings, excludes past slots when the date is
    today, returns an empty list on closed days.
  - `POST /public/test-drives` — creates the booking. See slot-locking
    note below. After commit, renders the React Email template and logs
    the `{ to, subject, html }` payload (see "Email stub").
  - `GET /public/test-drives/:id/ics` — text/calendar download. Title
    `Test drive — [Model] [Trim]`, 60-min duration, 1-hour reminder.
    Rate-limited 10/min/IP via `@fastify/rate-limit` route config.
- `apps/api/src/emails/test-drive-confirmation.tsx` — React Email template.
- `packages/db/prisma/schema.prisma` + `migrations/0002_test_drive_license/` —
  added `drivingLicense String?` to `TestDrive`.
- `packages/types/src/forms.ts` — extended `testDriveBookingSchema` with
  `drivingLicense` and tightened `notes` max to 500 to match the form. The
  schema is shared between the web RHF resolver and the API route validator.
- `apps/web/src/app/(public)/models/[slug]/page.tsx` — fixed the
  "Schedule Test Drive" CTA href to include `?modelId=${model.id}`.

### Date / timezone handling

Chose **`date-fns` + `date-fns-tz`** over `@internationalized/date`.
Reasons:

- We needed timezone math in two places: the API (slot generation +
  conflict detection) and the web (calendar rendering + slot picker). One
  library on both sides means one mental model.
- `react-aria` would have only bought us calendar a11y; we still needed a
  timezone library separately. The custom calendar is small (~150 lines)
  and matches the editorial-premium aesthetic better than the default
  react-aria primitives.

All times in the system are anchored to **Asia/Kuala_Lumpur (UTC+8)**.
The calendar generates KL-local YYYY-MM-DD strings; the API rounds-trips
those through `fromZonedTime` to produce UTC `Date`s for storage and
queries. `Decimal` columns are still stringified for serialization (no
change to the existing pattern).

### Slot-locking strategy

`POST /public/test-drives` runs inside a Postgres transaction with
**`Serializable` isolation** (`prisma.$transaction(fn, { isolationLevel: "Serializable" })`).
Inside the transaction the route does a `findFirst` on
`scheduledAt + status IN (REQUESTED, CONFIRMED)`. If a row exists, the
route throws a `SlotTakenError` and the transaction rolls back. Two
clients hitting the same slot at the same instant will produce exactly
one winner: either the second one finds the first one's row, or
Postgres's serialization layer raises `40001` (Prisma `P2034`), which
the route also catches and surfaces as `409 { error: "slot_taken" }`.

Client behavior on `409`: the booking flow surfaces an inline error and
bumps the user back to Step 2 (date & time) with the slot cleared.

Gotcha: the API also defends against bad `scheduledAt` values that didn't
come from the availability endpoint — closed days, non-30-min boundaries,
and past times all return `400` rather than persisting bad data.

### Email stub

We render the confirmation email with `@react-email/render` and log the
output as a structured Pino log line:

```json
{
  "email": {
    "to": "...",
    "subject": "Test drive confirmed — ...",
    "html": "<!doctype html>..."
  }
}
```

No actual send happens — Resend wiring is out of scope and is the next
agent's job. `RESEND_API_KEY` already exists in `.env.example`. To
preview the email visually, you can copy the logged HTML into a file and
open it in a browser, or run the React Email dev server later if we add
one.

### Rate limiting

Added `@fastify/rate-limit` with `global: false`. The ICS download route
opts in via per-route `config.rateLimit` (10/min/IP). The other public
routes are not rate-limited — revisit if abuse becomes an issue.

### Malaysian public holidays — 2026

Hard-coded in `apps/web/src/lib/test-drive/holidays.ts` and
`apps/api/src/lib/holidays.ts` (keep in sync):

- 1 Jan — New Year's Day
- 17–18 Feb — Chinese New Year
- 21–22 Mar — Hari Raya Puasa
- 1 May — Wesak Day
- 27 May — Hari Raya Haji
- 31 Aug — Merdeka Day
- 16 Sep — Malaysia Day
- 28 Oct — Deepavali
- 25 Dec — Christmas Day

Should move to a DB-backed admin config later — the dual-source duplication
is a known smell.

### Hero CTA — decision

The brief asked us to verify the homepage hero secondary CTA points to
`/test-drive`. The existing hero has two CTAs ("Build Yours" → `/models`,
"Available Now" → `/stock`); changing either label-link pair would be a
hero redesign, which the brief separately disallows ("DO NOT modify the
homepage hero"). **Resolution:** left the hero untouched. Entry to
`/test-drive` is via the site header nav link, the site footer nav link,
and the per-model "Schedule Test Drive" CTA (now wired to
`?modelId=${model.id}`).

### WhatsApp number is a placeholder

`https://wa.me/60378012345` and `+60 3 7801 2345` are placeholders shared
with the site footer. Replace before launch.

### Optional account creation — deferred

Step 3 has an "Create an account?" checkbox. Today the flow only
collects the password; it does **not** write a `User` row or send a
verification email. The full sign-up path is the auth agent's
responsibility — when that lands, the auth agent should pull the
collected password from the booking flow's submit and finish the
account-creation handshake.

### Verification gaps

Without a live `DATABASE_URL` we couldn't run `db:migrate:dev` or
exercise the full flow end-to-end against real data. `pnpm typecheck`,
`pnpm lint`, and `pnpm build` are the gates we ran. Manual browser /
slot-locking verification is in the brief's checklist — run it after
`db:migrate:dev` lands the `0002_test_drive_license` migration.


## Out of scope (handed to other agents)

- Real page UIs beyond the placeholder homepage
- Real API routes beyond `/health`
- Auth flows (sign-in, sign-up, sessions, providers)
- Seed data
- Image upload + R2 wiring
- Configurator state, finance math, payment integration
- Admin dashboard
- Deploy targets (Vercel, Fly.io, etc.) and any associated workflows

## Trade-in flow

Customer-facing valuation submission lives at:

- `apps/web/src/app/(public)/trade-in/page.tsx` — server-rendered shell. All
  form interaction is the `<TradeInFlow>` client island.
- `apps/web/src/components/trade-in/*` — five steps (vehicle, condition,
  photos, contact, review) plus a success screen and a 5-dot progress
  indicator with sticky mobile back/next.
- `apps/web/src/stores/tradeInStore.ts` — Zustand store persisted to
  `sessionStorage`. Photo upload state is split: completed `publicUrl`s live
  in the store; in-flight uploads stay local to the photos step.
- `apps/web/src/lib/phone.ts` — Malaysian-mobile validator used by the
  contact step. **TODO:** dedupe with the test-drive flow's helper once
  that lands; both should reduce to `mlPhone` in `@dealership/types`.

The flow uses React Hook Form + Zod resolver per step. Tabs / radio cards /
yes-no toggles / textareas are styled inline rather than as new UI
primitives so we don't grow `packages/ui` ahead of what's reused. Two
shadcn primitives that previously kept `.js` import suffixes
(`Input`, `Label`) were updated to drop them — they now import
`../lib/cn` so they resolve under Next's `transpilePackages`.

### Reference number format

`TI-XXXXXX` — last 6 chars of the cuid `id`, uppercased. Derived in
`apps/api/src/lib/reference.ts` (`tradeInReferenceFromId` /
`tradeInIdSuffixFromReference`). The id stays canonical; the reference is
just a friendlier surface for customers. The lookup endpoint converts the
suffix back to lowercase and runs `findFirst({ where: { id: { endsWith }}})`.

### Photo upload (R2)

- `POST /public/uploads/presign` (apps/api/src/routes/public/uploads.ts)
  validates the content-type allowlist (jpeg/png/webp/heic), file size
  (≤ 10 MB), and `purpose: "trade-in"`. Returns
  `{ uploadUrl, publicUrl, key, expiresIn: 300 }`. Rate-limit: 30 per IP
  per hour (`apps/api/src/lib/rate-limit.ts`, in-memory).
- The web client hits `${NEXT_PUBLIC_API_URL}/public/uploads/presign`,
  then PUTs the file directly to R2 — never proxied through Fastify.
- R2 client lives at `apps/api/src/lib/r2.ts`. `readR2Config()` returns
  `null` if any of `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `R2_ENDPOINT` is missing; an optional `R2_PUBLIC_BASE_URL` overrides
  the default `${R2_ENDPOINT}/${R2_BUCKET}` for custom CDN domains.

### R2 fallback ("Skip for now")

When the presign endpoint returns 503 with
`{ error: "storage_not_configured" }`, the photos step swaps the upload
zone for an inline warning and a "Skip for now" button. Skipping sets
`photosSkipped: true` in the store and lets submission proceed with
`photos: []`. The submitted `notes` JSON includes `photosSkipped: true`
so staff know to chase photos directly. This keeps the form usable in
dev environments without R2 credentials.

### Email stub

`POST /public/trade-ins` calls `request.log.info` with a payload that
mirrors the notification staff would receive (reference, vehicle, contact,
photo count, photosSkipped flag). **Resend is not wired** — once it is,
replace the log call with a real send.

### Schema gaps

The current `TradeIn` Prisma model only persists a subset of the submitted
fields directly: `vin`, `make`, `model`, `year`, `mileage`, `condition`,
`photos`, `contactName/Email/Phone`, `status`, plus `notes` and
`estimatedValue`. Everything else from the form is JSON-encoded into the
`notes` text column for now:

- `trim` / variant
- `serviceHistory` + `serviceLocation`
- `accidentHistory` + `accidentNote`
- `modifications` + `modificationsNote`
- `preferredContactMethod` (PHONE / EMAIL / WHATSAPP)
- `bestTimeToCall` (MORNING / AFTERNOON / EVENING / ANYTIME)
- `configurationId` — captured from the `?configurationId=` URL param so
  staff can later send a quote linked to a saved build. **TODO:** add a
  dedicated nullable `configurationId` foreign key on `TradeIn` once the
  configurator agent lands; until then it's read-only metadata in `notes`.
- `photosSkipped` — set when the user took the storage-fallback skip path.

### Public Fastify routes

Registered in `apps/api/src/routes/public/index.ts`:

- `POST /public/uploads/presign` — see above. 30/IP/hour, 503 if R2 is
  unconfigured.
- `POST /public/trade-ins` — Zod-validated full submission
  (`tradeInFullSubmissionSchema` in `@dealership/types`). Creates the row
  at status `SUBMITTED`, returns `{ id, reference }`. 5/IP/day.
- `GET /public/trade-ins/:reference` — minimal status info
  (`{ reference, status, submittedAt, estimatedValue }`). Public-but-uses-
  reference-as-token; no PII in the response. 30/IP/hour. **Not consumed
  by the trade-in flow** — built for the future "Track this submission"
  page on `/account/trade-ins` (the auth / account agent will read it).

These routes drop response schemas intentionally — `fastify-type-provider-zod`
only supports a single response shape per status code, and we mix 200 / 429 /
503 / 404. Input validation still uses Zod; outputs are TypeScript-typed
in code.

### Schemas

`@dealership/types` gained a new `trade-in.ts` module:

- `mlPhone` (in `primitives.ts`) — stricter Malaysian mobile regex; strips
  spaces and dashes before validating. Mirrored client-side in
  `apps/web/src/lib/phone.ts`.
- `tradeInVehicleSchema`, `tradeInConditionSchema`, `tradeInContactSchema`
  — per-step shapes. The web app mostly uses ad-hoc per-step Zod schemas
  inside RHF, but these are exported for reuse.
- `tradeInFullSubmissionSchema` — the `POST /public/trade-ins` body shape
  with the `photosSkipped || photos.length >= 4` refine.

The original `tradeInSubmissionSchema` in `forms.ts` was left in place —
it's a leaner shape that may still be wanted by the admin agent.

### Rate limiter

`apps/api/src/lib/rate-limit.ts` is an in-memory fixed-window counter,
keyed per limiter. Suitable for single-process v1 deploys. Replace with
Redis (`REDIS_URL` already in `.env.example`) when scaling out.

### New runtime dependencies

- `apps/api`: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`,
  `nanoid`.

### Embedded entry points

The footer `Services` column in `apps/web/src/components/site-footer.tsx`
already links to `/trade-in`. No homepage / models / stock CTA changes
were made — those were deferred per the brief.

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
