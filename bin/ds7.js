#!/usr/bin/env node
'use strict';

// DS7 CLI. Installs the DS7 standard into ds7/ and enables it as the `ds7`
// pack of AI-ALL (@ai.all/aiall). The agent entrypoints and the root ALL.md
// belong to AI-ALL; this CLI never writes them.
//
// Usage: npx @ai.all/ds7 [command]; `npx @ai.all/ds7 --help` lists the commands.
//
// Ownership:
//   ds7/**                 the standard, vendored; overwritten by `update`
//   ds7/aiall-pack.json    pack manifest, generated from this version; overwritten by `update`
//   ds7/VERSION            installed version; written by `init` and `update`
//   ds7/FILES              checksums of the shipped files, so `update` can keep local edits
//   ds7/local/**           the project's own notes and patches; never overwritten
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
const DS7_FILES = ['README.md', 'SPEC.md', 'ALL.md', 'CONFIG.md', 'CHANGELOG.md'];

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

// A path for messages: relative, with forward slashes on every system
const relPath = (from, to) => path.relative(from, to).split(path.sep).join('/');

// Copy one file. `overwrite` decides whether an existing file is replaced.
function copyOne(relFromPkg, destAbs, overwrite) {
  const label = relPath(TARGET, destAbs);
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
    skip(relPath(TARGET, dest));
    return;
  }
  fs.mkdirSync(DS7, { recursive: true });
  fs.writeFileSync(dest, `${JSON.stringify(packManifest(), null, 2)}\n`);
  ok(relPath(TARGET, dest));
}

function writeVersion() {
  fs.mkdirSync(DS7, { recursive: true });
  fs.writeFileSync(path.join(DS7, 'VERSION'), `${version}\n`);
}

// ---- local edits to the vendored standard
// ds7/FILES lists the checksum of every file as the package shipped it. `ds7 update` uses it to tell a file the project edited
// from one it never touched: an edit that no patch in ds7/local/patches carries is saved to ds7/local/edited/ before the file is
// replaced, and the patches are applied again afterwards. `ds7 patch <file>` turns an edit into such a patch.
const FILES_LIST = path.join(DS7, 'FILES');
const PATCH_DIR = path.join(DS7, 'local', 'patches');
const sha = (buf) => require('crypto').createHash('sha256').update(buf).digest('hex').slice(0, 16);
const relInDs7 = (dest) => path.relative(DS7, dest).split(path.sep).join('/');

function readFilesList() {
  if (!fs.existsSync(FILES_LIST)) return null;
  const map = new Map();
  for (const line of fs.readFileSync(FILES_LIST, 'utf8').split('\n')) {
    const m = line.match(/^([0-9a-f]+) {2}(.+)$/);
    if (m) map.set(m[2], m[1]);
  }
  return map;
}
function writeFilesList() {
  const lines = standardFiles()
    .map(([rel, dest]) => `${sha(fs.readFileSync(path.join(PKG, rel)))}  ${relInDs7(dest)}`)
    .sort((a, b) => a.slice(18).localeCompare(b.slice(18)));
  fs.writeFileSync(
    FILES_LIST,
    `# Checksums of the files of DS7 ${version} as shipped; ds7 update reads them to keep local edits. Do not edit.\n${lines.join('\n')}\n`,
  );
}
const patches = () =>
  fs.existsSync(PATCH_DIR)
    ? fs
        .readdirSync(PATCH_DIR)
        .filter((f) => f.endsWith('.patch'))
        .sort()
    : [];
// the vendored files a patch changes (its "+++ b/ds7/<file>" lines)
const patchedFiles = () =>
  new Set(
    patches().flatMap((f) =>
      [...fs.readFileSync(path.join(PATCH_DIR, f), 'utf8').matchAll(/^\+\+\+ b\/ds7\/(\S+)/gm)].map(
        (m) => m[1],
      ),
    ),
  );
