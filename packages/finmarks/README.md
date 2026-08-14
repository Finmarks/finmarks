# Finmarks

Logos and structured metadata for the Indian fintech ecosystem — banks, UPI apps, payment gateways, neobanks, account aggregators and more.

**115 entities · 16 categories · MIT licensed**

```bash
npm install finmarks
```

## Usage

```ts
import { getEntity, getLogoUrl, getByCategory, search } from 'finmarks';

const hdfc = getEntity('hdfc-bank');
hdfc?.brand_color;   // '#004C8F'
hdfc?.ifsc_prefix;   // 'HDFC'
hdfc?.upi_handles;   // ['@hdfcbank']

getLogoUrl('hdfc-bank', 'icon');
// 'https://cdn.jsdelivr.net/gh/Finmarks/Finmarks@main/entities/hdfc-bank/icon.svg'

getByCategory('upi-psp');                        // 26 entities
getByCategory(['upi-psp', 'payment-gateway']);   // union, deduped

search('paytm');
```

### Resolving identifiers you have at runtime

```ts
import { getByIfscPrefix, getByUpiHandle } from 'finmarks';

getByIfscPrefix('HDFC0000123'.slice(0, 4));  // → HDFC Bank
getByUpiHandle('someone@ybl');               // → PhonePe
```

### Rendering a logo

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

Logo URLs point at the CDN, so the dataset stays small — the package inlines metadata only, not artwork.

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

Full reference: [docs/api.md](https://github.com/Finmarks/Finmarks/blob/main/docs/api.md)

## Categories

`public-sector-bank` · `private-bank` · `small-finance-bank` · `payments-bank` · `upi-psp` · `wallet` · `payment-gateway` · `neobank` · `bnpl` · `lending-platform` · `wealthtech` · `insurtech` · `infra-api` · `account-aggregator` · `credit-bureau` · `nbfc`

Categories are tags — an entity can hold several. Paytm is `upi-psp`, `wallet`, `bnpl`, `payments-bank`, `wealthtech` and `payment-gateway` at once.

## Logo variants

`full` · `icon` 

> **Logo assets are being sourced.** All 115 entities carry complete metadata today; SVG artwork is landing entity by entity. `getLogoUrl` returns `undefined` for variants not yet available, and the index only publishes URLs that actually resolve.

## TypeScript

Fully typed, ESM and CJS, no runtime dependencies.

```ts
import type { Entity, Category, LogoVariant, CategoryInfo } from 'finmarks';
```

## Trademarks

The MIT licence covers this package's code and metadata. It does not grant rights to the trademarks — every logo remains the property of its owner, and your use is governed by that brand's policy. See [docs/trademarks.md](https://github.com/Finmarks/Finmarks/blob/main/docs/trademarks.md).

## Contributing

Missing brands and missing logo variants are what this project needs most. [CONTRIBUTING.md](https://github.com/Finmarks/Finmarks/blob/main/CONTRIBUTING.md)

## Licence

MIT
