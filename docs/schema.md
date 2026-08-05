# Schema

The source of truth is [`schemas/entity.schema.json`](../schemas/entity.schema.json) (JSON Schema draft-07). This page explains the decisions behind it.

Every `entities/{id}/entity.json` is validated against it on every PR. Nothing malformed reaches `main`.

## Design decisions

### Categories are tags, not folders

Every entity lives in one flat `entities/{id}/` directory, and `categories` is an array. This is the single most important structural choice in the schema.

A folder hierarchy would force a false primary category. Paytm is a UPI app, a wallet, a BNPL provider, a payments bank, a wealthtech platform and a payment gateway — genuinely, all at once. Filing it under one of those makes the other five queries fail to find it, and picking which one is "primary" is arbitrary.

Tags also make the taxonomy additive: a new category is a new enum value, not a repository reshuffle.

### `id` is permanent

The id is the folder name, the npm export key, and part of every CDN URL. Once published it must never change, because a rename breaks every hotlinked image in the wild.

This is why rebrands are modelled with `status: 'rebranded'` and `acquired_by` rather than by renaming the folder.

### Logo values may be `null`

`logos.full` is a required *key*, but its value may be `null`.

An entity with verified metadata and no artwork yet is a genuinely useful record — it carries the IFSC prefix, the UPI handles, the category tags. Requiring artwork before accepting an entity would either block those contributions or push contributors toward submitting bad logos to satisfy the validator. `null` means "not sourced yet" and is an honest, valid state.

The index generator drops any variant that is `null` or missing on disk, so the published data never advertises a URL that 404s.

### Nullable identifier fields

`fip_id`, `fiu_id`, `ifsc_prefix` and `upi_handles` accept `null` as well as a value.

The distinction is deliberate: **absent** means nobody has looked into it; **`null`** means someone checked and could not verify it. In a dataset where a wrong FIP ID silently breaks an account aggregator consent flow, that difference is worth encoding. `null` beats a plausible guess.

### `additionalProperties: false`

Unknown fields are a hard error. Typos like `brandcolor` or `catagories` fail loudly at PR time instead of silently producing an entity that consumers cannot read. Adding a legitimate new field means updating the schema, which is the review checkpoint we want.

### Reproducible generation

`dist/*.json` carries a date, not a timestamp, and honours `SOURCE_DATE_EPOCH`. A full ISO timestamp would produce a diff on every CI run even when no data changed, which would bury real changes in noise and defeat `generate --check`.

## Validation beyond the schema

Some invariants span files, so `scripts/validate.mjs` enforces them separately:

| Check | Severity |
|---|---|
| Folder name matches the `id` field | error |
| `id` values are unique | error |
| `acquired_by` resolves to an entity in the dataset | error |
| `acquired_by` does not point at itself | error |
| Declared logo files exist on disk and are non-empty | error |
| SVGs have a `viewBox`, no raster embeds, no `<script>`, under 50KB | error |
| The category enum matches `schemas/categories.json` | error |
| SVGs use hex rather than `rgb()` | warning |
| Mono variants use a single fill colour | warning |
| Account aggregators carry an `aa_id` | warning |
| `ifsc_prefix` only appears on entities tagged as a bank | warning |
| `status: 'acquired'` has `acquired_by` set | warning |

Errors fail CI. Warnings never do — they flag things worth a human's attention without blocking a contribution that is otherwise fine.

## Status modelling

| Status | Meaning |
|---|---|
| `active` | Operating under its own brand |
| `acquired` | No longer operating independently; `acquired_by` set |
| `defunct` | Shut down |
| `rebranded` | Now operating under a different name; `acquired_by` points at the successor |

`active` combined with `acquired_by` is valid and intentional. Freecharge is owned by Axis Bank but still ships as Freecharge, and BillDesk is owned by PayU but still operates its own brand. Collapsing ownership into operational status would lose a distinction that matters when you are deciding whether to show a logo.

## Generated output

`scripts/generate-index.mjs` builds three files. All are generated — never hand-edit them.

| File | Contents |
|---|---|
| `dist/index.json` | Full records with resolved CDN URLs, plus `category_counts` |
| `dist/index-lite.json` | `id`, `name`, `short_name`, `categories`, `brand_color` |
| `dist/categories.json` | The taxonomy with live counts |

In the published index, optional fields are omitted when empty rather than emitted as `null`. This keeps the payload tight and makes `'field' in entity` a meaningful check for consumers.

## Editor support

VS Code binds the schema to every `entity.json` automatically via [`.vscode/settings.json`](../.vscode/settings.json), giving contributors autocomplete on category names and inline errors as they type.

## Adding a category

1. Add the id to the `categories` enum in `entity.schema.json`
2. Add the full definition to `schemas/categories.json`
3. Add the union member to `packages/bharatbrands/src/types.ts`
4. Run `pnpm validate` — it fails if the schema and the taxonomy have drifted apart

Step 4 exists because these three files falling out of sync is the most likely way to break the dataset, and it is invisible until a consumer hits it.
