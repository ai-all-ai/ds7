#!/usr/bin/env node
// Lab check in a real browser over the generated site: Largest Contentful Paint (and which element it is), Cumulative Layout Shift and main-thread blocking
// of the first load, on every public page, with a phone profile, a 4x slower CPU and a slow 4G network (the PageSpeed Insights mobile profile).
// The median of several runs is compared with the Core Web Vitals "good" limits. Lab numbers find regressions and the LCP element; they are not the field data of
// real visitors: that comes from Search Console and `npm run psi`. Needs Playwright with Chromium (as the console check); run it on a machine that has a browser.
//   ds7 lab [--out .output/public] [--routes /,/about/] [--runs 3]
//   ds7 lab --axe [--widths 390,820,1440]   accessibility with axe-core (needs `npm i -D axe-core`): WCAG A and AA tags, fails on any violation
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serve, routesOf } from '../lib/static-server.mjs';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const OUT = path.resolve(arg('out', '.output/public'));
const RUNS = Number(arg('runs', 3));
const LIMIT = { lcp: 2500, cls: 0.1, blocking: 200 };
const req = createRequire(path.resolve('package.json'));
let chromium, devices;
try {
  ({ chromium, devices } = req('playwright'));
} catch {
  console.error(
    'Playwright is missing. Run:  npm i -D playwright && npx playwright install chromium',
  );
  process.exit(1);
}
if (!fs.existsSync(OUT)) {
  console.error(`Folder ${OUT} is missing. Run first: npm run generate`);
  process.exit(1);
}

const { base, close } = await serve(OUT);
const routes = arg('routes', '') ? arg('routes').split(',') : routesOf(OUT);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

// observers installed before the page runs
const observe = () => {
  const m = (window.__m = { lcp: 0, lcpEl: '', cls: 0, blocking: 0 });
  const watch = (type, fn) =>
    new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true });
  watch('largest-contentful-paint', (e) => {
    m.lcp = e.startTime;
    m.lcpEl = `${e.element?.tagName?.toLowerCase() ?? '?'}${e.url ? ` ${e.url.split('/').pop()}` : ''}`;
  });
  watch('layout-shift', (e) => {
    if (!e.hadRecentInput) m.cls += e.value;
  });
  watch('longtask', (e) => {
    m.blocking += Math.max(0, e.duration - 50);
  });
};

const browser = await chromium.launch();
const problems = [];
// accessibility with axe-core at three widths (SPEC section 5, gate 7)
if (process.argv.includes('--axe')) {
  let axeSrc;
  try {
    axeSrc = fs.readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8');
  } catch {
    console.error('axe-core is missing. Run:  npm i -D axe-core');
    process.exit(1);
  }
  const TAGS = arg('tags', 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa').split(',');
  const WIDTHS = arg('widths', '390,820,1440').split(',').map(Number);
  const found = new Map();
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    for (const r of routes) {
      const page = await ctx.newPage();
      await page.goto(base + r, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(1200);
      await page.addStyleTag({
        content: '*,*::before,*::after{transition:none!important;animation:none!important}',
      });
      await page.addScriptTag({ content: axeSrc });
      const res = await page.evaluate(
        (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
        TAGS,
      );
      for (const v of res.violations) {
        const entry = found.get(v.id) || { help: v.help, impact: v.impact, where: [] };
        entry.where.push(`${r}@${w}: ${v.nodes[0]?.target?.join(' ')}`);
        found.set(v.id, entry);
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  close();
  console.log(
    `axe: ${routes.length} pages x ${WIDTHS.length} widths, ${found.size} rules violated`,
  );
  for (const [id, e] of found) {
    console.log(`\n${id} (${e.impact}): ${e.help}`);
    for (const x of e.where.slice(0, 5)) console.log(`  ${x}`);
  }
  process.exit(found.size ? 1 : 0);
}
console.log(
  `lab-check: ${routes.length} pages, median of ${RUNS} runs, Pixel 7, CPU x4, slow 4G\n`,
);
for (const r of routes) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await page.addInitScript(observe);
    await page.goto(base + r, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    runs.push(await page.evaluate(() => window.__m));
    await ctx.close();
  }
  const lcp = median(runs.map((x) => x.lcp)),
    cls = median(runs.map((x) => x.cls)),
    blocking = median(runs.map((x) => x.blocking));
  const el = runs.find((x) => x.lcp === lcp)?.lcpEl;
  console.log(
    `  ${r.padEnd(16)} LCP ${(lcp / 1000).toFixed(2)} s (${el})  CLS ${cls.toFixed(3)}  blocking ${Math.round(blocking)} ms`,
  );
  if (lcp > LIMIT.lcp)
    problems.push(
      `${r}: LCP ${(lcp / 1000).toFixed(2)} s over ${LIMIT.lcp / 1000} s (element: ${el})`,
    );
  if (cls > LIMIT.cls) problems.push(`${r}: CLS ${cls.toFixed(3)} over ${LIMIT.cls}`);
  if (blocking > LIMIT.blocking)
    problems.push(`${r}: main thread blocked ${Math.round(blocking)} ms over ${LIMIT.blocking} ms`);
}
await browser.close();
close();
console.log(`\n${problems.length} problems`);
for (const p of problems) console.log(`  ${p}`);
process.exit(problems.length ? 1 : 0);
