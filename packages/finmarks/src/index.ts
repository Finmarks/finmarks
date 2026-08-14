/**
 * Finmarks — logos and structured metadata for the Indian fintech ecosystem.
 *
 * @example
 * import { getEntity, getLogoUrl, getByCategory, search } from '@finmarks/finmarks';
 *
 * getLogoUrl('hdfc-bank', 'icon');
 * getByCategory('upi-psp');
 * search('paytm');
 *
 * @packageDocumentation
 */

export {
  buildLogoUrl,
  getAllEntities,
  getAllEntityIds,
  getByAllCategories,
  getByCategory,
  getByIfscPrefix,
  getByUpiHandle,
  getCategory,
  getEntity,
  getLogos,
  getLogoUrl,
  getLogoUrlWithFallback,
  hasEntity,
  listCategories,
  mustGetEntity,
  search,
} from './utils.js';

export { CDN_BASE, VERSION, data } from './data.js';

export type {
  Category,
  CategoryInfo,
  CountryCode,
  Entity,
  EntityIndex,
  EntityStatus,
  FilterOptions,
  LogoUrls,
  LogoVariant,
  Regulator,
  SearchOptions,
} from './types.js';
