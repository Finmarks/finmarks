/**
 * Small helpers for the page metadata that repeats across templates.
 *
 * Kept separate from data.ts because none of this touches the dataset — it is
 * purely about how a page presents itself to a crawler.
 */

/**
 * Google truncates the displayed title at roughly 600px, which lands near 60
 * characters for this site's mix of Latin text. Over-length titles are not
 * penalised, they are just cut mid-word in results — and a title Google
 * dislikes is one it rewrites itself, losing the wording we chose.
 */
export const TITLE_LIMIT = 60;

/**
 * Pick the first title variant that fits, so a short brand name keeps the fully
 * descriptive title and only a long one degrades. Order candidates most to
 * least descriptive; the last is used verbatim if nothing fits, so make it the
 * shortest.
 */
export function fitTitle(candidates: string[]): string {
  return (
    candidates.find((c) => c.length <= TITLE_LIMIT) ??
    candidates[candidates.length - 1] ??
    ''
  );
}

/** One crumb: the visible label and the site-root-relative path it points at. */
export type Crumb = [label: string, path: string];

/**
 * BreadcrumbList JSON-LD mirroring the visible breadcrumb nav. Search engines
 * use it to render a path in place of the raw URL, and it only earns that if
 * it matches what the page actually shows — so build it from the same trail.
 */
export function breadcrumbList(trail: Crumb[], site: URL | undefined) {
  const origin = site ?? new URL('https://www.finmarks.org');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: new URL(path, origin).href,
    })),
  };
}

/**
 * ItemList of entities for a collection page. Capped because a list of every
 * one of 152 entries adds weight to the HTML for no extra benefit — the sitemap
 * and the on-page links are what get the rest crawled.
 */
export function itemList(
  items: Array<{ id: string; name: string }>,
  site: URL | undefined,
  limit = 50,
) {
  const origin = site ?? new URL('https://www.finmarks.org');
  return {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.slice(0, limit).map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.name,
      url: new URL(`/entities/${e.id}/`, origin).href,
    })),
  };
}
