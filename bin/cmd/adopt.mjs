#!/usr/bin/env node
// `ds7 adopt`: moving a project from its own scripts to the ds7 commands. Reads tools/ and scripts/ and the npm scripts,
// and lists for each local tool the ds7 command that does the same job, with the script line to use instead.
//   ds7 adopt            the report; changes nothing
//   ds7 adopt --write    rewrites the npm scripts that only call such a tool (`node tools/x.mjs [--check]`); the tool files stay,
//                        delete them yourself once the new script has passed
// Compare before you switch: a local tool may check something ds7 does not, then keep it next to the ds7 command.
import fs from 'node:fs';
import path from 'node:path';

const MAP = [
  [/^guard/, 'ds7 guard --strict'],
  [/^console(-check)?$/, 'ds7 console'],
  [/^css-audit$/, 'ds7 css'],
  [/^css-diff$/, 'ds7 css diff'],
  [/^unused(-assets)?$/, 'ds7 unused'],
  [/^strip-metadata$/, 'ds7 images strip'],
  [/^optimi[sz]e-images$/, 'ds7 images optimize'],
  [/^images$/, 'ds7 images'],
  [/^(site-)?graph$/, 'ds7 graph'],
  [/^layout(-check)?$/, 'ds7 layout'],
  [/^docs(-check)?$/, 'ds7 docs'],
  [/^html(-check)?$/, 'ds7 audit html'],
  [/^a11y(-check)?$/, 'ds7 audit a11y'],
  [/^seo(-check)?$/, 'ds7 audit seo'],
  [/^perf(-check)?$/, 'ds7 audit perf'],
  [/^lab(-check)?$/, 'ds7 lab'],
  [/^psi$/, 'ds7 psi'],
  [/^i18n-check$/, 'ds7 check (Gate 3)'],
];
const commandFor = (stem) => MAP.find(([re]) => re.test(stem))?.[1];
const write = process.argv.includes('--write');

const tools = ['tools', 'scripts']
  .filter((d) => fs.existsSync(d))
  .flatMap((d) =>
    fs
      .readdirSync(d)
      .filter((f) => /\.(m?js|ts)$/.test(f))
      .map((f) => `${d}/${f}`),
  );
const pkgFile = 'package.json';
const pkg = fs.existsSync(pkgFile) ? JSON.parse(fs.readFileSync(pkgFile, 'utf8')) : { scripts: {} };
const scripts = pkg.scripts || {};

const rows = [];
const rewrites = {};
for (const tool of tools) {
  const stem = path.basename(tool).replace(/\.\w+$/, '');
  const cmd = commandFor(stem);
  if (!cmd) continue;
  const users = Object.entries(scripts).filter(([, line]) => line.includes(tool));
  rows.push({ tool, cmd, users: users.map(([n]) => n) });
  // a script that is exactly `node <tool> [--check|--strict]` can be replaced as it is
  for (const [name, line] of users) {
    const m = line
      .trim()
      .match(
        new RegExp(
          `^node ${tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}((?: --(?:check|strict))*)$`,
        ),
      );
    if (m && !cmd.includes('('))
      rewrites[name] = `${cmd.replace(' --strict', '')}${m[1]}`.replace(
        '--strict --strict',
        '--strict',
      );
  }
}

if (!rows.length) {
  console.log('adopt: no local tool with a ds7 counterpart in tools/ or scripts/');
  process.exit(0);
}
console.log(`adopt: ${rows.length} local tool(s) have a ds7 counterpart\n`);
for (const r of rows)
  console.log(
    `  ${r.tool.padEnd(32)} → ${r.cmd}${r.users.length ? `   (npm scripts: ${r.users.join(', ')})` : ''}`,
  );
const names = Object.keys(rewrites);
if (names.length) {
  console.log(`\n${write ? 'Rewritten' : 'Can be rewritten with --write'}:`);
  for (const n of names) console.log(`  "${n}": "${scripts[n]}"  →  "${rewrites[n]}"`);
}
console.log(
  '\nSettings for these commands live in ds7.config.json (every key: ds7/CONFIG.md); run each new script before deleting the old tool.',
);
if (write && names.length) {
  for (const n of names) scripts[n] = rewrites[n];
  const indent = fs.readFileSync(pkgFile, 'utf8').match(/^\{\n(\s+)/)?.[1] ?? '  ';
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, indent) + '\n');
}
