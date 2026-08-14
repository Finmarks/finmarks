# Finmarks site

The discovery site — an entity browser over the dataset in [`../dist/`](../dist).

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Astro 7 (static) | 136 pages prerendered at build time; one interactive island |
| Interactivity | React 19 | The browser: filtering, search, selection, ZIP download |
| ZIP | `fflate` | 8KB, no dependencies |
| Hosting | Cloudflare Pages | Free tier, unlimited bandwidth, custom domain, free SSL |
| Assets | jsDelivr via GitHub | Free, no account, no rate limit |

Nothing in the stack costs money. There is no server, no database and no API.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview
```

The site imports `../dist/index.json` directly, so run `pnpm generate` at the
repository root first if the dataset has changed.

## Structure

```
src/lib/data.ts        loads dist/index.json, derives stats and the browse payload
src/lib/download.ts    fetches SVGs from the CDN and zips them client-side
src/components/        Browser.tsx (the island), Coverage.astro (the meter)
src/pages/             index, entities/[id], categories/[id], docs, trademarks, 404
src/layouts/Base.astro shell, theme toggle, meta tags
```

### Pages

- `/` — hero, coverage meter, entity browser
- `/entities/{id}/` — one prerendered page per entity (115). The SEO surface.
- `/categories/{id}/` — one per populated category (16)
- `/categories/` — the taxonomy
- `/docs/` — npm and CDN usage
- `/trademarks/` — the trademark position

## Design notes

**The hero is a coverage readout, not a logo wall.** At launch almost no
entities have artwork. A grid of empty tiles reads as broken; a segmented meter
showing `n/115` reads as a burn-down chart, which is both honest and a clearer
call to contribute.

**Two tile states.** Sourced entities render their SVG on a solid brand-colour
mark. Unsourced entities render a dashed outline with a monogram derived from
the name — deliberate rather than missing.

**Downloads are client-side.** Selecting entities and hitting Download fetches
from the CDN and zips in the browser, so an archive always reflects what is
live rather than what existed at build time. Entities without artwork cannot be
selected, and the ZIP carries a `README.txt` with the trademark position.

## Deployment

Cloudflare Pages, via [`.github/workflows/site.yml`](../.github/workflows/site.yml).

Set these repository secrets to enable deploys — without them the workflow
still runs as a build check:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Set the `SITE_URL` repository variable once a custom domain is attached, so
canonical URLs and the sitemap are correct.

### Manual deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=Finmarks
```
