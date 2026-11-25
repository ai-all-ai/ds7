#!/usr/bin/env node
// Markup, link and asset check over the generated site. No dependencies: runs anywhere.
// Usage: ds7 audit html [--out .output/public] [--routes /,/tienda/] [--base /repo/] [--quiet]
// A site built under a base path (GitHub Pages: NUXT_APP_BASE_URL=/repo/) is checked with --base or that variable: every root path
// must start with the base, a path that does not would break once the site is served from the sub-folder (rule outside-base).
import fs from 'node:fs';
import path from 'node:path';
import { conclude, showByRule } from '../lib/report.mjs';
import { loadConfig, internalRoutes } from '../lib/config.mjs';
import { arg, buildDir, walk } from '../lib/cli.mjs';

const OUT = buildDir();
const ONLY = arg('routes', '');

const pages = ONLY
  ? ONLY.split(',')
      .map((r) => path.join(OUT, r, 'index.html'))
      .filter((f) => fs.existsSync(f))
  : walk(OUT).filter((f) => f.endsWith('.html') && !f.includes(`${path.sep}_nuxt${path.sep}`));

const BASE = (() => {
  const b = arg('base', process.env.NUXT_APP_BASE_URL || '/');
  return `/${b.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');
})();
let current = '';
const assetExists = (url) => {
  let clean = url.split('?')[0].split('#')[0];
  if (!clean.startsWith('/') || clean.startsWith('//')) return true;
  if (BASE !== '/') {
    if (!clean.startsWith(BASE)) {
      add(
        current,
        'outside-base',
        `${clean} does not start with ${BASE} (wrap the path in asset())`,
      );
      return true;
    }
    clean = clean.slice(BASE.length - 1);
  }
  const f = path.join(OUT, decodeURIComponent(clean));
  return fs.existsSync(f) || fs.existsSync(path.join(f, 'index.html'));
};
const tags = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : undefined;
};
const has = (tag, name) => new RegExp(`\\s${name}(\\s|=|>|/)`, 'i').test(tag);
const text = (html, open, close) => {
  const i = html.indexOf(open);
  return i < 0 ? '' : html.slice(i + open.length, html.indexOf(close, i));
};

const issues = [];
const add = (page, rule, detail) => issues.push({ where: page, rule, detail });
// developer pages (seo.internal) are not public pages
const skip = internalRoutes(loadConfig());

for (const file of pages) {
  const base = path.basename(file);
  const dir = '/' + path.relative(OUT, path.dirname(file)).replace(/\\/g, '/').replace(/^\.$/, '');
  const isPage = base === 'index.html';
  const r = isPage
    ? dir.endsWith('/')
      ? dir
      : dir + '/'
    : path.relative(OUT, file).replace(/\\/g, '/');
  if (skip(r)) continue;
  current = r;
  const html = fs.readFileSync(file, 'utf8');
  // 200.html / 404.html are empty SPA fallbacks produced by the generator: only their assets matter
  const shell = !isPage;

  // document basics
  if (!/^<!DOCTYPE html>/i.test(html.trim())) add(r, 'doctype', 'missing <!DOCTYPE html>');
  const htmlTag = tags(html, 'html')[0] || '';
  if (!attr(htmlTag, 'lang')) add(r, 'html-lang', 'missing lang on <html>');
  if (!shell) {
    const title = text(html, '<title>', '</title>').trim();
    if (!title) add(r, 'title', 'empty <title>');
    const h1 = [...html.matchAll(/<h1\b/gi)].length;
    if (h1 !== 1) add(r, 'h1-count', `${h1} h1 tags`);
  }

  // unique ids
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  if (dup.length) add(r, 'duplicate-id', dup.slice(0, 6).join(', '));

  // heading order
  let prev = 0;
  for (const m of html.matchAll(/<h([1-6])\b/gi)) {
    const lvl = Number(m[1]);
    if (prev && lvl > prev + 1) {
      add(r, 'heading-order', `h${prev} → h${lvl}`);
      break;
    }
    prev = lvl;
  }

  // images: alt, dimensions, existing file
  for (const img of tags(html, 'img')) {
    const src = attr(img, 'src');
    if (!has(img, 'alt')) add(r, 'img-alt', img.slice(0, 90));
    const sized =
      (has(img, 'width') && has(img, 'height')) || /aspect-ratio/.test(attr(img, 'style') || '');
    // an <img> without src has no box yet (e.g. the lightbox image while closed); its size is set on load
    if (!sized && src) add(r, 'img-size', src);
    if (src && !assetExists(src)) add(r, 'missing-image', src);
    for (const cand of (attr(img, 'srcset') || '')
      .split(',')
      .map((s) => s.trim().split(/\s+/)[0])
      .filter(Boolean)) {
      if (!assetExists(cand)) add(r, 'missing-image', cand);
    }
  }
  for (const s of tags(html, 'source')) {
    for (const cand of (attr(s, 'srcset') || '')
      .split(',')
      .map((x) => x.trim().split(/\s+/)[0])
      .filter(Boolean)) {
      if (!assetExists(cand)) add(r, 'missing-image', cand);
    }
  }

  // stylesheets, scripts, preloads
  for (const l of tags(html, 'link')) {
    const href = attr(l, 'href');
    if (
      href &&
      /stylesheet|preload|icon|manifest/i.test(attr(l, 'rel') || '') &&
      !assetExists(href)
    )
      add(r, 'missing-asset', href);
  }
  for (const s of tags(html, 'script')) {
    const src = attr(s, 'src');
    if (src && !assetExists(src)) add(r, 'missing-asset', src);
  }

  // internal links
  for (const a of tags(html, 'a')) {
    const href = attr(a, 'href');
    if (!href) {
      if (!has(a, 'role')) add(r, 'link-href', a.slice(0, 90));
      continue;
    }
    if (/^(https?:|mailto:|tel:|#|\?|javascript:|data:)/i.test(href)) continue;
    if (!href.startsWith('/')) {
      add(r, 'relative-link', href);
      continue;
    }
    if (!assetExists(href)) add(r, 'broken-link', href);
  }

  // in-page anchors used by the site's own links
  const anchorIds = new Set(ids);
  for (const a of tags(html, 'a')) {
    const href = attr(a, 'href') || '';
    const m = href.match(/^#(.+)$/);
    if (m && !anchorIds.has(decodeURIComponent(m[1]))) add(r, 'missing-anchor', href);
  }
}

conclude({
  command: 'html',
  cli: 'audit html',
  summary: (n) => `html-check: ${pages.length} pages, ${n} problems`,
  findings: issues,
  show: showByRule(8),
});
