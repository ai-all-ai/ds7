// DS7 packed with `npm pack`, installed with AI-ALL into a project, as a user gets it. Each test starts from its own
// copy of the installed project (the pack and install run once per file, a copy per test). Set AIALL_TARBALL to test a
// local AI-ALL build instead of the registry version.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { installed, cli, has, read, put, edit, version } from './helpers.mjs';

const init = (t) => {
  const p = installed(t);
  const r = cli(p.dir, [], p.ds7);
  assert.equal(r.status, 0, r.out);
  return p;
};

test('the pack manifest names the version and a document that exists for every directive', (t) => {
  const { dir } = init(t);
  const manifest = JSON.parse(read(dir, 'ds7/aiall-pack.json'));
  assert.equal(manifest.name, '@ai.all/ds7');
  assert.equal(manifest.version, version);
  for (const d of manifest.directives)
    assert.ok(has(dir, d.doc), `directive doc missing: ${d.doc}`);
});

test('the pack routes agents to the SEO checklist and the token strategy', (t) => {
  const { dir } = init(t);
  const docs = JSON.parse(read(dir, 'ds7/aiall-pack.json')).directives.map((d) => d.doc);
  assert.ok(docs.some((d) => d.endsWith('04-seo-ai-optimization/SEO-CHECKLIST.md')));
  assert.ok(docs.some((d) => d.endsWith('08-token-optimization/TOKEN-STRATEGY.md')));
});

test('init enables the ds7 pack and writes the version file', (t) => {
  const { dir } = init(t);
  assert.deepEqual(JSON.parse(read(dir, '.ai/aiall.json')).packs, [
    'aiall-core',
    'ds7/aiall-pack.json',
  ]);
  assert.equal(read(dir, 'ds7/VERSION').trim(), version);
});

test('init links the ds7 rules from the root ALL.md and AI-ALL accepts the result', (t) => {
  const p = init(t);
  const all = read(p.dir, 'ALL.md');
  assert.ok(all.includes('<!-- aiall:begin packs -->') && all.includes('ds7/ALL.md'));
  assert.equal(cli(p.dir, ['check', '--path', p.dir], p.aiall).status, 0);
});

test('init does not create ALL.project.md and does create the security and operations docs', (t) => {
  const { dir } = init(t);
  assert.ok(!has(dir, 'ALL.project.md'));
  assert.ok(has(dir, 'ds7/09-security-errors/SECURITY-AND-ERRORS.md'));
  assert.ok(has(dir, 'ds7/10-operations/DEPLOYMENT.md'));
});

test('guard and check pass on a fresh install', (t) => {
  const p = init(t);
  assert.equal(cli(p.dir, ['guard', '--strict', '--path', p.dir], p.ds7).status, 0);
  assert.equal(cli(p.dir, ['check', '--strict', '--path', p.dir], p.ds7).status, 0);
});

test('init a second time does not list the pack twice', (t) => {
  const p = init(t);
  const before = read(p.dir, '.ai/aiall.json');
  assert.ok(cli(p.dir, [], p.ds7).out.includes('pack ds7/aiall-pack.json (exists, kept)'));
  assert.equal(read(p.dir, '.ai/aiall.json'), before);
});

test('update restores the standard and keeps project text outside the packs block', (t) => {
  const p = init(t);
  edit(p.dir, 'ALL.md', (s) => `${s}\n\n## Project values\n\nCUSTOM PROJECT TEXT\n`);
  put(p.dir, 'ds7/ALL.md', 'stale standard');
  assert.equal(cli(p.dir, ['update'], p.ds7).status, 0);
  assert.ok(read(p.dir, 'ds7/ALL.md').includes('DS7 Projects'));
  assert.ok(read(p.dir, 'ALL.md').includes('CUSTOM PROJECT TEXT'));
  assert.equal(cli(p.dir, ['check', '--path', p.dir], p.aiall).status, 0);
});

test('update warns about a DS7 1.x ALL.project.md and leaves it in place', (t) => {
  const p = init(t);
  put(p.dir, 'ALL.project.md', '# old project file');
  const r = cli(p.dir, ['update'], p.ds7);
  assert.ok(r.out.includes('ALL.project.md is from DS7 1.x'));
  assert.ok(has(p.dir, 'ALL.project.md'));
});

test('update on a project made by DS7 2.3 adds no files and keeps Gate 5 off', (t) => {
  const p = init(t);
  // what a 2.3 project looks like: none of the files that 2.4 init adds
  for (const f of [
    'ds7.config.json',
    'docs/ARCHITECTURE.md',
    'docs/DECISIONS.md',
    'docs/METRICS.md',
    'docs/SITE-GRAPH.md',
    '.github/workflows/ds7.yml',
  ])
    fs.rmSync(path.join(p.dir, f), { force: true });
  assert.equal(cli(p.dir, ['update'], p.ds7).status, 0);
  assert.ok(!has(p.dir, 'ds7.config.json'), 'update must not create ds7.config.json');
  const r = cli(p.dir, ['check', '--strict', '--path', p.dir], p.ds7);
  assert.equal(r.status, 0, r.out);
  assert.ok(!r.out.includes('Gate 5'), 'Gate 5 stays off without ds7.config.json');
});

test('the tarball ships the commands, the libraries and the templates', (t) => {
  const { dir } = init(t);
  for (const f of [
    'bin/cmd/layout.mjs',
    'bin/cmd/seo.mjs',
    'bin/lib/config.mjs',
    'templates/ds7.config.json',
    'templates/skills/seo-page/SKILL.md',
    'templates/workflows/ds7.yml',
  ])
    assert.ok(has(dir, `node_modules/@ai.all/ds7/${f}`), `${f} is in the package`);
});

test('docs, graph and doctor pass on a fresh install', (t) => {
  const p = init(t);
  for (const args of [['docs'], ['graph', '--check'], ['doctor']]) {
    const r = cli(p.dir, args, p.ds7);
    assert.equal(r.status, 0, `${args.join(' ')}: ${r.out}`);
  }
});
