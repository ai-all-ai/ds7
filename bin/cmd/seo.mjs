#!/usr/bin/env node
// SEO gate over the generated site: `nuxt generate`, then `ds7 audit seo`. It needs the build, so it is not part of `check:strict`.
//  Per indexable page: title 20-60 characters and unique, description 70-160 and unique, one canonical equal to the page URL, Open Graph and
//  Twitter tags with an absolute image that exists, the primary query of seo.targets (ds7.config.json, optional) in the title and in the description or a
//  heading (one query per page), JSON-LD that parses with resolvable @id references, enough text, at least two links from other pages.
//  Several languages: every hreflang alternate is a page of the build that links back; the page lists itself and an x-default.
//  Social image: PNG, JPEG or WebP, at least seo.socialImage.minWidth wide (1200), a ratio between minRatio and maxRatio (1.6 to 2.1), at most maxKB (300).
//  Site level: sitemap.xml lists exactly the indexable pages and any <lastmod> is a real, past date, robots.txt blocks only the internal tools and points at the sitemap,
//  llms.txt (when present, or required by seo.llms) has a title and links that resolve, no placeholder contact data in structured data.
//  seo.trailingSlash: true when the site serves /about/ (canonical, sitemap and structured data then end in a slash).
//   ds7 audit seo [--out .output/public] [--site https://example.com]
import fs from 'node:fs';
import path from 'node:path';
import { internalRoutes, loadConfig, siteUrl } from '../lib/config.mjs';
import { conclude, showByRule } from '../lib/report.mjs';
import { imageSize } from '../lib/image-size.mjs';
import { arg, buildDir, walk } from '../lib/cli.mjs';

const cfg = loadConfig();

const OUT = buildDir();
const SITE = siteUrl(cfg, arg('site'));
if (!SITE) {
  console.error(
    'Site URL not found: pass --site, set seo.site in ds7.config.json or runtimeConfig.public.siteUrl in nuxt.config.ts',
  );
  process.exit(1);
}

const walkBuild = (d) => walk(d, ['_nuxt']);
const read = (f) => fs.readFileSync(f, 'utf8');
const decode = (s) =>
  s
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
const strip = (s) =>
  decode(s.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
const meta = (h, attr, name) => {
  const m = h.match(new RegExp(`<meta[^>]*\\s${attr}="${name}"[^>]*>`, 'i'));
  const c = m && m[0].match(/\scontent="([^"]*)"/);
  return c ? decode(c[1]) : undefined;
};
const link = (h, rel) => {
  const m = h.match(new RegExp(`<link[^>]*\\srel="${rel}"[^>]*>`, 'i'));
  const c = m && m[0].match(/\shref="([^"]*)"/);
  return c ? c[1] : undefined;
};
// the address of a route; seo.trailingSlash: true when the site serves /about/ and not /about
const urlOf = (route) =>
  route === '/' ? `${SITE}/` : `${SITE}${route}${cfg.seo.trailingSlash ? '/' : ''}`;
const noSlash = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p);
// <link rel="alternate" hreflang="..." href="..."> of a page
const alternates = (h) =>
  [...h.matchAll(/<link[^>]*\srel="alternate"[^>]*>/gi)]
    .map((m) => ({
      lang: (m[0].match(/\shreflang="([^"]*)"/) || [])[1],
      href: (m[0].match(/\shref="([^"]*)"/) || [])[1],
    }))
    .filter((a) => a.lang);

const problems = [],
  notes = [];
const bad = (page, rule, detail) => problems.push({ where: page, rule, detail });

// pages of the build
const pages = walkBuild(OUT)
  .filter((f) => path.basename(f) === 'index.html')
  .map((f) => {
    const rel = '/' + path.relative(OUT, path.dirname(f)).split(path.sep).join('/');
    const route = rel === '/.' || rel === '/' ? '/' : rel;
    const html = read(f);
    const robots = meta(html, 'name', 'robots') || '';
    return { route, html, noindex: /noindex/i.test(robots) };
  });
const internal = cfg.seo.internal.map(noSlash);
const isInternal = internalRoutes(cfg);
const indexable = pages.filter((p) => !p.noindex && !isInternal(p.route));

// targets
const targets =
  typeof cfg.seo.targets === 'string' ? JSON.parse(read(cfg.seo.targets)) : cfg.seo.targets; // an object { route: query | { primary } } or the path of a JSON file with it
const STOP = new Set(cfg.seo.stopwords);
const stems = (s) =>
  norm(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.slice(0, 4));
const holds = (text, words) => {
  const have = new Set(stems(text));
  return words.every((w) => have.has(w));
};
const seenQuery = new Map();

