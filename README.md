# Dealership

Authorized new-car dealership site for the Malaysian market. Premium, editorial,
configurator-first — design language drawn from Porsche, Polestar, and Tesla.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 (App Router, RSC), Tailwind CSS v4, shadcn/ui
- **Backend**: Fastify (Node.js)
- **Database**: PostgreSQL (Neon-hosted) via Prisma
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Auth**: Auth.js v5 (scaffolded)
- **Storage**: Cloudflare R2 via `@aws-sdk/client-s3`
- **Email**: Resend
- **Logging**: Pino
- **Testing**: Vitest

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+ (or a Neon database URL)

## Quick start

```bash
pnpm install
cp .env.example .env
# fill in DATABASE_URL at minimum
pnpm db:generate
pnpm db:migrate:dev   # only if a real DATABASE_URL is set
pnpm dev
```

The web app boots on http://localhost:3000 and the API on http://localhost:4000.
Health check: `curl http://localhost:4000/health`.

## Repo structure

```
.
├── apps/
│   ├── web/         # Next.js 15 (App Router)
│   └── api/         # Fastify
├── packages/
│   ├── db/          # Prisma schema + client singleton
│   ├── ui/          # shadcn primitives + Tailwind preset
│   ├── types/       # Zod schemas + inferred TS types
│   └── config/      # eslint, tsconfig, prettier, tailwind preset
├── .github/workflows/
└── turbo.json
```

## Common scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start `web` + `api` in parallel |
| `pnpm build` | Build every app/package |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm typecheck` | `tsc --noEmit` across the monorepo |
| `pnpm test` | Vitest smoke tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate:dev` | Create + apply a Prisma migration locally |
| `pnpm db:studio` | Open Prisma Studio |

## Deployment

To be wired up by a follow-up agent. Recommended targets: Vercel (web), Fly.io
or Railway (api), Neon (Postgres), Cloudflare R2 (assets).

## Contributing

- Conventional Commits.
- Strict TypeScript everywhere — no `any`.
- All shared code goes in `packages/`, never duplicated across apps.
