// The standard itself: its documents, versions and code stay consistent, so mistakes found once cannot come back.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, cli, version } from './helpers.mjs';

const walk = (dir, keep) =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    return e.isDirectory() ? walk(rel, keep) : keep(rel) ? [rel] : [];
  });
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const docs = walk('.', (f) => f.endsWith('.md') && !f.endsWith('CHANGELOG.md'));

test('every ds7 command named in the documents exists in the CLI', () => {
  const help = cli(root, ['--help']).out;
  const known = new Set([...help.matchAll(/ds7 ([a-z]+)/g)].map((m) => m[1]));
  const unknown = [];
  for (const f of docs)
    for (const m of read(f).matchAll(/`(?:npx @ai\.all\/ds7|ds7) ([a-z][a-z-]*)/g))
      if (!known.has(m[1])) unknown.push(`${f}: ds7 ${m[1]}`);
  assert.deepEqual(unknown, []);
});

test('names that were removed or never existed do not come back into the documents and templates', () => {
  // i18n-check: not a DS7 command (use `ds7 check`); inlineSSRStyles: removed in Nuxt 4 (use features.inlineStyles).
  const gone = [/\bi18n-check\b/, /\binlineSSRStyles\b/];
  const files = [...docs, ...walk('templates', () => true)];
  const hits = [];
  for (const f of files) {
    const lines = read(f).split('\n');
    lines.forEach((line, i) => {
      // a line that explains the old name as old is allowed
      if (/no longer exists|removed|older name/i.test(line)) return;
      for (const re of gone) if (re.test(line)) hits.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(hits, []);
});

test('the version is the same in package.json, ALL.md, SPEC.md and the CHANGELOG', () => {
  assert.match(read('ALL.md'), new RegExp(`\\*\\*Version:\\*\\* ${version.replace(/\./g, '\\.')}`));
  assert.match(read('SPEC.md'), new RegExp(`Version ${version.replace(/\./g, '\\.')}\\.`));
  assert.match(read('CHANGELOG.md'), new RegExp(`## \\[${version.replace(/\./g, '\\.')}\\]`));
  assert.equal(JSON.parse(read('package-lock.json')).version, version);
});

test('code and tests use only APIs that Node 18 has (engines >=18, CI runs Node 18)', () => {
  const newer = [
    [/readdirSync\([^)]*recursive/, 'fs.readdirSync with recursive'],
    [/\bObject\.groupBy\b|\bMap\.groupBy\b/, 'Object.groupBy'],
    [/\.(toSorted|toReversed|toSpliced)\(/, 'Array change-by-copy methods'],
    [/import\.meta\.(dirname|filename)\b/, 'import.meta.dirname'],
    [/\bfs\.globSync\b|\bfs\.promises\.glob\b/, 'fs.glob'],
    [/\bPromise\.withResolvers\b/, 'Promise.withResolvers'],
    [/\bURL\.canParse\b/, 'URL.canParse'],
  ];
  const self = path.join('test', 'standard.test.mjs');
  const files = [
    ...walk('bin', (f) => /\.m?js$/.test(f)),
    ...walk('test', (f) => /\.m?js$/.test(f)),
  ].filter((f) => f !== self);
  const hits = [];
  for (const f of files)
    for (const [re, name] of newer) if (re.test(read(f))) hits.push(`${f}: ${name}`);
  assert.deepEqual(hits, []);
});

test('every document a pack directive routes to is shipped in the package', () => {
  const pkg = JSON.parse(read('package.json'));
  const src = read('bin/ds7.js');
  const routed = [...src.matchAll(/doc\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(routed.length > 5);
  for (const rel of routed) {
    assert.ok(fs.existsSync(path.join(root, rel)), `missing: ${rel}`);
    assert.ok(
      pkg.files.some((f) => rel === f || rel.startsWith(f)),
      `not in package.json files: ${rel}`,
    );
  }
});