// the social preview image, once per file: format, size in bytes, pixels and shape
const checkedImages = new Set();
const socialImageProblems = (file, og) => {
  const want = cfg.seo.socialImage,
    out = [];
  if (/\.svg$/i.test(file)) return [`${og} is an SVG; social networks need PNG, JPEG or WebP`];
  const buf = fs.readFileSync(file);
  if (buf.length > want.maxKB * 1024)
    out.push(
      `${og} is ${Math.round(buf.length / 1024)} KB (at most ${want.maxKB} KB, larger previews are dropped by some chat apps)`,
    );
  const size = imageSize(buf);
  if (size) {
    if (size.width < want.minWidth)
      out.push(`${og} is ${size.width} px wide (at least ${want.minWidth})`);
    const ratio = size.width / size.height;
    if (ratio < want.minRatio || ratio > want.maxRatio)
      out.push(
        `${og} is ${size.width}x${size.height} (landscape between ${want.minRatio}:1 and ${want.maxRatio}:1 is expected; 1200 x 630 is the safe size)`,
      );
  }
  return out;
};

const titles = new Map(),
  descs = new Map();
for (const p of indexable) {
  const { route, html } = p;
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '').trim();
  const desc = (meta(html, 'name', 'description') || '').trim();
  // title and description
  if (title.length < 20 || title.length > 60)
    bad(route, 'title-length', `${title.length} characters (20-60): ${title}`);
  if (desc.length < 70 || desc.length > 160)
    bad(route, 'description-length', `${desc.length} characters (70-160)`);
  if (titles.has(title)) bad(route, 'title-duplicate', `same title as ${titles.get(title)}`);
  else titles.set(title, route);
  if (descs.has(desc))
    bad(route, 'description-duplicate', `same description as ${descs.get(desc)}`);
  else descs.set(desc, route);
  // canonical and social tags
  const canon = link(html, 'canonical');
  if (canon !== urlOf(route)) bad(route, 'canonical', `${canon} (expected ${urlOf(route)})`);
  if ((html.match(/rel="canonical"/g) || []).length !== 1)
    bad(route, 'canonical', 'not exactly one canonical link');
  // languages: every alternate is a page of the build that links back; the page lists itself and an x-default
  const alts = alternates(html);
  if (alts.length) {
    if (!alts.some((a) => a.href === canon))
      bad(route, 'hreflang', 'no alternate that points at the page itself');
    if (!alts.some((a) => a.lang === 'x-default')) bad(route, 'hreflang', 'no x-default alternate');
    for (const a of alts) {
      const target = pages.find((q) => link(q.html, 'canonical') === a.href);
      if (!target)
        bad(route, 'hreflang', `${a.lang} points at ${a.href}, which is not a page of the build`);
      else if (target.route !== route && !alternates(target.html).some((b) => b.href === canon))
        bad(route, 'hreflang', `${a.href} does not link back to this page`);
    }
  }
  for (const [attr, name] of [
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['property', 'og:url'],
    ['property', 'og:image'],
    ['property', 'og:image:alt'],
    ['property', 'og:site_name'],
    ['property', 'og:locale'],
    ['property', 'og:type'],
    ['name', 'twitter:card'],
    ['name', 'twitter:image'],
  ]) {
    if (!meta(html, attr, name)) bad(route, 'social-tags', `missing ${name}`);
  }
  if (meta(html, 'property', 'og:url') !== urlOf(route))
    bad(route, 'social-tags', `og:url is ${meta(html, 'property', 'og:url')}`);
  if (meta(html, 'property', 'og:title') !== title)
    bad(route, 'social-tags', 'og:title differs from <title>');
  const og = meta(html, 'property', 'og:image');
  if (og) {
    if (!og.startsWith(`${SITE}/`)) bad(route, 'social-image', `not absolute on ${SITE}: ${og}`);
    else {
      const file = path.join(OUT, decodeURIComponent(og.slice(SITE.length)));
      if (!fs.existsSync(file)) bad(route, 'social-image', `file does not exist: ${og}`);
      else if (!checkedImages.has(file)) {
        checkedImages.add(file);
        for (const detail of socialImageProblems(file, og)) bad(route, 'social-image', detail);
      }
    }
  }
  if (!/<meta[^>]*name="viewport"/i.test(html)) bad(route, 'viewport', 'missing viewport meta');
  // primary query
  const t0 = targets?.[route];
  const t = t0 && { primary: typeof t0 === 'string' ? t0 : t0.primary };
  if (targets && !t) bad(route, 'target', 'no entry in seo.targets of ds7.config.json');
  else if (t) {
    const words = stems(t.primary);
    const heads = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g)].map((m) => strip(m[1]));
    if (!holds(title, words)) bad(route, 'target-title', `title lacks "${t.primary}"`);
    if (!holds(desc, words) && !heads.some((h) => holds(h, words)))
      bad(route, 'target-copy', `neither the description nor a heading holds "${t.primary}"`);
    if (seenQuery.has(norm(t.primary)))
      bad(route, 'target-duplicate', `same primary query as ${seenQuery.get(norm(t.primary))}`);
    else seenQuery.set(norm(t.primary), route);
  }
  // content
  const body = strip(
    html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' '),
  );
  const words = body.split(' ').length;
  if (words < 300) bad(route, 'thin-content', `${words} words (at least 300)`);
  if ((html.match(/<h2\b/g) || []).length < 2) bad(route, 'headings', 'fewer than two h2');

  // structured data
  const blocks = [
    ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  if (!blocks.length) bad(route, 'json-ld', 'no structured data');
  for (const raw of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      bad(route, 'json-ld', `does not parse: ${e.message}`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org')
      bad(route, 'json-ld', '@context is not https://schema.org');
    const graph = data['@graph'];
    if (!Array.isArray(graph)) {
      bad(route, 'json-ld', 'not one @graph (DS7: one graph per page)');
      continue;
    }
    const ids = new Set();
    for (const n of graph) {
      if (!n['@type']) bad(route, 'json-ld', 'node without @type');
      if (n['@id']) {
        if (ids.has(n['@id'])) bad(route, 'json-ld', `duplicate @id ${n['@id']}`);
        ids.add(n['@id']);
      }
    }
    const refs = [];
    const scan = (v) => {
      if (Array.isArray(v)) v.forEach(scan);
      else if (v && typeof v === 'object') {
        const k = Object.keys(v);
        if (k.length === 1 && k[0] === '@id') refs.push(v['@id']);
        else Object.values(v).forEach(scan);
      }
    };
    graph.forEach((n) => Object.entries(n).forEach(([k, v]) => k !== '@id' && scan(v)));
    for (const r of refs)
      if (!ids.has(r)) bad(route, 'json-ld', `@id ${r} is referenced but not defined in the graph`);
    const type = (n) => [].concat(n['@type']);
    const org = graph.find(
      (n) =>
        /#(organi[sz]ation|business)$/i.test(n['@id'] || '') ||
        type(n).some((t) => ['Organization', 'LocalBusiness'].includes(t)),
    );
    if (!org) bad(route, 'json-ld', 'no organisation node');
    else
      for (const k of ['name', 'url', 'logo'])
        if (!org[k]) bad(route, 'json-ld', `organisation lacks ${k}`);
    const web = graph.find((n) => type(n).includes('WebPage'));
    if (!web) bad(route, 'json-ld', 'no WebPage node');
    else if (web.url !== urlOf(route))
      bad(route, 'json-ld', `WebPage url ${web.url} is not ${urlOf(route)}`);
    const crumbs = graph.find((n) => type(n).includes('BreadcrumbList'));
    if (route !== '/' && !crumbs) bad(route, 'json-ld', 'no BreadcrumbList');
    for (const [i, it] of (crumbs?.itemListElement || []).entries())
      if (it.position !== i + 1 || !it.name || !it.item)
        bad(route, 'json-ld', 'BreadcrumbList item is not numbered 1..n with name and item');
    for (const n of graph.filter((x) => type(x).includes('Service')))
      for (const k of ['name', 'provider']) if (!n[k]) bad(route, 'json-ld', `Service lacks ${k}`);
    if (new RegExp(cfg.seo.placeholders.join('|'), 'i').test(raw))
      bad(route, 'json-ld', 'placeholder contact data in structured data');
    if (org && !org.address)
      notes.push(
        `${route}: no address in the organisation node (Google needs one for Local Business rich results; a service-area business may keep it in the business profile only)`,
      );
  }
}

// sitemap
const sitemapFile = path.join(OUT, 'sitemap.xml');
if (!fs.existsSync(sitemapFile)) bad('/sitemap.xml', 'sitemap', 'missing');
else {
  const xml = read(sitemapFile);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (new Set(locs).size !== locs.length) bad('/sitemap.xml', 'sitemap', 'duplicate URLs');
  for (const l of locs)
    if (!l.startsWith(`${SITE}/`)) bad('/sitemap.xml', 'sitemap', `not on ${SITE}: ${l}`);
  // lastmod is optional, but when it is there it must be a real date that is not in the future
  const mods = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1].trim());
  for (const m of mods) {
    const t = Date.parse(m);
    if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(m) || Number.isNaN(t))
      bad('/sitemap.xml', 'sitemap-lastmod', `"${m}" is not a W3C date (YYYY-MM-DD)`);
    else if (t > Date.now() + 864e5)
      bad('/sitemap.xml', 'sitemap-lastmod', `${m} is in the future`);
  }
  // seo.lastmod: "warn" (default) notes a sitemap without dates, "require" fails on it, "off" stays silent (a project that has no real edit dates)
  if (!mods.length && locs.length) {
    const why =
      'sitemap.xml has no <lastmod>; add the date each page really changed so crawlers can skip unchanged pages';
    if (cfg.seo.lastmod === 'require') bad('/sitemap.xml', 'sitemap-lastmod', why);
    else if (cfg.seo.lastmod !== 'off') notes.push(`${why} (or set seo.lastmod to "off")`);
  }
  const want = new Set(indexable.map((p) => urlOf(p.route)));
  for (const l of locs)
    if (!want.has(l))
      bad('/sitemap.xml', 'sitemap', `${l} is listed but is noindex, internal or missing`);
  for (const w of want)
    if (!locs.includes(w)) bad('/sitemap.xml', 'sitemap', `${w} is indexable but not listed`);
}
// robots.txt
const robotsFile = path.join(OUT, 'robots.txt');
if (!fs.existsSync(robotsFile)) bad('/robots.txt', 'robots', 'missing');
else {
  const txt = read(robotsFile);
  if (
    !new RegExp(
      `^Sitemap:\\s*${SITE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml\\s*$`,
      'm',
    ).test(txt)
  )
    bad('/robots.txt', 'robots', `no "Sitemap: ${SITE}/sitemap.xml" line`);
  const disallowed = [...txt.matchAll(/^Disallow:\s*(\S+)/gm)].map((m) => noSlash(m[1]));
  for (const d of disallowed)
    if (indexable.some((p) => p.route === d || p.route.startsWith(d + '/')))
      bad('/robots.txt', 'robots', `blocks the indexable page ${d}`);
  for (const d of internal)
    if (!disallowed.includes(noSlash(d)))
      bad('/robots.txt', 'robots', `does not block the internal tool ${d}`);
  for (const d of disallowed)
    if (!internal.map(noSlash).includes(d))
      bad(
        '/robots.txt',
        'robots',
        `blocks ${d}: a noindex page must stay crawlable so Google can read the tag; add it to internalPaths only if it is a tool`,
      );
}

