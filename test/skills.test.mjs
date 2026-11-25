// `ds7 skills` and `ds7 hooks`: links for agents that read .claude/skills, and the commit-msg hook.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { project, cli, has, read } from './helpers.mjs';

test('skills link makes every project skill readable from .claude/skills, once', (t) => {
  const dir = project(t);
  assert.equal(cli(dir, ['skills', 'link']).status, 0);
  assert.match(read(dir, '.claude/skills/seo-page/SKILL.md'), /^---\nname: seo-page/);
  assert.match(cli(dir, ['skills', 'link']).out, /0 linked/);
});

test('hooks installs a commit-msg hook that accepts Conventional Commits and refuses the rest', (t) => {
  const dir = project(t);
  spawnSync('git', ['init', '-q'], { cwd: dir });
  assert.equal(cli(dir, ['hooks']).status, 0);
  const hook = path.join(dir, '.git', 'hooks', 'commit-msg');
  const check = (msg) => {
    fs.writeFileSync(path.join(dir, 'MSG'), `${msg}\n`);
    return spawnSync('sh', [hook, path.join(dir, 'MSG')]).status;
  };
  assert.equal(check('fix(seo): keep the canonical on paged lists'), 0);
  assert.equal(check('Fixed stuff.'), 1);
  assert.ok(has(dir, 'ds7/local/README.md'));
});
