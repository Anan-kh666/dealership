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
