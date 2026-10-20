# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start web (:3000) + api (:4000) in parallel
pnpm build            # Build all apps/packages
pnpm lint             # ESLint across monorepo
pnpm typecheck        # tsc --noEmit across monorepo
pnpm test             # Vitest across monorepo

# Run a single package's tests
pnpm --filter @dealership/web test
pnpm --filter @dealership/api test

# Database
pnpm db:generate      # Regenerate Prisma client after schema changes
pnpm db:migrate:dev   # Create + apply migration (requires DATABASE_URL)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Journal posts + demo accounts, then vehicles from /models (resets demo stock)
pnpm db:up            # Start local Postgres (docker compose, port 5433)
pnpm db:setup         # db:up + generate + migrate:deploy + seed

# Vehicles (see models/README.md)
pnpm vehicles:sync    # /models → 3D files in apps/web/public/vehicles + catalogue rows
pnpm vehicles:check   # Validate every models/*/vehicle.json (CI runs this)
```

`pnpm dev` also runs the vehicles watcher: saving anything under `models/` updates the site within a second.

All app and db scripts load the **root** `.env` via `dotenv-cli` (`dotenv -e ../../.env --`). Variables already set in the environment win, so CI/hosting config is never overridden.

Demo logins after seeding: `admin@dealership.my` / `Admin12345!` (ADMIN) and `customer@example.com` / `Customer12345!`.

## Architecture

Turborepo + pnpm workspaces monorepo. Two apps, five shared packages, and the `models/` folder of vehicles:

```
apps/web    Next.js 15 (App Router, RSC)    port 3000
apps/api    Fastify 5                        port 4000

packages/db       Prisma schema + PrismaClient singleton
packages/types    Zod schemas + inferred TS types shared by web and api
packages/ui       shadcn primitives + brand components + Tailwind preset
packages/config   ESLint config, tsconfig bases, Prettier config
packages/vehicles models/ folder → 3D assets + catalogue rows (CLI + watcher)

