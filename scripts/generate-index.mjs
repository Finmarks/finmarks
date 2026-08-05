#!/usr/bin/env node
/**
 * Builds dist/ from entities/. Never edit dist/ by hand — CI regenerates it on
 * every merge to main and the diff is the review surface for data changes.
 *
 *   dist/index.json        full records + resolved CDN URLs
 *   dist/index-lite.json   id, name, short_name, categories, brand_color
 *   dist/categories.json   taxonomy + live entity counts
 *
 * Only logo variants that exist on disk are emitted as URLs, so the published
 * index never advertises a 404.
 *
 *   node scripts/generate-index.mjs [--check]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CDN_BASE,
  DIST_DIR,
  LOGO_VARIANTS,
  ROOT,
  bold,
  cdnUrl,
  dim,
  fileHasContent,
  green,
  loadCategories,
  loadEntities,
  red,
  toJson,
  yellow,
} from './lib.mjs';

const check = process.argv.includes('--check');

/** Version comes from the package, not a hardcoded literal. */
async function packageVersion() {
  const pkg = JSON.parse(await readFile(join(ROOT, 'packages', 'bharatbrands', 'package.json'), 'utf8'));
  return pkg.version;
}

/**
 * Generated timestamps would churn the diff on every run and break --check.
 * Use the date only, and let SOURCE_DATE_EPOCH override for reproducible builds.
 */
function generatedAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  const d = epoch ? new Date(Number(epoch) * 1000) : new Date();
  return d.toISOString().slice(0, 10);
}

async function main() {
  const entities = await loadEntities();
  const taxonomy = await loadCategories();
  const version = await packageVersion();
  const generated_at = generatedAt();

  const categoryCounts = Object.fromEntries(taxonomy.map((c) => [c.id, 0]));
  const full = [];
  const lite = [];

  for (const { id, dir, data } of entities) {
    // Resolve logo URLs, dropping any variant that is not actually on disk.
    const logos = {};
    for (const variant of LOGO_VARIANTS) {
      const rel = data.logos?.[variant];
      if (typeof rel !== 'string') continue;
      if (!(await fileHasContent(join(dir, rel)))) continue;
      logos[variant] = cdnUrl(id, rel);
    }

    for (const c of data.categories) {
      if (c in categoryCounts) categoryCounts[c] += 1;
    }

    const record = {
      id: data.id,
      name: data.name,
      short_name: data.short_name,
      categories: data.categories,
      brand_color: data.brand_color,
      country: data.country,
      status: data.status ?? 'active',
      logos,
    };

    // Optional fields are emitted only when they carry a value, keeping the
    // index tight and making `field in entity` a meaningful check for consumers.
    const optional = [
      'legal_name',
      'founded',
      'regulated_by',
      'ifsc_prefix',
      'upi_handles',
      'fip_id',
      'fiu_id',
      'aa_id',
      'website',
      'acquired_by',
      'tags',
    ];
    for (const key of optional) {
      const v = data[key];
      if (v === undefined || v === null) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      record[key] = v;
    }

    full.push(record);
    lite.push({
      id: data.id,
      name: data.name,
      short_name: data.short_name,
      categories: data.categories,
      brand_color: data.brand_color,
    });
  }

  const indexJson = {
    version,
    generated_at,
    schema_version: '1.0',
    cdn_base: CDN_BASE,
    total: full.length,
    category_counts: categoryCounts,
    entities: full,
  };

  const liteJson = { version, generated_at, total: lite.length, entities: lite };

  const categoriesJson = {
    version,
    generated_at,
    total: taxonomy.length,
    categories: taxonomy.map((c) => ({ ...c, count: categoryCounts[c.id] ?? 0 })),
  };

  const outputs = [
    ['index.json', indexJson],
    ['index-lite.json', liteJson],
    ['categories.json', categoriesJson],
  ];

  if (check) {
    let stale = false;
    for (const [name, value] of outputs) {
      const path = join(DIST_DIR, name);
      if (!existsSync(path)) {
        console.error(`${red('✖')} dist/${name} is missing`);
        stale = true;
        continue;
      }
      const onDisk = await readFile(path, 'utf8');
      // Compare ignoring generated_at, which legitimately moves with the clock.
      const norm = (s) => s.replace(/"generated_at":\s*"[^"]*"/, '"generated_at":"_"');
      if (norm(onDisk) !== norm(toJson(value))) {
        console.error(`${red('✖')} dist/${name} is out of date — run \`pnpm generate\``);
        stale = true;
      }
    }
    if (stale) process.exit(1);
    console.log(`${green('✔')} ${bold('generate --check')} dist/ is up to date`);
    return;
  }

  await mkdir(DIST_DIR, { recursive: true });
  for (const [name, value] of outputs) {
    await writeFile(join(DIST_DIR, name), toJson(value), 'utf8');
  }

  const withLogos = full.filter((e) => Object.keys(e.logos).length > 0).length;
  console.log(`${green('✔')} ${bold('generate')} wrote dist/ ${dim(`(${full.length} entities, ${taxonomy.length} categories)`)}`);
  console.log(`  ${dim('index.json, index-lite.json, categories.json')}`);
  if (withLogos < full.length) {
    console.log(`  ${yellow('!')} ${full.length - withLogos} entities have no logo assets on disk yet`);
  }
}

main().catch((e) => {
  console.error(red(e.stack ?? e.message));
  process.exit(1);
});
