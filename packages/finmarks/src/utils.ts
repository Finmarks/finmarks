/**
 * The public query API.
 *
 * Every accessor returns plain data — no classes, no wrappers. Arrays returned
 * from lookups are fresh copies, so callers can sort or splice them without
 * corrupting the shared index.
 */
import { CDN_BASE, categories, categoryIndex, data, idIndex } from './data.js';
import type {
  Category,
  CategoryInfo,
  Entity,
  FilterOptions,
  LogoUrls,
  LogoVariant,
  SearchOptions,
} from './types.js';

const isActive = (e: Entity): boolean => e.status === 'active';

function applyFilter(entities: Entity[], options?: FilterOptions): Entity[] {
  if (options?.includeInactive === false) return entities.filter(isActive);
  return entities;
}

/**
 * Look up a single entity by id.
 *
 * @returns the entity, or `undefined` when the id is not in the dataset.
 *
 * @example
 * const hdfc = getEntity('hdfc-bank');
 * hdfc?.brand_color; // '#004C8F'
 */
export function getEntity(id: string): Entity | undefined {
  return idIndex().get(id);
}

/**
 * Like {@link getEntity} but throws on an unknown id. Use when a missing entity
 * is a programming error rather than an expected case.
 *
 * @throws {Error} when the id is not in the dataset.
 */
export function mustGetEntity(id: string): Entity {
  const entity = idIndex().get(id);
  if (!entity) throw new Error(`Finmarks: unknown entity id "${id}"`);
  return entity;
}

/** True when an entity with this id exists. */
export function hasEntity(id: string): boolean {
  return idIndex().has(id);
}

/**
 * CDN URL for one logo variant.
 *
 * Returns `undefined` when the entity is unknown or that variant has not been
 * sourced yet — the index only lists variants that actually exist, so a
 * returned URL always resolves.
 *
 * @example
 * getLogoUrl('hdfc-bank', 'icon');
 * // 'https://cdn.jsdelivr.net/gh/Finmarks/Finmarks@main/entities/hdfc-bank/icon.svg'
 */
export function getLogoUrl(id: string, variant: LogoVariant = 'full'): string | undefined {
  return idIndex().get(id)?.logos[variant];
}

/**
 * A logo URL with graceful degradation: tries each variant in order and
 * returns the first that exists.
 *
 * @example
 * // prefer the square app icon, fall back to the mark, then the full logo
 * getLogoUrlWithFallback('phonepe', ['square', 'icon', 'full']);
 */
export function getLogoUrlWithFallback(
  id: string,
  variants: LogoVariant[] = ['full', 'icon', 'wordmark'],
): string | undefined {
  const logos = idIndex().get(id)?.logos;
  if (!logos) return undefined;
  for (const variant of variants) {
    const url = logos[variant];
    if (url) return url;
  }
  return undefined;
}

/** Every available logo URL for an entity, keyed by variant. */
export function getLogos(id: string): LogoUrls {
  return { ...(idIndex().get(id)?.logos ?? {}) };
}

/**
 * All entities in a category, or in any of several categories (union).
 *
 * @example
 * getByCategory('upi-psp');
 * getByCategory(['upi-psp', 'payment-gateway']);
 * getByCategory('bnpl', { includeInactive: false });
 */
export function getByCategory(category: Category | Category[], options?: FilterOptions): Entity[] {
  const wanted = Array.isArray(category) ? category : [category];
  const index = categoryIndex();

  let result: Entity[];
  if (wanted.length === 1) {
    result = [...(index.get(wanted[0]) ?? [])];
  } else {
    // Dedupe across categories while keeping dataset order stable.
    const seen = new Set<string>();
    result = [];
    for (const entity of data.entities) {
      if (seen.has(entity.id)) continue;
      if (entity.categories.some((c) => wanted.includes(c))) {
        seen.add(entity.id);
        result.push(entity);
      }
    }
  }

  return applyFilter(result, options);
}

/**
 * Entities matching every one of the given categories (intersection).
 *
 * @example
 * // super-apps that are both a UPI app and a wallet
 * getByAllCategories(['upi-psp', 'wallet']);
 */
export function getByAllCategories(categoryList: Category[], options?: FilterOptions): Entity[] {
  const result = data.entities.filter((e) => categoryList.every((c) => e.categories.includes(c)));
  return applyFilter(result, options);
}

