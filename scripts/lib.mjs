/**
 * Shared helpers for the build scripts. Nothing here touches the network.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ENTITIES_DIR = join(ROOT, 'entities');
export const SCHEMAS_DIR = join(ROOT, 'schemas');
export const DIST_DIR = join(ROOT, 'dist');

/** Logo variants in canonical order. `full` is the primary. */
export const LOGO_VARIANTS = ['full', 'icon', 'wordmark', 'mono_dark', 'mono_light', 'square'];

/** Variants a complete entity is expected to ship. `square` stays optional. */
export const EXPECTED_VARIANTS = ['full', 'icon', 'wordmark', 'mono_dark', 'mono_light'];

export const CDN_BASE = process.env.BHARATBRANDS_CDN ?? 'https://cdn.bharatbrands.dev';

const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (color) => (s) => (useColor ? `${c[color]}${s}${c.reset}` : String(s));

export const red = paint('red');
export const green = paint('green');
export const yellow = paint('yellow');
export const blue = paint('blue');
export const dim = paint('dim');
export const bold = paint('bold');

export async function readJson(path) {
  const raw = await readFile(path, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${path}: ${err.message}`);
  }
}

/** Stable JSON stringify with 2-space indent and trailing newline. */
export function toJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Every entity id that has a folder in entities/, sorted. */
export async function listEntityIds() {
  if (!existsSync(ENTITIES_DIR)) return [];
  const dirents = await readdir(ENTITIES_DIR, { withFileTypes: true });
  return dirents
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();
}

/** Load every entity.json. Returns [{ id, dir, file, data }] sorted by id. */
export async function loadEntities() {
  const ids = await listEntityIds();
  const out = [];
  for (const id of ids) {
    const dir = join(ENTITIES_DIR, id);
    const file = join(dir, 'entity.json');
    if (!existsSync(file)) {
      throw new Error(`entities/${id}/ has no entity.json`);
    }
    out.push({ id, dir, file, data: await readJson(file) });
  }
  return out;
}

export async function loadSchema() {
  return readJson(join(SCHEMAS_DIR, 'entity.schema.json'));
}

export async function loadCategories() {
  const { categories } = await readJson(join(SCHEMAS_DIR, 'categories.json'));
  return categories;
}

/** CDN URL for one logo variant. */
export function cdnUrl(id, filename) {
  return `${CDN_BASE}/entities/${id}/${filename}`;
}

/** True when the file exists and is non-empty. */
export async function fileHasContent(path) {
  try {
    const s = await stat(path);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}
