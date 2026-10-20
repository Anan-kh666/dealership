import { statSync, watch } from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@dealership/db";
import { MODELS_DIR } from "./paths";
import { syncVehicles } from "./sync";

/*
 *   tsx src/cli.ts sync [--watch] [--reset-stock] [--force] [slug…]
 *   tsx src/cli.ts assets      3D files + images only (used by the web build)
 *   tsx src/cli.ts check       validate every vehicle.json, write nothing
 */

const args = process.argv.slice(2);
const command = args[0] ?? "sync";
const flags = new Set(args.filter((a) => a.startsWith("--")));
const slugs = args.slice(1).filter((a) => !a.startsWith("--"));
const log = (s: string): void => console.log(`[vehicles] ${s}`);

async function connect(): Promise<PrismaClient | null> {
  if (!process.env.DATABASE_URL) {
    log("DATABASE_URL isn't set — publishing 3D files only; the catalogue isn't updated.");
    return null;
  }
  try {
    const { prisma } = await import("@dealership/db");
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n").filter(Boolean).pop() : String(error);
    log(`Database not reachable (${reason}) — publishing 3D files only. Start it with \`pnpm db:up\`.`);
    return null;
  }
}

async function main(): Promise<void> {
  if (command === "check") {
    const res = await syncVehicles({ prisma: null, dryRun: true, only: slugs.length ? slugs : undefined });
    process.exitCode = res.failed.length ? 1 : 0;
    return;
  }
  if (command === "assets") {
    const res = await syncVehicles({ prisma: null, force: flags.has("--force") });
    log(`${res.ok.length} vehicle(s) published${res.failed.length ? `, ${res.failed.length} with errors` : ""}.`);
    return;
  }
  if (command !== "sync") {
    console.error(`Unknown command "${command}". Use: sync | assets | check`);
    process.exitCode = 1;
    return;
  }

  const prisma = await connect();
  const res = await syncVehicles({
    prisma,
    resetStock: flags.has("--reset-stock"),
    force: flags.has("--force"),
    only: slugs.length ? slugs : undefined,
  });
  log(
    `${res.ok.length} vehicle(s) synced${res.failed.length ? `, ${res.failed.length} with errors (${res.failed.join(", ")})` : ""}.`,
  );

  if (!flags.has("--watch")) {
    await prisma?.$disconnect();
    if (res.failed.length) process.exitCode = 1;
    return;
  }

  // ---------------------------------------------------------------- watch
  log(`Watching ${path.relative(process.cwd(), MODELS_DIR) || "models"}/ — add or change a vehicle folder to update the site.`);
  const pending = new Set<string>();
  let everything = false;
  let timer: NodeJS.Timeout | null = null;
  let running: Promise<void> | null = null;

  const run = async (): Promise<void> => {
    const only = everything ? undefined : [...pending];
    pending.clear();
    everything = false;
    try {
      await syncVehicles({ prisma, only });
    } catch (error) {
      log(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const schedule = (): void => {
    if (timer) clearTimeout(timer);
    // Wait for writes to settle (Blender writes large .glb files in chunks).
    timer = setTimeout(() => {
      timer = null;
      if (running) {
        void running.then(schedule);
        return;
      }
      running = run().finally(() => {
        running = null;
      });
    }, 800);
  };

  watch(MODELS_DIR, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const [top] = filename.split(/[\\/]/);
    if (!top || top.startsWith(".") || top === "_schema") return;
    const base = path.basename(filename);
    if (base.startsWith(".") || base.endsWith("~") || base.includes(".tmp-") || base.endsWith(".blend1")) return;
    // Loose files next to the vehicle folders (README.md…) aren't vehicles.
    if (!filename.includes(path.sep) && statSync(path.join(MODELS_DIR, top), { throwIfNoEntry: false })?.isFile()) return;
    if (top.startsWith("_")) everything = true;
    else pending.add(top);
    schedule();
  });
}

main().catch(async (error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
