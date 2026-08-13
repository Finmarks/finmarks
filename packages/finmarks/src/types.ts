/**
 * Types for the FinMarks dataset.
 *
 * These mirror schemas/entity.schema.json. The union members are written out
 * literally rather than generated at build time so that editor autocomplete
 * works without a codegen step in the consumer's install.
 */

/** Every category tag in the taxonomy. */
export type Category =
  | 'public-sector-bank'
  | 'private-bank'
  | 'small-finance-bank'
  | 'payments-bank'
  | 'upi-psp'
  | 'wallet'
  | 'payment-gateway'
  | 'neobank'
  | 'bnpl'
  | 'lending-platform'
  | 'wealthtech'
  | 'insurtech'
  | 'infra-api'
  | 'account-aggregator'
  | 'credit-bureau'
  | 'nbfc'
  | 'international-bank'
  | 'crypto-exchange'
  | 'pos-terminal'
  | 'regulator';

/** Logo variants an entity can ship. */
export type LogoVariant = 'full' | 'icon' | 'wordmark' | 'mono_dark' | 'mono_light' | 'square';

/** Regulators an entity can fall under. */
export type Regulator = 'RBI' | 'SEBI' | 'IRDAI' | 'NPCI' | 'PFRDA' | 'IFSCA' | 'MCA' | 'None';

/** Operational status of a brand. */
export type EntityStatus = 'active' | 'acquired' | 'defunct' | 'rebranded';

/** ISO 3166-1 alpha-2 codes present in the dataset. */
export type CountryCode = 'IN' | 'US' | 'GB' | 'SG' | 'AE';

/**
 * Resolved CDN URLs per variant. Only variants with an asset on disk at build
 * time appear here, so any key present is guaranteed to resolve.
 */
export type LogoUrls = Partial<Record<LogoVariant, string>>;

/** A single brand entity as published in dist/index.json. */
export interface Entity {
  id: string;
  name: string;
  short_name: string;
  categories: Category[];
  brand_color: string;
  country: CountryCode;
  status: EntityStatus;
  logos: LogoUrls;

  legal_name?: string;
  founded?: number;
  regulated_by?: Regulator[];
  /** 4-letter IFSC prefix. Banks only. */
  ifsc_prefix?: string;
  /** UPI VPA suffixes, each including the leading `@`. */
  upi_handles?: string[];
  /** Account Aggregator FIP id, as registered with Sahamati. */
  fip_id?: string;
  /** Account Aggregator FIU id. */
  fiu_id?: string;
  /** AA operator id. Account aggregators only. */
  aa_id?: string;
  website?: string;
  /** Entity id of the owner, when this brand is owned by another in the dataset. */
  acquired_by?: string;
  tags?: string[];
}

/** A category with its live entity count. */
export interface CategoryInfo {
  id: Category;
  label: string;
  regulator: string;
  description: string;
  /** Roadmap phase the category was introduced in. */
  phase: number;
  count: number;
}

/** Shape of the published dist/index.json. */
export interface EntityIndex {
  version: string;
  generated_at: string;
  schema_version: string;
  cdn_base: string;
  total: number;
  category_counts: Record<Category, number>;
  entities: Entity[];
}

/** Options for {@link search}. */
export interface SearchOptions {
  /** Cap the number of results. Default: unlimited. */
  limit?: number;
  /** Restrict to entities in at least one of these categories. */
  categories?: Category | Category[];
  /** Include non-active entities. Default: true. */
  includeInactive?: boolean;
}

/** Options for {@link getByCategory} and {@link getAllEntities}. */
export interface FilterOptions {
  /** Include non-active entities. Default: true. */
  includeInactive?: boolean;
}
