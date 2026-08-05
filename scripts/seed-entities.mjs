#!/usr/bin/env node
/**
 * One-shot migration: entities.json (flat seed database) -> entities/{id}/entity.json
 *
 * The flat file is the original hand-built dataset. Once split, the per-entity
 * folders become the source of truth and this script is only useful for a
 * re-import. It never overwrites an existing entity.json unless --force is set,
 * so hand edits and sourced logo paths survive a re-run.
 *
 *   node scripts/seed-entities.mjs [--force] [--dry-run]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ENTITIES_DIR, LOGO_VARIANTS, ROOT, bold, dim, green, readJson, toJson, yellow } from './lib.mjs';

const argv = new Set(process.argv.slice(2));
const force = argv.has('--force');
const dryRun = argv.has('--dry-run');

const SEED_FILE = join(ROOT, 'entities.json');

/**
 * Key order for a written entity.json. Mirrors the schema's documentation order
 * so diffs stay readable and PRs are easy to review.
 */
const KEY_ORDER = [
  'id',
  'name',
  'short_name',
  'legal_name',
  'categories',
  'logos',
  'brand_color',
  'country',
  'founded',
  'regulated_by',
  'ifsc_prefix',
  'upi_handles',
  'fip_id',
  'fiu_id',
  'aa_id',
  'website',
  'status',
  'acquired_by',
  'tags',
  'added_at',
  'updated_at',
  'contributors',
];

/** Reorder keys and normalise the logos block to the canonical variant order. */
function normalise(entity, addedAt) {
  const logos = {};
  for (const variant of LOGO_VARIANTS) {
    if (variant in (entity.logos ?? {})) logos[variant] = entity.logos[variant];
  }
  // `full` is required by the schema; keep the key present even when unsourced.
  if (!('full' in logos)) logos.full = null;

  const merged = { ...entity, logos, added_at: entity.added_at ?? addedAt, updated_at: entity.updated_at ?? addedAt };

  const out = {};
  for (const key of KEY_ORDER) {
    if (key in merged) out[key] = merged[key];
  }
  // Anything the seed carries that KEY_ORDER does not know about is preserved
  // at the end rather than silently dropped; validate.mjs will flag it.
  for (const key of Object.keys(merged)) {
    if (!(key in out)) out[key] = merged[key];
  }
  return out;
}

async function main() {
  if (!existsSync(SEED_FILE)) {
    console.error(`No entities.json found at ${SEED_FILE}`);
    process.exit(1);
  }

  const seed = await readJson(SEED_FILE);
  const entities = Array.isArray(seed) ? seed : seed.entities;
  if (!Array.isArray(entities)) {
    console.error('entities.json must be an array, or an object with an "entities" array.');
    process.exit(1);
  }

  const addedAt = seed.generated_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  let written = 0;
  let skipped = 0;
  const seen = new Set();

  for (const entity of entities) {
    if (!entity?.id) {
      console.error('Entity with no id — aborting:', JSON.stringify(entity).slice(0, 120));
      process.exit(1);
    }
    if (seen.has(entity.id)) {
      console.error(`Duplicate id in entities.json: ${entity.id}`);
      process.exit(1);
    }
    seen.add(entity.id);

    const dir = join(ENTITIES_DIR, entity.id);
    const file = join(dir, 'entity.json');

    if (existsSync(file) && !force) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      await mkdir(dir, { recursive: true });
      await writeFile(file, toJson(normalise(entity, addedAt)), 'utf8');
    }
    written += 1;
  }

  const verb = dryRun ? 'would write' : 'wrote';
  console.log(`${green('✔')} ${bold('seed')} ${verb} ${written} entit${written === 1 ? 'y' : 'ies'} to entities/`);
  if (skipped > 0) {
    console.log(`  ${yellow('•')} skipped ${skipped} existing (pass ${dim('--force')} to overwrite)`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