function applyPatches() {
  const failed = [];
  const git = (...args) =>
    require('child_process').spawnSync('git', args, { cwd: TARGET, encoding: 'utf8' });
  for (const f of patches()) {
    const file = path.join('ds7', 'local', 'patches', f);
    // a plain apply first; a three-way merge (needs the file in the git index) when upstream moved the lines
    let r = git('apply', '--whitespace=nowarn', file);
    if (r.status !== 0) r = git('apply', '--3way', '--whitespace=nowarn', file);
    if (r.status === 0) ok(`patch ${f} applied`);
    else failed.push([f, (r.stderr || r.error?.message || '').trim().split('\n')[0]]);
  }
  return failed;
}

// `ds7 patch <file>`: the difference between the package copy of a vendored file and the project's edited one, as a patch
function cmdPatch(args) {
  const file = (args[0] || '').replace(/^ds7\//, '');
  if (!file || !fs.existsSync(path.join(PKG, file)) || !fs.existsSync(path.join(DS7, file))) {
    err(
      'Usage: ds7 patch <file in ds7/>, for example: ds7 patch 02-design-system/NAMING-CONVENTIONS.md',
    );
    process.exitCode = 1;
    return;
  }
  const r = require('child_process').spawnSync(
    'git',
    [
      'diff',
      '--no-index',
      '--no-color',
      `--src-prefix=a/ds7/`,
      `--dst-prefix=b/ds7/`,
      '--',
      path.join(PKG, file),
      path.join(DS7, file),
    ],
    { encoding: 'utf8' },
  );
  if (r.status === 0) return info(`ds7/${file} is the same as in the package: nothing to record`);
  // git names both sides by their full paths: put the vendored path in both headers
  const diff = r.stdout
    .split('\n')
    .map((l) =>
      l.startsWith('diff --git')
        ? `diff --git a/ds7/${file} b/ds7/${file}`
        : l.startsWith('--- ')
          ? `--- a/ds7/${file}`
          : l.startsWith('+++ ')
            ? `+++ b/ds7/${file}`
            : l,
    )
    .join('\n');
  fs.mkdirSync(PATCH_DIR, { recursive: true });
  const existing = patches().find((f) =>
    fs.readFileSync(path.join(PATCH_DIR, f), 'utf8').includes(`+++ b/ds7/${file}\n`),
  );
  const name =
    existing ||
    `${String(patches().length + 1).padStart(2, '0')}-${path
      .basename(file)
      .replace(/\.\w+$/, '')
      .toLowerCase()}.patch`;
  fs.writeFileSync(path.join(PATCH_DIR, name), diff);
  ok(
    `ds7/local/patches/${name} ${existing ? 'updated' : 'written'}; ds7 update applies it after every update`,
  );
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
  // on Windows npx is a .cmd file and needs the shell; quoted, so cmd keeps the ^ and paths with spaces
  const win = process.platform === 'win32';
  const npxArgs = ['--yes', '@ai.all/aiall@^1.0.0', ...args, '--path', TARGET];
  const r = spawnSync('npx', win ? npxArgs.map((a) => `"${a}"`) : npxArgs, {
    stdio: 'inherit',
    shell: win,
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

// .gitignore: the local intake folders and temporary files
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

// The brand questions of `init`, asked only in a terminal (CI and --yes skip them)
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

// docs/BRAND.md from the template, filled with the answers when there are any
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
    ['templates/local/README.md', 'ds7/local/README.md'],
    ['templates/local/RECURRING-RULES.md', 'ds7/local/RECURRING-RULES.md'],
    // a project whose own workflow already runs the DS7 checks gets no second one
    ...(ownCiRunsDs7() ? [] : [['templates/workflows/ds7.yml', '.github/workflows/ds7.yml']]),
    // icons and error pages (`ds7 icons`): the site's own copies, kept when they exist
    ['templates/error.vue', 'app/error.vue'],
    ['templates/site.webmanifest', 'public/site.webmanifest'],
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

// Makefile from the template, when the project has none
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

// The DS7 npm scripts, added to package.json where missing
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
  if (!fs.existsSync(FILES_LIST)) writeFilesList();

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
  // keep what the project changed in the vendored files
  const known = readFilesList();
  const carried = patchedFiles();
  const saved = [];
  if (known)
    for (const [, dest] of standardFiles()) {
      const rel = relInDs7(dest);
      if (!fs.existsSync(dest) || !known.has(rel) || carried.has(rel)) continue;
      if (sha(fs.readFileSync(dest)) === known.get(rel)) continue;
      const copy = path.join(DS7, 'local', 'edited', rel);
      fs.mkdirSync(path.dirname(copy), { recursive: true });
      fs.copyFileSync(dest, copy);
      saved.push(rel);
    }
  for (const [rel, dest] of standardFiles()) copyOne(rel, dest, true);
  writePackManifest(true);
  writeVersion();
  writeFilesList();
  const failed = applyPatches();

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

  for (const rel of saved)
    info(
      `ds7/${rel} had a local edit that no patch carries: it is saved in ds7/local/edited/${rel}. Put the edit back and run ds7 patch ${rel}`,
    );
  for (const [f, why] of failed)
    err(
      `patch ${f} does not apply any more (${why}): upstream changed the same lines; edit by hand, then ds7 patch <file>`,
    );
  if (failed.length) process.exitCode = 1;
  console.log(
    `\n${C.green}Standard updated to v${version}. See ds7/CHANGELOG.md for what changed.${C.reset}`,
  );
  info('The root ALL.md outside the aiall packs block was not changed.\n');
}

// True when a workflow in .github/workflows (other than ds7.yml) already runs the DS7 checks
function ownCiRunsDs7() {
  const dir = path.join(TARGET, '.github', 'workflows');
  if (!fs.existsSync(dir)) return false;
  return fs
    .readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f) && f !== 'ds7.yml')
    .some((f) =>
      /\bds7 check\b|npm run check(:strict)?\b/.test(fs.readFileSync(path.join(dir, f), 'utf8')),
    );
}

// ds7.config.json of a project, or {} (a broken file is reported by Gate 5 and `ds7 doctor`)
function userConfig(targetDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(targetDir, 'ds7.config.json'), 'utf8'));
  } catch {
    return {};
  }
}

