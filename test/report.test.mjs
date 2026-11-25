// The shared ending of layout, docs and the audits: --json output and the baseline of known findings. One test per behaviour.
// `layout` is the vehicle for the file handling (it needs no build); each other command has one test of its own for the JSON shape.
import test from 'node:test';
import assert from 'node:assert/strict';
import { project, site, cli, put, read, has, editPage, PAGES } from './helpers.mjs';

const stray = (dir, name = 'stray') => put(dir, `app/${name}.ts`, 'export const x = 1;\n');
const json = (r) => JSON.parse(r.stdout);

test('--json prints one JSON object with the findings and the summary', (t) => {
  const dir = project(t);
  stray(dir);
  const r = cli(dir, ['layout', '--json']);
  assert.equal(r.status, 1);
  const out = json(r);
  assert.equal(out.command, 'layout');
  assert.equal(out.problems, 1);
  assert.equal(out.known, 0);
  assert.deepEqual(
    out.findings.map((f) => [f.rule, f.where, f.known]),
    [['placement', 'app/stray.ts', false]],
  );
  assert.match(out.summary, /1 problems/);
});

test('--json exits 0 and lists no findings when the project is clean', (t) => {
  const dir = project(t);
  const r = cli(dir, ['layout', '--json']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(json(r).findings, []);
});

test('docs --json reports a missing script with the line in the place', (t) => {
  const dir = project(t);
  put(dir, 'docs/NOTES.md', '# Notes\n\nRun `npm run nothing` first.\n');
  const out = json(cli(dir, ['docs', '--json']));
  const f = out.findings.find((x) => /npm run nothing/.test(x.detail));
  assert.ok(f, JSON.stringify(out));
  assert.equal(f.rule, 'docs');
  assert.equal(f.where, 'docs/NOTES.md:3');
});

test('audit seo --json carries the rule and the page of each finding', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(/<link rel="canonical"[^>]*>/, '')),
  );
  const out = json(cli(dir, ['audit', 'seo', '--json']));
  const f = out.findings.find((x) => x.rule === 'canonical' && x.where === '/about');
  assert.ok(f, JSON.stringify(out.findings));
  assert.equal(f.known, false);
});

test('audit --json joins the four audits in one document', (t) => {
  const out = json(cli(site(t), ['audit', '--json']));
  assert.deepEqual(
    out.audits.map((a) => a.command),
    ['html', 'seo', 'a11y', 'perf'],
  );
  assert.equal(out.failed, 0);
});

test('audit --json reports a missing build as an error entry, not as broken JSON', (t) => {
  const dir = project(t);
  const r = cli(dir, ['audit', 'seo', '--json']);
  assert.equal(r.status, 1);
  const out = json(cli(dir, ['audit', '--json']));
  assert.ok(out.audits.every((a) => a.error));
  assert.equal(out.failed, 4);
});

test('--update-baseline writes the findings of one command to ds7-baseline.json', (t) => {
  const dir = project(t);
  stray(dir);
  const r = cli(dir, ['layout', '--update-baseline']);
  assert.equal(r.status, 0, r.out);
  const file = JSON.parse(read(dir, 'ds7-baseline.json'));
  assert.equal(file.layout.length, 1);
  assert.match(file.layout[0], /^placement \| app\/stray\.ts \|/);
});

test('a finding in the baseline is known: shown in the count and not failing', (t) => {
  const dir = project(t);
  stray(dir);
  cli(dir, ['layout', '--update-baseline']);
  const r = cli(dir, ['layout']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /0 problems \(1 known\)/);
});

test('a finding that is not in the baseline still fails', (t) => {
  const dir = project(t);
  stray(dir);
  cli(dir, ['layout', '--update-baseline']);
  stray(dir, 'another');
  const r = cli(dir, ['layout']);
  assert.equal(r.status, 1);
  assert.match(r.out, /app\/another\.ts/);
  assert.doesNotMatch(r.out, /app\/stray\.ts: no placement/);
});

test('a baseline entry that no longer occurs is reported so it can be dropped', (t) => {
  const dir = project(t);
  stray(dir);
  cli(dir, ['layout', '--update-baseline']);
  put(dir, 'app/stray.ts', 'export const x = 1;\n');
  put(
    dir,
    'ds7.config.json',
    JSON.stringify({ layout: { rules: [{ path: 'app/*.ts', what: 'ok' }] } }),
  );
  const r = cli(dir, ['layout']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /1 known finding\(s\) no longer occur/);
});

test('--update-baseline with no findings leaves an empty section out of the file', (t) => {
  const dir = project(t);
  stray(dir);
  cli(dir, ['layout', '--update-baseline']);
  put(dir, 'app/stray.ts', 'export const x = 1;\n');
  put(
    dir,
    'ds7.config.json',
    JSON.stringify({ layout: { rules: [{ path: 'app/*.ts', what: 'ok' }] } }),
  );
  cli(dir, ['layout', '--update-baseline']);
  assert.equal(JSON.parse(read(dir, 'ds7-baseline.json')).layout, undefined);
});

test('--no-baseline ignores the file for one run', (t) => {
  const dir = project(t);
  stray(dir);
  cli(dir, ['layout', '--update-baseline']);
  assert.equal(cli(dir, ['layout', '--no-baseline']).status, 1);
});

test('the baseline of one command does not hide the findings of another', (t) => {
  const dir = project(t);
  stray(dir);
  put(dir, 'docs/NOTES.md', '# Notes\n\nRun `npm run nothing` first.\n');
  cli(dir, ['layout', '--update-baseline']);
  assert.equal(cli(dir, ['docs']).status, 1);
});

test('a baseline entry ignores the line number of the finding', (t) => {
  const dir = project(t);
  put(dir, 'docs/NOTES.md', '# Notes\n\nRun `npm run nothing` first.\n');
  cli(dir, ['docs', '--update-baseline']);
  put(dir, 'docs/NOTES.md', '# Notes\n\nA new line.\n\nRun `npm run nothing` first.\n');
  assert.equal(cli(dir, ['docs']).status, 0);
});

test('the baseline file is created only when asked for', (t) => {
  const dir = project(t);
  stray(dir);
  cli(dir, ['layout']);
  assert.equal(has(dir, 'ds7-baseline.json'), false);
});

test('an audit takes its own section of the baseline', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(PAGES['/about'].title, 'Short')),
  );
  assert.equal(cli(dir, ['audit', 'seo']).status, 1);
  cli(dir, ['audit', 'seo', '--update-baseline']);
  assert.equal(cli(dir, ['audit', 'seo']).status, 0);
  assert.ok(JSON.parse(read(dir, 'ds7-baseline.json')).seo.length > 0);
});

test('a baseline that is not valid JSON stops the command with a message', (t) => {
  const dir = project(t);
  put(dir, 'ds7-baseline.json', '{ not json');
  const r = cli(dir, ['layout']);
  assert.equal(r.status, 1);
  assert.match(r.out, /ds7-baseline\.json is not valid JSON/);
});
