# Contributing

Two things move this project forward: **new entities** and **missing logo variants**. Both are welcome, and a metadata-only PR is a real contribution — you do not need to bring artwork.

## Setup

```bash
git clone https://github.com/bharatbrands/bharatbrands.git
cd bharatbrands
pnpm install
pnpm validate
```

You need Node 18+ and pnpm.

## Adding an entity

**1. Create the folder.** The folder name is the entity `id` — lowercase, kebab-case, and stable forever, because it appears in CDN URLs.

```bash
mkdir -p entities/acme-bank
```

**2. Write `entity.json`.** Minimum viable record:

```json
{
  "id": "acme-bank",
  "name": "Acme Bank",
  "short_name": "Acme",
  "categories": ["private-bank"],
  "logos": { "full": null },
  "brand_color": "#004C8F",
  "country": "IN",
  "status": "active",
  "added_at": "2026-08-06",
  "updated_at": "2026-08-06",
  "contributors": ["your-github-username"]
}
```

Add whatever else you can verify — `legal_name`, `founded`, `website`, `regulated_by`, `ifsc_prefix`, `upi_handles`, `tags`. If you open `entity.json` in VS Code you get autocomplete and inline validation, because the schema is bound in [.vscode/settings.json](.vscode/settings.json).

**3. Add logos** (optional but encouraged). Drop SVGs into the folder and point at them:

```json
"logos": {
  "full": "full.svg",
  "icon": "icon.svg",
  "mono_dark": "mono-dark.svg",
  "mono_light": "mono-light.svg"
}
```

Use `null` for variants you do not have. The generated index only publishes URLs for files that actually exist, so a `null` never becomes a broken link.

**4. Validate and open a PR.**

```bash
pnpm validate      # must pass
pnpm check-logos   # shows what is still missing
```

## Field reference

| Field | Required | Notes |
|---|---|---|
| `id` | ✅ | Kebab-case, matches the folder name, permanent |
| `name` | ✅ | Full official brand name |
| `short_name` | ✅ | For space-constrained UI, ≤24 chars |
| `categories` | ✅ | At least one; see the taxonomy below |
| `logos` | ✅ | The `full` key must be present, though it may be `null` |
| `country` | ✅ | `IN`, `US`, `GB`, `SG`, `AE` |
| `brand_color` | | `#RRGGBB`, the primary brand colour |
| `legal_name` | | Registered entity name |
| `founded` | | Year, 1800–2030 |
| `regulated_by` | | `RBI`, `SEBI`, `IRDAI`, `NPCI`, `PFRDA`, `IFSCA`, `MCA`, `None` |
| `ifsc_prefix` | | 4 uppercase letters. Banks only |
| `upi_handles` | | Include the `@`, e.g. `["@ybl"]` |
| `fip_id` / `fiu_id` | | AA framework identifiers. `null` if unverified |
| `aa_id` | | Account aggregators only |
| `website` | | Official URL |
| `status` | | `active`, `acquired`, `defunct`, `rebranded` |
| `acquired_by` | | Entity id of the owner; must exist in the dataset |
| `tags` | | Free-form, for search |
| `contributors` | | GitHub usernames |

### Choosing categories

Categories are tags, not folders — assign every one that applies. Paytm is genuinely six things at once, and under-tagging makes it invisible to the query that should find it.

```
PhonePe    → upi-psp, wallet, wealthtech, insurtech
Razorpay   → payment-gateway, neobank, infra-api, lending-platform
Groww      → wealthtech, upi-psp
CRED       → upi-psp, bnpl, lending-platform
```

The full taxonomy with definitions lives in [schemas/categories.json](schemas/categories.json).

### `status` and `acquired_by`

- `active` — operating under its own brand
- `acquired` — no longer operating independently; set `acquired_by`
- `defunct` — shut down (e.g. Paytm Payments Bank)
- `rebranded` — now operating under a different name; set `acquired_by` to the successor

A brand can be `active` *and* have `acquired_by` set: Freecharge is owned by Axis Bank but still ships as Freecharge. That combination is intentional and valid.

## Logo standards

These are enforced by `pnpm validate` and are not negotiable, because a malformed SVG breaks every consumer at once.

**Required**

- **SVG only.** No PNG or JPG source files.
- **No raster embeds.** No `<image>` tags, no `data:image/png` payloads. A traced vector or nothing.
- **`viewBox` must be set.** Without it the logo will not scale.
- **No `<script>` tags.**
- **Under 50KB.** Anything larger needs cleanup.

**Expected**

- Hex colours (`#RRGGBB`), not `rgb()` or named colours.
- `icon.svg` square or near-square.
- `mono-dark.svg` and `mono-light.svg` use exactly one fill colour.
- Filenames use hyphens: `mono-dark.svg`, not `mono_dark.svg`. The JSON *key* is `mono_dark`; the *file* is `mono-dark.svg`.

**Cleaning an SVG**

A shared SVGO config is committed:

```bash
npx svgo --config svgo.config.mjs entities/acme-bank/full.svg
```

It is deliberately conservative — it will not alter geometry in ways that visibly distort a mark.

### Where logos may come from

In priority order:

1. **Official brand kit or press page** — always preferred.
2. **Official website SVG extraction** — inspect the page and pull the inline `<svg>` or linked asset.
3. **App DOM extraction** — for brands with no web presence.

Declare the source in your PR. Do not trace a logo by hand from a screenshot and do not pull from a third-party logo aggregator; both produce marks that are subtly wrong, and wrong is worse than missing.

**Do not submit a logo whose brand guidelines forbid redistribution.** If a brand kit says the mark may not be redistributed, open an issue instead so we can record the entity's metadata without the artwork.

## Trademarks

Submitting a logo is not a claim of ownership. Every mark belongs to its owner; the MIT licence here covers this repository's code and metadata only. See [docs/trademarks.md](docs/trademarks.md) for what that means for you as a user, and for the takedown process brand owners can use.

## Correcting existing data

Data corrections are as valuable as additions. Much of the current metadata is best-effort — `brand_color` values are approximations pending verification against official guidelines, and `fip_id` fields are deliberately `null` until confirmed against the [Sahamati Central Registry](https://sahamati.org.in). Verified replacements are very welcome.

Edit the entity's `entity.json`, bump `updated_at`, add yourself to `contributors`, and cite your source in the PR.

## What gets rejected

- Logos that embed raster images
- Assets sourced from third-party logo aggregators
- Entities with no verifiable official website
- Metadata guessed rather than sourced — `null` beats wrong
- Non-Indian entities with no meaningful India presence, until `international-bank` opens in Phase 3

## Project scope

This is a brand asset library, not a design system. No colour tokens, no typography, no components — just logos and the metadata that makes them addressable.

Never a scraper, either. Assets are sourced deliberately from official channels, one entity at a time.
