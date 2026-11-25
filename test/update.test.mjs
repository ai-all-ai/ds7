// `ds7 update` keeps local edits of the vendored standard; `ds7 patch` records one so every update re-applies it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { project, cli, read, has, edit } from './helpers.mjs';

const FILE = '02-design-system/NAMING-CONVENTIONS.md';
const LINE = '\nLocal rule: roots have no family prefix.\n';
const gitRepo = (dir) => spawnSync('git', ['init', '-q'], { cwd: dir });

test('init writes the checksums of the vendored files', (t) => {
  const dir = project(t);
  assert.match(read(dir, 'ds7/FILES'), new RegExp(`^[0-9a-f]{16} {2}${FILE}$`, 'm'));
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
