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
const readline = require('readline');
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
        summary:
          'Read when starting a project: brand intake specification and fast 4-step onboarding.',
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
        id: 'ds7.delivery',
        title: 'Delivery and caching',
        summary:
          'Read before changing the web server, cache or compression settings, the Dockerfile, prerender options or a page-level opt-in (no JavaScript, speculation rules).',
        doc: doc('03-performance-web-vitals/DELIVERY-AND-CACHING.md'),
      },
      {
        id: 'ds7.i18n',
        title: 'Internationalisation',
        summary: 'Read before adding a locale, a route or a translated string.',
        doc: doc('05-internationalization/I18N-ARCHITECTURE.md'),
      },
      {
        id: 'ds7.seo',
        title: 'SEO, accessibility and speed',
        summary:
          'Read before adding or changing a public page, its metadata, structured data or sitemap, and for any SEO, WCAG or PageSpeed task.',
        doc: doc('04-seo-ai-optimization/SEO-CHECKLIST.md'),
      },
      {
        id: 'ds7.validators',
        title: 'Validators & quality gates',
        summary:
          'Read before running quality checks: class-name guard, images pipeline, runtime checks.',
        doc: doc('07-testing/VALIDATORS-AND-GUARDS.md'),
      },
      {
        id: 'ds7.tokens',
        title: 'Token economy and orientation',
        summary:
          'Read at the start of a task: reading order, the generated site graph, where files live, language rules for agents.',
        doc: doc('08-token-optimization/TOKEN-STRATEGY.md'),
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
  const r = spawnSync('npx', ['--yes', '@ai.all/aiall@^1.0.0', ...args, '--path', TARGET], {
    stdio: 'inherit',
  });
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

// Prompt interactive brand questionnaire when run in a TTY
async function promptQuestionnaire() {
  if (!process.stdin.isTTY || process.argv.includes('--yes') || process.argv.includes('-y')) {
    return null;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q, def) =>
    new Promise((resolve) => {
      rl.question(`  ${C.cyan}?${C.reset} ${q} ${C.dim}(${def})${C.reset}: `, (ans) => {
        resolve(ans.trim() || def);
      });
    });

  let defaultName = path.basename(TARGET);
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(TARGET, 'package.json'), 'utf8'));
    if (pkg.name) defaultName = pkg.name;
  } catch {}

  console.log(
    `\n${C.bold}DS7 Brand Intake Questionnaire${C.reset} ${C.dim}(press Enter to use defaults)${C.reset}:\n`,
  );
  const name = await ask('Brand or project name', defaultName);
  const color = await ask('Primary brand color hex', '#e5a93c');
  const port = await ask('Local dev server port', '3000');
  const locales = await ask('Target languages (comma-separated)', 'es, en');
  rl.close();
  return { name, color, port, locales };
}

// Ensure docs/BRAND.md exists from templates, populated with questionnaire answers if available
function ensureBrandSpec(answers) {
  const brandPath = path.join(TARGET, 'docs', 'BRAND.md');
  if (!fs.existsSync(brandPath)) {
    const src = path.join(PKG, 'templates', 'BRAND.md');
    fs.mkdirSync(path.dirname(brandPath), { recursive: true });
    let content = fs.readFileSync(src, 'utf8');
    if (answers) {
      if (answers.name) {
        content = content.replace(
          /- \*\*Project \/ Brand Name:\*\* .*/,
          `- **Project / Brand Name:** ${answers.name}`,
        );
      }
      if (answers.port) {
        content = content.replace(
          /- \*\*Dev Server Port:\*\* .*/,
          `- **Dev Server Port:** \`${answers.port}\``,
        );
        content = content.replace(
          /- \*\*Local Dev URL:\*\* .*/,
          `- **Local Dev URL:** \`http://localhost:${answers.port}\``,
        );
      }
      if (answers.color) {
        content = content.replace(
          /\| `--color-brand` \| `#[a-fA-F0-9]+` \|/,
          `| \`--color-brand\` | \`${answers.color}\` |`,
        );
      }
      if (answers.locales) {
        content = content.replace(/- \*\*Languages:\*\* .*/, `- **Languages:** ${answers.locales}`);
      }
    }
    fs.writeFileSync(brandPath, content);
    ok('docs/BRAND.md created (brand specification & intake)');
  } else {
    skip('docs/BRAND.md');
  }
}