const GUARD_SUFFIXES = [
  'active',
  'big',
  'small',
  'large',
  'orange',
  'red',
  'green',
  'blue',
  'dark',
  'light',
  'new',
  'alt',
  'v\\d',
];

// Settings of the guard, "guard" in ds7.config.json; every rule can be switched off.
//  stateClasses   "allow" | "warn" (default) | "deny": what to do with is-* state classes (the standard is a dash modifier, .-active)
//  allowClasses   class names never reported
//  suffixes       words that make a class a baked-in modifier (card-big); [] turns that rule off
//  dirs           folders searched for classes
//  uiDir          the atoms folder; a component there must not use components of the other folders of its parent; false turns it off
//  upperLayers    component name prefixes counted as upper layers; "auto" (default) = the other folders next to uiDir
//  pageStyleLines most lines of <style> a page may hold (false = no limit); pageStyleSkip: page files left out
function guardConfig(targetDir) {
  const g = userConfig(targetDir).guard || {};
  const state = g.stateClasses ?? 'warn';
  return {
    stateClasses: state === false ? 'allow' : state,
    allowClasses: new Set(g.allowClasses ?? []),
    suffixes: g.suffixes ?? GUARD_SUFFIXES,
    dirs: g.dirs ?? ['app', 'src', 'components', 'pages'],
    uiDir: g.uiDir === false ? null : (g.uiDir ?? 'app/components/ui'),
    upperLayers: g.upperLayers ?? 'auto',
    pagesDir: g.pagesDir ?? 'app/pages',
    pageStyleLines: g.pageStyleLines === undefined ? 40 : g.pageStyleLines,
    pageStyleSkip: g.pageStyleSkip ?? ['ui.vue', 'ds.vue'],
  };
}

const pascal = (s) => s.replace(/(^|[-_])([a-z0-9])/g, (_, __, c) => c.toUpperCase());

