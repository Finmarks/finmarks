/**
 * API tests against the built ESM bundle, so they exercise what consumers
 * actually install rather than the TypeScript sources.
 *
 *   node --test test/*.test.mjs
 */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  CDN_BASE,
  VERSION,
  buildLogoUrl,
  data,
  getAllEntities,
  getAllEntityIds,
  getByAllCategories,
  getByCategory,
  getByIfscPrefix,
  getByUpiHandle,
  getCategory,
  getEntity,
  getLogoUrl,
  getLogoUrlWithFallback,
  getLogos,
  hasEntity,
  listCategories,
  mustGetEntity,
  search,
} from '../dist/index.js';

describe('dataset', () => {
  it('exposes a non-empty entity list', () => {
    assert.ok(data.total > 0);
    assert.equal(data.total, data.entities.length);
  });

  it('has a version and CDN base', () => {
    assert.match(VERSION, /^\d+\.\d+\.\d+/);
    assert.match(CDN_BASE, /^https?:\/\//);
  });

  it('has unique ids', () => {
    const ids = getAllEntityIds();
    assert.equal(new Set(ids).size, ids.length);
  });

  it('gives every entity the required fields', () => {
    for (const e of getAllEntities()) {
      assert.ok(e.id, `${e.id}: id`);
      assert.ok(e.name, `${e.id}: name`);
      assert.ok(e.short_name, `${e.id}: short_name`);
      assert.ok(Array.isArray(e.categories) && e.categories.length > 0, `${e.id}: categories`);
      assert.match(e.brand_color, /^#[0-9A-Fa-f]{6}$/, `${e.id}: brand_color`);
      assert.ok(typeof e.logos === 'object' && e.logos !== null, `${e.id}: logos`);
    }
  });

  it('resolves every acquired_by to a real entity', () => {
    for (const e of getAllEntities()) {
      if (e.acquired_by) assert.ok(hasEntity(e.acquired_by), `${e.id} -> ${e.acquired_by}`);
    }
  });
});

describe('getEntity', () => {
  it('returns an entity by id', () => {
    const id = getAllEntityIds()[0];
    assert.equal(getEntity(id)?.id, id);
  });

  it('returns undefined for an unknown id', () => {
    assert.equal(getEntity('definitely-not-a-real-entity'), undefined);
  });

  it('mustGetEntity throws for an unknown id', () => {
    assert.throws(() => mustGetEntity('definitely-not-a-real-entity'), /unknown entity id/);
  });

  it('hasEntity reflects presence', () => {
    assert.equal(hasEntity(getAllEntityIds()[0]), true);
    assert.equal(hasEntity('nope'), false);
  });
});

describe('logos', () => {
  it('returns undefined for an unknown entity', () => {
    assert.equal(getLogoUrl('nope', 'full'), undefined);
    assert.deepEqual(getLogos('nope'), {});
  });

  it('only publishes URLs on the CDN origin', () => {
    for (const e of getAllEntities()) {
      for (const url of Object.values(e.logos)) {
        assert.ok(url.startsWith(CDN_BASE), `${e.id}: ${url}`);
        assert.match(url, /\.svg$/, `${e.id}: ${url}`);
      }
    }
  });

  it('falls back through the variant list', () => {
    const withLogo = getAllEntities().find((e) => Object.keys(e.logos).length > 0);
    if (!withLogo) return; // no assets sourced yet
    const variant = Object.keys(withLogo.logos)[0];
    assert.equal(getLogoUrlWithFallback(withLogo.id, ['square', variant]), withLogo.logos[variant]);
  });

  it('returns undefined when no fallback matches', () => {
    const noLogo = getAllEntities().find((e) => Object.keys(e.logos).length === 0);
    if (noLogo) assert.equal(getLogoUrlWithFallback(noLogo.id), undefined);
  });

  it('buildLogoUrl composes a CDN path', () => {
    assert.equal(buildLogoUrl('hdfc-bank', 'icon.svg'), `${CDN_BASE}/entities/hdfc-bank/icon.svg`);
  });

  it('getLogos returns a copy', () => {
    const id = getAllEntityIds()[0];
    const logos = getLogos(id);
    logos.full = 'mutated';
    assert.notEqual(getLogos(id).full, 'mutated');
  });
});

describe('categories', () => {
  it('lists categories with counts', () => {
    const cats = listCategories();
    assert.ok(cats.length >= 16);
    for (const c of cats) {
      assert.ok(c.id && c.label);
      assert.equal(typeof c.count, 'number');
    }
  });

  it('counts agree with getByCategory', () => {
    for (const c of listCategories()) {
      assert.equal(getByCategory(c.id).length, c.count, `count mismatch for ${c.id}`);
    }
  });

  it('getCategory returns one definition', () => {
    assert.equal(getCategory('upi-psp')?.id, 'upi-psp');
    assert.equal(getCategory('not-a-category'), undefined);
  });

  it('every entity category exists in the taxonomy', () => {
    const known = new Set(listCategories().map((c) => c.id));
    for (const e of getAllEntities()) {
      for (const c of e.categories) assert.ok(known.has(c), `${e.id}: unknown category ${c}`);
    }
  });
});

describe('getByCategory', () => {
  it('returns entities for a single category', () => {
    const upi = getByCategory('upi-psp');
    assert.ok(upi.length > 0);
    for (const e of upi) assert.ok(e.categories.includes('upi-psp'));
  });

  it('unions multiple categories without duplicates', () => {
    const union = getByCategory(['upi-psp', 'payment-gateway']);
    const ids = union.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const e of union) {
      assert.ok(e.categories.includes('upi-psp') || e.categories.includes('payment-gateway'));
    }
  });

  it('union is at least as large as either part', () => {
    const a = getByCategory('upi-psp').length;
    const b = getByCategory('wallet').length;
    assert.ok(getByCategory(['upi-psp', 'wallet']).length >= Math.max(a, b));
  });

  it('intersects with getByAllCategories', () => {
    const both = getByAllCategories(['upi-psp', 'wallet']);
    for (const e of both) {
      assert.ok(e.categories.includes('upi-psp') && e.categories.includes('wallet'));
    }
    assert.ok(both.length <= getByCategory(['upi-psp', 'wallet']).length);
  });

  it('filters inactive entities on request', () => {
    const all = getAllEntities();
    const active = getAllEntities({ includeInactive: false });
    assert.ok(active.length <= all.length);
    for (const e of active) assert.equal(e.status, 'active');
  });

  it('returns a caller-owned array', () => {
    const first = getByCategory('upi-psp');
    const n = first.length;
    first.pop();
    assert.equal(getByCategory('upi-psp').length, n);
  });

  it('returns empty for a category with no entities', () => {
    assert.deepEqual(getByCategory('not-a-real-category'), []);
  });
});

describe('search', () => {
  it('finds by name', () => {
    const e = getAllEntities()[0];
    assert.ok(search(e.name).some((r) => r.id === e.id));
  });

  it('finds by id', () => {
    const e = getAllEntities()[0];
    assert.equal(search(e.id)[0]?.id, e.id);
  });

  it('is case insensitive', () => {
    const e = getAllEntities()[0];
    assert.deepEqual(
      search(e.name.toUpperCase()).map((r) => r.id),
      search(e.name.toLowerCase()).map((r) => r.id),
    );
  });

  it('returns empty for a blank query', () => {
    assert.deepEqual(search(''), []);
    assert.deepEqual(search('   '), []);
  });

  it('returns empty for nonsense', () => {
    assert.deepEqual(search('zzzzzzqqqqq'), []);
  });

  it('respects limit', () => {
    assert.ok(search('bank', { limit: 3 }).length <= 3);
  });

  it('respects a category scope', () => {
    for (const e of search('a', { categories: 'wealthtech' })) {
      assert.ok(e.categories.includes('wealthtech'));
    }
  });

  it('ranks an exact id match first', () => {
    const e = getAllEntities().find((x) => x.id.includes('-')) ?? getAllEntities()[0];
    assert.equal(search(e.id)[0]?.id, e.id);
  });
});

describe('lookups', () => {
  it('resolves an IFSC prefix', () => {
    const bank = getAllEntities().find((e) => e.ifsc_prefix);
    if (!bank) return;
    assert.equal(getByIfscPrefix(bank.ifsc_prefix)?.id, bank.id);
    assert.equal(getByIfscPrefix(bank.ifsc_prefix.toLowerCase())?.id, bank.id);
    assert.equal(getByIfscPrefix('ZZZZ'), undefined);
  });

  it('resolves a UPI handle from a full VPA or bare suffix', () => {
    const e = getAllEntities().find((x) => x.upi_handles?.length);
    if (!e) return;
    const handle = e.upi_handles[0]; // '@ybl'
    const suffix = handle.slice(1);
    assert.equal(getByUpiHandle(handle)?.id, e.id);
    assert.equal(getByUpiHandle(suffix)?.id, e.id);
    assert.equal(getByUpiHandle(`someone${handle}`)?.id, e.id);
    assert.equal(getByUpiHandle('@zzzznotreal'), undefined);
    assert.equal(getByUpiHandle(''), undefined);
  });
});
