// `ds7 check`: the five gates. One test per gate, each on its own fresh project.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { project, cli, put, edit } from './helpers.mjs';

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
  assert.match(r.out, /missing in en \(present in es\): hero\.sub/);
});

test('Gate 3 passes when the locales have the same keys', (t) => {
  const dir = project(t);
  put(dir, 'i18n/locales/es.ts', "export default { hero: { title: 'A' } }\n");
  put(dir, 'i18n/locales/en.ts', "export default { hero: { title: 'B' } }\n");
  assert.match(check(dir).out, /✓ Gate 3 \(Internationalisation\): Clean. 2 locales/);
});

test('Gate 3 does not take words inside strings, templates or comments for keys', (t) => {
  const dir = project(t);
  put(
    dir,
    'i18n/locales/es.ts',
    "export default {\n  // note: a comment\n  a: 'Nota: algo, b: c',\n  t: `x ${'y'} label: z`,\n  list: ['one: two'],\n}\n",
  );
  put(dir, 'i18n/locales/en.ts', "export default { a: 'Note', t: 'x', list: ['one'] }\n");
  assert.match(check(dir).out, /✓ Gate 3 \(Internationalisation\): Clean. 2 locales/);
});

test('Gate 3 reports a key written twice in one object', (t) => {
  const dir = project(t);
  put(dir, 'i18n/locales/es.ts', "export default { hero: { title: 'A', title: 'B' } }\n");
  put(dir, 'i18n/locales/en.ts', "export default { hero: { title: 'A' } }\n");
  assert.match(check(dir).out, /key written twice in i18n\/locales\/es\.ts: hero\.title/);
});

test('Gate 3 compares locales kept as folders of files', (t) => {
  const dir = project(t);
  put(dir, 'i18n/locales/es/home.json', '{ "title": "A", "sub": "B" }\n');
  put(dir, 'i18n/locales/en/home.json', '{ "title": "A" }\n');
  assert.match(check(dir).out, /missing in en \(present in es\): home\.sub/);
});

test('Gate 3 says so when there is one locale only', (t) => {
  const dir = project(t);
  put(dir, 'i18n/locales/es.ts', "export default { a: 'A' }\n");
  assert.match(check(dir).out, /Gate 3 \(Internationalisation\): Clean. One locale/);
});

test('Gate 3 is off when i18n.check is false', (t) => {
  const dir = project(t);
  put(dir, 'i18n/locales/es.ts', "export default { a: 'A', b: 'B' }\n");
  put(dir, 'i18n/locales/en.ts', "export default { a: 'A' }\n");
  edit(dir, 'ds7.config.json', (s) => JSON.stringify({ ...JSON.parse(s), i18n: { check: false } }));
  assert.match(check(dir).out, /✓ Gate 3 \(Internationalisation\): Off/);
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

const rawColour = (dir) =>
  put(
    dir,
    'app/components/ui/UiCard.vue',
    '<template><div class="card">x</div></template>\n<style>\n.card { color: #ff0000 }\n</style>\n',
  );

test('check --update-baseline accepts the current issues; --strict then passes until a new one appears', (t) => {
  const dir = project(t);
  rawColour(dir);
  assert.equal(cli(dir, ['check', '--strict']).status, 1);
  cli(dir, ['check', '--update-baseline']);
  const r = cli(dir, ['check', '--strict']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /Gate 2 \(Token Discipline\): Clean[\s\S]*\(1 known\)/);
  put(dir, 'app/components/ui/UiTag.vue', '<style>\n.tag { color: #00ff00 }\n</style>\n');
  assert.equal(cli(dir, ['check', '--strict']).status, 1);
});

test('check --json prints every gate with its issues', (t) => {
  const dir = project(t);
  rawColour(dir);
  const out = JSON.parse(cli(dir, ['check', '--json']).stdout);
  assert.equal(out.command, 'check');
  assert.equal(out.gates.find((g) => g.name === 'tokens').issues.length, 1);
  assert.equal(out.problems, 1);
});

test('check.gates switches a gate off by name', (t) => {
  const dir = project(t);
  rawColour(dir);
  edit(dir, 'ds7.config.json', (s) =>
    JSON.stringify({ ...JSON.parse(s), check: { gates: { tokens: false } } }),
  );
  const r = cli(dir, ['check', '--strict']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /Gate 2 \(Token Discipline\): Off/);
});
