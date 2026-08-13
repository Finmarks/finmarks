# FinMarks

Logos and structured metadata for the Indian fintech ecosystem — banks, UPI apps, payment gateways, neobanks, account aggregators and more.

[![Validate](https://github.com/finmarks/finmarks/actions/workflows/validate.yml/badge.svg)](https://github.com/finmarks/finmarks/actions/workflows/validate.yml)
[![npm](https://img.shields.io/npm/v/finmarks.svg)](https://www.npmjs.com/package/finmarks)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**115 entities · 16 categories · MIT licensed**

---

## Why

Every developer building a fintech product in India needs the same thing: a logo for HDFC Bank, a symbol for PhonePe, an icon for Finvu. Today that means googling for a PNG at the wrong size, emailing brand teams who rarely reply, or buying a design subscription for a handful of marks.

There is no single structured source of truth for Indian fintech brand assets. This is that source of truth — clean SVGs plus the metadata that actually matters in fintech: IFSC prefixes, UPI handles, FIP IDs, regulatory classification.

## Install

```bash
npm install finmarks
# or: pnpm add finmarks / yarn add finmarks
```

> **Before shipping a logo to production:** this package's MIT licence covers
> the code and metadata only. The logos themselves are third-party
> trademarks — check the brand's own guidelines before using one in your
> product. See [Trademarks](#trademarks) below.

This project is pre-1.0 (`0.x`) — minor versions may include breaking
changes. See [CHANGELOG.md](CHANGELOG.md) before upgrading.

## Usage

```ts
import { getEntity, getLogoUrl, getByCategory, search } from 'finmarks';

// One entity, fully typed
const hdfc = getEntity('hdfc-bank');
hdfc?.brand_color;   // '#004C8F'
hdfc?.ifsc_prefix;   // 'HDFC'
hdfc?.upi_handles;   // ['@hdfcbank']

// A logo URL
getLogoUrl('hdfc-bank', 'icon');
// 'https://cdn.jsdelivr.net/gh/finmarks/finmarks@main/entities/hdfc-bank/icon.svg'

// Everything in a category
getByCategory('upi-psp');                        // 26 entities
getByCategory(['upi-psp', 'payment-gateway']);   // union, deduped

// Search across name, id, tags, UPI handles and IFSC prefixes
search('paytm');
search('bank', { categories: 'neobank', limit: 5 });
```

### Fintech-specific lookups

The metadata is the point. These resolve the identifiers you actually have at runtime:

```ts
import { getByIfscPrefix, getByUpiHandle } from 'finmarks';

// You have an IFSC code from a bank account
getByIfscPrefix('HDFC0000123'.slice(0, 4));  // → HDFC Bank

// You have a VPA from a UPI transaction
getByUpiHandle('someone@ybl');               // → PhonePe
```

### Displaying a linked account

```tsx
import { getByIfscPrefix, getLogoUrlWithFallback } from 'finmarks';

function AccountRow({ ifsc }: { ifsc: string }) {
  const bank = getByIfscPrefix(ifsc.slice(0, 4));
  if (!bank) return null;

  return (
    <div style={{ borderLeft: `3px solid ${bank.brand_color}` }}>
      <img
        src={getLogoUrlWithFallback(bank.id, ['square', 'icon', 'full'])}
        alt={bank.name}
        width={32}
        height={32}
      />
      <span>{bank.short_name}</span>
    </div>
  );
}
```

### Without npm

Every asset is served free by [jsDelivr](https://www.jsdelivr.com) straight from
this repository — no account, no API key, no rate limit:

```html
<img src="https://cdn.jsdelivr.net/gh/finmarks/finmarks@main/entities/hdfc-bank/icon.svg" width="32" />
<img src="https://cdn.jsdelivr.net/gh/finmarks/finmarks@main/entities/phonepe/full.svg" alt="PhonePe" width="120" />
```

The index is fetchable too:

```bash
BASE=https://cdn.jsdelivr.net/gh/finmarks/finmarks@main

curl $BASE/dist/index.json        # full dataset
curl $BASE/dist/index-lite.json   # id, name, categories, colour
curl $BASE/dist/categories.json   # taxonomy with counts
```

## Coverage

| Category | Label | Regulator | Entities |
|---|---|---|---|
| `public-sector-bank` | Public sector banks | RBI | 12 |
| `private-bank` | Private banks | RBI | 15 |
| `small-finance-bank` | Small finance banks | RBI | 10 |
| `payments-bank` | Payments banks | RBI | 6 |
| `upi-psp` | UPI / PSP apps | NPCI | 26 |
| `wallet` | Prepaid wallets | RBI | 7 |
| `payment-gateway` | Payment gateways | RBI | 13 |
| `neobank` | Neobanks | RBI | 9 |
| `bnpl` | Buy Now Pay Later | RBI | 9 |
| `lending-platform` | Digital lending | RBI | 20 |
| `wealthtech` | Investing platforms | SEBI | 13 |
| `insurtech` | Insurance platforms | IRDAI | 7 |
| `infra-api` | Infra / API platforms | Varies | 10 |
| `account-aggregator` | Account Aggregators | RBI | 6 |
| `credit-bureau` | Credit bureaus | RBI | 4 |
| `nbfc` | NBFCs | RBI | 7 |

Categories are **tags, not folders** — an entity can hold several. Paytm is `upi-psp`, `wallet`, `bnpl`, `payments-bank`, `wealthtech` and `payment-gateway` at once.

Four more categories are defined and awaiting entities: `international-bank`, `crypto-exchange`, `pos-terminal`, `regulator`.

> **Logo assets are being sourced.** All 115 entities carry complete, validated metadata today. SVG artwork is landing entity by entity — run `pnpm check-logos` for live coverage, and see [CONTRIBUTING.md](CONTRIBUTING.md) if you want to help.

## API

| Function | Returns |
|---|---|
| `getEntity(id)` | `Entity \| undefined` |
| `mustGetEntity(id)` | `Entity` — throws on unknown id |
| `hasEntity(id)` | `boolean` |
| `getLogoUrl(id, variant?)` | `string \| undefined` |
| `getLogoUrlWithFallback(id, variants?)` | first variant that exists |
| `getLogos(id)` | every available URL, keyed by variant |
| `getByCategory(cat \| cats, opts?)` | union of categories |
| `getByAllCategories(cats, opts?)` | intersection of categories |
| `getByIfscPrefix(prefix)` | `Entity \| undefined` |
| `getByUpiHandle(vpaOrHandle)` | `Entity \| undefined` |
| `search(query, opts?)` | ranked `Entity[]` |
| `listCategories()` | `CategoryInfo[]` with counts |
| `getCategory(id)` | one `CategoryInfo` |
| `getAllEntities(opts?)` | every entity |
| `getAllEntityIds()` | every id |
| `buildLogoUrl(id, filename)` | a CDN URL, no lookup |

Full reference in [docs/api.md](docs/api.md).

### Logo variants

| Variant | What it is |
|---|---|
| `full` | Symbol + wordmark. The primary logo. |
| `icon` | Symbol only, no text. Square-ish. |


## Repository layout

```
entities/{id}/entity.json   source of truth — one folder per brand
entities/{id}/*.svg         logo variants
schemas/                    JSON Schema + category taxonomy
scripts/                    validate, generate, check-logos, convert-png
packages/finmarks/      the npm package
dist/                       generated index — never edited by hand
```

## Local development

```bash
pnpm install
pnpm validate       # schema + cross-file checks (the CI gate)
pnpm check-logos    # coverage report, never fails
pnpm generate       # rebuild dist/
pnpm build          # validate + generate + build the package
pnpm test           # validate + package tests
```

## Contributing

Missing brands and missing logo variants are the two things this project needs most. [CONTRIBUTING.md](CONTRIBUTING.md) covers the schema, logo quality standards, and how to open a PR.

## Trademarks

The MIT licence covers the code and metadata in this repository. It does **not** grant rights to the trademarks themselves — every logo remains the property of its owner, and your use of a mark is governed by that brand's own trademark policy. See [docs/trademarks.md](docs/trademarks.md).

## Licence

[MIT](LICENSE)
# finmarks