// Gate 1: baked-in modifier classes, atoms that use upper layers, pages that hold their own styles
function runGuardChecks(targetDir) {
  const cfg = guardConfig(targetDir);
  const BAD = cfg.suffixes.length
    ? new RegExp(`^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-(?:${cfg.suffixes.join('|')})$`)
    : null;
  // framework classes: Vue transitions and the like
  const FRAMEWORK = /-(?:enter|leave)(?:-from|-to|-active)?$/;

  const found = new Map();
  const states = new Map();
  const note = (map, c, p) => {
    const set = map.get(c) || new Set();
    set.add(relPath(TARGET, p));
    map.set(c, set);
  };
  const searchDirs = cfg.dirs.map((d) => path.join(targetDir, d)).filter((d) => fs.existsSync(d));
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
            if (!c || cfg.allowClasses.has(c) || FRAMEWORK.test(c)) continue;
            if (/^is-[a-z]/.test(c)) {
              if (cfg.stateClasses !== 'allow') note(states, c, p);
            } else if (BAD && BAD.test(c)) note(found, c, p);
          }
        }
      }
    }
  };

  for (const d of searchDirs) walk(d);
  // "deny": state classes count as baked-in modifiers; "warn": they are listed as advice
  if (cfg.stateClasses === 'deny') for (const [c, f] of states) found.set(c, f);

  const findVues = (d) => {
    if (!fs.existsSync(d)) return [];
    return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(d, e.name);
      return e.isDirectory() ? findVues(p) : e.name.endsWith('.vue') ? [p] : [];
    });
  };

  // Atomic-design layer checks: atoms (uiDir) must not use components of the upper layers
  const layerIssues = [];
  if (cfg.uiDir) {
    const uiDir = path.join(targetDir, cfg.uiDir);
    const parent = path.dirname(uiDir);
    const prefixes =
      cfg.upperLayers === 'auto'
        ? fs.existsSync(parent)
          ? fs
              .readdirSync(parent, { withFileTypes: true })
              .filter((e) => e.isDirectory() && e.name !== path.basename(uiDir))
              .map((e) => pascal(e.name))
          : []
        : cfg.upperLayers || [];
    if (prefixes.length) {
      const UP = new RegExp(`(?<=[\\s>])<(?:${prefixes.join('|')})[A-Z]\\w*`, 'g');
      for (const f of findVues(uiDir)) {
        const matches = fs.readFileSync(f, 'utf8').match(UP);
        if (matches)
          layerIssues.push(
            `ui → upper layer: ${relPath(TARGET, f)} uses ${[...new Set(matches.map((m) => m.slice(1)))].join(', ')}`,
          );
      }
    }
  }

  // Page style lines: pages should not accumulate scoped CSS; it belongs in components
  if (cfg.pageStyleLines !== false) {
    for (const f of findVues(path.join(targetDir, cfg.pagesDir))) {
      if (cfg.pageStyleSkip.includes(path.basename(f))) continue;
      const styleMatch = fs.readFileSync(f, 'utf8').match(/<style[^>]*>([\s\S]*?)<\/style>/);
      const lines = styleMatch ? styleMatch[1].split('\n').length : 0;
      if (lines > cfg.pageStyleLines)
        layerIssues.push(
          `page with ${lines} style lines (move to a component/molecule): ${relPath(TARGET, f)}`,
        );
    }
  }

  return { found, layerIssues, stateAdvice: cfg.stateClasses === 'warn' ? states : new Map() };
}

// Advice, not a failure: is-* state classes while guard.stateClasses is "warn"
function printStateAdvice(states) {
  if (!states.size) return;
  const list = [...states.keys()].sort();
  info(
    `${list.length} is-* state class(es) (${list.slice(0, 4).join(', ')}${list.length > 4 ? ', …' : ''}): the standard is a dash modifier (.-active). Set guard.stateClasses to "deny" to enforce, or "allow" to silence.`,
  );
}

// `ds7 guard`: Gate 1 on its own, with every finding listed
function cmdGuard() {
  const strict = process.argv.includes('--strict');
  const pathIdx = process.argv.indexOf('--path');
  const targetDir = pathIdx > -1 ? path.resolve(process.argv[pathIdx + 1]) : TARGET;

  const { found, layerIssues, stateAdvice } = runGuardChecks(targetDir);

  console.log(`\n${C.bold}DS7 Guard: Validating modifier classes and atomic layers…${C.reset}\n`);

  for (const issue of layerIssues) err(issue);

  for (const [cls, files] of [...found].sort()) {
    err(`${cls} (baked-in modifier) in: ${[...files].slice(0, 3).join(', ')}`);
  }

  printStateAdvice(stateAdvice);
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

// Gate 2: colours in components/ui come from tokens, never as hex or rgb() literals
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
        issues.push(`raw color ${rawMatch[0]} in ${relPath(TARGET, f)} (use var(--color-*) token)`);
      }
    }
  }

  return issues;
}

