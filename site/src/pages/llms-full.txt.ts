/**
 * /llms-full.txt — every entity in one plain-text file.
 *
 * The companion to /llms.txt: that one maps the site, this one carries the
 * data, so a model can answer "what is the CDN URL for the Paytm icon" or
 * "which bank does IFSC prefix UTIB belong to" without crawling 152 pages.
 *
 * Logo URLs are rebuilt from CDN_ORIGIN rather than read off `entity.logos`,
 * because data.ts rewrites those to local paths under `astro dev` — a reader
 * of this file is on the open internet and needs the CDN URL either way.
 */
import type { APIRoute } from 'astro';
import {
  CDN_ORIGIN,
  categoryLabel,
  entities,
  GENERATED_AT,
  stats,
  VARIANTS,
  VERSION,
  type Entity,
  type LogoVariant,
} from '../lib/data';

/** `mono_dark` is stored as mono-dark.svg on disk; `full`/`icon` map straight through. */
const logoUrl = (id: string, variant: LogoVariant) =>
  `${CDN_ORIGIN}/entities/${id}/${variant.replace(/_/g, '-')}.svg`;

function record(e: Entity, siteOrigin: URL): string {
  const available = VARIANTS.filter((v) => e.logos[v]);

  // Only fields the entity actually has, so absence is unambiguous rather than
  // rendered as an empty value a model might read as a real one.
  const lines: string[] = [
    `- id: ${e.id}`,
    `- page: ${new URL(`/entities/${e.id}/`, siteOrigin).href}`,
  ];

  if (e.legal_name) lines.push(`- legal name: ${e.legal_name}`);
  if (e.short_name && e.short_name !== e.name) lines.push(`- short name: ${e.short_name}`);
  lines.push(`- categories: ${e.categories.map((c) => `${categoryLabel(c)} (${c})`).join(', ')}`);
  lines.push(`- brand colour: ${e.brand_color}`);
  if (e.founded) lines.push(`- founded: ${e.founded}`);
  if (e.regulated_by?.length) lines.push(`- regulated by: ${e.regulated_by.join(', ')}`);
  lines.push(`- status: ${e.status}`);
  lines.push(`- country: ${e.country}`);
  if (e.ifsc_prefix) lines.push(`- IFSC prefix: ${e.ifsc_prefix}`);
  if (e.upi_handles?.length) lines.push(`- UPI handles: ${e.upi_handles.join(', ')}`);
  if (e.aa_id) lines.push(`- account aggregator id: ${e.aa_id}`);
  if (e.fip_id) lines.push(`- FIP id: ${e.fip_id}`);
  if (e.fiu_id) lines.push(`- FIU id: ${e.fiu_id}`);
  if (e.acquired_by) lines.push(`- owned by: ${e.acquired_by}`);
  if (e.website) lines.push(`- website: ${e.website}`);
  if (e.tags?.length) lines.push(`- tags: ${e.tags.join(', ')}`);

  lines.push(
    available.length
      ? `- logos: ${available.map((v) => `${v} ${logoUrl(e.id, v)}`).join(' | ')}`
      : '- logos: none sourced yet (metadata is complete, artwork is pending)',
  );

  return `## ${e.name}\n${lines.join('\n')}`;
}

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://www.finmarks.org');
  // Plain concatenation for the URL *pattern* below: new URL() would
  // percent-encode the braces, printing /entities/%7Bid%7D/ as the template.
  const base = origin.origin;

  // Alphabetical by name: a stable order keeps the diff between two builds
  // readable, and gives a model a predictable place to look for a brand.
  const sorted = [...entities].sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const body = `# Finmarks — full entity listing

> Every one of the ${stats.total} entities in the Finmarks dataset, with logo URLs
> and fintech identifiers. Dataset version ${VERSION}, generated ${GENERATED_AT}.
> Site map for models: ${new URL('/llms.txt', origin).href}

Logo URL pattern: ${CDN_ORIGIN}/entities/{id}/{variant}.svg
Variants: full (symbol + wordmark), icon (symbol only). Both are SVG.
Entity page pattern: ${base}/entities/{id}/

Licence: MIT covers the code and metadata below. It does NOT cover the logos —
each mark belongs to its owner and its use is governed by that brand's own
trademark policy. Treat every logo URL here as "free to fetch, not free to use".

${sorted.map((e) => record(e, origin)).join('\n\n')}
`;

  return new Response(body, {
    // Cache-Control is set in public/_headers, not here: this is a static
    // build, so Astro writes the body to disk and discards these headers.
    // Content-Type still matters for `astro dev` and `astro preview`.
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
