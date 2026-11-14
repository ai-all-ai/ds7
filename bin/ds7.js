#!/usr/bin/env node
'use strict';

// DS7 CLI. Installs the DS7 standard into ds7/ and enables it as the `ds7`
// pack of AI-ALL (@ai.all/aiall). The agent entrypoints and the root ALL.md
// belong to AI-ALL; this CLI never writes them.
//
// Usage: npx @ai.all/ds7 [init|sync|update|--version|--help]
//
// Ownership:
//   ds7/**                 the standard, vendored; overwritten by `update`
//   ds7/aiall-pack.json    pack manifest, generated from this version; overwritten by `update`
//   ds7/VERSION            installed version; written by `init` and `update`
//   ALL.md (project root)  AI-ALL routing file; its packs block is managed by AI-ALL,
//                          the text outside that block is the project's own

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};
const ok = (s) => console.log(`  ${C.green}✓${C.reset} ${s}`);
const skip = (s) => console.log(`  ${C.dim}· ${s} (exists, kept)${C.reset}`);
const info = (s) => console.log(`  ${C.yellow}→${C.reset} ${s}`);
const err = (s) => console.log(`  ${C.red}✗${C.reset} ${s}`);

const PKG = path.resolve(__dirname, '..');
const TARGET = process.cwd();
const DS7 = path.join(TARGET, 'ds7');
const PACK_REF = 'ds7/aiall-pack.json';

const { version } = require(path.join(PKG, 'package.json'));

// Folders that make up the standard (copied into ds7/).
const DS7_DIRS = [
  '01-architecture',
  '02-design-system',
  '03-performance-web-vitals',
  '04-seo-ai-optimization',
  '05-internationalization',
  '06-business-conversion',
  '07-testing',
  '08-token-optimization',
  '09-security-errors',
  '10-operations',
  'templates',
];
// Root-level documents of the standard (copied into ds7/).
const DS7_FILES = ['README.md', 'SPEC.md', 'ALL.md', 'CHANGELOG.md'];

// Collect every file under a folder of the package, as paths relative to PKG.
function listFiles(relDir) {
  const out = [];
  const walk = (abs, rel) => {
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const a = path.join(abs, e.name);
      const r = path.join(rel, e.name);
      if (e.isDirectory()) walk(a, r);
      else out.push(r);
    }
  };
  walk(path.join(PKG, relDir), relDir);
  return out;
}

// Copy one file. `overwrite` decides whether an existing file is replaced.
function copyOne(relFromPkg, destAbs, overwrite) {
  const label = path.relative(TARGET, destAbs);
  if (fs.existsSync(destAbs) && !overwrite) {
    skip(label);
    return false;
  }
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.copyFileSync(path.join(PKG, relFromPkg), destAbs);
  ok(label);
  return true;
}

// Every file of the standard, as [relative path in package, destination].
function standardFiles() {
  const pairs = [];
  for (const dir of DS7_DIRS) {
    if (!fs.existsSync(path.join(PKG, dir))) continue;
    for (const rel of listFiles(dir)) pairs.push([rel, path.join(DS7, rel)]);
  }
  for (const f of DS7_FILES) pairs.push([f, path.join(DS7, f)]);
  return pairs;
}

// The pack manifest that AI-ALL reads. Paths are project-relative, because the
// standard is vendored into ds7/ and AI-ALL links to them from the project's ALL.md.
function packManifest() {
  const doc = (p) => `ds7/${p}`;
  return {
    name: '@ai.all/ds7',
    version,
    title: 'DS7 web architecture standard',
    directives: [
      {
        id: 'ds7.rules',
        title: 'DS7 agent rules',
        summary:
          'Read before any change in a DS7 web project: ground rules, build order, components and the pre-finish checklist.',
        doc: doc('ALL.md'),
      },
      {
        id: 'ds7.spec',
        title: 'DS7 stack and quality gates',
        summary:
          'Read for the stack, directory layout, naming, performance targets and quality gates.',
        doc: doc('SPEC.md'),
      },
      {
        id: 'ds7.architecture',
        title: 'Atomic architecture',
        summary: 'Read before creating or changing components, variants or modifiers.',
        doc: doc('01-architecture/COMPONENT-ANATOMY.md'),
      },
      {
        id: 'ds7.brand',
        title: 'Brand tokens and brandbook',
        summary: 'Read before changing colours, type, spacing or the brandbook page.',
        doc: doc('02-design-system/TOKENS-SPEC.md'),
      },
      {
        id: 'ds7.i18n',
        title: 'Internationalisation',
        summary: 'Read before adding a locale, a route or a translated string.',
        doc: doc('05-internationalization/I18N-ARCHITECTURE.md'),
      },
      {
        id: 'ds7.testing',
        title: 'Testing strategy',
        summary: 'Read before adding or changing tests or quality checks.',
        doc: doc('07-testing/TESTING-STRATEGY.md'),
      },
      {
        id: 'ds7.security',
        title: 'Security and error pages',
        summary:
          'Read before changing headers, secrets, dependencies, input validation or the 404 and 500 pages.',
        doc: doc('09-security-errors/SECURITY-AND-ERRORS.md'),
      },
      {
        id: 'ds7.operations',
        title: 'Operations',
        summary:
          'Read before a deploy, a rollback, a feature flag, a content or dependency change, or a change to real-user metrics.',
        doc: doc('10-operations/OPERATIONS.md'),
      },
    ],
  };
}