// Leaf key paths of the object literal a .ts/.js locale file exports. A small tokenizer, not a regex: words inside
// strings, template literals and comments are never taken for keys, and a key written twice in one object is reported.
function localeKeysOfSource(src) {
  const keys = [];
  const dups = [];
  const start = src.search(/export\s+default\b/);
  let i = src.indexOf('{', start < 0 ? 0 : start);
  if (i < 0) return { keys, dups };
  const path = [];
  const seen = [new Set()];
  const n = src.length;
  const skipString = (q) => {
    for (i++; i < n && src[i] !== q; i++) {
      if (src[i] === '\\') i++;
      else if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
        let depth = 0;
        for (i++; i < n; i++) {
          if (src[i] === '{') depth++;
          else if (src[i] === '}' && --depth === 0) break;
          else if (src[i] === "'" || src[i] === '"' || src[i] === '`') skipString(src[i]);
        }
      }
    }
  };
  const skipComment = () => {
    if (src[i + 1] === '/') while (i < n && src[i] !== '\n') i++;
    else {
      i = src.indexOf('*/', i + 2);
      i = i < 0 ? n : i + 1;
    }
  };
  // skip a value that is not an object literal: up to the , or } that ends it at this depth
  const skipValue = () => {
    let depth = 0;
    for (; i < n; i++) {
      const c = src[i];
      if (c === "'" || c === '"' || c === '`') skipString(c);
      else if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) skipComment();
      else if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') {
        if (depth === 0) return;
        depth--;
      } else if (c === ',' && depth === 0) return;
    }
  };
  i++; // into the root object
  while (i < n) {
    const c = src[i];
    if (/\s|,/.test(c)) i++;
    else if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
      skipComment();
      i++;
    } else if (c === '}') {
      if (!path.length) break;
      path.pop();
      seen.pop();
      i++;
    } else if (c === '.' && src.startsWith('...', i)) {
      i += 3;
      skipValue();
    } else {
      // a key: identifier, number or quoted string, then ':'
      let key;
      if (c === "'" || c === '"') {
        const from = i;
        skipString(c);
        key = src.slice(from + 1, i);
        i++;
      } else {
        const m = /^[A-Za-z0-9_$]+/.exec(src.slice(i, i + 200));
        if (!m) {
          i++;
          continue;
        }
        key = m[0];
        i += key.length;
      }
      while (i < n && /\s/.test(src[i])) i++;
      if (src[i] !== ':') {
        // shorthand property or method: nothing to compare
        skipValue();
        continue;
      }
      i++;
      while (i < n && /\s/.test(src[i])) i++;
      const full = [...path, key].join('.');
      const here = seen[seen.length - 1];
      if (here.has(key)) dups.push(full);
      here.add(key);
      if (src[i] === '{') {
        path.push(key);
        seen.push(new Set());
        i++;
      } else {
        keys.push(full);
        skipValue();
      }
    }
  }
  return { keys, dups };
}

// Locale files: i18n.dir in ds7.config.json, else i18n/locales, locales or app/locales. A locale is a file
// (es.ts, en.json) or a folder of files (es/home.json → keys home.*).
function readLocales(targetDir, cfg) {
  const candidates = cfg.dir
    ? [path.join(targetDir, cfg.dir)]
    : ['i18n/locales', 'locales', 'app/locales'].map((d) => path.join(targetDir, d));
  const locDir = candidates.find((d) => fs.existsSync(d));
  if (!locDir) return null;
  const isLocaleFile = (f) => /\.(json|ts|js|mjs)$/.test(f) && !/\.d\.ts$/.test(f);
  const out = new Map();
  const add = (loc, file, prefix) => {
    const list = out.get(loc) || [];
    list.push({ file, prefix });
    out.set(loc, list);
  };
  for (const e of fs.readdirSync(locDir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      for (const f of fs.readdirSync(path.join(locDir, e.name)).filter(isLocaleFile))
        add(e.name, path.join(locDir, e.name, f), f.replace(/\.[^.]+$/, ''));
    } else if (isLocaleFile(e.name))
      add(e.name.replace(/\.[^.]+$/, ''), path.join(locDir, e.name), '');
  }
  for (const loc of cfg.ignore || []) out.delete(loc);
  return out;
}

