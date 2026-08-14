/**
 * The entity browser — the one interactive island on the site.
 *
 * Everything else is prerendered HTML; this handles filtering, search,
 * multi-select and bulk download. It receives its data as props from the Astro
 * page rather than fetching, so it renders correctly on first paint.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, Table, Check, StarPlus, Plus } from 'lucide-react';
import type { BrowseEntity, CategoryInfo, LogoVariant } from '../lib/data';
import SidebarLinks, { SidebarBottom } from './SidebarLinks';
import { downloadZip, type DownloadResult } from '../lib/download';
import s from './Browser.module.css';

interface Props {
  entities: BrowseEntity[];
  categories: CategoryInfo[];
  cdnBase: string;
  hideSidebar?: boolean;
  children?: React.ReactNode;
}

type View = 'grid' | 'table';
const ALL = '__all';

/** Match ranking, mirroring the npm package's search() so results agree. */
function score(e: BrowseEntity, q: string): number {
  const id = e.id.toLowerCase();
  const name = e.name.toLowerCase();
  const short = e.short_name.toLowerCase();

  if (id === q || name === q || short === q) return 100;
  if (e.ifsc_prefix?.toLowerCase() === q) return 95;
  if (id.startsWith(q) || name.startsWith(q) || short.startsWith(q)) return 80;
  if (name.split(/[\s-]+/).some((w) => w.startsWith(q))) return 60;
  if (id.includes(q) || name.includes(q) || short.includes(q)) return 40;
  if (e.legal_name?.toLowerCase().includes(q)) return 30;
  if (e.tags?.some((t) => t.toLowerCase().includes(q))) return 20;
  if (e.upi_handle?.toLowerCase().includes(q)) return 15;
  return 0;
}