/**
 * The category taxonomy with entity counts.
 *
 * @example
 * listCategories();
 * // [{ id: 'upi-psp', label: 'UPI / PSP apps', count: 26, ... }, ...]
 */
export function listCategories(): CategoryInfo[] {
  return categories.map((c) => ({ ...c }));
}

/** One category's definition and count, or `undefined` if unknown. */
export function getCategory(id: Category): CategoryInfo | undefined {
  const found = categories.find((c) => c.id === id);
  return found ? { ...found } : undefined;
}

/** Every entity in the dataset. */
export function getAllEntities(options?: FilterOptions): Entity[] {
  return applyFilter([...data.entities], options);
}

/** Every entity id, in dataset order. */
export function getAllEntityIds(): string[] {
  return data.entities.map((e) => e.id);
}

/**
 * Scoring for {@link search}. Higher is a better match. Returns 0 for no match.
 *
 * Exact id or name beats a prefix, which beats a substring, which beats a tag
 * hit — so searching "axis" surfaces Axis Bank above entities merely tagged
 * with it.
 */
function score(entity: Entity, q: string): number {
  const id = entity.id.toLowerCase();
  const name = entity.name.toLowerCase();
  const short = entity.short_name.toLowerCase();

  if (id === q || name === q || short === q) return 100;
  if (id.startsWith(q) || name.startsWith(q) || short.startsWith(q)) return 80;

  // Match on a word boundary inside the name, e.g. "bank" in "Axis Bank".
  if (name.split(/[\s-]+/).some((w) => w.startsWith(q))) return 60;
  if (id.includes(q) || name.includes(q) || short.includes(q)) return 40;
  if (entity.legal_name?.toLowerCase().includes(q)) return 30;
  if (entity.tags?.some((t) => t.toLowerCase().includes(q))) return 20;
  if (entity.upi_handles?.some((h) => h.toLowerCase().includes(q))) return 15;
  if (entity.ifsc_prefix?.toLowerCase() === q) return 90;

  return 0;
}

/**
 * Search by name, id, short name, legal name, tag, UPI handle or IFSC prefix.
 * Results are ranked by match quality, then alphabetically for stable output.
 *
 * @example
 * search('paytm');
 * search('upi', { categories: 'wallet', limit: 5 });
 */
export function search(query: string, options?: SearchOptions): Entity[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];

  const pool = options?.categories ? getByCategory(options.categories) : data.entities;

  const scored: Array<{ entity: Entity; s: number }> = [];
  for (const entity of pool) {
    if (options?.includeInactive === false && !isActive(entity)) continue;
    const s = score(entity, q);
    if (s > 0) scored.push({ entity, s });
  }

  scored.sort((a, b) => b.s - a.s || a.entity.name.localeCompare(b.entity.name));

  const results = scored.map((r) => r.entity);
  return options?.limit != null ? results.slice(0, options.limit) : results;
}

/**
 * Find a bank by its 4-letter IFSC prefix — the first four characters of any
 * IFSC code.
 *
 * @example
 * getByIfscPrefix('HDFC0000123'.slice(0, 4)); // HDFC Bank
 */
export function getByIfscPrefix(prefix: string): Entity | undefined {
  const p = prefix.trim().toUpperCase();
  return data.entities.find((e) => e.ifsc_prefix === p);
}

/**
 * Resolve a UPI VPA or handle suffix to the entity that issues it.
 * Accepts a full VPA (`someone@ybl`) or a bare handle (`@ybl`, `ybl`).
 *
 * @example
 * getByUpiHandle('kaval@ybl'); // PhonePe
 */
export function getByUpiHandle(handle: string): Entity | undefined {
  const raw = handle.trim().toLowerCase();
  const suffix = raw.includes('@') ? raw.slice(raw.lastIndexOf('@') + 1) : raw;
  if (suffix === '') return undefined;
  const needle = `@${suffix}`;
  return data.entities.find((e) => e.upi_handles?.some((h) => h.toLowerCase() === needle));
}

/** Build a CDN URL directly, without a dataset lookup. */
export function buildLogoUrl(id: string, filename: string): string {
  return `${CDN_BASE}/entities/${id}/${filename}`;
}