// Gate 3: every locale has the same keys. Settings: "i18n" in ds7.config.json,
// { "check": false } turns the gate off, "dir" names the locale folder, "ignore" lists locales to leave out.
function validateI18n(targetDir) {
  const issues = [];
  const cfg = userConfig(targetDir).i18n || {};
  if (cfg.check === false) return { localeCount: 0, issues, off: true };
  const found = readLocales(targetDir, cfg);
  if (!found || found.size === 0) return { localeCount: 0, issues };

  const localeKeys = new Map();
  for (const [loc, files] of found) {
    const keys = new Set();
    for (const { file, prefix } of files) {
      const content = fs.readFileSync(file, 'utf8');
      const at = (k) => (prefix ? `${prefix}.${k}` : k);
      if (file.endsWith('.json')) {
        try {
          const extract = (o, pre = '') => {
            for (const [k, v] of Object.entries(o)) {
              const full = pre ? `${pre}.${k}` : k;
              if (v && typeof v === 'object' && !Array.isArray(v)) extract(v, full);
              else {
                keys.add(at(full));
                if (typeof v === 'string' && !v.trim())
                  issues.push(`empty string in ${loc}: ${at(full)}`);
              }
            }
          };
          extract(JSON.parse(content));
        } catch (e) {
          issues.push(`invalid JSON in ${relPath(targetDir, file)}: ${e.message}`);
        }
      } else {
        const { keys: ks, dups } = localeKeysOfSource(content);
        for (const k of ks) keys.add(at(k));
        for (const d of dups)
          issues.push(`key written twice in ${relPath(targetDir, file)}: ${at(d)}`);
      }
    }
    localeKeys.set(loc, keys);
  }

  const locales = [...localeKeys.keys()];
  for (const l1 of locales) {
    for (const l2 of locales) {
      if (l1 === l2) continue;
      const k2 = localeKeys.get(l2);
      const missing = [...localeKeys.get(l1)].filter((k) => !k2.has(k));
      if (missing.length) {
        issues.push(
          `missing in ${l2} (present in ${l1}): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` (+${missing.length - 5} more)` : ''}`,
        );
      }
    }
  }

  return { localeCount: locales.length, issues: [...new Set(issues)] };
}

// Gate 4: the brand spec exists and no temporary files are left in the repository
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
          issues.push(`temporary / raw artifact in tree: ${relPath(TARGET, p)}`);
        }
      }
    }
  };

  for (const d of checkDirs) walk(d);

  return issues;
}