// llms.txt: an optional file for AI assistants (a title and links to the pages worth reading); checked when it exists, required when seo.llms is true
const llmsFile = path.join(OUT, 'llms.txt');
if (!fs.existsSync(llmsFile)) {
  if (cfg.seo.llms) bad('/llms.txt', 'llms-txt', 'missing (seo.llms is on in ds7.config.json)');
} else {
  const txt = read(llmsFile);
  if (!/^# \S/.test(txt)) bad('/llms.txt', 'llms-txt', 'must start with a "# Title" line');
  for (const [, href] of txt.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const rel = href.startsWith(`${SITE}/`) ? href.slice(SITE.length) : href;
    if (!rel.startsWith('/')) continue; // another site
    const route = noSlash(rel.replace(/[?#].*$/, ''));
    if (!pages.some((p) => p.route === route) && !fs.existsSync(path.join(OUT, route)))
      bad('/llms.txt', 'llms-txt', `${href} is not a page or file of the build`);
  }
}

// internal links: every indexable page is linked from at least two other pages
const inbound = new Map(indexable.map((p) => [p.route, new Set()]));
for (const p of pages)
  for (const m of p.html.matchAll(/<a\b[^>]*\shref="([^"#?]+)[^"]*"/g)) {
    const href = m[1].length > 1 ? m[1].replace(/\/$/, '') : m[1];
    if (inbound.has(href) && href !== p.route) inbound.get(href).add(p.route);
  }
for (const [route, from] of inbound)
  if (from.size < 2)
    bad(route, 'internal-links', `linked from ${from.size} other page(s) (at least 2)`);

conclude({
  command: 'seo',
  cli: 'audit seo',
  summary: (n) =>
    `seo-check: ${indexable.length} indexable pages of ${pages.length} built, ${n} problems`,
  findings: problems,
  notes: [...new Set(notes)],
  show: (fresh) => {
    showByRule(10)(fresh);
    if (notes.length) {
      console.log('\nnotes (not counted):');
      for (const n of [...new Set(notes)]) console.log('  ' + n);
    }
  },
});
