#!/usr/bin/env node
// `ds7 console`: opens every generated page in a browser and fails on anything the browser complains about: console errors and
// warnings (hydration mismatches included), uncaught exceptions, failed requests and responses with status 400 or more.
// Each page is loaded, scrolled to the end (so lazy parts run) and given a moment to settle, at each width.
//   ds7 console [--out .output/public] [--widths 1440,390] [--routes /,/about/] [--json]
// Settings: "console" in ds7.config.json: widths, warnings (true: warnings fail too, the default; false: errors only),
// allow (regular expressions of known, explained messages). Developer pages (seo.internal) are left out. Needs Playwright.
import fs from 'node:fs';
import path from 'node:path';
import { serve, routesOf } from '../lib/static-server.mjs';
import { loadConfig, internalRoutes } from '../lib/config.mjs';
import { conclude } from '../lib/report.mjs';
import { requireOptional } from '../lib/optional.mjs';
import { arg, buildDir } from '../lib/cli.mjs';

const all = loadConfig();
const cfg = all.console;
const OUT = buildDir();
const WIDTHS = arg('widths') ? arg('widths').split(',').map(Number) : cfg.widths;
const { chromium } = requireOptional('playwright', 'ds7 console');
const ALLOWED = cfg.allow.map((s) => new RegExp(s));

const { base, close } = await serve(OUT);
const routes = arg('routes') ? arg('routes').split(',') : routesOf(OUT, internalRoutes(all));
const findings = [];
let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  close();
  console.log(
    `ds7 console: the browser does not start (${e.message.split('\n')[0]}). Run: npx playwright install chromium`,
  );
  process.exit(process.env.CI ? 1 : 0);
}
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  for (const r of routes) {
    const pg = await ctx.newPage();
    const seen = new Set();
    const note = (rule, text) => {
      const detail = String(text).replace(/\s+/g, ' ').slice(0, 200);
      if (ALLOWED.some((re) => re.test(detail)) || seen.has(rule + detail)) return;
      seen.add(rule + detail);
      findings.push({ rule, where: `${r}@${w}`, detail });
    };
    pg.on('pageerror', (e) => note('exception', e.message ?? e));
    pg.on('console', (m) => {
      if (m.type() === 'error') note('console-error', m.text());
      else if (m.type() === 'warning' && cfg.warnings) note('console-warning', m.text());
    });
    pg.on('requestfailed', (q) =>
      note('request-failed', `${q.url().replace(base, '')} ${q.failure()?.errorText ?? ''}`),
    );
    pg.on('response', (res) => {
      if (res.status() >= 400) note(`http-${res.status()}`, res.url().replace(base, ''));
    });
    try {
      await pg.goto(base + r, { waitUntil: 'load', timeout: 30000 });
      await pg.waitForTimeout(1000);
      await pg.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          scrollTo(0, y);
          await new Promise((ok) => setTimeout(ok, 60));
        }
        scrollTo(0, 0);
      });
      await pg.waitForTimeout(500);
    } catch (e) {
      note('not-loaded', e.message);
    }
    await pg.close();
  }
  await ctx.close();
}
await browser.close();
close();

conclude({
  command: 'console',
  summary: (n) =>
    `console: ${routes.length} page(s) × ${WIDTHS.length} width(s), ${n ? `${n} problem(s)` : 'clean'}`,
  findings,
  show: (fresh) => {
    // one line per message, with the pages where it happens
    const by = fresh.reduce((a, f) => ((a[`${f.rule}: ${f.detail}`] ||= []).push(f.where), a), {});
    for (const [line, where] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`\n${line}`);
      console.log(
        `  ${where.slice(0, 8).join(', ')}${where.length > 8 ? ` +${where.length - 8}` : ''}`,
      );
    }
    if (fresh.length)
      console.log('\nA known, explained message goes into console.allow in ds7.config.json.');
  },
});
