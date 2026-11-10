#!/usr/bin/env node
'use strict';

// DS7 CLI — bootstraps the DS7 architecture standard in any project.
// Usage: npx @ai-all-ai/ds7 [init|sync|update|--version]

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ─── ANSI colours ──────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
};
const ok   = (s) => console.log(`  ${C.green}✓${C.reset} ${s}`);
const skip = (s) => console.log(`  ${C.dim}· ${s} (exists, skipped)${C.reset}`);
const info = (s) => console.log(`  ${C.yellow}→${C.reset} ${s}`);
const err  = (s) => console.log(`  ${C.red}✗${C.reset} ${s}`);

// ─── Paths ──────────────────────────────────────────────────────────────────
const PKG    = path.resolve(__dirname, '..');   // package root (ds7/)
const TARGET = process.cwd();                   // user's project root

const { version } = require(path.join(PKG, 'package.json'));

// ─── Helpers ────────────────────────────────────────────────────────────────
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (!fs.existsSync(d)) { fs.copyFileSync(s, d); return true; }
  }
}

function copyFile(src, dest) {
  if (fs.existsSync(dest)) { skip(path.relative(TARGET, dest)); return false; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  ok(path.relative(TARGET, dest));
  return true;
}

// ─── Directories published to npm (not meta files) ──────────────────────────
const DS7_DIRS = [
  '01-architecture', '02-design-system', '03-performance-web-vitals',
  '04-seo-ai-optimization', '05-internationalization', '06-business-conversion',
  '07-testing', '08-token-optimization', 'templates',
];
const DS7_FILES = ['README.md', 'SPEC.md', 'ALL.md', 'ANDALUSIA.md', 'ff.md'];

// ─── Commands ────────────────────────────────────────────────────────────────
function cmdInit() {
  console.log(`\n${C.bold}${C.cyan}⚡ DS7 v${version} — Architecture Setup${C.reset}\n`);

  // 1. Copy ds7/ docs structure
  const ds7Target = path.join(TARGET, 'ds7');
  let copied = 0;
  for (const dir of DS7_DIRS) {
    const src  = path.join(PKG, dir);
    const dest = path.join(ds7Target, dir);
    if (!fs.existsSync(src)) continue;
    const entries = fs.readdirSync(src, { withFileTypes: true });
    fs.mkdirSync(dest, { recursive: true });
    for (const e of entries) {
      const s = path.join(src, e.name);
      const d = path.join(dest, e.name);
      if (e.isDirectory()) {
        if (copyDir(s, d)) copied++;
      } else if (!fs.existsSync(d)) {
        fs.copyFileSync(s, d);
        ok(`ds7/${dir}/${e.name}`);
        copied++;
      } else {
        skip(`ds7/${dir}/${e.name}`);
      }
    }
  }
  for (const f of DS7_FILES) {
    if (copyFile(path.join(PKG, f), path.join(ds7Target, f))) copied++;
  }

  // 2. Create ALL.md in project root if missing
  copyFile(path.join(PKG, 'ALL.md'), path.join(TARGET, 'ALL.md'));

  console.log(`\n${C.yellow}⚡ Syncing AI agent entrypoints...${C.reset}`);

  // 3. Run @ai.all/aiall
  const r = spawnSync('npx', ['--yes', '@ai.all/aiall'], {
    stdio: 'inherit', cwd: TARGET, shell: true,
  });
  if (r.status !== 0) {
    info("Could not run @ai.all/aiall automatically.");
    info("Run manually: npx @ai.all/aiall");
  }

  console.log(`\n${C.bold}${C.green}✅ DS7 ready.${C.reset}`);
  console.log(`   Open ${C.cyan}ds7/README.md${C.reset} to explore the standard.`);
  console.log(`   Open ${C.cyan}ALL.md${C.reset} to review and customise agent rules.\n`);
}

function cmdSync() {
  console.log(`\n${C.yellow}⚡ Syncing agent entrypoints via @ai.all/aiall...${C.reset}\n`);
  const r = spawnSync('npx', ['--yes', '@ai.all/aiall'], {
    stdio: 'inherit', cwd: TARGET, shell: true,
  });
  if (r.status !== 0) err('Sync failed — run npx @ai.all/aiall manually.');
  else ok('All agent entrypoints are in sync.');
}

function cmdUpdate() {
  console.log(`\n${C.yellow}↑ Updating ds7/ from package v${version}...${C.reset}\n`);
  const ds7Target = path.join(TARGET, 'ds7');
  for (const dir of DS7_DIRS) {
    const src = path.join(PKG, dir);
    if (!fs.existsSync(src)) continue;
    copyDir(src, path.join(ds7Target, dir));
    ok(`ds7/${dir}/`);
  }
  console.log(`\n${C.green}✅ ds7/ updated to v${version}.${C.reset}\n`);
}

// ─── Dispatch ────────────────────────────────────────────────────────────────
const cmd = process.argv[2];
if (cmd === '--version' || cmd === '-v') {
  console.log(version);
} else if (cmd === 'sync') {
  cmdSync();
} else if (cmd === 'update') {
  cmdUpdate();
} else {
  // default: init
  cmdInit();
}
