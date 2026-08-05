## Entity addition / update

**Entity id:** `` <!-- e.g. hdfc-bank -->
**Categories:** <!-- e.g. private-bank, upi-psp -->
**Type of change:** <!-- new entity | logo update | metadata fix | other -->

### Logo quality checklist

<!-- Skip this section if the PR is metadata-only. -->

- [ ] SVG is clean (no raster embeds, no base64 images inside)
- [ ] SVG `viewBox` is set correctly
- [ ] Colors use hex, not named colors or `rgb()`
- [ ] `full.svg` is present (minimum requirement for a logo PR)
- [ ] `icon.svg` is square or near-square, if included
- [ ] `mono-dark.svg` / `mono-light.svg` use a single fill color, if included
- [ ] Every SVG is under 50KB
- [ ] Source is official (brand kit URL, or extracted from official website/app)

### Metadata checklist

- [ ] `entity.json` passes `pnpm validate` with no errors
- [ ] `categories[]` correctly assigned (multi-category where applicable)
- [ ] `brand_color` matches the primary brand color
- [ ] `status` is set (`active` / `acquired` / `defunct` / `rebranded`)
- [ ] `updated_at` bumped to today
- [ ] Your GitHub username is in `contributors[]`

### Source declaration

Where did this logo come from?

- [ ] Official brand kit — link:
- [ ] Official website SVG extraction — link:
- [ ] App DOM extraction
- [ ] Other (explain):

### Trademark acknowledgement

- [ ] I understand these logos remain the trademarks of their respective owners,
      that the MIT licence covers this repository's code and metadata rather than
      the marks themselves, and that I am not submitting an asset whose brand
      guidelines forbid redistribution.

---

<!--
Before opening:
  pnpm validate      # must pass — this is the merge gate
  pnpm check-logos   # shows which variants are still missing
-->
