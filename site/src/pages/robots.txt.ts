/**
 * robots.txt, generated at build time.
 *
 * This used to be a hand-written public/robots.txt, and it had drifted: it
 * advertised the sitemap at https://Finmarks.pages.dev while every canonical,
 * and the sitemap itself, pointed at https://www.finmarks.org. A sitemap
 * reference on a different hostname to the pages it lists is ignored, so the
 * whole 189-URL sitemap was effectively invisible to crawlers that found it
 * this way. Deriving the origin from `site` in astro.config.mjs means the two
 * can never disagree again, including on forks that set SITE_URL.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  // `site` is always set (astro.config.mjs defines it), but the type is
  // optional because a config could omit it.
  const origin = site ?? new URL('https://www.finmarks.org');
  const url = (path: string) => new URL(path, origin).href;

  const body = `# ${origin.host} — open, MIT-licensed brand assets and metadata
# for the Indian fintech ecosystem. https://github.com/Finmarks/Finmarks
#
# Generated from astro.config.mjs \`site\`, not hand-maintained.

User-agent: *
Allow: /

# Query-string URLs such as /browse/?q=hdfc are deliberately left crawlable.
# Every page emits a self-referencing <link rel="canonical"> without the query
# string, so search engines fold those URLs into the clean one. Disallowing
# them here would hide that canonical and invite the parameterised URLs to be
# indexed without content instead.

# AI crawlers are welcome by design. The dataset exists to be quoted, and a
# correct logo URL or IFSC prefix in an assistant's answer is the point of the
# project. \`User-agent: *\` above already permits these; naming them makes the
# intent explicit and keeps it true if the wildcard rule is ever tightened.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: CCBot
Allow: /

# A condensed, plain-text map of this site for language models:
# ${url('/llms.txt')}
# Every entity in one file:
# ${url('/llms-full.txt')}

Sitemap: ${url('/sitemap-index.xml')}
`;

  return new Response(body, {
    // Cache-Control is set in public/_headers, not here: this is a static
    // build, so Astro writes the body to disk and discards these headers.
    // Content-Type still matters for `astro dev` and `astro preview`.
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
