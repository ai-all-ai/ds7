#!/usr/bin/env node
// `ds7 icons`: the icons and head tags a site needs, checked on the generated site (.output/public):
//   favicon.ico, apple-touch-icon.png (180 x 180), site.webmanifest with 192 and 512 icons and a maskable one,
//   and on every page: the icon and manifest links, theme-color and og:image.
// With errorPages (the default): app/error.vue exists, shows the status code and links to the main sections,
// and the build has 404.html.
//   ds7 icons [--out .output/public] [--json] [--update-baseline] [--no-baseline]
// Settings: "icons" in ds7.config.json: false switches the command off; errorPages: false skips the error page checks.
import fs from 'node:fs';
import path from 'node:path';
import { buildDir, walk } from '../lib/cli.mjs';
import { loadConfig } from '../lib/config.mjs';
import { conclude } from '../lib/report.mjs';

const cfg = loadConfig().icons;
if (cfg.off) {
  console.log('icons: off (icons is false in ds7.config.json)');
  process.exit(0);
}

const OUT = buildDir();
const findings = [];
const bad = (where, detail) => findings.push({ rule: 'icons', where, detail });
const exists = (rel) => fs.existsSync(path.join(OUT, rel));

// width and height of a PNG file, or null when the file is not a PNG
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function checkSize(where, file, w, h) {
  const size = pngSize(file);
  if (size && (size.w !== w || size.h !== h))
    bad(where, `is ${size.w} x ${size.h}, expected ${w} x ${h}`);
}

if (!exists('favicon.ico')) bad('favicon.ico', 'missing: browsers and bookmarks ask for it');
if (!exists('apple-touch-icon.png'))
  bad('apple-touch-icon.png', 'missing: iPhone and iPad home screen icon');
else checkSize('apple-touch-icon.png', path.join(OUT, 'apple-touch-icon.png'), 180, 180);

const manifestFile = 'site.webmanifest';
if (!exists(manifestFile))
  bad(manifestFile, 'missing: Android, install and home screen icons come from it');
else {
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(OUT, manifestFile), 'utf8'));
  } catch (e) {
    bad(manifestFile, `not valid JSON: ${e.message}`);
  }
  if (manifest) {
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    for (const size of ['192x192', '512x512'])
      if (!icons.some((i) => i.sizes === size)) bad(manifestFile, `no ${size} icon`);
    if (!icons.some((i) => /maskable/.test(i.purpose ?? '')))
      bad(manifestFile, 'no maskable icon (purpose "maskable")');
    for (const i of icons) {
      const rel = String(i.src ?? '').replace(/^\//, '');
      if (!rel || !exists(rel)) bad(manifestFile, `icon ${i.src} is missing`);
      else {
        const [w, h] = String(i.sizes ?? '')
          .split('x')
          .map(Number);
        if (w && h) checkSize(manifestFile, path.join(OUT, rel), w, h);
      }
    }
  }
}

// every page: the links a browser, a phone and a link preview read
const pages = walk(OUT).filter((f) => f.endsWith('.html'));
const headTags = [
  ['icon link', /<link[^>]*rel="(?:shortcut )?icon"/i],
  ['apple-touch-icon link', /<link[^>]*rel="apple-touch-icon"/i],
  ['manifest link', /<link[^>]*rel="manifest"/i],
  ['theme-color', /<meta[^>]*name="theme-color"/i],
  ['og:image', /<meta[^>]*property="og:image"/i],
];
for (const file of pages) {
  const where = path.relative(OUT, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  const missing = headTags.filter(([, re]) => !re.test(html)).map(([name]) => name);
  if (missing.length) bad(where, `missing ${missing.join(', ')}`);
}

if (cfg.errorPages) {
  const errorFile = 'app/error.vue';
  if (!fs.existsSync(errorFile))
    bad(errorFile, 'missing: one error page for every status, in the style of the site');
  else {
    const src = fs.readFileSync(errorFile, 'utf8');
    if (!/statusCode/.test(src)) bad(errorFile, 'does not show the status code (error.statusCode)');
    // links to the main sections: entries such as { to: '/about' } or <NuxtLink> tags, at least three
    const entries = (src.match(/\b(?:to|href):\s*['"]/g) ?? []).length;
    const tags = (src.match(/<NuxtLink|<a[\s>]/g) ?? []).length;
    if (Math.max(entries, tags) < 3)
      bad(
        errorFile,
        `links to the main sections: ${Math.max(entries, tags)} found, at least 3 expected`,
      );
  }
  if (!exists('404.html'))
    bad('404.html', 'not in the build: the 404 page is generated from app/error.vue');
}

conclude({
  command: 'icons',
  summary: (n) =>
    n
      ? `icons: ${n} problem(s) in the icons, the head or the error pages`
      : `icons OK: ${pages.length} page(s) with the icons and head tags, error pages in place`,
  findings,
  show: (fresh) => {
    for (const f of fresh) console.log(`  ${f.where}: ${f.detail}`);
    if (fresh.length)
      console.log(
        '\nIcon sources and sizes: see ds7/04-seo-ai-optimization/ICONS-AND-ERROR-PAGES.md',
      );
  },
  notes: [`${pages.length} page(s) checked`],
});
