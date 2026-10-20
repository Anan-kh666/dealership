# Dealership

Website and back office for an authorised new-car dealership in Malaysia.
Customers browse the lineup, configure a car, find one in stock, book a test
drive, estimate and apply for financing, and get a trade-in valuation. Staff
manage every one of those leads from a role-protected admin.

Editorial design language (graphite, warm off-white, one bronze accent),
inspired by Porsche, Polestar and Tesla.

## What's in it

| Area | Routes |
| --- | --- |
| Lineup | `/models`, `/models/[slug]` — filters, trims, specs, gallery, JSON-LD |
| Configurator | `/build` → `/models/[slug]/build` — trim, paint, interior, options, live price, 3D preview, shareable URL, "find in stock" matching |
| Stock | `/stock`, `/stock/[slug]` — faceted filters, monthly-payment filter, enquiry dialog, finance widget |
| Test drives | `/test-drive` — 4-step booking, KL-timezone slots, holidays, slot locking, `.ics` invites, optional account creation |
| Financing | `/financing` (calculator, `?stockUnitId=` prefill), `/financing/apply` (6-step application) |
| Trade-in | `/trade-in` (5-step valuation with photo upload), `/trade-in/status` (track by `TI-` reference) |
| Content | `/blog`, `/blog/[slug]`, `/about`, `/about/team`, `/careers`, `/press`, `/after-sales`, `/contact`, `/privacy`, `/terms` |
| Accounts | `/register`, `/sign-in`, `/account` — bookings (with cancel), applications, trade-ins, profile & password |
| Admin | `/admin` — dashboard, test drives, financing (with detail + notes), trade-ins (quote), enquiries, inventory status |
| SEO | `sitemap.xml`, `robots.txt`, Open Graph, structured data |

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Web**: Next.js 15 (App Router, Server Components, Server Actions), Tailwind CSS v4, shadcn/ui, Framer Motion, React Three Fiber
- **API**: Fastify 5 with Zod-validated routes (for mobile / third-party clients)
- **Database**: PostgreSQL via Prisma
- **Auth**: Auth.js v5 — email + password (bcrypt), JWT sessions, role-based access
- **Forms & state**: React Hook Form + Zod, Zustand
- **Storage / email**: Cloudflare R2 (presigned uploads), SMTP via Nodemailer — both optional in development
- **Tests**: Vitest

## Quick start

Requires Node 20+, pnpm 9+ and Docker (for the local database).

```bash
pnpm install
cp .env.example .env
# Set AUTH_SECRET:  openssl rand -base64 32

pnpm db:setup        # start Postgres in Docker, migrate, seed
pnpm dev             # web → http://localhost:3000, API → http://localhost:4000
```

`pnpm db:setup` is shorthand for `db:up` → `db:generate` → `db:migrate:deploy` → `db:seed`.
The seed is idempotent and safe to re-run; it keeps existing customer leads.

### Demo accounts (from the seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@dealership.my` | `Admin12345!` |
| Customer | `customer@example.com` | `Customer12345!` |

Override with `SEED_ADMIN_PASSWORD` / `SEED_CUSTOMER_PASSWORD`, and never use
the defaults on a shared or production database.

### Optional services

Everything works locally without these — the app degrades gracefully:

- **SMTP** (`SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, …): without it, emails are rendered and logged instead of sent.
- **R2** (`R2_*`): without it, upload steps offer "skip for now".
- **`ADMIN_NOTIFY_EMAIL`**: where staff notifications for new leads go.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web + API in watch mode |
| `pnpm build` | Production build of every app/package |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality gates (all run in CI) |
| `pnpm db:up` | Start the local Postgres container |
| `pnpm db:migrate:dev` | Create + apply a migration after a schema change |
| `pnpm db:migrate:deploy` | Apply existing migrations (CI / production) |
| `pnpm db:seed` | Load journal and accounts, then the vehicles from `models/` (resets demo stock) |
| `pnpm vehicles:sync` | Publish `models/` to the site: 3D files and catalogue |
| `pnpm vehicles:check` | Validate every `vehicle.json` |
| `pnpm db:studio` | Browse the database in Prisma Studio |

## Repo structure

```
apps/
  web/        Next.js site, account area and admin
  api/        Fastify public API
packages/
  db/         Prisma schema, migrations, seed, client singleton
  types/      Zod schemas, shared constants (site details, finance maths, references)
  ui/         shadcn primitives + brand components + Tailwind preset
  config/     ESLint, tsconfig and Prettier presets
  vehicles/   Turns models/ into 3D assets and catalogue rows
models/       One folder per vehicle — details + 3D model (see models/README.md)
```

### Adding a vehicle

Make a folder in `models/` and put a `vehicle.json` in it (copy an existing
one), a `.glb` exported from Blender, or both. With `pnpm dev` running, it
shows up on the site within a second. Otherwise run `pnpm vehicles:sync`.
`models/README.md` covers the Blender export settings and the material and
object naming.

See `CLAUDE.md` for architecture conventions and `BUILD_NOTES.md` for the
decision log.

## Before launch

- Replace the placeholder business details in `packages/types/src/site.ts` (phone, WhatsApp, address, registration number).
- Have the privacy notice and terms (`/privacy`, `/terms`) reviewed by counsel.
- Configure SMTP and R2, set `NEXT_PUBLIC_SITE_URL`, and rotate the seeded passwords.
- Add email verification before relying on email-matched account history (see BUILD_NOTES → Accounts).
- Swap the in-memory rate limiters for Redis when running more than one instance.

## Deployment

Recommended: Vercel (web), Fly.io or Railway (API), Neon (Postgres),
Cloudflare R2 (uploads). Run `pnpm db:migrate:deploy && pnpm vehicles:sync` as a release step.