// Project files that DS7 itself requires (SPEC section 2) and the starter skills. Existing files are kept.
function ensureProjectFiles() {
  const skills = listFiles('templates/skills').map((rel) => [
    rel,
    path.join('.agents', 'skills', path.relative(path.join('templates', 'skills'), rel)),
  ]);
  const pairs = [
    ['templates/ARCHITECTURE.md', 'docs/ARCHITECTURE.md'],
    ['templates/DECISIONS.md', 'docs/DECISIONS.md'],
    ['templates/METRICS.md', 'docs/METRICS.md'],
    ['templates/ds7.config.json', 'ds7.config.json'],
    ['templates/workflows/ds7.yml', '.github/workflows/ds7.yml'],
    ...skills,
  ];
  const created = [];
  for (const [rel, dest] of pairs) {
    if (copyOne(rel, path.join(TARGET, dest), false) && /SKILL\.md$/.test(dest))
      created.push([rel, dest.split(path.sep).join('/')]);
  }
  registerSkills(created);
  // The generated code map, so the docs that point at it are true from the first day.
  if (!fs.existsSync(path.join(TARGET, 'docs', 'SITE-GRAPH.md'))) runScript('graph', []);
}

// New starter skills are registered in the root ALL.md: in the "Project skills" table that AI-ALL writes, or in a section of their own.
function registerSkills(created) {
  const file = path.join(TARGET, 'ALL.md');
  if (!created.length || !fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const rows = [];
  for (const [rel, dest] of created) {
    if (text.includes(dest)) continue;
    const d =
      (fs.readFileSync(path.join(PKG, rel), 'utf8').match(/^description:\s*(.+)$/m) || [])[1] || '';
    const i = d.search(/\bUse\b/);
    const purpose = (i > 0 ? d.slice(0, i) : d).trim() || 'Project skill';
    const trigger =
      i >= 0
        ? cap(
            d
              .slice(i)
              .replace(/^Use\s+/i, '')
              .replace(/\.$/, ''),
          )
        : 'See the skill';
    rows.push(`| ${trigger} | \`${dest}\` | ${purpose} |`);
  }
  if (!rows.length) return;
  const placeholder = /^\| \(Add a trigger\)[^\n]*\n/m;
  const section = /^## (?:\d+\. )?Project skills[\s\S]*?(?=\n## |\s*$)/m.exec(text);
  if (placeholder.test(text)) {
    text = text.replace(placeholder, `${rows.join('\n')}\n`);
  } else if (section && /^\|/m.test(section[0])) {
    const lines = section[0].split('\n');
    const last = lines.map((l) => l.startsWith('|')).lastIndexOf(true);
    lines.splice(last + 1, 0, ...rows);
    text = text.replace(section[0], lines.join('\n'));
  } else {
    text = `${text.trimEnd()}\n\n## Project skills\n\n| Trigger | Skill | Purpose |\n| --- | --- | --- |\n${rows.join('\n')}\n`;
  }
  fs.writeFileSync(file, text);
  ok(`ALL.md: ${rows.length} project skill(s) registered`);
}

// Ensure Makefile exists from templates
function ensureMakefile() {
  const mkPath = path.join(TARGET, 'Makefile');
  if (!fs.existsSync(mkPath)) {
    const src = path.join(PKG, 'templates', 'Makefile');
    fs.copyFileSync(src, mkPath);
    ok('Makefile created (provides: make dev, make guard, make check, make build)');
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
    if (!pkg.scripts.check) {
      pkg.scripts.check = 'ds7 check';
      changed = true;
    }
    if (!pkg.scripts['check:strict']) {
      pkg.scripts['check:strict'] = 'ds7 check --strict';
      changed = true;
    }
    for (const [name, cmd] of [
      ['graph', 'ds7 graph'],
      ['graph:check', 'ds7 graph --check'],
      ['layout', 'ds7 layout'],
      ['docs:check', 'ds7 docs'],
      ['audit', 'ds7 audit'],
    ]) {
      if (!pkg.scripts[name]) {
        pkg.scripts[name] = cmd;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
      ok(
        'package.json scripts added: "guard", "guard:strict", "check", "check:strict", "graph", "graph:check", "layout", "docs:check", "audit"',
      );
    }
  } catch {}
}

async function cmdInit() {
  console.log(`\n${C.bold}${C.cyan}DS7 v${version} — setup${C.reset}\n`);

  const answers = await promptQuestionnaire();

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
  ensureBrandSpec(answers);
  ensureProjectFiles();
  ensureMakefile();
  ensurePackageScripts();

  console.log(`\n${C.bold}${C.green}DS7 is installed.${C.reset}`);
  console.log(
    `  1. Review ${C.cyan}docs/BRAND.md${C.reset} with colors, typography, and page requirements.`,
  );
  console.log(`  2. Add project-specific guidelines to root ${C.cyan}ALL.md${C.reset}.`);
  console.log(
    `  3. Run ${C.cyan}npx @ai.all/ds7 check${C.reset} to verify quality gates (guard, tokens, i18n, hygiene, layout).`,
  );
  console.log(
    `     Skills for agents are in ${C.cyan}.agents/skills/${C.reset}: register them in ALL.md section 3. Settings of the commands: ${C.cyan}ds7.config.json${C.reset}.`,
  );
  console.log(
    `  4. Run ${C.cyan}npx @ai.all/ds7 update${C.reset} to get new versions of the standard.\n`,
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
  ensureGitignore();
  ensureBrandSpec();
  ensureMakefile();
  ensurePackageScripts();

  console.log(
    `\n${C.green}Standard updated to v${version}. See ds7/CHANGELOG.md for what changed.${C.reset}`,
  );
  info('The root ALL.md outside the aiall packs block was not changed.\n');
}

// Core modifier and atomic layer validator
function runGuardChecks(targetDir) {
  const BAD =
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-(?:active|big|small|large|orange|red|green|blue|dark|light|new|alt|v\d)$/;
  const ALLOW = new Set([
    'is-active',
    'btn-active',
    'page-enter-active',
    'page-leave-active',
    'swap-enter-active',
    'swap-leave-active',
  ]);

  const found = new Map();
  const searchDirs = ['app', 'src', 'components', 'pages']
    .map((d) => path.join(targetDir, d))
    .filter((d) => fs.existsSync(d));
  if (!searchDirs.length) searchDirs.push(targetDir);

  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (
        e.name === 'node_modules' ||
        e.name === 'dist' ||
        e.name === '.output' ||
        e.name === '.nuxt' ||
        e.name.startsWith('.')
      )
        continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(vue|html|jsx|tsx|svelte|astro|css|scss)$/.test(e.name)) {
        const text = fs.readFileSync(p, 'utf8');
        for (const m of text.matchAll(/(?:class="([^"]*)"|\.([a-z][a-z0-9_-]*))/g)) {
          const classes = m[1] ? m[1].split(/\s+/) : [m[2]];
          for (const c of classes) {
            if (
              c &&
              BAD.test(c) &&
              !/^is-/.test(c) &&
              !ALLOW.has(c) &&
              !/-(?:enter|leave)-active$/.test(c)
            ) {
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
  const UP =
    /(?<=[\s>])<(Home|Sections|Site|Shop|Calc|Direction|Hook|Info|Maint|Blog|Legal|Layout)[A-Z]\w*/g;
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
      layerIssues.push(
        `ui → upper layer: ${path.relative(TARGET, f)} uses ${[...new Set(matches)].join(', ')}`,
      );
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
      layerIssues.push(
        `page with ${lines} style lines (move to a component/molecule): ${path.relative(TARGET, f)}`,
      );
    }
  }

  return { found, layerIssues };
}

// Built-in zero-dependency class name & atomic design guard validator
function cmdGuard() {
  const strict = process.argv.includes('--strict');
  const pathIdx = process.argv.indexOf('--path');
  const targetDir = pathIdx > -1 ? path.resolve(process.argv[pathIdx + 1]) : TARGET;

  const { found, layerIssues } = runGuardChecks(targetDir);

  console.log(`\n${C.bold}DS7 Guard: Validating modifier classes and atomic layers…${C.reset}\n`);

  for (const issue of layerIssues) err(issue);

  for (const [cls, files] of [...found].sort()) {
    err(`${cls} (baked-in modifier) in: ${[...files].slice(0, 3).join(', ')}`);
  }

  const total = found.size + layerIssues.length;
  if (total === 0) {
    ok(`All checks passed. No modifier anti-patterns or layer violations found.\n`);
  } else {
    console.log(
      `\n${C.yellow}Found ${found.size} baked-in modifier class(es), ${layerIssues.length} layer/style issue(s).${C.reset}`,
    );
    console.log(
      `Fix: use separate hyphen modifiers (.card.-top) and move page styles to components.\n`,
    );
    if (strict) process.exit(1);
  }
}

// Validate token discipline: no raw hex or rgb/rgba colors in components/ui/
function validateRawColors(targetDir) {
  const issues = [];
  const uiDir = path.join(targetDir, 'app', 'components', 'ui');
  if (!fs.existsSync(uiDir)) return issues;

  const findFiles = (d) => {
    return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(d, e.name);
      return e.isDirectory() ? findFiles(p) : /\.(vue|css|scss)$/.test(e.name) ? [p] : [];
    });
  };

  const HEX_RGB =
    /(?:color|background(?:-color)?|border(?:-[a-z]+)?(?:-color)?|fill|stroke|outline(?:-color)?)\s*:\s*([^;}\n]+)/gi;
  const RAW_COLOR = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\([^)]+\)/;

  for (const f of findFiles(uiDir)) {
    const text = fs.readFileSync(f, 'utf8');
    let styleText = text;
    if (f.endsWith('.vue')) {
      const match = text.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      styleText = match ? match[1] : '';
    }
    if (!styleText) continue;

    for (const m of styleText.matchAll(HEX_RGB)) {
      const val = m[1].trim();
      if (val.includes('var(')) continue;
      const rawMatch = val.match(RAW_COLOR);
      if (rawMatch) {
        issues.push(
          `raw color ${rawMatch[0]} in ${path.relative(TARGET, f)} (use var(--color-*) token)`,
        );
      }
    }
  }

  return issues;
}

