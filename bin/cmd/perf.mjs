#!/usr/bin/env node
// Performance gate over the generated site (what PageSpeed Insights and the Core Web Vitals reward, as far as a script can prove without
// a browser): `nuxt generate`, then `ds7 audit perf`. Lab numbers (LCP, INP, CLS in seconds) need a browser: `ds7 lab` on a machine that has one,
// and PageSpeed Insights on the live URL (`ds7 psi`).
//  - budgets per page (gzip): JS, CSS, HTML, number of scripts and render-blocking stylesheets
//  - LCP candidate (the first photo of the page): eager, fetchpriority="high", srcset with sizes, the 800 px file under 150 KB
//  - every other photo: loading="lazy" (or fetchpriority="low" when it must stay eager, e.g. a parallax picture)
//  - fonts declare font-display; nothing is loaded from another origin
//  - advice, printed but not failing in this version (CONTRIBUTING.md, "Safe changes"): compressible files without a pre-compressed
//    .br or .gz variant (nitro.compressPublicAssets), and a missing 404.html (03-performance-web-vitals/DELIVERY-AND-CACHING.md)
//   ds7 audit perf [--out .output/public]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parse, all, attr, ancestors } from '../lib/html.mjs';
import { internalRoutes, loadConfig, siteUrl } from '../lib/config.mjs';
import { conclude, showByRule } from '../lib/report.mjs';
import { arg, buildDir, walk } from '../lib/cli.mjs';

const cfg = loadConfig();

const BUDGET = cfg.perf.budgets;
const OUT = buildDir();
const SITE = siteUrl(cfg);
const walkBuild = (d) => walk(d, ['_nuxt']);
const file = (url) => path.join(OUT, decodeURIComponent(url.split('?')[0]));
const gz = (url) => {
  const f = file(url);
  return fs.existsSync(f) ? zlib.gzipSync(fs.readFileSync(f)).length : 0;
};
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const problems = [],
  rows = [];
const bad = (page, rule, detail) => problems.push({ where: page, rule, detail });
const isInternal = internalRoutes(cfg);

for (const f of walkBuild(OUT).filter((f) => path.basename(f) === 'index.html')) {
  const rel = '/' + path.relative(OUT, path.dirname(f)).split(path.sep).join('/');
  const r = rel === '/.' || rel === '/' ? '/' : rel;
  if (isInternal(r)) continue;
  const raw = fs.readFileSync(f, 'utf8');
  const root = parse(raw);
  const links = all(root, (n) => n.tag === 'link'),
    scripts = all(root, (n) => n.tag === 'script');

  // budgets
  const sheets = links.filter((l) => attr(l, 'rel') === 'stylesheet');
  const css = sheets.map((l) => attr(l, 'href'));
  // a disabled stylesheet (Nuxt 4.7 writes lazy component CSS so) or one for print does not block the first render
  const blocking = sheets.filter(
    (l) => attr(l, 'disabled') === undefined && !/^\s*print\s*$/i.test(attr(l, 'media') || ''),
  );
  const js = [
    ...new Set([
      ...links.filter((l) => attr(l, 'rel') === 'modulepreload').map((l) => attr(l, 'href')),
      ...scripts.filter((s) => attr(s, 'src')).map((s) => attr(s, 'src')),
    ]),
  ];
  const sizes = {
    html: zlib.gzipSync(raw).length,
    css: css.reduce((s, u) => s + gz(u), 0),
    js: js.reduce((s, u) => s + gz(u), 0),
  };
  rows.push(
    `${r.padEnd(14)} html ${kb(sizes.html).padStart(8)}  css ${kb(sizes.css).padStart(8)} (${css.length})  js ${kb(sizes.js).padStart(9)} (${js.length})`,
  );
  if (sizes.html > BUDGET.html)
    bad(r, 'budget-html', `${kb(sizes.html)} gzip (budget ${kb(BUDGET.html)})`);
  if (sizes.css > BUDGET.css)
    bad(r, 'budget-css', `${kb(sizes.css)} gzip (budget ${kb(BUDGET.css)})`);
  if (sizes.js > BUDGET.js) bad(r, 'budget-js', `${kb(sizes.js)} gzip (budget ${kb(BUDGET.js)})`);
  if (js.length > BUDGET.scripts)
    bad(r, 'budget-scripts', `${js.length} scripts (budget ${BUDGET.scripts})`);
  if (blocking.length > BUDGET.stylesheets)
    bad(
      r,
      'budget-stylesheets',
      `${blocking.length} render-blocking stylesheets (budget ${BUDGET.stylesheets})`,
    );

  // other origins
  const origin = (u) =>
    u && /^(https?:)?\/\//.test(u) ? new URL(u.startsWith('//') ? `https:${u}` : u).origin : null;
  for (const n of all(root, (x) => ['link', 'script', 'img', 'source', 'iframe'].includes(x.tag))) {
    const u =
      attr(n, 'src') ||
      attr(n, 'srcset')?.split(/\s+/)[0] ||
      (n.tag === 'link' &&
      ['stylesheet', 'preload', 'modulepreload', 'icon'].includes(attr(n, 'rel'))
        ? attr(n, 'href')
        : null);
    const o = origin(u);
    if (o && o !== SITE) bad(r, 'third-party', `${n.tag} loads ${u}`);
  }

  // photos (raster pictures with a srcset: what UiImg builds for real photos); the first one is the LCP candidate
  const photos = all(
    root,
    (n) =>
      n.tag === 'img' &&
      /\.(webp|jpe?g|png|avif)(\?|$)/.test(attr(n, 'src') || '') &&
      attr(n, 'srcset'),
  );
  photos.forEach((img, i) => {
    const lazy = attr(img, 'loading') === 'lazy';
    if (i === 0) {
      if (lazy) bad(r, 'lcp-lazy', `first photo ${attr(img, 'src')} is lazy-loaded`);
      if (attr(img, 'fetchpriority') !== 'high')
        bad(r, 'lcp-priority', `first photo ${attr(img, 'src')} lacks fetchpriority="high"`);
      const small = (attr(img, 'srcset') || '')
        .split(',')
        .map((s) => s.trim().split(/\s+/))
        .find(([, w]) => w === '800w');
      if (
        small &&
        fs.existsSync(file(small[0])) &&
        fs.statSync(file(small[0])).size > BUDGET.lcp800
      )
        bad(
          r,
          'lcp-weight',
          `${small[0]} is ${kb(fs.statSync(file(small[0])).size)} (budget ${kb(BUDGET.lcp800)})`,
        );
    } else if (!lazy && attr(img, 'fetchpriority') !== 'low')
      bad(
        r,
        'photo-lazy',
        `${attr(img, 'src')} is photo number ${i + 1}: lazy-load it, or give it fetchpriority="low" when it must stay eager`,
      );
    if (!attr(img, 'sizes'))
      bad(r, 'srcset-sizes', `${attr(img, 'src')} has srcset in w units without sizes`);
  });
}

