#!/usr/bin/env node
// `ds7 unused`: files and exports nothing refers to: components, composables and utils, data files, and assets in public/.
// A name counts as used when any other source file mentions it (Nuxt auto-imports, so there is no import line to follow).
//   ds7 unused [--json] [--update-baseline]
// Settings: "unused" in ds7.config.json: components, composables, data, assets (each true/false), publicDir, sources (folders
// and files searched for uses), ignore (globs of files never reported: generated variants, folders filled by a dynamic path).
import fs from 'node:fs';
import path from 'node:path';
import { listFiles, read, glob, componentName } from '../lib/project.mjs';
import { loadConfig } from '../lib/config.mjs';
import { conclude, showByRule } from '../lib/report.mjs';

const cfg = loadConfig().unused;
if (cfg.off) {
  console.log('unused: off (unused is false in ds7.config.json)');
  process.exit(0);
}
const files = listFiles();
const ignore = cfg.ignore.map(glob);
const ignored = (f) => ignore.some((re) => re.test(f));
const inSources = (f) => cfg.sources.some((s) => f === s || f.startsWith(`${s}/`));
const code = files.filter(
  (f) => inSources(f) && /\.(vue|ts|tsx|js|mjs|jsx|json|css|scss|md|html|yml|yaml)$/.test(f),
);
const text = new Map(code.map((f) => [f, read(f)]));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const elsewhere = (self, re) => [...text].some(([f, t]) => f !== self && re.test(t));
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const findings = [];
const add = (rule, where, detail) => !ignored(where) && findings.push({ rule, where, detail });

if (cfg.components)
  for (const f of files.filter((f) => /^app\/components\/.+\.vue$/.test(f))) {
    const name = componentName(f);
    // with and without the folder prefix (components: { pathPrefix: false }), plain and Lazy, Pascal and kebab case
    const names = [name, path.basename(f, '.vue')];
    const variants = names
      .flatMap((n) => [n, kebab(n), `Lazy${n}`, `lazy-${kebab(n)}`])
      .map(esc)
      .join('|');
    if (!elsewhere(f, new RegExp(`(?<![\\w-])(?:${variants})(?![\\w-])`)))
      add('component', f, `${name} is used nowhere`);
  }

if (cfg.composables)
  for (const f of files.filter(
    (f) => /^app\/(?:composables|utils)\/.+\.[jt]s$/.test(f) && !/\.(test|spec)\.[jt]s$/.test(f),
  )) {
    const exported = [
      ...read(f).matchAll(/export\s+(?:const|let|function|async\s+function|class)\s+(\w+)/g),
    ].map((m) => m[1]);
    const dead = exported.filter((n) => !elsewhere(f, new RegExp(`\\b${esc(n)}\\b`)));
    if (exported.length && dead.length === exported.length)
      add('composable', f, `no export is used (${dead.join(', ')})`);
    else for (const n of dead) add('export', f, `${n} is exported but used nowhere`);
  }

if (cfg.data)
  for (const f of files.filter(
    (f) => /^app\/data\/.+\.(ts|js|json)$/.test(f) && !/\.(test|spec)\.[jt]s$/.test(f),
  )) {
    const base = esc(path.basename(f).replace(/\.\w+$/, ''));
    if (!elsewhere(f, new RegExp(`[/'"]${base}(?:\\.\\w+)?['"]`)))
      add('data', f, 'no file imports it');
  }

if (cfg.assets) {
  const words = new Set([...text.values()].join('\n').match(/[\w@.-]+/g) || []);
  const pub = `${cfg.publicDir}/`;
  for (const f of files.filter(
    (f) => f.startsWith(pub) && /\.(webp|avif|png|jpe?g|gif|svg|ico|mp4|webm|pdf|woff2?)$/i.test(f),
  )) {
    const base = path.basename(f);
    if (
      /^(favicon|apple-touch-icon|icon|og|android-chrome|mstile|safari-pinned-tab)[\w.-]*$/i.test(
        base,
      )
    )
      continue;
    // a responsive variant (hero-800.webp) is used when its base image (hero.webp, hero) is named
    const stem = base.replace(/\.\w+$/, '');
    const parent = stem.replace(/-\d{2,4}w?$/, '');
    const named = (n) => words.has(n) || [...words].some((w) => w.startsWith(`${n}.`));
    if (!named(stem) && !(parent !== stem && named(parent)))
      add('asset', f, `${Math.round(fs.statSync(f).size / 1024)} kB, no source file names it`);
  }
}

conclude({
  command: 'unused',
  summary: (n) =>
    n ? `unused: ${n} thing(s) nothing refers to` : 'unused OK: everything is referred to',
  findings,
  show: (fresh) => {
    showByRule(process.argv.includes('--all') ? Infinity : 30)(fresh);
    if (fresh.length)
      console.log(
        '\nA name built at run time (a dynamic path, `<component :is>`) is not seen: add such files to unused.ignore.',
      );
  },
});
