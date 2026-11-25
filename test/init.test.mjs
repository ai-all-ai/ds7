// `ds7 init` on a project that has only a package.json. One test per thing init creates.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bare, project, cli, has, read, edit } from './helpers.mjs';

test('init creates the project documents ARCHITECTURE, DECISIONS and METRICS', (t) => {
  const dir = project(t);
  for (const f of ['docs/ARCHITECTURE.md', 'docs/DECISIONS.md', 'docs/METRICS.md'])
    assert.ok(has(dir, f), `${f} is created`);
});

test('init creates ds7.config.json, the switch of the layout gate', (t) => {
  const dir = project(t);
  assert.ok(has(dir, 'ds7.config.json'));
  assert.ok('layout' in JSON.parse(read(dir, 'ds7.config.json')));
});

test('init creates the three starter skills', (t) => {
  const dir = project(t);
  for (const s of ['project-graph', 'add-language', 'seo-page']) {
    const text = read(dir, `.agents/skills/${s}/SKILL.md`);
    assert.match(text, new RegExp(`^---\\nname: ${s}\\n`), `${s} frontmatter names the folder`);
  }
});

test('init registers the starter skills in the root ALL.md', (t) => {
  const all = read(project(t), 'ALL.md');
  for (const s of ['project-graph', 'add-language', 'seo-page'])
    assert.ok(all.includes(`.agents/skills/${s}/SKILL.md`), `${s} is listed`);
  assert.ok(!all.includes('(Add a trigger)'), 'the placeholder row is replaced');
});

test('init creates the CI workflow', (t) => {
  const yml = read(project(t), '.github/workflows/ds7.yml');
  for (const step of ['check:strict', 'graph:check', 'docs:check', 'audit'])
    assert.ok(yml.includes(step));
});

test('init generates docs/SITE-GRAPH.md so the docs that name it are true', (t) => {
  assert.ok(has(project(t), 'docs/SITE-GRAPH.md'));
});

test('init adds the npm scripts of every command', (t) => {
  const scripts = JSON.parse(read(project(t), 'package.json')).scripts;
  assert.deepEqual(
    [scripts.guard, scripts['guard:strict'], scripts.check, scripts['check:strict']],
    ['ds7 guard', 'ds7 guard --strict', 'ds7 check', 'ds7 check --strict'],
  );
  assert.deepEqual(
    [scripts.graph, scripts['graph:check'], scripts.layout, scripts['docs:check'], scripts.audit],
    ['ds7 graph', 'ds7 graph --check', 'ds7 layout', 'ds7 docs', 'ds7 audit'],
  );
});

test('init keeps a script the project already has', (t) => {
  const dir = bare(t);
  edit(dir, 'package.json', () =>
    JSON.stringify({ name: 'x', scripts: { audit: 'my-own-audit' } }),
  );
  cli(dir);
  assert.equal(JSON.parse(read(dir, 'package.json')).scripts.audit, 'my-own-audit');
});

test('init scaffolds docs/BRAND.md, the Makefile and the ds5 entry of .gitignore', (t) => {
  const dir = project(t);
  assert.ok(has(dir, 'docs/BRAND.md') && has(dir, 'Makefile'));
  assert.ok(read(dir, '.gitignore').includes('ds5/'));
});

test('init a second time keeps edited project files and lists each skill once', (t) => {
  const dir = project(t);
  edit(dir, 'docs/ARCHITECTURE.md', (s) => `${s}\nMY CONVENTION\n`);
  edit(dir, 'docs/DECISIONS.md', (s) => `${s}\nMY DECISION\n`);
  assert.equal(cli(dir).status, 0);
  assert.ok(read(dir, 'docs/ARCHITECTURE.md').includes('MY CONVENTION'));
  assert.ok(read(dir, 'docs/DECISIONS.md').includes('MY DECISION'));
  assert.equal(read(dir, 'ALL.md').split('.agents/skills/seo-page/SKILL.md').length - 1, 1);
});