// fonts
const cssDir = path.join(OUT, '_nuxt');
const allCss = (fs.existsSync(cssDir) ? fs.readdirSync(cssDir) : [])
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8'))
  .join('\n');
const faces = [...allCss.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);
// a metric fallback (src: local(Arial) only) downloads nothing, so it has no swap period to set
const downloads = (b) => /url\(/.test(b);
const noDisplay = faces.filter(
  (b) => downloads(b) && !/font-display\s*:\s*(swap|optional|fallback)/.test(b),
);
if (noDisplay.length)
  bad('(css)', 'font-display', `${noDisplay.length} @font-face rules without font-display: swap`);
const woff = (fs.existsSync(cssDir) ? fs.readdirSync(cssDir) : []).filter((f) =>
  /\.woff2?$/.test(f),
);
const woffFirst = faces.filter((b) => {
  const i = b.indexOf('.woff)'),
    j = b.indexOf('.woff2)');
  return i > -1 && j > -1 && i < j;
});
if (woffFirst.length)
  bad('(css)', 'font-order', `${woffFirst.length} @font-face rules list .woff before .woff2`);

// advice: printed, never fails in this version
const advice = [];
const MIN_COMPRESS = 1024; // smaller files gain nothing; Nitro skips them too
const uncompressed = walk(OUT).filter(
  (f) =>
    /\.(html|js|mjs|css|svg|json|xml|txt)$/.test(f) &&
    fs.statSync(f).size >= MIN_COMPRESS &&
    !fs.existsSync(`${f}.br`) &&
    !fs.existsSync(`${f}.gz`),
);
if (uncompressed.length)
  advice.push(
    `precompressed: ${uncompressed.length} compressible file(s) have no .br or .gz variant, for example ${path.relative(OUT, uncompressed[0]).split(path.sep).join('/')}; set nitro.compressPublicAssets (03-performance-web-vitals/DELIVERY-AND-CACHING.md, section 1)`,
  );
if (!fs.existsSync(path.join(OUT, '404.html')))
  advice.push(
    "404-page: the build has no 404.html, so unknown routes cannot get the site's own 404 page (09-security-errors/SECURITY-AND-ERRORS.md, section 5)",
  );

conclude({
  command: 'perf',
  cli: 'audit perf',
  summary: (n) =>
    `perf-check: ${rows.length} pages, ${faces.length} @font-face rules, ${woff.length} font files, ${n} problems`,
  findings: problems,
  show: (fresh) => {
    console.log();
    for (const row of rows) console.log('  ' + row);
    showByRule(8)(fresh);
    if (advice.length) {
      console.log('\nadvice (does not fail in this version):');
      for (const line of advice) console.log(`  ${line}`);
    }
  },
  notes: advice,
});
