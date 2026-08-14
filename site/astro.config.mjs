// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// The custom domain connected in Cloudflare Pages. Canonicals and the sitemap
// must point here rather than at the pages.dev origin, or search engines and
// the GA data stream see two hostnames for the same site. SITE_URL overrides
// for forks and preview deploys ( `||`, since an unset CI variable is "" ).
const site = process.env.SITE_URL || 'https://www.finmarks.org';

export default defineConfig({
  site,
  integrations: [react(), sitemap()],
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
