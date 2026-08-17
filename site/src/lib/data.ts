/**
 * The site's data layer. Reads the generated index straight from the repo's
 * dist/ at build time — no API, no fetch, no duplication of the dataset.
 *
 * Everything here runs during `astro build` unless a component explicitly
 * imports it into an island.
 */
import indexJson from '../../../dist/index.json';
import categoriesJson from '../../../dist/categories.json';

export type LogoVariant = 'full' | 'icon' | 'mono_dark' | 'mono_light';

export interface Entity {
  id: string;
  name: string;
  short_name: string;
  categories: string[];
  brand_color: string;
  country: string;
  status: string;
  logos: Partial<Record<LogoVariant, string>>;
  legal_name?: string;
  founded?: number;
  regulated_by?: string[];
  ifsc_prefix?: string;
  upi_handles?: string[];
  fip_id?: string;
  fiu_id?: string;
  aa_id?: string;
  website?: string;
  acquired_by?: string;
  tags?: string[];
}

export interface CategoryInfo {
  id: string;
  label: string;
  regulator: string;
  description: string;
  phase: number;
  count: number;
}

export const VERSION: string = indexJson.version;
/**
 * In development (pnpm dev), serve logos from the local symlinked entities/
 * directory so you don't need an internet connection or a published GitHub repo.
 * In production builds, use the CDN URL baked into dist/index.json.
 */
export const CDN_BASE: string = import.meta.env.DEV ? '' : indexJson.cdn_base;
/**
 * The published CDN origin, always absolute. CDN_BASE goes empty in dev so the
 * site serves local SVGs, but the generated text endpoints (llms.txt,
 * llms-full.txt) document URLs a reader will fetch from the open internet —
 * those must be the real CDN paths even when previewing locally.
 */
export const CDN_ORIGIN: string = indexJson.cdn_base;
export const GENERATED_AT: string = indexJson.generated_at;

const rawEntities = indexJson.entities as Entity[];
export const entities: Entity[] = import.meta.env.DEV
  ? rawEntities.map((e) => ({
      ...e,
      logos: Object.fromEntries(
        Object.entries(e.logos).map(([k, url]) => {
          if (!url) return [k, url];
          const filename = url.includes('/entities/')
            ? url.slice(url.indexOf('/entities/'))
            : `/entities/${e.id}/${k === 'mono_dark' ? 'mono-dark' : k === 'mono_light' ? 'mono-light' : k}.svg`;
          return [k, filename];
        })
      ) as Partial<Record<LogoVariant, string>>,
    }))
  : rawEntities;

export const categories = categoriesJson.categories as CategoryInfo[];

/** Canonical order of logo variants, used everywhere variants are listed. */
export const VARIANTS: LogoVariant[] = ['full', 'icon', 'mono_dark', 'mono_light'];

/** Categories that actually have entities, for navigation. */
export const activeCategories = categories.filter((c) => c.count > 0);

export const byId = new Map(entities.map((e) => [e.id, e]));

export function getEntity(id: string): Entity | undefined {
  return byId.get(id);
}

export function getByCategory(id: string): Entity[] {
  return entities.filter((e) => e.categories.includes(id));
}

export function categoryLabel(id: string): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}

/** True when any logo variant has been sourced. */
export function hasArtwork(e: Entity): boolean {
  return Object.keys(e.logos).length > 0;
}

/**
 * A short label for the placeholder mark shown when no artwork exists.
 *
 * A hard slice mangles names — "Airtel Payments Bank" became "Airte". Instead
 * take initials for multi-word names and a short prefix for single words, so
 * the placeholder reads as a deliberate monogram rather than truncated text.
 */
export function monogram(e: Entity | { short_name: string; name: string }): string {
  const source = e.short_name.length <= 5 ? e.short_name : e.name;
  const words = source.split(/[\s-]+/).filter(Boolean);

  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  const word = words[0] ?? e.short_name;
  return word.length <= 5 ? word : word.slice(0, 4);
}

export const stats = {
  total: entities.length,
  sourced: entities.filter(hasArtwork).length,
  categories: activeCategories.length,
  ifsc: entities.filter((e) => e.ifsc_prefix).length,
  upi: entities.reduce((n, e) => n + (e.upi_handles?.length ?? 0), 0),
};

/**
 * The payload handed to the browser island. Trimmed to the fields the client
 * actually renders — the full index carries fields only the detail pages use,
 * and shipping them would roughly double the JS payload for no benefit.
 */
export interface BrowseEntity {
  id: string;
  name: string;
  short_name: string;
  /** Precomputed placeholder label, so the client never recomputes it. */
  mono: string;
  categories: string[];
  brand_color: string;
  status: string;
  ifsc_prefix?: string;
  upi_handle?: string;
  variants: LogoVariant[];
  tags?: string[];
  legal_name?: string;
}

export const browseData: BrowseEntity[] = entities.map((e) => ({
  id: e.id,
  name: e.name,
  short_name: e.short_name,
  mono: monogram(e),
  categories: e.categories,
  brand_color: e.brand_color,
  status: e.status,
  ...(e.ifsc_prefix ? { ifsc_prefix: e.ifsc_prefix } : {}),
  ...(e.upi_handles?.length ? { upi_handle: e.upi_handles[0] } : {}),
  ...(e.tags?.length ? { tags: e.tags } : {}),
  ...(e.legal_name ? { legal_name: e.legal_name } : {}),
  variants: VARIANTS.filter((v) => e.logos[v]),
}));