export default function Browser({ entities, categories, cdnBase, hideSidebar, children }: Props) {
  // Read initial state from URL so Back navigation restores filters
  const getInitialState = () => {
    if (typeof window === 'undefined') return { cat: ALL, query: '', view: 'grid' as View };
    const params = new URLSearchParams(window.location.search);
    return {
      cat: params.get('cat') ?? ALL,
      query: params.get('q') ?? '',
      view: (params.get('view') === 'table' ? 'table' : 'grid') as View,
    };
  };

  const init = getInitialState();
  const [cat, setCat] = useState<string>(init.cat);
  const [query, setQuery] = useState(init.query);
  const [view, setView] = useState<View>(init.view);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [variantChoice, setVariantChoice] = useState<'all' | LogoVariant>('all');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keep URL in sync with filter state so Back navigation restores them.
  // We use replaceState (not pushState) to avoid polluting the history stack
  // while the user is just browsing/filtering.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (cat === ALL) params.delete('cat'); else params.set('cat', cat);
    if (!query) params.delete('q'); else params.set('q', query);
    if (view === 'grid') params.delete('view'); else params.set('view', view);
    const qs = params.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [cat, query, view]);

  // `/` focuses search, matching the convention of every dev tool this
  // audience already uses.
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (ev.key === '/' && !typing) {
        ev.preventDefault();
        searchRef.current?.focus();
      }
      if (ev.key === 'Escape' && typing) searchRef.current?.blur();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visible = useMemo(() => {
    let out = cat === ALL ? entities : entities.filter((e) => e.categories.includes(cat));
    const q = query.trim().toLowerCase();
    if (q) {
      out = out
        .map((e) => ({ e, s: score(e, q) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name))
        .map((r) => r.e);
    }
    return out;
  }, [entities, cat, query]);

  const withArtwork = useMemo(() => visible.filter((e) => e.variants.length > 0), [visible]);
  const selectedList = useMemo(() => entities.filter((e) => selected.has(e.id)), [entities, selected]);
  const selectedWithArtwork = selectedList.filter((e) => e.variants.length > 0);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResult(null);
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const e of withArtwork) next.add(e.id);
      return next;
    });
    setResult(null);
  }, [withArtwork]);

  const clear = useCallback(() => {
    setSelected(new Set());
    setResult(null);
  }, []);

  async function onDownload() {
    if (selectedWithArtwork.length === 0) return;
    setBusy(true);
    setResult(null);
    setProgress({ done: 0, total: 0 });
    try {
      const res = await downloadZip(
        cdnBase,
        selectedWithArtwork.map((e) => ({ id: e.id, name: e.name, variants: e.variants })),
        variantChoice === 'all' ? 'all' : [variantChoice],
        setProgress,
      );
      setResult(res);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  // Which variants exist anywhere in the current selection — no point offering
  // a filter for a variant nobody has.
  const offeredVariants = useMemo(() => {
    const set = new Set<LogoVariant>();
    for (const e of selectedWithArtwork) for (const v of e.variants) set.add(v);
    return [...set];
  }, [selectedWithArtwork]);

  const noArtworkSelected = selectedList.length > 0 && selectedWithArtwork.length === 0;

  const innerContent = (
    <div className={hideSidebar ? s.embedded : undefined}>
      {children}
      <div className={s.stickyHead}>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="12" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              ref={searchRef}
              className={s.search}
              type="search"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Search name, id, @handle, IFSC…   (press /)"
              aria-label="Search entities"
              autoComplete="off"
            />
          </div>
          <button
            data-tally-open="dWGzWd"
            data-tally-layout="modal"
            data-tally-width="380"
            data-tally-auto-close="2000"
            className="primary-btn"
            type="button"
          >
            <Plus size={16} />
            Contribute
          </button>
        </div>
      </div>

      <div className={s.browseContent}>
        <div className={s.resultLine}>
          <div className={s.resultMeta}>
            <span>
              <b>{visible.length}</b> {visible.length === 1 ? 'entity' : 'entities'}
            </span>
            {withArtwork.length > 0 && (
              <button className="ghost-btn" onClick={selectAllVisible} type="button">
                Select all
              </button>
            )}
            {selected.size > 0 && (
              <button className="ghost-btn" onClick={clear} type="button">
                Clear selection
              </button>
            )}
          </div>
          <div className={s.segToggle} role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
              <LayoutGrid size={14} /> Grid
            </button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
              <Table size={14} /> Table
            </button>
          </div>
        </div>

        {visible.length === 0 && (
          <div className={s.empty}>
            <p>No entities match that query.</p>
            <div className={s.emptyActions}>
              <button
                data-tally-open="yPAzV8"
                data-tally-layout="modal"
                data-tally-width="380"
                data-tally-auto-close="2000"
                className="outline-btn"
                type="button"
              >
                <StarPlus size={16} />
                Request a logo
              </button>
              <button
                data-tally-open="dWGzWd"
                data-tally-layout="modal"
                data-tally-width="380"
                data-tally-auto-close="2000"
                className="primary-btn"
                type="button"
              >
                <Plus size={16} />
                Contribute
              </button>
            </div>
          </div>
        )}

        {visible.length > 0 && view === 'grid' && (
          <div className={s.tiles}>
            {visible.map((e) => {
              const sourced = e.variants.length > 0;
              const isSel = selected.has(e.id);
              return (
                <a
                  key={e.id}
                  className={`${s.tile} mark-host`}
                  href={`/entities/${e.id}/`}
                  data-selected={isSel}>
                  <button
                    type="button"
                    className={s.check}
                    data-on={isSel}
                    disabled={!sourced}
                    aria-label={isSel ? `Deselect ${e.name}` : `Select ${e.name}`}
                    title={sourced ? 'Select for download' : 'No artwork sourced yet'}
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      toggle(e.id);
                    }}>
                    <Check size={16} strokeWidth={3} />
                  </button>

                  <span
                    className={`mark ${s.tileMark}`}
                    data-sourced={sourced}
                    style={
                      sourced
                        ? { background: 'var(--logo-bg)', boxShadow: '0 0 0 1px var(--line) inset' }
                        : { background: `${e.brand_color}1A`, color: e.brand_color }
                    }>
                    {sourced ? (
                      <img
                        src={`${cdnBase ? cdnBase : ''}/entities/${e.id}/${e.variants.includes('icon') ? 'icon' : 'full'}.svg`}
                        alt=""
                        loading="lazy"
                        onError={(ev) => {
                          const target = ev.currentTarget;
                          const fallback = `/entities/${e.id}/${e.variants.includes('icon') ? 'icon' : 'full'}.svg`;
                          if (target.src !== new URL(fallback, window.location.href).href) {
                            target.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      e.mono
                    )}
                  </span>

                  <span>
                    <span className={s.tileName}>{e.name}</span>
                    <span className={s.tileId}>{e.id}</span>
                  </span>

                  <span className={s.tileFoot}>
                    <span className={s.tileState}>
                      {sourced ? (
                        `${e.variants.length} SVG`
                      ) : (
                        <span style={{ display: 'inline-flex', gap: '0.2rem' }}>
                          {e.categories.slice(0, 2).map((c) => (
                            <span className="chip" key={c}>
                              {c}
                            </span>
                          ))}
                          {e.categories.length > 2 && (
                            <span className="chip">+{e.categories.length - 2}</span>
                          )}
                        </span>
                      )}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {visible.length > 0 && view === 'table' && (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr">Select</span>
                  </th>
                  <th scope="col"></th>
                  <th scope="col">Entity</th>
                  <th scope="col">ID</th>
                  <th scope="col">Categories</th>
                  <th scope="col">IFSC</th>
                  <th scope="col">UPI</th>
                  <th scope="col">Logos</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => {
                  const sourced = e.variants.length > 0;
                  return (
                    <tr key={e.id}>
                      <td>
                        <input
                          className={s.rowCheck}
                          type="checkbox"
                          checked={selected.has(e.id)}
                          disabled={!sourced}
                          onChange={() => toggle(e.id)}
                          aria-label={`Select ${e.name}`}
                        />
                      </td>
                      <td>
                        <span
                          className={`mark ${s.miniMark}`}
                          data-sourced={sourced}
                          style={
                            sourced
                              ? { background: '#ffffff', boxShadow: '0 0 0 1px var(--line) inset' }
                              : { background: e.brand_color }
                          }
                          aria-hidden="true">
                          {sourced ? (
                            <img
                              src={`${cdnBase ? cdnBase : ''}/entities/${e.id}/${e.variants.includes('icon') ? 'icon' : 'full'}.svg`}
                              alt=""
                              loading="lazy"
                              onError={(ev) => {
                                const target = ev.currentTarget;
                                const fallback = `/entities/${e.id}/${e.variants.includes('icon') ? 'icon' : 'full'}.svg`;
                                if (target.src !== new URL(fallback, window.location.href).href) {
                                  target.src = fallback;
                                }
                              }}
                            />
                          ) : (
                            e.mono.slice(0, 2)
                          )}
                        </span>
                      </td>
                      <td>
                        <a href={`/entities/${e.id}/`}>{e.name}</a>
                      </td>
                      <td className={s.idCell}>{e.id}</td>
                      <td>
                        {e.categories.slice(0, 2).map((c) => (
                          <span className="chip" key={c}>
                            {c}
                          </span>
                        ))}
                        {e.categories.length > 2 && <span className="chip">+{e.categories.length - 2}</span>}
                      </td>
                      <td className={s.idCell}>{e.ifsc_prefix ?? '—'}</td>
                      <td className={s.idCell}>{e.upi_handle ?? '—'}</td>
                      <td>
                        {sourced ? (
                          <span className="chip" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                            {e.variants.length}
                          </span>
                        ) : (
                          <span className="chip">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className={s.selBar} role="status">
          <span className={s.selCount}>
            {selected.size} selected
            {selectedWithArtwork.length !== selected.size && (
              <span> · {selectedWithArtwork.length} downloadable</span>
            )}
          </span>

          {noArtworkSelected ? (
            <span className={s.selNote}>
              No artwork sourced for this selection yet — metadata only.
            </span>
          ) : (
            <div className={s.selActions}>
              {offeredVariants.length > 1 && (
                <select
                  className={s.variantPick}
                  value={variantChoice}
                  onChange={(ev) => setVariantChoice(ev.target.value as 'all' | LogoVariant)}
                  aria-label="Which logo variants to download">
                  <option value="all">All variants</option>
                  {offeredVariants.map((v) => (
                    <option key={v} value={v}>
                      {v.replace(/_/g, '-')} only
                    </option>
                  ))}
                </select>
              )}
              <button className="primary-btn" onClick={onDownload} disabled={busy} type="button">
                {busy
                  ? progress && progress.total > 0
                    ? `${progress.done}/${progress.total}…`
                    : 'Preparing…'
                  : `Download ZIP`}
              </button>
            </div>
          )}

          <button className="outline-btn" onClick={clear} type="button" aria-label="Discard selection">
            Discard
          </button>

          {result?.message && <span className={s.selNote}>{result.message}</span>}
        </div>
      )}
    </div>
  );

  if (hideSidebar) {
    return innerContent;
  }

  return (
    <div className="app-layout" id="browse">
      <header className="mobile-header">
        <a className="brand" href="/" aria-label="Finmarks">
          <img src="/finmark_light.svg" alt="Finmarks" className="logo-light brand-logo" />
          <img src="/finmark_dark.svg" alt="Finmarks" className="logo-dark brand-logo" />
        </a>
        <button
          className="menu-toggle"
          aria-label="Toggle Menu"
          onClick={() => document.body.classList.toggle('sidebar-open')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </header>

      <div
        className="mobile-overlay"
        onClick={() => document.body.classList.remove('sidebar-open')}
        aria-hidden="true"
      ></div>

      <aside className="app-sidebar">
        <div onClick={() => { if (window.innerWidth < 940) document.body.classList.remove('sidebar-open'); }}>
          <SidebarLinks currentPath="/browse" />
        </div>
        <p className={`eyebrow ${s.railTitle}`}>Categories</p>
        <button
          className={s.cat}
          aria-pressed={cat === ALL}
          onClick={() => setCat(ALL)}
          type="button">
          <span className={s.catLabel}>All entities</span>
          <span className={s.catN}>{entities.length}</span>
        </button>
        <div className={s.railSep} />
        {categories.map((c) => (
          <button
            key={c.id}
            className={s.cat}
            aria-pressed={cat === c.id}
            onClick={() => setCat(c.id)}
            title={c.description}
            type="button">
            <span className={s.catLabel}>{c.label}</span>
            <span className={s.catN}>{c.count}</span>
          </button>
        ))}
        <SidebarBottom />
      </aside>

      <div className="app-main">
        {innerContent}
      </div>
    </div>
  );
}
