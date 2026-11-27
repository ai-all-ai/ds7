#!/usr/bin/env node
// `ds7 doctor`: where the project stands with DS7 and what to do next. Reads only; changes nothing. `--json` prints the same as one object.
//  version (tool and vendored standard), root ALL.md, settings file, required documents, package scripts, site graph, baseline, build.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, listFiles, isIgnored } from '../lib/project.mjs';
import { loadConfig } from '../lib/config.mjs';
import { BASELINE_FILE } from '../lib/report.mjs';
import { OPTIONAL, installed } from '../lib/optional.mjs';

const NEEDS = {
  postcss: 'ds7 css, contrast in audit a11y',
  sharp: 'ds7 images',
  playwright: 'ds7 console, ds7 lab',
};

const here = path.dirname(fileURLToPath(import.meta.url));
const tool = JSON.parse(
  fs.readFileSync(path.join(here, '..', '..', 'package.json'), 'utf8'),
).version;
const has = (rel) => fs.existsSync(path.join(ROOT, rel));
const rows = [];
// state: ok (nothing to do), todo (do this), info
const row = (name, state, text, action) =>
  rows.push({ name, state, text, ...(action ? { action } : {}) });

// the standard
if (!has('ds7/VERSION')) row('standard', 'todo', 'ds7/ is not installed', 'npx @ai.all/ds7');
else {
  const v = fs.readFileSync(path.join(ROOT, 'ds7/VERSION'), 'utf8').trim();
  if (v === tool) row('standard', 'ok', `ds7/ is ${v}, the same as this tool`);
  else row('standard', 'todo', `ds7/ is ${v}, this tool is ${tool}`, 'npx ds7 update');
}
// the vendored standard must be part of the repository: a clone of the ds7 source, or a .gitignore rule that hides ds7/,
// leaves agents and CI without it
if (has('ds7/.git'))
  row(
    'standard',
    'todo',
    'ds7/ is a git clone of the DS7 source, not the vendored standard',
    'move ds7/.git away, then npx ds7 update',
  );
else if (has('ds7/VERSION') && isIgnored('ds7/VERSION'))
  row(
    'standard',
    'todo',
    '.gitignore hides ds7/, so the standard is never committed',
    'add the line !/ds7/ to .gitignore',
  );
if (!has('ALL.md'))
  row('root', 'todo', 'ALL.md (the entry point for agents) is missing', 'npx @ai.all/ds7');
else row('root', 'ok', 'ALL.md found');

// settings
let cfg;
try {
  cfg = loadConfig();
  if (!cfg.exists)
    row(
      'settings',
      'todo',
      'no ds7.config.json: Gate 5 (layout) is off and the commands use defaults',
      'npx @ai.all/ds7 (creates it when missing)',
    );
  else row('settings', 'ok', 'ds7.config.json found; Gate 5 (layout) is on');
} catch (e) {
  row('settings', 'todo', `ds7.config.json is not valid JSON: ${e.message}`, 'fix ds7.config.json');
}

// what the settings switch off, and keys no command reads (a typo is silently ignored otherwise)
if (cfg?.exists) {
  const user = JSON.parse(fs.readFileSync(path.join(ROOT, 'ds7.config.json'), 'utf8'));
  const KNOWN = [
    '$schema',
    'icons',
    'layout',
    'seo',
    'a11y',
    'perf',
    'css',
    'unused',
    'console',
    'images',
    'graph',
    'docs',
    'guard',
    'i18n',
    'check',
    'update',
    'dev',
  ];
  const unknown = Object.keys(user).filter((k) => !KNOWN.includes(k));
  if (unknown.length)
    row(
      'settings',
      'todo',
      `ds7.config.json has keys no command reads: ${unknown.join(', ')}`,
      'see ds7/CONFIG.md',
    );
  const off = [
    ...Object.entries(user.check?.gates ?? {})
      .filter(([, v]) => v === false)
      .map(([k]) => `gate ${k}`),
    ...['css', 'unused', 'images'].filter((k) => user[k] === false).map((k) => `ds7 ${k}`),
    user.i18n?.check === false && 'i18n gate',
    user.graph?.check === false && 'graph check',
    user.guard?.uiDir === false && 'atom layer rule',
    user.guard?.pageStyleLines === false && 'page style limit',
    ['allow', false].includes(user.guard?.stateClasses) && 'is-* advice',
    [false, 'off'].includes(user.seo?.lastmod) && 'sitemap lastmod note',
    [false, 'off'].includes(user.a11y?.skipLink) && 'skip link check',
    user.a11y?.exceptionPolicy === 'off' && 'a11y exception policy',
  ].filter(Boolean);
  if (off.length) row('switches', 'info', `off in ds7.config.json: ${off.join(', ')}`);
}