// Validate translation completeness across locales
function validateI18n(targetDir) {
  const issues = [];
  const candidates = [
    path.join(targetDir, 'i18n', 'locales'),
    path.join(targetDir, 'locales'),
    path.join(targetDir, 'app', 'locales'),
  ];
  const locDir = candidates.find((d) => fs.existsSync(d));
  if (!locDir) return { localeCount: 0, issues };

  const files = fs.readdirSync(locDir).filter((f) => /\.(json|ts|js)$/.test(f));
  if (files.length <= 1) return { localeCount: files.length, issues };

  const localeKeys = new Map();

  for (const f of files) {
    const loc = path.basename(f).replace(/\.[^.]+$/, '');
    const p = path.join(locDir, f);
    const content = fs.readFileSync(p, 'utf8');
    const keys = new Set();

    if (f.endsWith('.json')) {
      try {
        const obj = JSON.parse(content);
        const extract = (o, prefix = '') => {
          for (const [k, v] of Object.entries(o)) {
            const full = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) extract(v, full);
            else {
              keys.add(full);
              if (typeof v === 'string' && !v.trim()) {
                issues.push(`empty string in ${loc}: ${full}`);
              }
            }
          }
        };
        extract(obj);
      } catch (err) {
        issues.push(`invalid JSON in ${path.relative(TARGET, p)}: ${err.message}`);
      }
    } else {
      for (const m of content.matchAll(/['"]?([a-zA-Z0-9_.-]+)['"]?\s*:\s*(?:['"`]|\[|\{)/g)) {
        if (!['export', 'default', 'import', 'const', 'let', 'var'].includes(m[1])) {
          keys.add(m[1]);
        }
      }
    }
    localeKeys.set(loc, keys);
  }

  const locales = [...localeKeys.keys()];
  for (let i = 0; i < locales.length; i++) {
    for (let j = 0; j < locales.length; j++) {
      if (i === j) continue;
      const [l1, l2] = [locales[i], locales[j]];
      const k1 = localeKeys.get(l1);
      const k2 = localeKeys.get(l2);
      const missing = [];
      for (const k of k1) {
        if (!k2.has(k)) missing.push(k);
      }
      if (missing.length) {
        issues.push(
          `missing in ${l2} (present in ${l1}): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` (+${missing.length - 5} more)` : ''}`,
        );
      }
    }
  }

  return { localeCount: locales.length, issues: [...new Set(issues)] };
}

// Validate repo hygiene: brand specification present, zero temp artifacts
function validateRepoHygiene(targetDir) {
  const issues = [];

  const brandPath = path.join(targetDir, 'docs', 'BRAND.md');
  if (!fs.existsSync(brandPath)) {
    issues.push('docs/BRAND.md is missing. Run: npx @ai.all/ds7 init');
  }

  const checkDirs = ['app', 'public', 'docs']
    .map((d) => path.join(targetDir, d))
    .filter((d) => fs.existsSync(d));
  const FORBIDDEN_EXT = /\.(tmp|tmp-pv|psd|raw|cr2|nef)$/i;

  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('.nuxt')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        if (
          e.name === '.DS_Store' ||
          FORBIDDEN_EXT.test(e.name) ||
          /-(?:tmp|scratch)\./.test(e.name)
        ) {
          issues.push(`temporary / raw artifact in tree: ${path.relative(TARGET, p)}`);
        }
      }
    }
  };

  for (const d of checkDirs) walk(d);

  return issues;
}

// Comprehensive health check running all quality gates
function cmdCheck() {
  const strict = process.argv.includes('--strict');
  const pathIdx = process.argv.indexOf('--path');
  const targetDir = pathIdx > -1 ? path.resolve(process.argv[pathIdx + 1]) : TARGET;

  console.log(`\n${C.bold}DS7 Health Check: Running all quality gates…${C.reset}\n`);

  // Gate 1: Modifier & Layer Guard
  const { found: guardFound, layerIssues } = runGuardChecks(targetDir);
  const guardCount = guardFound.size + layerIssues.length;
  if (guardCount === 0) {
    ok('Gate 1 (Modifiers & Layers): Clean. No modifier anti-patterns or layer violations.');
  } else {
    err(
      `Gate 1 (Modifiers & Layers): Found ${guardFound.size} modifier class(es), ${layerIssues.length} layer issue(s).`,
    );
    for (const issue of layerIssues) console.log(`    ${C.dim}${issue}${C.reset}`);
    for (const [cls, files] of [...guardFound].sort().slice(0, 5)) {
      console.log(`    ${C.dim}${cls} in ${[...files].slice(0, 2).join(', ')}${C.reset}`);
    }
  }

  // Gate 2: Raw Colors in UI Atoms
  const rawColors = validateRawColors(targetDir);
  if (rawColors.length === 0) {
    ok('Gate 2 (Token Discipline): Clean. All UI component colors use design tokens.');
  } else {
    err(
      `Gate 2 (Token Discipline): Found ${rawColors.length} raw color literal(s) in components/ui/.`,
    );
    for (const issue of rawColors.slice(0, 5)) console.log(`    ${C.dim}${issue}${C.reset}`);
  }

  // Gate 3: i18n Locales Parity
  const { localeCount, issues: i18nIssues } = validateI18n(targetDir);
  if (i18nIssues.length === 0) {
    ok(
      `Gate 3 (Internationalisation): Clean. ${localeCount ? `${localeCount} locales in parity.` : 'No locale files found (skipped).'}`,
    );
  } else {
    err(`Gate 3 (Internationalisation): Found ${i18nIssues.length} translation parity issue(s).`);
    for (const issue of i18nIssues.slice(0, 5)) console.log(`    ${C.dim}${issue}${C.reset}`);
  }

  // Gate 4: Repository Hygiene & Brand Spec
  const hygieneIssues = validateRepoHygiene(targetDir);
  if (hygieneIssues.length === 0) {
    ok('Gate 4 (Repository Hygiene): Clean. Brand spec present, no stray artifacts.');
  } else {
    err(`Gate 4 (Repository Hygiene): Found ${hygieneIssues.length} hygiene issue(s).`);
    for (const issue of hygieneIssues.slice(0, 5)) console.log(`    ${C.dim}${issue}${C.reset}`);
  }

  // Gate 5: Layout (only when the project has a ds7.config.json)
  let layoutCount = 0;
  if (fs.existsSync(path.join(targetDir, 'ds7.config.json'))) {
    const r = require('child_process').spawnSync(
      process.execPath,
      [path.join(__dirname, 'cmd', 'layout.mjs')],
      { cwd: targetDir, encoding: 'utf8' },
    );
    const lines = (r.stdout || '').split('\n').filter(Boolean);
    layoutCount = Number((lines[0] || '').match(/(\d+) problems/)?.[1] ?? (r.status ? 1 : 0));
    if (layoutCount === 0) {
      ok('Gate 5 (Layout): Clean. Every file is in its place and no import crosses a layer.');
    } else {
      err(`Gate 5 (Layout): Found ${layoutCount} placement or layer problem(s).`);
      for (const l of lines.slice(1, 6)) console.log(`    ${C.dim}${l.trim()}${C.reset}`);
    }
  }

  const totalErrors =
    guardCount + rawColors.length + i18nIssues.length + hygieneIssues.length + layoutCount;
  if (totalErrors === 0) {
    console.log(`\n${C.bold}${C.green}✓ All DS7 quality gates passed!${C.reset}\n`);
  } else {
    console.log(
      `\n${C.bold}${C.yellow}Total: ${totalErrors} issue(s) detected across quality gates.${C.reset}`,
    );
    if (strict) {
      console.log(`${C.red}Strict mode active: exiting with code 1.${C.reset}\n`);
      process.exit(1);
    } else {
      console.log(`Fix the issues above before submitting pull requests or publishing.\n`);
    }
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

  const walk = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
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
      await sharp(file)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);
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

// Commands implemented as scripts in bin/cmd: they run in the project root and pass their arguments and exit code on.
const SCRIPT_COMMANDS = ['graph', 'layout', 'docs', 'psi', 'lab', 'doctor'];
const AUDITS = ['html', 'seo', 'a11y', 'perf'];
function runScript(name, args) {
  const r = require('child_process').spawnSync(
    process.execPath,
    [path.join(__dirname, 'cmd', `${name}.mjs`), ...args],
    {
      cwd: TARGET,
      stdio: 'inherit',
    },
  );
  return r.status ?? 1;
}
// `ds7 audit [html|seo|a11y|perf]`: static checks over the generated site (.output/public); without a name all four run.
function cmdAudit(args) {
  const only = args[0] && !args[0].startsWith('--') ? args[0] : null;
  if (only && !AUDITS.includes(only)) {
    err(`Unknown audit: ${only} (html, seo, a11y, perf)`);
    process.exit(1);
  }
  const rest = only ? args.slice(1) : args;
  let failed = 0;
  if (rest.includes('--json') && only) process.exit(runScript(only, rest)); // the audit's own JSON object
  if (rest.includes('--json')) {
    // one JSON document for all four audits
    const audits = [];
    for (const name of only ? [only] : AUDITS) {
      const r = require('child_process').spawnSync(
        process.execPath,
        [path.join(__dirname, 'cmd', `${name}.mjs`), ...rest],
        { cwd: TARGET, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      );
      if (r.status !== 0) failed++;
      try {
        audits.push(JSON.parse(r.stdout));
      } catch {
        audits.push({ command: name, error: `${r.stdout}${r.stderr}`.trim() });
      }
    }
    console.log(JSON.stringify({ audits, failed }, null, 2));
    process.exit(failed ? 1 : 0);
  }
  for (const name of only ? [only] : AUDITS) {
    console.log(`\n${C.bold}ds7 audit ${name}${C.reset}`);
    if (runScript(name, rest) !== 0) failed++;
  }
  if (!only)
    console.log(
      failed
        ? `\n${C.red}${failed} of ${AUDITS.length} audits failed.${C.reset}`
        : `\n${C.green}All audits passed.${C.reset}`,
    );
  process.exit(failed ? 1 : 0);
}

function cmdHelp() {
  console.log(`
DS7 ${version}

  npx @ai.all/ds7           install standard, brand intake and quality scripts (init)
  npx @ai.all/ds7 sync      sync agent entrypoints (AI-ALL sync)
  npx @ai.all/ds7 update    update ds7/ to this version and refresh the pack
  npx @ai.all/ds7 guard     check modifier class names and atomic layer rules (--strict)
  npx @ai.all/ds7 check     run all quality gates: guard, tokens, i18n, hygiene, layout (--strict)
  npx @ai.all/ds7 images    generate responsive WebP image variants (--check)
  npx @ai.all/ds7 graph     generate docs/SITE-GRAPH.md; --check, --uses X, --of X, --css X, --budget N, --stats
  npx @ai.all/ds7 layout    check that files sit where the layout rules say and no import crosses a layer
  npx @ai.all/ds7 docs      check that what the docs mention (scripts, paths, links, sections, skills) exists
  npx @ai.all/ds7 audit     static checks over the build: html, seo, a11y, perf (name one to run one)
                            layout, docs and audit also take --json, --update-baseline and --no-baseline
  npx @ai.all/ds7 lab       LCP, CLS and blocking in a browser (--axe for accessibility); needs Playwright
  npx @ai.all/ds7 doctor    where the project stands with DS7 and what to do next (--json)
  npx @ai.all/ds7 psi URL   PageSpeed Insights scores and field data for a live URL
  npx @ai.all/ds7 --version print the version
`);
}

const cmd = process.argv[2];
if (cmd === '--version' || cmd === '-v') console.log(version);
else if (cmd === '--help' || cmd === '-h' || cmd === 'help') cmdHelp();
else if (cmd === 'sync') cmdSync();
else if (cmd === 'update') cmdUpdate();
else if (cmd === 'guard') cmdGuard();
else if (cmd === 'check') cmdCheck();
else if (cmd === 'images') cmdImages();
else if (cmd === 'audit') cmdAudit(process.argv.slice(3));
else if (SCRIPT_COMMANDS.includes(cmd)) process.exit(runScript(cmd, process.argv.slice(3)));
else if (!cmd || cmd === 'init') cmdInit();
else {
  err(`Unknown command: ${cmd}`);
  cmdHelp();
  process.exitCode = 1;
}
