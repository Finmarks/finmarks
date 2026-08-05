#!/usr/bin/env node
/**
 * Validates every entities/{id}/entity.json against the JSON Schema, plus the
 * cross-file invariants a schema cannot express on its own:
 *
 *   - folder name matches the `id` field
 *   - ids are unique
 *   - `acquired_by` points at an entity that exists in the dataset
 *   - declared logo paths actually exist on disk and are non-empty
 *   - referenced SVGs are clean (no raster embeds, viewBox present, size cap)
 *   - the categories enum in the schema matches schemas/categories.json
 *
 * Exit code 1 on any error. Warnings never fail the build.
 *
 *   node scripts/validate.mjs [--quiet]
 */
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  LOGO_VARIANTS,
  bold,
  dim,
  fileHasContent,
  green,
  loadCategories,
  loadEntities,
  loadSchema,
  red,
  yellow,
} from './lib.mjs';

const quiet = process.argv.includes('--quiet');

const MAX_SVG_BYTES = 50 * 1024;

const errors = [];
const warnings = [];

const err = (id, msg) => errors.push({ id, msg });
const warn = (id, msg) => warnings.push({ id, msg });

/** Structural checks on an SVG referenced by an entity. */
async function lintSvg(id, variant, path, relPath) {
  if (!(await fileHasContent(path))) {
    err(id, `logos.${variant} points at "${relPath}" which is missing or empty`);
    return;
  }

  const svg = await readFile(path, 'utf8');
  const bytes = Buffer.byteLength(svg);

  if (bytes > MAX_SVG_BYTES) {
    err(id, `${relPath} is ${(bytes / 1024).toFixed(1)}KB, over the 50KB cap — needs SVGO cleanup`);
  }
  if (!/<svg[\s>]/i.test(svg)) {
    err(id, `${relPath} does not contain an <svg> element`);
    return;
  }
  if (!/\sviewBox\s*=/i.test(svg)) {
    err(id, `${relPath} has no viewBox attribute`);
  }
  if (/<image[\s>]/i.test(svg) || /data:image\/(png|jpe?g|gif|webp)/i.test(svg)) {
    err(id, `${relPath} embeds a raster image — SVG sources must be pure vector`);
  }
  if (/<script[\s>]/i.test(svg)) {
    err(id, `${relPath} contains a <script> tag`);
  }
  if (/\brgb\s*\(/i.test(svg)) {
    warn(id, `${relPath} uses rgb() colors — prefer #RRGGBB hex`);
  }
  if (variant === 'mono_dark' || variant === 'mono_light') {
    const fills = new Set(
      [...svg.matchAll(/fill\s*[:=]\s*["']?(#[0-9A-Fa-f]{3,8}|[a-z]+)/gi)]
        .map((m) => m[1].toLowerCase())
        .filter((f) => f !== 'none'),
    );
    if (fills.size > 1) {
      warn(id, `${relPath} is a mono variant but uses ${fills.size} fill colors: ${[...fills].join(', ')}`);
    }
  }
}

async function main() {
  const schema = await loadSchema();
  const categories = await loadCategories();

  // The schema enum and the taxonomy file must not drift apart.
  const schemaCats = new Set(schema.properties.categories.items.enum);
  const taxonomyCats = new Set(categories.map((c) => c.id));
  for (const id of schemaCats) {
    if (!taxonomyCats.has(id)) err('schemas', `category "${id}" is in entity.schema.json but not categories.json`);
  }
  for (const id of taxonomyCats) {
    if (!schemaCats.has(id)) err('schemas', `category "${id}" is in categories.json but not entity.schema.json`);
  }

  const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const entities = await loadEntities();
  if (entities.length === 0) {
    console.error(red('No entities found in entities/. Run `pnpm seed` first.'));
    process.exit(1);
  }

  const knownIds = new Set(entities.map((e) => e.id));

  for (const { id, dir, data } of entities) {
    if (!validate(data)) {
      for (const e of validate.errors) {
        const at = e.instancePath || '(root)';
        const extra = e.params?.allowedValues ? ` (allowed: ${e.params.allowedValues.join(', ')})` : '';
        err(id, `${at} ${e.message}${extra}`);
      }
    }

    if (data.id !== id) {
      err(id, `folder name "${id}" does not match the id field "${data.id}"`);
    }

    if (data.acquired_by && !knownIds.has(data.acquired_by)) {
      err(id, `acquired_by "${data.acquired_by}" is not an entity in this dataset`);
    }
    if (data.acquired_by === data.id) {
      err(id, `acquired_by points at itself`);
    }

    if (data.status === 'acquired' && !data.acquired_by) {
      warn(id, `status is "acquired" but acquired_by is not set`);
    }

    // Account aggregators should carry an aa_id; it is the whole point of the category.
    if (data.categories?.includes('account-aggregator') && !data.aa_id) {
      warn(id, `is an account-aggregator but has no aa_id`);
    }

    // Only banks get an IFSC prefix.
    const bankish = ['public-sector-bank', 'private-bank', 'small-finance-bank', 'payments-bank'];
    if (data.ifsc_prefix && !data.categories?.some((c) => bankish.includes(c))) {
      warn(id, `has ifsc_prefix "${data.ifsc_prefix}" but is not categorised as a bank`);
    }

    for (const variant of LOGO_VARIANTS) {
      const rel = data.logos?.[variant];
      if (typeof rel !== 'string') continue;
      await lintSvg(id, variant, join(dir, rel), `${id}/${rel}`);
    }
  }

  const byEntity = new Map();
  for (const { id, msg } of errors) {
    if (!byEntity.has(id)) byEntity.set(id, []);
    byEntity.get(id).push(msg);
  }

  if (!quiet && warnings.length > 0) {
    console.log(bold(`\n${warnings.length} warning${warnings.length === 1 ? '' : 's'}`));
    for (const { id, msg } of warnings) {
      console.log(`  ${yellow('!')} ${bold(id)} ${dim('—')} ${msg}`);
    }
  }

  if (errors.length > 0) {
    console.log(bold(`\n${errors.length} error${errors.length === 1 ? '' : 's'}`));
    for (const [id, msgs] of byEntity) {
      console.log(`  ${red('✖')} ${bold(id)}`);
      for (const m of msgs) console.log(`      ${m}`);
    }
    console.log(red(`\nvalidation failed — ${errors.length} error(s) across ${byEntity.size} entit(ies)\n`));
    process.exit(1);
  }

  console.log(
    `${green('✔')} ${bold('validate')} ${entities.length} entities pass the schema` +
      (warnings.length ? dim(` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})`) : ''),
  );
}

main().catch((e) => {
  console.error(red(e.stack ?? e.message));
  process.exit(1);
});
