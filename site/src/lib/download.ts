/**
 * Client-side asset download.
 *
 * SVGs are fetched from the CDN and zipped in the browser — there is no server
 * and no build step involved, so a download always reflects what is live on the
 * CDN rather than what existed when the site was built.
 */
import { zip } from 'fflate';
import type { LogoVariant } from './data';

export interface DownloadTarget {
  id: string;
  name: string;
  variants: LogoVariant[];
}

/** Filenames on disk use hyphens; the JSON keys use underscores. */
export function variantFilename(variant: LogoVariant): string {
  return `${variant.replace(/_/g, '-')}.svg`;
}

export function assetUrl(cdnBase: string, id: string, variant: LogoVariant): string {
  return `${cdnBase}/entities/${id}/${variantFilename(variant)}`;
}

export interface DownloadProgress {
  done: number;
  total: number;
}

export interface DownloadResult {
  ok: boolean;
  /** Number of files actually written into the archive. */
  files: number;
  /** Entities that yielded no assets, by id. */
  failed: string[];
  message?: string;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Download a single asset directly, without zipping.
 */
export async function downloadOne(
  cdnBase: string,
  id: string,
  variant: LogoVariant,
): Promise<DownloadResult> {
  try {
    const res = await fetch(assetUrl(cdnBase, id, variant));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    triggerBlobDownload(await res.blob(), `${id}-${variantFilename(variant)}`);
    return { ok: true, files: 1, failed: [] };
  } catch (err) {
    return {
      ok: false,
      files: 0,
      failed: [id],
      message: err instanceof Error ? err.message : 'Download failed',
    };
  }
}

/**
 * Fetch every requested variant for every selected entity and deliver one ZIP.
 *
 * Files are laid out as `{id}/{variant}.svg`, mirroring the repository, so an
 * unzipped archive drops straight into a project. Entities whose assets 404 are
 * reported rather than silently omitted — a partial archive that looks complete
 * is worse than one that tells you what is missing.
 */
export async function downloadZip(
  cdnBase: string,
  targets: DownloadTarget[],
  wantedVariants: LogoVariant[] | 'all',
  onProgress?: (p: DownloadProgress) => void,
): Promise<DownloadResult> {
  const jobs: Array<{ id: string; variant: LogoVariant; path: string }> = [];

  for (const t of targets) {
    const variants =
      wantedVariants === 'all' ? t.variants : t.variants.filter((v) => wantedVariants.includes(v));
    for (const variant of variants) {
      jobs.push({ id: t.id, variant, path: `${t.id}/${variantFilename(variant)}` });
    }
  }

  if (jobs.length === 0) {
    return {
      ok: false,
      files: 0,
      failed: targets.map((t) => t.id),
      message: 'No artwork has been sourced for this selection yet.',
    };
  }

  const files: Record<string, Uint8Array> = {};
  const failed = new Set<string>();
  let done = 0;

  // Modest concurrency: enough to be fast, not enough to look like an attack.
  const QUEUE = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const res = await fetch(assetUrl(cdnBase, job.id, job.variant));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        files[job.path] = new Uint8Array(await res.arrayBuffer());
      } catch {
        failed.add(job.id);
      }
      done += 1;
      onProgress?.({ done, total: jobs.length });
    }
  }

  await Promise.all(Array.from({ length: Math.min(QUEUE, jobs.length) }, worker));

  const count = Object.keys(files).length;
  if (count === 0) {
    return {
      ok: false,
      files: 0,
      failed: [...failed],
      message: 'Every asset failed to download. The CDN may not have these files yet.',
    };
  }

  // A short attribution note travels with the archive, since the licence
  // question is the first thing a downloader will have.
  files['README.txt'] = new TextEncoder().encode(
    [
      'Finmarks — Indian fintech brand assets',
      'https://github.com/Finmarks/Finmarks',
      '',
      `${count} file(s) across ${targets.length} entit(ies).`,
      '',
      'These logos are the trademarks of their respective owners. The MIT licence',
      'covers the Finmarks code and metadata, NOT the marks themselves. Your',
      'use of any logo is governed by that brand’s own trademark policy.',
      '',
      'Nominative use — identifying the brand a logo names — is normally fine.',
      'Implying partnership, endorsement, or affiliation is not.',
    ].join('\n'),
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    zip(files, { level: 6 }, (err, data) => {
      if (err) reject(err);
      // Copy into a fresh buffer so the Blob owns plain ArrayBuffer-backed bytes.
      else resolve(new Blob([new Uint8Array(data)], { type: 'application/zip' }));
    });
  });

  const filename =
    targets.length === 1 ? `Finmarks-${targets[0].id}.zip` : `Finmarks-${targets.length}-logos.zip`;
  triggerBlobDownload(blob, filename);

  return {
    ok: true,
    files: count,
    failed: [...failed],
    message: failed.size > 0 ? `${failed.size} entit(ies) had no downloadable artwork.` : undefined,
  };
}