// `ds7 check`: the five quality gates. --strict exits 1 on any new issue; --json prints one object; ds7-baseline.json ("check")
// holds accepted issues (--update-baseline writes it, --no-baseline ignores it). "check.gates" in ds7.config.json switches a gate
// off by name: { "tokens": false } (names: guard, tokens, i18n, hygiene, layout).
function cmdCheck() {
  const argv = process.argv;
  const strict = argv.includes('--strict');
  const json = argv.includes('--json');
  const pathIdx = argv.indexOf('--path');
  const targetDir = pathIdx > -1 ? path.resolve(argv[pathIdx + 1]) : TARGET;
  const off = (userConfig(targetDir).check || {}).gates || {};
  const gates = [];
  const gate = (n, key, name, run) => {
    if (off[key] === false)
      return gates.push({
        n,
        key,
        name,
        off: true,
        issues: [],
        clean: 'Off (check.gates in ds7.config.json).',
      });
    gates.push({ n, key, name, ...run() });
  };

  let stateAdvice = new Map();
  gate(1, 'guard', 'Modifiers & Layers', () => {
    const r = runGuardChecks(targetDir);
    stateAdvice = r.stateAdvice;
    return {
      issues: [
        ...r.layerIssues,
        ...[...r.found]
          .sort()
          .map(([cls, files]) => `${cls} (baked-in modifier) in ${[...files].sort()[0]}`),
      ],
      clean: 'Clean. No modifier anti-patterns or layer violations.',
    };
  });
  gate(2, 'tokens', 'Token Discipline', () => ({
    issues: validateRawColors(targetDir),
    clean: 'Clean. All UI component colors use design tokens.',
  }));
  gate(3, 'i18n', 'Internationalisation', () => {
    const { localeCount, issues, off: i18nOff } = validateI18n(targetDir);
    const clean = i18nOff
      ? 'Off (i18n.check is false in ds7.config.json).'
      : localeCount > 1
        ? `Clean. ${localeCount} locales in parity.`
        : localeCount === 1
          ? 'Clean. One locale, nothing to compare yet.'
          : 'No locale files found (skipped).';
    return { issues, clean };
  });
  gate(4, 'hygiene', 'Repository Hygiene', () => ({
    issues: validateRepoHygiene(targetDir),
    clean: 'Clean. Brand spec present, no stray artifacts.',
  }));
  // Gate 5 runs `ds7 layout`, which keeps its own baseline: its new problems only count here
  if (fs.existsSync(path.join(targetDir, 'ds7.config.json')))
    gate(5, 'layout', 'Layout', () => {
      const r = require('child_process').spawnSync(
        process.execPath,
        [path.join(__dirname, 'cmd', 'layout.mjs'), '--json'],
        { cwd: targetDir, encoding: 'utf8' },
      );
      let issues = [];
      try {
        issues = JSON.parse(r.stdout)
          .findings.filter((f) => !f.known)
          .map((f) => `${f.where}: ${f.detail}`);
      } catch {
        issues = [`ds7 layout did not run: ${(r.stderr || r.stdout || '').trim().split('\n')[0]}`];
      }
      return {
        issues,
        clean: 'Clean. Every file is in its place and no import crosses a layer.',
        ownBaseline: true,
      };
    });

  // the baseline of accepted issues, shared with the other commands
  const baseFile = path.join(targetDir, 'ds7-baseline.json');
  let base = {};
  try {
    if (fs.existsSync(baseFile)) base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  } catch (e) {
    err(`ds7-baseline.json is not valid JSON: ${e.message}`);
    process.exit(1);
  }
  const keyOf = (g, i) => `Gate ${g.n} | ${i}`;
  const all = gates.flatMap((g) => (g.ownBaseline ? [] : g.issues.map((i) => keyOf(g, i))));
  if (argv.includes('--update-baseline')) {
    if (!Object.keys(base).length)
      base.note =
        'Findings accepted for now. Fix them and run the command with --update-baseline to drop them; new findings still fail.';
    if (all.length) base.check = [...new Set(all)].sort();
    else delete base.check;
    fs.writeFileSync(baseFile, JSON.stringify(base, null, 2) + '\n');
    console.log(`check: baseline updated, ${all.length} known issue(s) in ds7-baseline.json`);
    return;
  }
  const known = new Set(argv.includes('--no-baseline') ? [] : base.check || []);
  for (const g of gates) {
    g.known = g.issues.filter((i) => !g.ownBaseline && known.has(keyOf(g, i)));
    g.issues = g.issues.filter((i) => g.ownBaseline || !known.has(keyOf(g, i)));
  }
  const fixed = [...known].filter((k) => !all.includes(k));
  const total = gates.reduce((a, g) => a + g.issues.length, 0);

  if (json) {
    console.log(
      JSON.stringify(
        {
          command: 'check',
          problems: total,
          known: gates.reduce((a, g) => a + g.known.length, 0),
          fixed: fixed.length,
          gates: gates.map((g) => ({
            gate: g.n,
            name: g.key,
            off: !!g.off,
            issues: g.issues,
            known: g.known,
          })),
          advice: [...stateAdvice.keys()].sort().map((c) => `${c}: is-* state class`),
        },
        null,
        2,
      ),
    );
    if (strict && total) process.exit(1);
    return;
  }

  console.log(`\n${C.bold}DS7 Health Check: Running all quality gates…${C.reset}\n`);
  for (const g of gates) {
    const label = `Gate ${g.n} (${g.name})`;
    const knownNote = g.known.length ? ` (${g.known.length} known)` : '';
    if (!g.issues.length) ok(`${label}: ${g.clean}${knownNote}`);
    else {
      err(`${label}: Found ${g.issues.length} issue(s).${knownNote}`);
      for (const i of g.issues.slice(0, 5)) console.log(`    ${C.dim}${i}${C.reset}`);
      if (g.issues.length > 5)
        console.log(`    ${C.dim}... ${g.issues.length - 5} more (--json lists all)${C.reset}`);
    }
    if (g.n === 1) printStateAdvice(stateAdvice);
  }
  if (fixed.length)
    info(
      `baseline: ${fixed.length} known issue(s) no longer occur; run ds7 check --update-baseline to drop them`,
    );
  if (total === 0) {
    console.log(`\n${C.bold}${C.green}✓ All DS7 quality gates passed!${C.reset}\n`);
    return;
  }
  console.log(
    `\n${C.bold}${C.yellow}Total: ${total} issue(s) detected across quality gates.${C.reset}`,
  );
  if (strict) {
    console.log(`${C.red}Strict mode active: exiting with code 1.${C.reset}\n`);
    process.exit(1);
  }
  console.log(`Fix the issues above, or accept them for now with ds7 check --update-baseline.\n`);
}

