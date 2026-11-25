// `ds7 check`: the five gates. One test per gate, each on its own fresh project.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { project, cli, put } from './helpers.mjs';

const check = (dir) => cli(dir, ['check', '--strict']);

test('a fresh project passes all five gates', (t) => {
  const r = check(project(t));
  assert.equal(r.status, 0, r.out);
  for (const g of [1, 2, 3, 4, 5]) assert.match(r.out, new RegExp(`Gate ${g} \\(`));
});

test('Gate 1 fails on a baked-in modifier', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiButton.vue',
    '<template><button class="btn-big">x</button></template>\n',
  );
  assert.match(check(dir).out, /✗ Gate 1/);
});

test('Gate 2 fails on a raw colour in a ui component', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiCard.vue',
    '<template><div class="card">x</div></template>\n<style>\n.card { color: #ff0000 }\n</style>\n',
  );
  const r = check(dir);
  assert.match(r.out, /✗ Gate 2/);
  assert.match(r.out, /raw color #ff0000/);
});

test('Gate 3 fails when a locale lacks a key of another locale', (t) => {
  const dir = project(t);
  put(dir, 'i18n/locales/es.ts', "export default { hero: { title: 'A', sub: 'B' } }\n");
  put(dir, 'i18n/locales/en.ts', "export default { hero: { title: 'A' } }\n");
  const r = check(dir);
  assert.match(r.out, /✗ Gate 3/);
  assert.match(r.out, /missing in en \(present in es\): sub/);
});

test('Gate 3 passes when the locales have the same keys', (t) => {
  const dir = project(t);
  put(dir, 'i18n/locales/es.ts', "export default { hero: { title: 'A' } }\n");
  put(dir, 'i18n/locales/en.ts', "export default { hero: { title: 'B' } }\n");
  assert.match(check(dir).out, /✓ Gate 3 \(Internationalisation\): Clean. 2 locales/);
});

test('Gate 4 fails when docs/BRAND.md is missing', (t) => {
  const dir = project(t);
  fs.rmSync(path.join(dir, 'docs/BRAND.md'));
  assert.match(check(dir).out, /✗ Gate 4[\s\S]*docs\/BRAND\.md is missing/);
});

test('Gate 5 fails on a file outside every placement rule', (t) => {
  const dir = project(t);
  put(dir, 'app/stray.ts', 'export const x = 1;\n');
  const r = check(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /✗ Gate 5[\s\S]*app\/stray\.ts: no placement rule/);
});

test('Gate 5 passes a finding that ds7-baseline.json lists as known', (t) => {
  const dir = project(t);
  put(dir, 'app/stray.ts', 'export const x = 1;\n');
  cli(dir, ['layout', '--update-baseline']);
  const r = check(dir);
  assert.equal(r.status, 0, r.out);
});

test('Gate 5 is off without ds7.config.json, so older projects keep passing', (t) => {
  const dir = project(t);
  fs.rmSync(path.join(dir, 'ds7.config.json'));
  put(dir, 'app/stray.ts', 'export const x = 1;\n');
  const r = check(dir);
  assert.equal(r.status, 0, r.out);
  assert.ok(!r.out.includes('Gate 5'));
});

test('check without --strict reports problems but does not fail the exit code of a clean project', (t) => {
  assert.equal(cli(project(t), ['check']).status, 0);
});
