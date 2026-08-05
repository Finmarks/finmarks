#!/usr/bin/env node
/**
 * Rasterises every entity SVG to PNG at 1x / 2x / 3x into dist/png/{id}/.
 *
 * PNGs are build output, not source — they are never committed. The CDN deploy
 * job runs this and uploads the result alongside the SVGs.
 *
 * `sharp` is an optional dependency (native bindings, ~30MB). When it is not
 * installed this exits 0 with a notice so `pnpm build` still works locally.
 *
 *   node scripts/convert-png.mjs [--base 64] [--only hdfc-bank,phonepe] [--force]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_DIR, LOGO_VARIANTS, bold, dim, fileHasContent, green, loadEntities, red, yellow } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const BASE = Number(flag('base', 64));
const SCALES = [1, 2, 3];
const only = flag('only', null)?.split(',').map((s) => s.trim());
const force = args.includes('--force');

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.log(`${yellow('!')} ${bold('convert-png')} skipped — sharp is not installed`);
  console.log(dim('  install it with: pnpm add -Dw sharp'));
  process.exit(0);
}

/**
 * Read the viewBox so non-square logos keep their aspect ratio: height is
 * pinned to BASE*scale and width follows. Wordmarks are much wider than tall,
 * and forcing them into a square box would letterbox or distort them.
 */
function dimensionsFor(svg, scale) {
  const h = BASE * scale;
  const m = svg.match(/viewBox\s*=\s*["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return { height: h };
  const [w, vh] = [Number(m[1]), Number(m[2])];
  if (!w || !vh) return { height: h };
  return { height: h, width: Math.max(1, Math.round((w / vh) * h)) };
}

async function main() {
  const entities = await loadEntities();
  const targets = only ? entities.filter((e) => only.includes(e.id)) : entities;

  let written = 0;
  let skipped = 0;
  const failures = [];

  for (const { id, dir, data } of targets) {
    for (const variant of LOGO_VARIANTS) {
      const rel = data.logos?.[variant];
      if (typeof rel !== 'string') continue;

      const src = join(dir, rel);
      if (!(await fileHasContent(src))) continue;

      const outDir = join(DIST_DIR, 'png', id);
      await mkdir(outDir, { recursive: true });

      const svg = await readFile(src);
      const svgText = svg.toString('utf8');

      for (const scale of SCALES) {
        const suffix = scale === 1 ? '' : `@${scale}x`;
        const out = join(outDir, `${variant.replace(/_/g, '-')}${suffix}.png`);

        if (existsSync(out) && !force) {
          skipped += 1;
          continue;
        }

        try {
          await writeFile(
            out,
            await sharp(svg, { density: 72 * scale * 4 })
              .resize({ ...dimensionsFor(svgText, scale), fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png({ compressionLevel: 9, palette: true })
              .toBuffer(),
          );
          written += 1;
        } catch (e) {
          failures.push(`${id}/${rel} @${scale}x — ${e.message}`);
        }
      }
    }
  }

  if (failures.length > 0) {
    console.log(bold(`\n${failures.length} conversion failure(s)`));
    for (const f of failures) console.log(`  ${red('✖')} ${f}`);
  }

  console.log(
    `${green('✔')} ${bold('convert-png')} wrote ${written} PNG${written === 1 ? '' : 's'}` +
      (skipped ? dim(` (${skipped} already present, --force to redo)`) : ''),
  );

  if (written === 0 && skipped === 0 && failures.length === 0) {
    console.log(dim('  no SVG sources found yet — nothing to rasterise'));
  }

  if (failures.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(red(e.stack ?? e.message));
  process.exit(1);
});
