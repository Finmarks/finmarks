// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

// The custom domain connected in Cloudflare Pages. Canonicals and the sitemap
// must point here rather than at the pages.dev origin, or search engines and
// the GA data stream see two hostnames for the same site. SITE_URL overrides
// for forks and preview deploys ( `||`, since an unset CI variable is "" ).
const site = process.env.SITE_URL || 'https://www.finmarks.org';

// Every data-driven page on this site is rendered from dist/index.json, so the
// dataset's own generation date is the honest lastmod. A build timestamp would
// instead claim every page changed on every unrelated deploy, and a lastmod
// that always says "now" is one search engines learn to discount entirely.
const { generated_at: generatedAt } = JSON.parse(
  readFileSync(new URL('../dist/index.json', import.meta.url), 'utf8'),
);
const datasetLastmod = new Date(`${generatedAt}T00:00:00Z`).toISOString();

/**
 * @typedef {object} RouteRank
 * @property {number} priority
 * @property {ChangeFreqEnum} changefreq
 * @property {boolean} dataDriven Whether the page's content comes from the
 *   dataset, and so should carry `datasetLastmod`. Docs and policy pages change
 *   with the repo rather than the data, so claiming the dataset's date for them
 *   would be a lie the sitemap has no way to make true.
 */

/**
 * Crawl hints per route family. Ordered most specific first — the first regex
 * that matches wins, so `/categories/` must precede `/categories/{id}/`.
 * @type {Array<[RegExp, RouteRank]>}
 */
const ROUTE_RANKS = [
  [/^\/$/, { priority: 1.0, changefreq: ChangeFreqEnum.WEEKLY, dataDriven: true }],
  [/^\/browse\/$/, { priority: 0.9, changefreq: ChangeFreqEnum.WEEKLY, dataDriven: true }],
  [/^\/categories\/$/, { priority: 0.8, changefreq: ChangeFreqEnum.WEEKLY, dataDriven: true }],
  // The long-tail surface — one page per brand, and what "PhonePe logo SVG"
  // style queries actually land on. Ranked level with the top hubs.
  [/^\/entities\/[^/]+\/$/, { priority: 0.8, changefreq: ChangeFreqEnum.MONTHLY, dataDriven: true }],
  [/^\/categories\/[^/]+\/$/, { priority: 0.7, changefreq: ChangeFreqEnum.MONTHLY, dataDriven: true }],
  [/^\/docs\/$/, { priority: 0.7, changefreq: ChangeFreqEnum.MONTHLY, dataDriven: false }],
  [/^\/docs\//, { priority: 0.6, changefreq: ChangeFreqEnum.MONTHLY, dataDriven: false }],
  [/^\/trademarks\/$/, { priority: 0.3, changefreq: ChangeFreqEnum.YEARLY, dataDriven: false }],
];

export default defineConfig({
  site,
  integrations: [
    react(),
    sitemap({
      // Astro's default sitemap is a bare list of <loc>s. These hints tell a
      // crawler which of the 189 URLs are worth recrawling and how often.
      serialize(item) {
        const { pathname } = new URL(item.url);
        const rank = ROUTE_RANKS.find(([pattern]) => pattern.test(pathname))?.[1];
        // A route added later still ships in the sitemap, just unranked,
        // rather than silently disappearing from it.
        if (!rank) return item;
        return {
          ...item,
          priority: rank.priority,
          changefreq: rank.changefreq,
          ...(rank.dataDriven ? { lastmod: datasetLastmod } : {}),
        };
      },
      // This site has no news, video, image or alternate-language entries; the
      // default declares all four namespaces on every sitemap regardless.
      namespaces: { news: false, video: false, image: false, xhtml: false },
    }),
  ],
  // Fully static: every entity and category page is rendered at build time,
  // so the site is one upload of HTML with no server and no runtime data fetch.
  output: 'static',
  build: {
    // Directory-style URLs (/entities/hdfc-bank/) match how the CDN paths read
    // and avoid trailing-slash redirects on Pages.
    format: 'directory',
  },
  vite: {
    build: {
      // The dataset is imported at build time and mostly disappears into the
      // prerendered HTML; only the browser island ships a JSON payload.
      assetsInlineLimit: 0,
    },
  },
});
