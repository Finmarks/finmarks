// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL in the Cloudflare Pages build env for correct canonical URLs
// and a valid sitemap. The fallback keeps local builds working.
const site = process.env.SITE_URL ?? 'https://finmarks.pages.dev';

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