models/<slug>/    One folder per vehicle: vehicle.json + 3D file
```

### Data-fetching split

Next.js Server Components query Prisma **directly** via `@dealership/db` (no HTTP hop). The Fastify API is the contract for external/mobile/admin consumers. Both paths exist intentionally — don't proxy one through the other.

All `(public)` route group pages are marked `dynamic = "force-dynamic"` so the build doesn't require a live `DATABASE_URL`.

Staff and customer mutations in the web app are **Server Actions** (`app/admin/actions.ts`, `app/account/actions.ts`, `app/(auth)/actions.ts`), not Fastify routes — they need the Auth.js session, which the API doesn't share. Every action re-checks the role itself.

### Route groups & layouts

- `app/(public)/*` and `app/(auth)/*` and `app/account/*` render inside `SiteChrome` (header + footer). `app/admin/*` has its own shell (`admin/layout.tsx`).
- The root layout only sets `<html>`/`<body>` and metadata. `not-found.tsx` wraps itself in `SiteChrome`; `(public)/error.tsx` keeps the header on page errors.

### API route structure

Fastify routes are split into three prefix scopes registered in `apps/api/src/server.ts`:

- `/public/*` — unauthenticated (models, stock, test drives, trade-ins, inquiries, uploads, financing)
- `/customer/*` — authenticated customer actions (scaffolded)
- `/admin/*` — staff/admin actions (scaffolded)

Fastify uses `fastify-type-provider-zod` for request validation and response serialization. Validation schemas are imported from `@dealership/types`.

### Packages

**`@dealership/db`** — exports a `PrismaClient` singleton via the `globalThis` pattern (prevents hot-reload connection leaks). Import as `import { prisma } from "@dealership/db"`.

**`@dealership/types`** — Zod enums mirroring every Prisma enum, model schemas, and form schemas (`testDriveBookingSchema`, `financeApplicationSchema`, `tradeInFullSubmissionSchema`, etc.). The `decimalString` brand is used for all `Decimal` Prisma columns — they serialize as numeric strings on the wire to avoid JS float precision loss.

**`@dealership/ui`** — shadcn primitives (New York style, neutral palette) plus brand components: `BrandButton`, `Container`, `Section`, `Card`, `ModelCard`, `StockCard`, `ColorSwatch`, `StatusBadge`, `Accordion`, `Slider`, `FilterDrawer`. Import via package exports, e.g. `@dealership/ui/components/button`.

**`@dealership/config`** — shared `tsconfig.base.json` / `tsconfig.next.json` / `tsconfig.node.json`, flat ESLint config, Prettier config, and the Tailwind v4 preset CSS.

### Styling — Tailwind v4

Tailwind v4 uses CSS-first config via `@theme` blocks, **not** `tailwind.config.ts`. The shared preset is at `packages/config/src/tailwind-preset.css` and is re-exported through `packages/ui/src/styles.css`.

Design tokens live in two places that must stay in sync:
- `packages/ui/src/tokens.ts` — for non-CSS consumers (Framer Motion, server renderers)
- `packages/config/src/tailwind-preset.css` — for Tailwind utility classes

**If you change one side, change the other.**

Tailwind v4 auto-detection doesn't reach workspace packages. `packages/ui/src/styles.css` has explicit `@source` directives for `./components` and `./lib`. Add a matching `@source` line whenever a new source folder is added to the package.

### Import path gotcha

The `.js` extension must be **omitted** for TS files in workspace packages consumed via Next.js `transpilePackages`. New components in `packages/ui` use `../lib/cn` (no `.js`). Existing shadcn primitives that haven't been touched still use `.js` — fix them when you first import them into an app.

### Site header

`apps/web/src/components/site-header.tsx` is a Client Component, `position: fixed`. It is transparent (white text) only on routes listed in `OVERLAY_ROUTES` (currently just `/`, which has a dark full-bleed hero) and solid white everywhere else. **Content under it still needs top padding** — use `pt-20`+ on the top-level wrapper, or `PageHero` (`components/page-hero.tsx`), which handles it.

### Shared content & config

- Business details (phone, WhatsApp, address, hours, emails) live in **`packages/types/src/site.ts` (`SITE`)** — used by web, API emails and ICS invites. Never hard-code them.
- Reference numbers (`TD-`, `TI-`, `FA-`) come from `packages/types/src/reference.ts`.
- Status labels/tones for every enum: `apps/web/src/lib/status.ts`. KL-timezone date formatting: `apps/web/src/lib/dates.ts`.
- Non-database imagery: `apps/web/src/data/media.ts` (verified Unsplash IDs only).
- Journal posts are `BlogPost` rows; `content` uses a tiny markup (`## `, `- `, `> `, blank-line paragraphs) parsed by `lib/blog-content.ts` — no HTML is ever rendered from it.

### Vehicles — `models/` folder

The vehicle catalogue is **files, not seed code**: one folder per vehicle in `/models/<slug>/` holding `vehicle.json` (details, trims, colours, gallery, demo stock, `model3d`) and its 3D file (`.glb`/`.gltf`, e.g. a Blender export). `packages/vehicles` (`@dealership/vehicles`) validates them (`src/schema.ts`, strict Zod — typos are errors), processes 3D (`src/scene.ts`: Draco decode, WebP textures, Meshopt, wheel-pivot centring, front/wheel/lamp detection), publishes to `apps/web/public/vehicles/<slug>/` (git-ignored, cached by input hash) and upserts the DB by natural keys (`src/database.ts`: slug, trim name, option name, colour name+type, VIN — IDs stay stable). Shared options: `models/_shared/options.json`. A folder with only a 3D file gets a draft `vehicle.json` (`published: false`). Deleted folders → `isActive: false` (never deleted). Stock is create-only on normal syncs (staff own it afterwards); `pnpm db:seed` resets it. Invalid vehicles are skipped and keep their last good state. The package's `build` script publishes 3D files without a DB (runs before the web build via turbo `^build`; `cache: false`). Run `pnpm vehicles:sync` as a release step next to `db:migrate:deploy`.

### Configurator 3D models

`/models/[slug]/build` renders a real `.glb` per model when one exists, otherwise the stylised `PlaceholderCar`. Each vehicle's 3D settings (orientation, length, rig, materials, credit) are the `model3d` section of `models/<slug>/vehicle.json` (see **Vehicles** above); `@dealership/vehicles` publishes the optimised file + a `scene.json` to `apps/web/public/vehicles/<slug>/`, which `server/car-assets.ts` reads per request (schema: `carAssetSchema` in `@dealership/types`). `lib/car-assets.ts` only holds the types and material-name defaults. `GltfCar` clones the scene, normalises scale/orientation (nose → +X, wheels on y=0) and recolours materials matching `paint` / `interior_accent|seat|leather` / `rim`. Use **Meshopt** compression and WebP/JPEG textures — Draco and KTX2 would need decoders fetched from a CDN (the vehicles sync decodes Draco input). CC BY models must keep their on-canvas credit line. Legacy one-off processing scripts: `tools/models/`.

Stage (`build/components/preview-canvas.tsx`): Poly Haven studio HDRI (`public/hdri/`) + Lightformers, `MeshReflectorMaterial` floor, ContactShadows, and `@react-three/postprocessing` (N8AO, Bloom, ACES tone mapping, SMAA, Vignette — the light tier drops AO/vignette). The effects tier is chosen **once** at mount; at runtime `PerformanceMonitor` only lowers DPR, because swapping effects recompiles shaders and flashes black. Keep the reflector at ≤512px (1024 renders black on some GPUs). Motion lives in `motion.tsx` (shared mutable state read in `useFrame`): drive-in, wheel spin from travel distance, step-driven camera (`VIEWS`), doors on the interior step, lights, idle turntable; all of it is skipped under `prefers-reduced-motion`. The canvas fades in only after the car has rendered three frames. Animation rigs (wheel/door node names) come from `model3d.rig` in each vehicle.json, or are auto-detected by the vehicles sync.

Cabins: cabin glazing (material names matching `glass|window…`, minus lamp lenses / frit — `NOT_CABIN_GLASS`) is swapped for one physical-transmission `CabinGlass` material, so interiors are visible with real Fresnel reflections. Models whose shipped cabin is crude set `model3d.interior: { rows, replace: true }` in their vehicle.json: `cabin-interior.tsx` generates a fitted interior (quilted leather seats tinted by the interior picker, dashboard with generated infotainment + cluster screens, RHD steering wheel, console, door cards) sized from the glass bounds via `cabinLevels()`, and every original mesh lying entirely inside the cabin volume is hidden. QA hooks `window.__configuratorCamera` / `__configuratorScene` exist in development only.

### State management

Customer-facing multi-step flows use Zustand stores persisted to **`sessionStorage`** (not `localStorage`):
- `apps/web/src/stores/test-drive-store.ts`
- `apps/web/src/stores/tradeInStore.ts`
- `apps/web/src/stores/financingStore.ts`
- `apps/web/src/stores/configurator-store.ts`

Stores reset on successful submission.

### Timezone

All booking/scheduling logic is anchored to **Asia/Kuala_Lumpur (UTC+8)**. Date math uses `date-fns` + `date-fns-tz`. Malaysian public holidays for 2026 are hard-coded in both `apps/web/src/lib/test-drive/holidays.ts` and `apps/api/src/lib/holidays.ts` — keep these two files in sync.

### Rate limiting

`apps/api/src/lib/rate-limit.ts` is an in-memory fixed-window counter. `@fastify/rate-limit` with `global: false` is registered in the API; individual routes opt in via `config.rateLimit`. Both should be swapped for Redis (`REDIS_URL` is already in `.env.example`) when scaling beyond a single process.

### R2 / file uploads

`apps/api/src/lib/r2.ts` returns `null` if any R2 env var is missing. Upload routes return `503 { error: "storage_not_configured" }` in that case. Forms that upload to R2 (trade-in photos, financing documents) have a "skip for now" fallback path so they remain usable in dev without credentials.

### Email

All API emails go through `apps/api/src/lib/mailer.ts` → `sendMail()`. With SMTP configured (`SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`) they are sent; otherwise the payload is logged and the request still succeeds. Customer confirmations: test drives, trade-ins, financing. Staff notifications go to `ADMIN_NOTIFY_EMAIL` when set. Escape user input in hand-written HTML with `escapeHtml()`.

### Auth

Auth.js v5, email + password (Credentials, bcrypt in `User.passwordHash`), JWT sessions carrying `id` + `role`. Requires `AUTH_SECRET`.

- `server/auth.config.ts` — **edge-safe** config used by `middleware.ts` (no Prisma/bcrypt imports here). Redirects signed-out users from `/account*` and `/admin*`, and non-staff from `/admin*`.
- `server/auth.ts` — full config with the Credentials provider.
- `server/session.ts` — `getSessionUser()`, `requireUser()`, `requireStaff()`. **Every account/admin page and action must call these** — middleware is only the first gate.
- `lib/safe-url.ts` — `safeCallbackUrl()` guards post-login redirects against open-redirects.
- Staff roles: `STAFF`, `MANAGER`, `ADMIN`. Accounts are created at `/register` or via the test-drive opt-in; staff accounts via the seed or by promoting a user in the DB.
- `/account` shows leads matched by `userId` **or** the account email (guests book without signing in). Add email verification before launch.

## Conventions

- **No `any`** — `strict` + `noUncheckedIndexedAccess` are on. Use `unknown` and narrow.
- **Conventional Commits** for all commit messages.
- All shared code goes in `packages/`; never duplicate across apps.
- Placeholder business details live only in `packages/types/src/site.ts` — replace before launch.
- Legal copy (`/privacy`, `/terms`) needs review by counsel before launch.
