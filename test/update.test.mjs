// `ds7 update` keeps local edits of the vendored standard; `ds7 patch` records one so every update re-applies it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { bare, project, cli, read, has, edit, put } from './helpers.mjs';

const FILE = '02-design-system/NAMING-CONVENTIONS.md';
const LINE = '\nLocal rule: roots have no family prefix.\n';
const gitRepo = (dir) => spawnSync('git', ['init', '-q'], { cwd: dir });

test('init writes the checksums of the vendored files', (t) => {
  const dir = project(t);
  assert.match(read(dir, 'ds7/FILES'), new RegExp(`^[0-9a-f]{16} {2}${FILE}$`, 'm'));
});

test('init names the dev address after the package and keeps customized scripts', (t) => {
  const dir = bare(t);
  const pkg = { name: '@team/velo.es', scripts: { dev: 'nuxt dev' } };
  put(dir, 'package.json', JSON.stringify(pkg));
  const result = cli(dir, ['init', '--yes']);
  assert.equal(result.status, 0, result.out);
  assert.equal(JSON.parse(read(dir, 'package.json')).scripts.dev, 'ds7 dev');
  const { dev } = JSON.parse(read(dir, 'ds7.config.json'));
  assert.equal(dev.name, 'velo');
  assert.ok(dev.port >= 3010 && dev.port % 10 === 0 && ![4000, 4500].includes(dev.port));
  assert.match(read(dir, 'docs/BRAND.md'), new RegExp(`http://velo\\.localhost:${dev.port}`));
  pkg.scripts.dev = 'nuxt dev --port 4500';
  put(dir, 'package.json', JSON.stringify(pkg));
  const rerun = cli(dir, ['init', '--yes']);
  assert.equal(rerun.status, 0, rerun.out);
  assert.equal(JSON.parse(read(dir, 'package.json')).scripts.dev, pkg.scripts.dev);
  assert.equal(JSON.parse(read(dir, 'ds7.config.json')).dev.port, dev.port);
});

test('update saves a local edit that no patch carries before it replaces the file', (t) => {
  const dir = project(t);
  edit(dir, `ds7/${FILE}`, (s) => s + LINE);
  const r = cli(dir, ['update']);
  assert.match(r.out, /had a local edit that no patch carries/);
  assert.ok(read(dir, `ds7/local/edited/${FILE}`).includes('Local rule'));
  assert.ok(!read(dir, `ds7/${FILE}`).includes('Local rule'));
});

test('patch records an edit and update applies it again', (t) => {
  const dir = project(t);
  gitRepo(dir);
  edit(dir, `ds7/${FILE}`, (s) => s + LINE);
  const p = cli(dir, ['patch', FILE]);
  assert.equal(p.status, 0, p.out);
  assert.ok(has(dir, 'ds7/local/patches/01-naming-conventions.patch'));
  const r = cli(dir, ['update']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /patch 01-naming-conventions\.patch applied/);
  assert.ok(read(dir, `ds7/${FILE}`).includes('Local rule'));
  assert.ok(!has(dir, `ds7/local/edited/${FILE}`));
});

test('init writes the custom layer starter and update creates it in an older project', (t) => {
  const dir = project(t);
  assert.match(read(dir, 'ds7/local/CUSTOM-LAYER.md'), /Custom layer of this project/);
  rmSync(`${dir}/ds7/local/CUSTOM-LAYER.md`);
  const r = cli(dir, ['update']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /CUSTOM-LAYER\.md created/);
  edit(dir, 'ds7/local/CUSTOM-LAYER.md', (s) => s + '\nOur rule.\n');
  cli(dir, ['update']);
  assert.ok(read(dir, 'ds7/local/CUSTOM-LAYER.md').includes('Our rule.'), 'never overwritten');
});

test('update --no-patches leaves the patches unapplied and still saves a local edit', (t) => {
  const dir = project(t);
  gitRepo(dir);
  edit(dir, `ds7/${FILE}`, (s) => s + LINE);
  assert.equal(cli(dir, ['patch', FILE]).status, 0);
  const r = cli(dir, ['update', '--no-patches']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /patch 01-naming-conventions\.patch not applied/);
  assert.ok(!read(dir, `ds7/${FILE}`).includes('Local rule'));
  assert.ok(has(dir, 'ds7/local/patches/01-naming-conventions.patch'));
  assert.ok(read(dir, `ds7/local/edited/${FILE}`).includes('Local rule'));
});

test('update.patches "off" in ds7.config.json does the same without the flag', (t) => {
  const dir = project(t);
  gitRepo(dir);
  edit(dir, `ds7/${FILE}`, (s) => s + LINE);
  assert.equal(cli(dir, ['patch', FILE]).status, 0);
  writeFileSync(`${dir}/ds7.config.json`, JSON.stringify({ update: { patches: 'off' } }));
  const r = cli(dir, ['update']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /not applied \(patches are off\)/);
  assert.ok(!read(dir, `ds7/${FILE}`).includes('Local rule'));
});

test("update runs the project's own @ai.all/ui, not the copy bundled with DS7", (t) => {
  const dir = project(t);
  put(
    dir,
    'node_modules/@ai.all/ui/bin/ui.js',
    "require('node:fs').writeFileSync('ui-ran.txt', process.argv.slice(2).join(' '));\n",
  );
  put(
    dir,
    'node_modules/@ai.all/ui/package.json',
    '{ "name": "@ai.all/ui", "version": "9.9.9" }\n',
  );
  const r = cli(dir, ['update']);
  assert.equal(r.status, 0, r.out);
  assert.equal(read(dir, 'ui-ran.txt'), 'update');
});
