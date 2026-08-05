/**
 * Data loading and lookup indexes.
 *
 * The JSON is imported statically so bundlers can inline it and consumers need
 * no runtime fetch. Indexes are built lazily on first access — importing the
 * package costs nothing until you actually query it.
 */
import indexJson from '../data/index.json' with { type: 'json' };
import categoriesJson from '../data/categories.json' with { type: 'json' };
import type { Category, CategoryInfo, Entity, EntityIndex } from './types.js';

const index = indexJson as unknown as EntityIndex;

/** The raw published index, including version and generation metadata. */
export const data: EntityIndex = index;

/** CDN origin the published logo URLs point at. */
export const CDN_BASE: string = index.cdn_base;

/** Dataset version, matching the npm package version it shipped with. */
export const VERSION: string = index.version;

let byId: Map<string, Entity> | null = null;
let byCategory: Map<Category, Entity[]> | null = null;

/** id -> entity, built on first use. */
export function idIndex(): Map<string, Entity> {
  if (byId === null) {
    byId = new Map(index.entities.map((e) => [e.id, e]));
  }
  return byId;
}

/** category -> entities, built on first use. Preserves dataset order. */
export function categoryIndex(): Map<Category, Entity[]> {
  if (byCategory === null) {
    const map = new Map<Category, Entity[]>();
    for (const entity of index.entities) {
      for (const category of entity.categories) {
        const bucket = map.get(category);
        if (bucket) bucket.push(entity);
        else map.set(category, [entity]);
      }
    }
    byCategory = map;
  }
  return byCategory;
}

/** The taxonomy with live counts. */
export const categories: CategoryInfo[] = (categoriesJson as { categories: CategoryInfo[] }).categories;
