// `ds7 psi`: PageSpeed Insights scores against the DS7 targets. The tests read a saved response (--file), so they need no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bare, cli, put } from './helpers.mjs';

const response = (scores, extra = {}) => ({
  id: 'https://example.test/',
  lighthouseResult: {
    categories: Object.fromEntries(
      Object.entries(scores).map(([id, s]) => [id, { title: id, score: s }]),
    ),
    audits: {
      'largest-contentful-paint': {
        title: 'Largest Contentful Paint',
        displayValue: '1.4 s',
        score: 1,
        scoreDisplayMode: 'numeric',
      },
    },
  },
  ...extra,
});
const GOOD = { performance: 0.98, accessibility: 1, 'best-practices': 0.96, seo: 1 };
const run = (t, data, args = []) => {
  const dir = bare(t);
  put(dir, 'saved.json', JSON.stringify(data));
  return cli(dir, ['psi', '--file', 'saved.json', ...args]);
};

test('psi exits 0 when every score reaches its target', (t) => {
  const r = run(t, response(GOOD));
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /below/);
});

test('psi marks a score below its target and exits 1', (t) => {
  const r = run(t, response({ ...GOOD, performance: 0.7 }));
  assert.equal(r.status, 1);
  assert.match(r.out, /performance\s+70\s+\(target 95\)\s+<-- below/);
});

test('psi wants SEO at 100, not 95', (t) => {
  const r = run(t, response({ ...GOOD, seo: 0.97 }));
  assert.equal(r.status, 1);
  assert.match(r.out, /seo\s+97\s+\(target 100\)/);
});

test('psi prints the lab values it finds', (t) => {
  assert.match(run(t, response(GOOD)).out, /Largest Contentful Paint\s+1\.4 s/);
});

test('psi says when the site has no field data yet', (t) => {
  assert.match(run(t, response(GOOD)).out, /no field data yet/);
});

test('psi prints field data when the response has it', (t) => {
  const data = response(GOOD, {
    loadingExperience: {
      overall_category: 'FAST',
      metrics: { LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2100, category: 'FAST' } },
    },
  });
  const r = run(t, data);
  assert.match(r.out, /LARGEST_CONTENTFUL_PAINT_MS\s+2\.10 s\s+FAST/);
  assert.match(r.out, /overall: FAST/);
});

test('psi fails on a response without lighthouseResult', (t) => {
  const r = run(t, { error: 'x' });
  assert.equal(r.status, 1);
  assert.match(r.out, /No lighthouseResult/);
});

test('psi without a URL or a file prints its usage', (t) => {
  const r = cli(bare(t), ['psi']);
  assert.equal(r.status, 1);
  assert.match(r.out, /Usage: ds7 psi https:\/\/example\.com\//);
});
