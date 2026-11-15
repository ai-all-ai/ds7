#!/usr/bin/env node
'use strict';

// DS7 CLI. Installs the DS7 standard into ds7/ and enables it as the `ds7`
// pack of AI-ALL (@ai.all/aiall). The agent entrypoints and the root ALL.md
// belong to AI-ALL; this CLI never writes them.
//
// Usage: npx @ai.all/ds7 [init|sync|update|guard|images|--version|--help]
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

// The pack manifest that AI-ALL reads.
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
        id: 'ds7.onboarding',
        title: 'Project onboarding & brand intake',
        summary: 'Read when starting a project: brand intake specification and fast 4-step onboarding.',
        doc: doc('01-architecture/PROJECT-ONBOARDING.md'),
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
        id: 'ds7.medialib',
        title: 'Developer media library',
        summary: 'Read before adding, processing or converting media assets.',
        doc: doc('03-performance-web-vitals/MEDIA-LIBRARY-DS5.md'),
      },
      {
        id: 'ds7.i18n',
        title: 'Internationalisation',
        summary: 'Read before adding a locale, a route or a translated string.',
        doc: doc('05-internationalization/I18N-ARCHITECTURE.md'),
      },
      {
        id: 'ds7.validators',
        title: 'Validators & quality gates',
        summary: 'Read before running quality checks: class-name guard, images pipeline, runtime checks.',
        doc: doc('07-testing/VALIDATORS-AND-GUARDS.md'),
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

function runAiall(args) {
  let bin;
  try {
    bin = require.resolve('@ai.all/aiall/bin/cli.js');
  } catch {
    const targetBin = path.join(TARGET, 'node_modules', '@ai.all', 'aiall', 'bin', 'cli.js');
    const siblingBin = path.resolve(PKG, '..', 'aiall', 'bin', 'cli.js');
    if (fs.existsSync(targetBin)) {
      bin = targetBin;
    } else if (fs.existsSync(siblingBin)) {
      bin = siblingBin;
    }
  }
  if (bin) {
    const r = spawnSync(process.execPath, [bin, ...args, '--path', TARGET], { stdio: 'inherit' });
    return r.status === 0;
  }
  const r = spawnSync('npx', ['--yes', '@ai.all/aiall@^1.0.0', ...args, '--path', TARGET], { stdio: 'inherit' });
  return r.status === 0;
}

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

// Ensure .gitignore ignores local developer media intake
function ensureGitignore() {
  const giPath = path.join(TARGET, '.gitignore');
  const entries = ['ds5/', '.ds5/', '*.tmp-pv'];
  let content = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf8') : '';
  const missing = entries.filter((e) => !content.includes(e));
  if (missing.length) {
    const banner = '\n# DS7 developer media intake & temp reports (local only)\n';
    content = content.trimEnd() + banner + missing.join('\n') + '\n';
    fs.writeFileSync(giPath, content);
    ok('.gitignore updated with local DS5 media entries');
  }
}

// Ensure docs/BRAND.md exists from templates
function ensureBrandSpec() {
  const brandPath = path.join(TARGET, 'docs', 'BRAND.md');
  if (!fs.existsSync(brandPath)) {
    const src = path.join(PKG, 'templates', 'BRAND.md');
    fs.mkdirSync(path.dirname(brandPath), { recursive: true });
    fs.copyFileSync(src, brandPath);
    ok('docs/BRAND.md created (fill this file with brand tokens and fonts)');
  } else {
    skip('docs/BRAND.md');
  }
}

// Ensure Makefile exists from templates
function ensureMakefile() {
  const mkPath = path.join(TARGET, 'Makefile');
  if (!fs.existsSync(mkPath)) {
    const src = path.join(PKG, 'templates', 'Makefile');
    fs.copyFileSync(src, mkPath);
    ok('Makefile created (provides: make dev, make guard, make build)');
  } else {
    skip('Makefile');
  }
}

// Add helpful scripts to package.json if present
function ensurePackageScripts() {
  const pkgPath = path.join(TARGET, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.scripts = pkg.scripts || {};
    let changed = false;
    if (!pkg.scripts.guard) {
      pkg.scripts.guard = 'ds7 guard';
      changed = true;
    }
    if (!pkg.scripts['guard:strict']) {
      pkg.scripts['guard:strict'] = 'ds7 guard --strict';
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
      ok('package.json scripts added: "guard", "guard:strict"');
    }
  } catch {}
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

  ensureGitignore();
  ensureBrandSpec();
  ensureMakefile();
  ensurePackageScripts();

  console.log(`\n${C.bold}${C.green}DS7 is installed.${C.reset}`);
  console.log(`  1. Fill in ${C.cyan}docs/BRAND.md${C.reset} with colors, typography, and page requirements.`);
  console.log(`  2. Add project-specific guidelines to root ${C.cyan}ALL.md${C.reset}.`);
  console.log(`  3. Run ${C.cyan}npx @ai.all/ds7 guard${C.reset} to verify modifier class names and atomic layers.`);
  console.log(`  4. Run ${C.cyan}npx @ai.all/ds7 update${C.reset} to get new versions of the standard.\n`);
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
  ensureGitignore();
  ensureBrandSpec();
  ensureMakefile();
  ensurePackageScripts();

  console.log(
    `\n${C.green}Standard updated to v${version}. See ds7/CHANGELOG.md for what changed.${C.reset}`,
  );
  info('The root ALL.md outside the aiall packs block was not changed.\n');
}

// Built-in zero-dependency class name & atomic design guard validator
function cmdGuard() {
  const strict = process.argv.includes('--strict');
  const pathIdx = process.argv.indexOf('--path');
  const targetDir = pathIdx > -1 ? path.resolve(process.argv[pathIdx + 1]) : TARGET;

  const BAD = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-(?:active|big|small|large|orange|red|green|blue|dark|light|new|alt|v\d)$/;
  const ALLOW = new Set([
    'is-active',
    'btn-active',
    'page-enter-active',
    'page-leave-active',
    'swap-enter-active',
    'swap-leave-active',
  ]);

  const found = new Map();
  const searchDirs = ['app', 'src', 'components', 'pages'].map((d) => path.join(targetDir, d)).filter((d) => fs.existsSync(d));
  if (!searchDirs.length) searchDirs.push(targetDir);

  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.output' || e.name === '.nuxt' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(vue|html|jsx|tsx|svelte|astro|css|scss)$/.test(e.name)) {
        const text = fs.readFileSync(p, 'utf8');
        for (const m of text.matchAll(/(?:class="([^"]*)"|\.([a-z][a-z0-9_-]*))/g)) {
          const classes = m[1] ? m[1].split(/\s+/) : [m[2]];
          for (const c of classes) {
            if (c && BAD.test(c) && !ALLOW.has(c) && !/-(?:enter|leave)-active$/.test(c)) {
              const set = found.get(c) || new Set();
              set.add(path.relative(TARGET, p));
              found.set(c, set);
            }
          }
        }
      }
    }
  };

  for (const d of searchDirs) walk(d);

  // Atomic-design layer checks (components/ui must not use upper-layer components)
  const layerIssues = [];
  const UP = /(?<=[\s>])<(Home|Sections|Site|Shop|Calc|Direction|Hook|Info|Maint|Blog|Legal|Layout)[A-Z]\w*/g;
  const findVues = (d) => {
    if (!fs.existsSync(d)) return [];
    return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(d, e.name);
      return e.isDirectory() ? findVues(p) : e.name.endsWith('.vue') ? [p] : [];
    });
  };

  const uiDir = path.join(targetDir, 'app', 'components', 'ui');
  for (const f of findVues(uiDir)) {
    const text = fs.readFileSync(f, 'utf8');
    const matches = text.match(UP);
    if (matches) {
      layerIssues.push(`ui → upper layer: ${path.relative(TARGET, f)} uses ${[...new Set(matches)].join(', ')}`);
    }
  }

  // Page style lines check (pages should not accumulate > 40 lines of scoped CSS)
  const pagesDir = path.join(targetDir, 'app', 'pages');
  for (const f of findVues(pagesDir)) {
    if (/ui\.vue$|ds\.vue$/.test(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const lines = styleMatch ? styleMatch[1].split('\n').length : 0;
    if (lines > 40) {
      layerIssues.push(`page with ${lines} style lines (move to a component/molecule): ${path.relative(TARGET, f)}`);
    }
  }

  console.log(`\n${C.bold}DS7 Guard: Validating modifier classes and atomic layers…${C.reset}\n`);

  for (const issue of layerIssues) err(issue);

  for (const [cls, files] of [...found].sort()) {
    err(`${cls} (baked-in modifier) in: ${[...files].slice(0, 3).join(', ')}`);
  }

  const total = found.size + layerIssues.length;
  if (total === 0) {
    ok(`All checks passed. No modifier anti-patterns or layer violations found.\n`);
  } else {
    console.log(`\n${C.yellow}Found ${found.size} baked-in modifier class(es), ${layerIssues.length} layer/style issue(s).${C.reset}`);
    console.log(`Fix: use separate hyphen modifiers (.card.-top) and move page styles to components.\n`);
    if (strict) process.exit(1);
  }
}

// Built-in responsive images processor
async function cmdImages() {
  const checkOnly = process.argv.includes('--check');
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    try {
      sharp = require(path.join(TARGET, 'node_modules', 'sharp'));
    } catch {
      err('sharp is required for image processing. Install with: npm i -D sharp');
      process.exit(checkOnly ? 0 : 1);
    }
  }

  const imgRoot = path.join(TARGET, 'public', 'images');
  if (!fs.existsSync(imgRoot)) {
    info('public/images/ not found. Nothing to process.');
    return;
  }

  const WIDTHS = [400, 800, 1200];
  const MIN_WIDTH = 900;
  const QUALITY = 72;
  const VARIANT = /-(\d{3,4})\.webp$/;

  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

  const sources = walk(imgRoot).filter((f) => /\.(webp|jpe?g|png)$/i.test(f) && !VARIANT.test(f));
  const manifest = {};
  const stale = [];
  let built = 0;

  for (const file of sources) {
    const meta = await sharp(file).metadata();
    if (!meta.width || meta.width < MIN_WIDTH) continue;
    const url = '/' + path.relative(path.join(TARGET, 'public'), file).split(path.sep).join('/');
    const dir = path.dirname(file);
    const stem = path.basename(file).replace(/\.\w+$/, '');
    const made = [];

    for (const w of WIDTHS) {
      if (w >= meta.width) continue;
      const out = path.join(dir, `${stem}-${w}.webp`);
      made.push(w);
      const fresh = fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs;
      if (fresh) continue;
      if (checkOnly) {
        stale.push(out);
        continue;
      }
      await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
      built++;
    }
    if (made.length) manifest[url] = made;
  }

  const manifestPath = path.join(TARGET, 'app', 'data', 'image-variants.json');
  if (!checkOnly && Object.keys(manifest).length) {
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }

  if (checkOnly) {
    if (stale.length) {
      err(`${stale.length} responsive image variant(s) missing or stale.`);
      process.exit(1);
    } else {
      ok('All responsive image variants are up to date.');
    }
  } else {
    ok(`Processed ${built} image variant(s). Manifest updated.`);
  }
}

function cmdHelp() {
  console.log(`
DS7 ${version}

  npx @ai.all/ds7           install the standard and enable the ds7 pack (init)
  npx @ai.all/ds7 sync      sync agent entrypoints (AI-ALL sync)
  npx @ai.all/ds7 update    update ds7/ to this version and refresh the pack
  npx @ai.all/ds7 guard     check modifier class names and atomic layer rules (--strict)
  npx @ai.all/ds7 images    generate responsive WebP image variants (--check)
  npx @ai.all/ds7 --version print the version
`);
}

const cmd = process.argv[2];
if (cmd === '--version' || cmd === '-v') console.log(version);
else if (cmd === '--help' || cmd === '-h' || cmd === 'help') cmdHelp();
else if (cmd === 'sync') cmdSync();
else if (cmd === 'update') cmdUpdate();
else if (cmd === 'guard') cmdGuard();
else if (cmd === 'images') cmdImages();
else if (!cmd || cmd === 'init') cmdInit();
else {
  err(`Unknown command: ${cmd}`);
  cmdHelp();
  process.exitCode = 1;
}
