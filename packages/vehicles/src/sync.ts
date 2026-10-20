import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { PrismaClient } from "@dealership/db";
import { hideMissingModels, writeVehicle } from "./database";
import { listVehicleSlugs, loadOptionCatalog, loadVehicle } from "./discover";
import { MODELS_DIR, PUBLIC_DIR, SCHEMA_DIR } from "./paths";
import { prunePublished, publishVehicle } from "./publish";
import { SLUG_PATTERN, optionCatalogSchema, vehicleSchema } from "./schema";

export interface SyncOptions {
  /** Write the catalogue to the database (null = 3D files and images only). */
  prisma: PrismaClient | null;
  /** Re-apply stock from vehicle.json even for units that already exist (the seed). */
  resetStock?: boolean;
  /** Re-process 3D files even if unchanged. */
  force?: boolean;
  /** Only these vehicle folders. Default: all of them, and tidy up removed ones. */
  only?: string[];
  /** Validate only — publish nothing, write nothing. */
  dryRun?: boolean;
}

export interface SyncSummary {
  ok: string[];
  failed: string[];
  removed: string[];
}

const c = {
  ok: (s: string) => `\x1b[32m${s}\x1b[0m`,
  bad: (s: string) => `\x1b[31m${s}\x1b[0m`,
  warn: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};
const log = (s: string): void => console.log(`[vehicles] ${s}`);

/** JSON Schemas so editors autocomplete and check vehicle.json files. */
export function writeEditorSchemas(): void {
  mkdirSync(SCHEMA_DIR, { recursive: true });
  const files: [string, unknown][] = [
    ["vehicle.schema.json", zodToJsonSchema(vehicleSchema, { $refStrategy: "none" })],
    ["options.schema.json", zodToJsonSchema(optionCatalogSchema, { $refStrategy: "none" })],
  ];
  for (const [name, schema] of files) {
    const file = path.join(SCHEMA_DIR, name);
    const json = `${JSON.stringify(schema, null, 2)}\n`;
    if (!existsSync(file) || readFileSync(file, "utf8") !== json) writeFileSync(file, json);
  }
}

export async function syncVehicles(opts: SyncOptions): Promise<SyncSummary> {
  const summary: SyncSummary = { ok: [], failed: [], removed: [] };
  if (!existsSync(MODELS_DIR)) {
    log(c.bad(`No models folder at ${MODELS_DIR}`));
    return summary;
  }
  if (!opts.dryRun) writeEditorSchemas();

  const catalog = loadOptionCatalog();
  const all = listVehicleSlugs();
  const targets = opts.only ?? all;

  for (const slug of targets) {
    if (!all.includes(slug)) {
      // Folder deleted (watch mode): unpublish it.
      if (opts.dryRun || !SLUG_PATTERN.test(slug)) continue;
      rmSync(path.join(PUBLIC_DIR, slug), { recursive: true, force: true });
      if (opts.prisma) await hideMissingModels(opts.prisma, all);
      summary.removed.push(slug);
      log(`${c.warn("−")} ${slug} ${c.dim("folder removed — hidden from the site")}`);
      continue;
    }

    const loaded = loadVehicle(slug);
    for (const w of loaded.warnings) log(`  ${c.warn("!")} ${slug}: ${w}`);
    if (!loaded.ok) {
      summary.failed.push(slug);
      log(`${c.bad("✗")} ${slug} ${c.dim("— not updated, the site keeps the last good version:")}`);
      for (const e of loaded.errors) log(`    ${c.bad(e)}`);
      continue;
    }
    if (loaded.drafted) {
      log(`${c.warn("+")} ${slug}: created models/${slug}/vehicle.json from the 3D file (unpublished draft)`);
    }
    if (opts.dryRun) {
      summary.ok.push(slug);
      log(`${c.ok("✓")} ${slug} ${c.dim("valid")}`);
      continue;
    }

    try {
      const published = await publishVehicle(loaded, { force: opts.force });
      for (const n of published.notes) log(`  ${c.dim(`${slug}: ${n}`)}`);
      for (const w of published.warnings) log(`  ${c.warn("!")} ${slug}: ${w}`);

      let detail = loaded.modelFile ? "3D ✓" : "no 3D file (placeholder car)";
      if (opts.prisma) {
        const db = await writeVehicle(opts.prisma, {
          slug,
          vehicle: loaded.vehicle,
          catalog,
          heroImage: published.heroImage,
          imageUrl: published.imageUrl,
          resetStock: opts.resetStock ?? false,
        });
        for (const w of db.warnings) log(`  ${c.warn("!")} ${slug}: ${w}`);
        detail += `, ${db.trims} trim${db.trims === 1 ? "" : "s"}`;
        if (db.stockCreated) detail += `, ${db.stockCreated} new stock`;
        if (db.created) detail += ", new";
      }
      const state = loaded.vehicle.published ? "" : c.warn(" (unpublished)");
      log(`${c.ok("✓")} ${slug} ${c.dim(`${loaded.vehicle.name} — ${detail}`)}${state}`);
      summary.ok.push(slug);
    } catch (error) {
      summary.failed.push(slug);
      log(`${c.bad("✗")} ${slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Full run: tidy up vehicles whose folder is gone.
  if (!opts.only && !opts.dryRun) {
    summary.removed.push(...prunePublished(new Set(all)));
    if (opts.prisma) {
      const hidden = await hideMissingModels(opts.prisma, all);
      for (const s of hidden) log(`${c.warn("−")} ${s} ${c.dim("has no folder in models/ — hidden from the site")}`);
    }
  }
  return summary;
}