// Commands implemented as scripts in bin/cmd: they run in the project root and pass their arguments and exit code on.
const SCRIPT_COMMANDS = [
  'graph',
  'layout',
  'docs',
  'psi',
  'lab',
  'doctor',
  'css',
  'unused',
  'console',
  'icons',
  'images',
  'pages',
  'adopt',
  'skills',
  'hooks',
];
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
  npx @ai.all/ds7 images    responsive WebP variants (--check); "images optimize", "images strip", "images dupes"
  npx @ai.all/ds7 graph     generate docs/SITE-GRAPH.md; --check, --uses X, --of X, --css X, --budget N, --stats
  npx @ai.all/ds7 layout    check that files sit where the layout rules say and no import crosses a layer
  npx @ai.all/ds7 docs      check that what the docs mention (scripts, paths, links, sections, skills) exists
  npx @ai.all/ds7 audit     static checks over the build: html, seo, a11y, perf (name one to run one)
                            layout, docs and audit also take --json, --update-baseline and --no-baseline
  npx @ai.all/ds7 lab       LCP, CLS and blocking in a browser (--axe for accessibility); needs Playwright
  npx @ai.all/ds7 css       dead classes and orphan stylesheets; "css diff [REV]" proves a CSS refactor changed no rule
  npx @ai.all/ds7 unused    components, composables, data files and public assets nothing refers to
  npx @ai.all/ds7 console   console errors, exceptions and failed requests of every page in a browser; needs Playwright
  npx @ai.all/ds7 icons     favicon, Apple, manifest and theme icons on every page; the 404 and 500 error pages
  npx @ai.all/ds7 pages     GitHub Pages preset: asset() helper and a deploy workflow under the base path
  npx @ai.all/ds7 adopt     which local tools/ scripts a ds7 command replaces (--write rewrites the npm scripts)
  npx @ai.all/ds7 patch F   record a local edit of the vendored file ds7/F as a patch that update re-applies
  npx @ai.all/ds7 skills    project skills; "skills link" links them into .claude/skills
  npx @ai.all/ds7 hooks     installs the commit-msg hook that checks Conventional Commits
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
else if (cmd === 'audit') cmdAudit(process.argv.slice(3));
else if (cmd === 'patch') cmdPatch(process.argv.slice(3));
else if (SCRIPT_COMMANDS.includes(cmd)) process.exit(runScript(cmd, process.argv.slice(3)));
// a bare flag such as `npx ds7 --yes` means init with that flag
else if (!cmd || cmd === 'init' || cmd === '--yes' || cmd === '-y') cmdInit();
else {
  err(`Unknown command: ${cmd}`);
  cmdHelp();
  process.exitCode = 1;
}
