// `ds7 adopt`: which local tools a ds7 command replaces, and the npm scripts it can rewrite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { project, cli, put, edit, read } from './helpers.mjs';

const withTools = (t) => {
  const dir = project(t);
  put(dir, 'tools/console-check.mjs', '');
  put(dir, 'tools/css-audit.mjs', '');
  put(dir, 'tools/my-own.mjs', '');
  edit(dir, 'package.json', (s) => {
    const p = JSON.parse(s);
    p.scripts.console = 'node tools/console-check.mjs';
    p.scripts['css:all'] = 'node tools/css-audit.mjs --all && echo done';
    return JSON.stringify(p, null, 2);
  });
  return dir;
};

test('adopt lists the local tools that have a ds7 counterpart and changes nothing', (t) => {
  const dir = withTools(t);
  const before = read(dir, 'package.json');
  const r = cli(dir, ['adopt']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /tools\/console-check\.mjs\s+→ ds7 console/);
  assert.match(r.out, /tools\/css-audit\.mjs\s+→ ds7 css/);
  assert.doesNotMatch(r.out, /my-own/);
  assert.equal(read(dir, 'package.json'), before);
});

test('adopt --write rewrites only the scripts that just call the tool', (t) => {
  const dir = withTools(t);
  cli(dir, ['adopt', '--write']);
  const s = JSON.parse(read(dir, 'package.json')).scripts;
  assert.equal(s.console, 'ds7 console');
  assert.equal(s['css:all'], 'node tools/css-audit.mjs --all && echo done');
});