if (cfg) {
  const missing = cfg.layout.required.filter((f) => !has(f));
  if (missing.length)
    row(
      'documents',
      'todo',
      `missing: ${missing.join(', ')}`,
      'npx @ai.all/ds7 (creates what is missing)',
    );
  else row('documents', 'ok', `${cfg.layout.required.length} required documents found`);
}

// package scripts
if (has('package.json')) {
  const scripts =
    JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts || {};
  const want = ['check', 'graph', 'graph:check', 'layout', 'docs:check', 'audit'];
  const missing = want.filter((s) => !scripts[s]);
  if (missing.length)
    row(
      'scripts',
      'todo',
      `package.json lacks: ${missing.join(', ')}`,
      'npx @ai.all/ds7 (adds them)',
    );
  else row('scripts', 'ok', 'DS7 scripts are in package.json');
}

// site graph: the built-in check, or the project's own generator when it has one (graph.check in ds7.config.json)
const scripts = has('package.json')
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts || {}
  : {};
const ownGraph = scripts['graph:check'] && !/\bds7\b/.test(scripts['graph:check']);
const graphCheck = cfg?.graph.check ?? 'auto';
const graphMode = graphCheck === 'auto' ? (ownGraph ? 'script' : 'ds7') : graphCheck;
if (graphMode === 'off')
  row('graph', 'info', 'site graph check is off (graph.check in ds7.config.json)');
else if (graphMode === 'script') {
  const r = spawnSync('npm', ['run', '-s', 'graph:check'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.status === 0) row('graph', 'ok', 'the site graph is current (npm run graph:check)');
  else row('graph', 'todo', 'the site graph is out of date (npm run graph:check)', 'npm run graph');
} else if (!has('docs/SITE-GRAPH.md'))
  row('graph', 'todo', 'docs/SITE-GRAPH.md does not exist', 'npx ds7 graph');
else {
  const r = spawnSync(process.execPath, [path.join(here, 'graph.mjs'), '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.status === 0) row('graph', 'ok', 'docs/SITE-GRAPH.md is current');
  else row('graph', 'todo', 'docs/SITE-GRAPH.md is out of date', 'npx ds7 graph');
}

// optional packages: which commands can run here
const found = OPTIONAL.filter((n) => installed(n));
const missing = OPTIONAL.filter((n) => !found.includes(n));
row(
  'packages',
  'info',
  `${found.length ? `found ${found.join(', ')}` : 'no optional package'}${missing.length ? `; without ${missing.map((n) => `${n} (${NEEDS[n]})`).join(', ')}` : ''}`,
);

// skills, baseline, build
const skills = listFiles().filter((f) => /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(f)).length;
row('skills', 'info', `${skills} project skill(s) in .agents/skills`);
if (has(BASELINE_FILE)) {
  try {
    const b = JSON.parse(fs.readFileSync(path.join(ROOT, BASELINE_FILE), 'utf8'));
    const parts = Object.entries(b)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => `${k} ${v.length}`);
    row(
      'baseline',
      'info',
      `${BASELINE_FILE}: known findings: ${parts.join(', ') || 'none'}. Fix them and run the command with --update-baseline`,
    );
  } catch {
    row('baseline', 'todo', `${BASELINE_FILE} is not valid JSON`, `fix or delete ${BASELINE_FILE}`);
  }
}
if (has('.output/public')) row('build', 'info', '.output/public found: ds7 audit can run');
else row('build', 'info', 'no build in .output/public: build the site before ds7 audit');

const actions = rows.filter((r) => r.state === 'todo');
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ version: tool, rows, next: actions[0]?.action ?? null }, null, 2));
  process.exit(0);
}
console.log(`ds7 doctor (tool ${tool})\n`);
const mark = { ok: '✓', todo: '✗', info: '·' };
for (const r of rows)
  console.log(
    `  ${mark[r.state]} ${r.name.padEnd(10)} ${r.text}${r.action ? `\n    → ${r.action}` : ''}`,
  );
console.log(actions.length ? `\nNext: ${actions[0].action}` : '\nNothing to do.');
