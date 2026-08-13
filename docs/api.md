# API reference

```bash
npm install finmarks
```

The package ships ESM and CJS builds with TypeScript declarations. The dataset is inlined into the bundle, so there is no runtime fetch and no loader configuration.

```ts
import { getEntity, getLogoUrl, getByCategory, search } from 'finmarks';
```

---

## Entities

### `getEntity(id)`

```ts
function getEntity(id: string): Entity | undefined
```

Look up one entity. Returns `undefined` for an unknown id.

```ts
const hdfc = getEntity('hdfc-bank');
hdfc?.name;         // 'HDFC Bank'
hdfc?.brand_color;  // '#004C8F'
hdfc?.ifsc_prefix;  // 'HDFC'
```

### `mustGetEntity(id)`

```ts
function mustGetEntity(id: string): Entity
```

As above, but throws when the id is unknown. Use it when a missing entity means a bug rather than a normal miss — it saves a `?.` chain on a value you know exists.

### `hasEntity(id)`

```ts
function hasEntity(id: string): boolean
```

### `getAllEntities(options?)`

```ts
function getAllEntities(options?: FilterOptions): Entity[]
```

Every entity. Pass `{ includeInactive: false }` to drop anything not `active`.

### `getAllEntityIds()`

```ts
function getAllEntityIds(): string[]
```

---

## Logos

### `getLogoUrl(id, variant?)`

```ts
function getLogoUrl(id: string, variant?: LogoVariant): string | undefined
```

CDN URL for one variant, defaulting to `'full'`. Returns `undefined` when the entity is unknown **or** that variant has not been sourced.

The index only lists variants that exist on disk at build time, so a returned URL always resolves — you never need to handle a 404.

```ts
getLogoUrl('hdfc-bank');          // full logo
getLogoUrl('hdfc-bank', 'icon');  // symbol only
```

### `getLogoUrlWithFallback(id, variants?)`

```ts
function getLogoUrlWithFallback(id: string, variants?: LogoVariant[]): string | undefined
```

Tries each variant in order and returns the first that exists. Default order: `['full', 'icon', 'wordmark']`.

```ts
// prefer a square app icon, degrade to the mark, then the full logo
getLogoUrlWithFallback('phonepe', ['square', 'icon', 'full']);
```

### `getLogos(id)`

```ts
function getLogos(id: string): LogoUrls
```

Every available URL for an entity, keyed by variant. Returns a fresh object; mutating it does not affect the dataset.

### `buildLogoUrl(id, filename)`

```ts
function buildLogoUrl(id: string, filename: string): string
```

Composes a CDN URL without a dataset lookup. Does not verify the asset exists — prefer `getLogoUrl` unless you have a reason not to.

### Variants

| Variant | Description |
|---|---|
| `full` | Symbol + wordmark. The primary logo. |
| `icon` | Symbol only. Square or near-square. |
| `wordmark` | Text only. |
| `mono_dark` | Single colour, for dark backgrounds. |
| `mono_light` | Single colour, for light backgrounds. |
| `square` | App-icon format, for circular avatars. |

---

## Categories

### `getByCategory(category, options?)`

```ts
function getByCategory(category: Category | Category[], options?: FilterOptions): Entity[]
```

Entities in a category, or the **union** of several, deduped and in dataset order.

```ts
getByCategory('upi-psp');
getByCategory(['upi-psp', 'payment-gateway']);
getByCategory('bnpl', { includeInactive: false });
```

### `getByAllCategories(categories, options?)`

```ts
function getByAllCategories(categories: Category[], options?: FilterOptions): Entity[]
```

The **intersection** — entities holding every listed category.

```ts
// super-apps that are both a UPI app and a wallet
getByAllCategories(['upi-psp', 'wallet']);
```

### `listCategories()`

```ts
function listCategories(): CategoryInfo[]
```

The taxonomy with live entity counts.

```ts
listCategories();
// [{ id: 'upi-psp', label: 'UPI / PSP apps', regulator: 'NPCI', count: 26, phase: 1, description: '…' }, …]
```

### `getCategory(id)`

```ts
function getCategory(id: Category): CategoryInfo | undefined
```

---

## Search and lookup

### `search(query, options?)`

```ts
function search(query: string, options?: SearchOptions): Entity[]
```

Matches against id, name, short name, legal name, tags, UPI handles and IFSC prefixes. Case-insensitive. Returns `[]` for a blank query.

Results are ranked by match quality — exact id, name or IFSC match first, then prefix, then word-boundary, then substring, then tag — with ties broken alphabetically so output is stable.

```ts
search('paytm');
search('bank', { limit: 5 });
search('invest', { categories: 'wealthtech' });
search('pay', { categories: ['upi-psp', 'wallet'], includeInactive: false });
```

### `getByIfscPrefix(prefix)`

```ts
function getByIfscPrefix(prefix: string): Entity | undefined
```

Resolves the first four characters of an IFSC code to a bank. Case-insensitive.

```ts
const ifsc = 'HDFC0000123';
getByIfscPrefix(ifsc.slice(0, 4));  // → HDFC Bank
```

### `getByUpiHandle(handle)`

```ts
function getByUpiHandle(handle: string): Entity | undefined
```

Resolves a UPI handle to its issuing entity. Accepts a full VPA (`someone@ybl`), a handle with `@` (`@ybl`), or a bare suffix (`ybl`).

```ts
getByUpiHandle('kaval@ybl');  // → PhonePe
```

Note that a handle identifies the **PSP**, not the user's bank — `@ybl` means the VPA was issued through PhonePe's Yes Bank rails.

---

## Constants

```ts
import { VERSION, CDN_BASE, data } from 'finmarks';

VERSION;     // '0.1.0' — dataset version
CDN_BASE;    // 'https://cdn.jsdelivr.net/gh/finmarks/finmarks@main'
data;        // the raw EntityIndex, including category_counts and generated_at
```

---

## Types

Every type is exported.

```ts
import type {
  Entity,
  EntityIndex,
  Category,
  CategoryInfo,
  LogoVariant,
  LogoUrls,
  Regulator,
  EntityStatus,
  CountryCode,
  SearchOptions,
  FilterOptions,
} from 'finmarks';
```

### `Entity`

```ts
interface Entity {
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
  ifsc_prefix?: string;
  upi_handles?: string[];
  fip_id?: string;
  fiu_id?: string;
  aa_id?: string;
  website?: string;
  acquired_by?: string;
  tags?: string[];
}
```

Optional fields are omitted entirely when empty, so `'ifsc_prefix' in entity` is a meaningful check.

### `FilterOptions` / `SearchOptions`

```ts
interface FilterOptions {
  includeInactive?: boolean;  // default true
}

interface SearchOptions extends FilterOptions {
  limit?: number;
  categories?: Category | Category[];
}
```

---

## Raw JSON

The generated files are exported as subpaths for consumers who want the data without the API:

```ts
import index from 'finmarks/index.json';
import categories from 'finmarks/categories.json';
```

Or fetch them from the CDN — see [the README](../README.md#without-npm).
