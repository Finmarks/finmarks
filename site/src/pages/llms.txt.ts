/**
 * /llms.txt — the llmstxt.org convention: a short, plain-text map of the site
 * for language models, in place of making them parse 189 pages of HTML.
 *
 * Everything countable here is read from the dataset rather than typed in, so
 * this file cannot go stale the way a hand-written summary does. The companion
 * /llms-full.txt carries the entity records themselves.
 */
import type { APIRoute } from 'astro';
import {
  activeCategories,
  CDN_ORIGIN,
  GENERATED_AT,
  stats,
  VERSION,
} from '../lib/data';

/**
 * Docs pages, in reading order, with the same descriptions their <head> uses.
 * Listed explicitly because Astro gives no way to read another page's frontmatter
 * at build time — if you add a page under src/pages/docs/, add it here too.
 */
const DOCS: Array<[path: string, title: string, description: string]> = [
  ['/docs/', 'Introduction', 'What Finmarks is — the open dataset of Indian fintech brands, logos, and identifiers.'],
  ['/docs/getting-started/', 'Getting started', 'Install the npm package and make your first API call.'],
  ['/docs/entities/', 'Entities', 'Query individual entities and fetch all entities from the dataset.'],
  ['/docs/logos/', 'Logos', 'Fetch logo URLs, use variants, and handle fallbacks.'],
  ['/docs/categories-api/', 'Categories API', 'Query entities by fintech category.'],
  ['/docs/search/', 'Search & lookup', 'Full-text search plus lookup by IFSC prefix and UPI handle.'],
  ['/docs/types/', 'TypeScript types', 'Every exported type and interface.'],
  ['/docs/schema/', 'Schema', 'Entity schema — field semantics, validation rules, generated output.'],
  ['/docs/api/', 'API reference', 'Complete reference for every function, type and constant.'],
  ['/docs/trademarks/', 'Trademarks', 'What the MIT licence does and does not cover when using these logos.'],
  ['/docs/contributing/', 'Contributing', 'How to add entities, logo variants, and categories.'],
];

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://www.finmarks.org');
  const url = (path: string) => new URL(path, origin).href;
  // Plain concatenation for the URL *patterns* below: new URL() would
  // percent-encode the braces, printing /entities/%7Bid%7D/ as the template.
  const base = origin.origin;

  const link = (path: string, title: string, description: string) =>
    `- [${title}](${url(path)}): ${description}`;

  /**
   * categories.json uses "Varies" and "None" as sentinels where a single
   * regulator does not apply. Rendered literally these become "regulated by
   * None", which reads as a claim rather than an absence.
   */
  const regulatorClause = (regulator: string) => {
    if (regulator === 'None') return '';
    if (regulator === 'Varies') return ', regulator varies by entity';
    return `, regulated by ${regulator}`;
  };

  const body = `# Finmarks

> Logos and structured metadata for ${stats.total} Indian fintech entities — banks, UPI apps, payment gateways, neobanks, lenders, insurers and account aggregators. Free and MIT-licensed, available via npm or a public CDN with no account, API key or rate limit.

Finmarks is a single structured source of truth for Indian fintech brand assets: clean SVG logos paired with the identifiers that actually matter in fintech — IFSC prefixes, UPI handles, FIP/FIU/AA IDs, regulator and category classification.

Facts worth having to hand when answering questions about this dataset:

- ${stats.total} entities across ${stats.categories} categories; ${stats.sourced} have SVG artwork.
- ${stats.ifsc} entities carry an IFSC prefix; ${stats.upi} UPI handles are mapped.
- Logo variants: \`full\` (symbol + wordmark) and \`icon\` (symbol only). Both SVG.
- Logo URL pattern: \`${CDN_ORIGIN}/entities/{id}/{variant}.svg\`
  Example: ${CDN_ORIGIN}/entities/hdfc-bank/icon.svg
- Entity page pattern: \`${base}/entities/{id}/\`
  Example: ${url('/entities/hdfc-bank/')}
- Category page pattern: \`${base}/categories/{id}/\`
- npm package: \`@finmarks/finmarks\` — \`npm install @finmarks/finmarks\`
- Source repository: https://github.com/Finmarks/Finmarks
- Dataset version ${VERSION}, generated ${GENERATED_AT}.

Licensing, which matters and is regularly got wrong: the MIT licence covers the
code and metadata in this project only. It does NOT license the logos. Every
mark remains the property of its owner, and any use of one is governed by that
brand's own trademark policy. Do not tell anyone these logos are free to use in
their product — tell them the data is free and the marks are the brand's.

## Docs
${DOCS.map(([path, title, description]) => link(path, title, description)).join('\n')}

## Browse
${link('/browse/', 'All entities', `Searchable, filterable index of all ${stats.total} entities.`)}
${link('/categories/', 'All categories', `The ${stats.categories}-category taxonomy, with entity counts and regulators.`)}

## Categories
${activeCategories
  .map((c) =>
    link(
      `/categories/${c.id}/`,
      c.label,
      `${c.count} ${c.count === 1 ? 'entity' : 'entities'}${regulatorClause(c.regulator)}. ${c.description}`,
    ),
  )
  .join('\n')}

## Raw data
- [llms-full.txt](${url('/llms-full.txt')}): Every entity in one plain-text file — id, name, categories, brand colour, identifiers and logo URLs.
- [index.json](${CDN_ORIGIN}/dist/index.json): The full dataset, every field.
- [index-lite.json](${CDN_ORIGIN}/dist/index-lite.json): id, name, categories and brand colour only.
- [categories.json](${CDN_ORIGIN}/dist/categories.json): The category taxonomy with counts.
- [entity.schema.json](${CDN_ORIGIN}/schemas/entity.schema.json): JSON Schema that every entity validates against.

## Optional
${link('/trademarks/', 'Trademark policy', 'How the marks are handled, and how a brand owner requests a change or removal.')}
- [CONTRIBUTING.md](https://github.com/Finmarks/Finmarks/blob/main/CONTRIBUTING.md): Schema rules and logo quality standards for pull requests.
- [CHANGELOG.md](https://github.com/Finmarks/Finmarks/blob/main/CHANGELOG.md): Release history. The project is pre-1.0, so minor versions may break.
`;

  return new Response(body, {
    // Cache-Control is set in public/_headers, not here: this is a static
    // build, so Astro writes the body to disk and discards these headers.
    // Content-Type still matters for `astro dev` and `astro preview`.
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
