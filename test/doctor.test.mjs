// `ds7 doctor`: where the project stands and what to do next. One test per thing it looks at.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { project, bare, miniApp, cli, put, edit, version } from './helpers.mjs';

const doctor = (dir, ...args) => cli(dir, ['doctor', ...args]);
const rowsOf = (dir) => JSON.parse(doctor(dir, '--json').stdout).rows;
const row = (dir, name) => rowsOf(dir).find((r) => r.name === name);

test('doctor finds nothing to do in a project that init just made', (t) => {
  const r = doctor(project(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /Nothing to do\./);
});

test('doctor tells a project on an older standard to update', (t) => {
  const dir = project(t);
  put(dir, 'ds7/VERSION', '2.3.0\n');
  const r = row(dir, 'standard');
  assert.equal(r.state, 'todo');
  assert.equal(r.action, 'npx ds7 update');
  assert.match(r.text, new RegExp(`2\\.3\\.0.*${version.replace(/\./g, '\\.')}`));
});

test('doctor tells a folder without ds7 to run init', (t) => {
  const r = row(bare(t), 'standard');
  assert.equal(r.state, 'todo');
  assert.match(r.text, /not installed/);
});

test('doctor reports a missing ds7.config.json and says Gate 5 is off', (t) => {
  const dir = project(t);
  fs.rmSync(path.join(dir, 'ds7.config.json'));
  const r = row(dir, 'settings');
  assert.equal(r.state, 'todo');
  assert.match(r.text, /Gate 5 \(layout\) is off/);
});

test('doctor reports a settings file that is not valid JSON instead of crashing', (t) => {
  const dir = project(t);
  put(dir, 'ds7.config.json', '{ nope');
  const r = doctor(dir);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /ds7\.config\.json is not valid JSON/);
});

test('doctor names a required document that is missing', (t) => {
  const dir = project(t);
  fs.rmSync(path.join(dir, 'docs/DECISIONS.md'));
  assert.match(row(dir, 'documents').text, /docs\/DECISIONS\.md/);
});

test('doctor names the package scripts DS7 expects and the project lacks', (t) => {
  const dir = project(t);
  edit(dir, 'package.json', (s) => {
    const p = JSON.parse(s);
    delete p.scripts.audit;
    return JSON.stringify(p);
  });
  assert.match(row(dir, 'scripts').text, /lacks: audit/);
});

test('doctor reports a site graph that is out of date', (t) => {
  const dir = project(t);
  miniApp(dir);
  const r = row(dir, 'graph');
  assert.equal(r.state, 'todo');
  assert.equal(r.action, 'npx ds7 graph');
});

test('doctor shows how many findings the baseline holds per command', (t) => {
  const dir = project(t);
  put(dir, 'app/stray.ts', 'export const x = 1;\n');
  cli(dir, ['layout', '--update-baseline']);
  assert.match(row(dir, 'baseline').text, /layout 1/);
});

test('doctor says when there is no build to audit', (t) => {
  assert.match(row(project(t), 'build').text, /no build in \.output\/public/);
});

test('doctor --json gives the next action', (t) => {
  const dir = project(t);
  put(dir, 'ds7/VERSION', '2.3.0\n');
  const out = JSON.parse(doctor(dir, '--json').stdout);
  assert.equal(out.version, version);
  assert.equal(out.next, 'npx ds7 update');
});

test('doctor changes no file', (t) => {
  const dir = project(t);
  const walk = (d, rel = '') =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const r = rel ? `${rel}/${e.name}` : e.name;
      const p = path.join(d, e.name);
      return e.isDirectory()
        ? [`${r}:dir`, ...walk(p, r)]
        : [`${r}:${fs.readFileSync(p, 'utf8').length}`];
    });
  const files = () => walk(dir).sort();
  const before = files();
  doctor(dir);
  assert.deepEqual(files(), before);
});
