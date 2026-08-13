#!/usr/bin/env node
/**
 * Copies the generated dist/*.json from the repo root into the package's data/
 * directory so the bundle can import it and `exports["./index.json"]` resolves
 * for consumers who want the raw JSON.
 *
 * Runs as the package's prebuild step. Fails loudly if the index has not been
 * generated — building a package against a stale or absent dataset is worse
 * than not building at all.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIST = resolve(PKG, '..', '..', 'dist');
const DATA = join(PKG, 'data');

const FILES = ['index.json', 'index-lite.json', 'categories.json'];

if (!existsSync(REPO_DIST)) {
  console.error('finmarks: repo dist/ not found — run `pnpm generate` at the repo root first.');
  process.exit(1);
}

await mkdir(DATA, { recursive: true });

for (const file of FILES) {
  const src = join(REPO_DIST, file);
  if (!existsSync(src)) {
    console.error(`finmarks: dist/${file} missing — run \`pnpm generate\` at the repo root.`);
    process.exit(1);
  }
  await copyFile(src, join(DATA, file));
}

console.log(`finmarks: copied ${FILES.length} data files into packages/finmarks/data/`);
