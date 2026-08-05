#!/usr/bin/env node
/**
 * Reports which logo variants are missing per entity. This is a coverage
 * report, not a gate — it exits 0 even when everything is missing, because an
 * entity with metadata and no artwork is still a useful contribution.
 *
 *   node scripts/check-logos.mjs               # summary + entities missing `full`
 *   node scripts/check-logos.mjs --all         # every entity, every gap
 *   node scripts/check-logos.mjs --json        # machine-readable
 *   node scripts/check-logos.mjs --strict      # exit 1 if any entity lacks full.svg
 */
import { join } from 'node:path';
import {
  EXPECTED_VARIANTS,
  LOGO_VARIANTS,
  bold,
  dim,
  fileHasContent,
  green,
  loadEntities,
  red,
  yellow,
} from './lib.mjs';

const argv = new Set(process.argv.slice(2));
const showAll = argv.has('--all');
const asJson = argv.has('--json');
const strict = argv.has('--strict');

/** A variant counts as present only if declared AND on disk with content. */
async function variantState(dir, rel) {
  if (typeof rel !== 'string') return 'unsourced';
  return (await fileHasContent(join(dir, rel))) ? 'present' : 'broken';
}

async function main() {
  const entities = await loadEntities();
  const rows = [];

  for (const { id, dir, data } of entities) {
    const state = {};
    for (const variant of LOGO_VARIANTS) {
      state[variant] = await variantState(dir, data.logos?.[variant]);
    }
    const have = EXPECTED_VARIANTS.filter((v) => state[v] === 'present');
    rows.push({
      id,
      name: data.name,
      state,
      missing: EXPECTED_VARIANTS.filter((v) => state[v] !== 'present'),
      broken: LOGO_VARIANTS.filter((v) => state[v] === 'broken'),
      completeness: Math.round((have.length / EXPECTED_VARIANTS.length) * 100),
    });
  }

  const withFull = rows.filter((r) => r.state.full === 'present');
  const withAny = rows.filter((r) => LOGO_VARIANTS.some((v) => r.state[v] === 'present'));
  const complete = rows.filter((r) => r.missing.length === 0);
  const broken = rows.filter((r) => r.broken.length > 0);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          total: rows.length,
          with_full: withFull.length,
          with_any: withAny.length,
          complete: complete.length,
          broken: broken.length,
          entities: rows,
        },
        null,
        2,
      ),
    );
    process.exit(strict && withFull.length < rows.length ? 1 : 0);
  }

  const pct = (n) => `${((n / rows.length) * 100).toFixed(0)}%`;

  console.log(bold('\nLogo coverage'));
  console.log(`  entities            ${rows.length}`);
  console.log(`  with full.svg       ${withFull.length}  ${dim(pct(withFull.length))}`);
  console.log(`  with any variant    ${withAny.length}  ${dim(pct(withAny.length))}`);
  console.log(`  fully complete      ${complete.length}  ${dim(pct(complete.length))}`);

  for (const variant of LOGO_VARIANTS) {
    const n = rows.filter((r) => r.state[variant] === 'present').length;
    console.log(`  ${variant.padEnd(18)}  ${String(n).padStart(3)}  ${dim(pct(n))}`);
  }

  if (broken.length > 0) {
    console.log(bold(`\nBroken references (declared but missing on disk)`));
    for (const r of broken) {
      console.log(`  ${red('✖')} ${r.id} ${dim('—')} ${r.broken.join(', ')}`);
    }
  }

  const noFull = rows.filter((r) => r.state.full !== 'present');
  if (noFull.length > 0 && !showAll) {
    console.log(bold(`\nMissing full.svg (${noFull.length})`));
    const preview = noFull.slice(0, 25);
    for (const r of preview) console.log(`  ${yellow('•')} ${r.id}`);
    if (noFull.length > preview.length) {
      console.log(dim(`  … and ${noFull.length - preview.length} more — run with --all`));
    }
  }

  if (showAll) {
    console.log(bold('\nPer-entity gaps'));
    for (const r of rows) {
      if (r.missing.length === 0) {
        console.log(`  ${green('✔')} ${r.id}`);
      } else {
        console.log(`  ${yellow('•')} ${r.id.padEnd(28)} ${dim(`${r.completeness}%`)}  missing: ${r.missing.join(', ')}`);
      }
    }
  }

  console.log();

  if (strict && withFull.length < rows.length) {
    console.log(red(`--strict: ${noFull.length} entities lack full.svg\n`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(red(e.stack ?? e.message));
  process.exit(1);
});