function writePackManifest(overwrite) {
  const dest = path.join(DS7, 'aiall-pack.json');
  if (fs.existsSync(dest) && !overwrite) {
    skip(path.relative(TARGET, dest));
    return;
  }
  fs.mkdirSync(DS7, { recursive: true });
  fs.writeFileSync(dest, `${JSON.stringify(packManifest(), null, 2)}\n`);
  ok(path.relative(TARGET, dest));
}

function writeVersion() {
  fs.mkdirSync(DS7, { recursive: true });
  fs.writeFileSync(path.join(DS7, 'VERSION'), `${version}\n`);
}

// Run an AI-ALL command with the @ai.all/aiall version this package depends on.
// The dependency is pinned, so the tested version is the one that runs.
function runAiall(args) {
  let bin;
  try {
    bin = require.resolve('@ai.all/aiall/bin/cli.js');
  } catch {
    err('@ai.all/aiall is not installed. Reinstall with: npm i -D @ai.all/ds7');
    return false;
  }
  const r = spawnSync(process.execPath, [bin, ...args, '--path', TARGET], { stdio: 'inherit' });
  return r.status === 0;
}

// True when .ai/aiall.json already lists the DS7 pack.
function packEnabled() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(TARGET, '.ai', 'aiall.json'), 'utf8'));
    return Array.isArray(cfg.packs) && cfg.packs.includes(PACK_REF);
  } catch {
    return false;
  }
}

function enablePack() {
  if (packEnabled()) {
    skip(`pack ${PACK_REF}`);
    return true;
  }
  if (!runAiall(['packs', 'add', PACK_REF])) return false;
  ok(`pack ${PACK_REF} enabled`);
  return true;
}

// Warn about files left by DS7 1.x. Nothing is deleted or rewritten automatically.
function legacyWarnings() {
  const rootAll = path.join(TARGET, 'ALL.md');
  if (
    fs.existsSync(rootAll) &&
    fs.readFileSync(rootAll, 'utf8').includes('Agent Rules for DS7 Projects')
  ) {
    info('Root ALL.md still holds the DS7 1.x rules. Those rules now live in ds7/ALL.md.');
    info('Remove the copied rules from root ALL.md and keep the aiall packs block.');
  }
  if (fs.existsSync(path.join(TARGET, 'ALL.project.md'))) {
    info('ALL.project.md is from DS7 1.x and is no longer used. Move its project values into');
    info('root ALL.md (below the aiall packs block), then delete the file.');
  }
}

function cmdInit() {
  console.log(`\n${C.bold}${C.cyan}DS7 v${version} — setup${C.reset}\n`);

  for (const [rel, dest] of standardFiles()) copyOne(rel, dest, false);
  writePackManifest(false);
  writeVersion();

  console.log(`\n${C.yellow}Configuring AI-ALL…${C.reset}\n`);
  if (!runAiall(['init'])) {
    err('AI-ALL init failed. Run: npx @ai.all/aiall init');
    process.exitCode = 1;
    return;
  }
  if (!enablePack()) {
    err(`Could not enable the pack. Run: npx @ai.all/aiall packs add ${PACK_REF}`);
    process.exitCode = 1;
    return;
  }
  legacyWarnings();

  console.log(`\n${C.bold}${C.green}DS7 is installed.${C.reset}`);
  console.log(`  1. Read ${C.cyan}ds7/README.md${C.reset} for the standard and the build order.`);
  console.log(
    `  2. Add this project's values to the root ${C.cyan}ALL.md${C.reset}, below the aiall packs block.`,
  );
  console.log(
    `  3. Run ${C.cyan}npx @ai.all/ds7 update${C.reset} to get new versions of the standard.\n`,
  );
}

function cmdSync() {
  console.log(`\n${C.yellow}Syncing agent entrypoints…${C.reset}\n`);
  if (runAiall(['sync'])) ok('Agent entrypoints are in sync.');
  else {
    err('Sync failed. Run: npx @ai.all/aiall sync');
    process.exitCode = 1;
  }
}

function cmdUpdate() {
  console.log(`\n${C.yellow}Updating the standard to v${version}…${C.reset}\n`);
  if (!fs.existsSync(DS7)) {
    err('ds7/ not found. Run `npx @ai.all/ds7` (init) first.');
    process.exitCode = 1;
    return;
  }
  for (const [rel, dest] of standardFiles()) copyOne(rel, dest, true);
  writePackManifest(true);
  writeVersion();

  if (!runAiall(['sync'])) {
    err('Sync failed. Run: npx @ai.all/aiall sync');
    process.exitCode = 1;
    return;
  }
  if (!enablePack()) {
    process.exitCode = 1;
    return;
  }
  legacyWarnings();

  console.log(
    `\n${C.green}Standard updated to v${version}. See ds7/CHANGELOG.md for what changed.${C.reset}`,
  );
  info('The root ALL.md outside the aiall packs block was not changed.\n');
}

function cmdHelp() {
  console.log(`
DS7 ${version}

  npx @ai.all/ds7           install the standard and enable the ds7 pack (init)
  npx @ai.all/ds7 sync      sync agent entrypoints (AI-ALL sync)
  npx @ai.all/ds7 update    update ds7/ to this version and refresh the pack
  npx @ai.all/ds7 --version print the version
`);
}

const cmd = process.argv[2];
if (cmd === '--version' || cmd === '-v') console.log(version);
else if (cmd === '--help' || cmd === '-h' || cmd === 'help') cmdHelp();
else if (cmd === 'sync') cmdSync();
else if (cmd === 'update') cmdUpdate();
else if (!cmd || cmd === 'init') cmdInit();
else {
  err(`Unknown command: ${cmd}`);
  cmdHelp();
  process.exitCode = 1;
}
