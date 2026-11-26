// `ds7 icons`: icon files and head tags on every page, the site manifest, and the error pages. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, site, cli, put, read, has, editPage, PAGES, tmp } from './helpers.mjs';

// A PNG header of the given size: the signature and the IHDR chunk, which is all the check reads.
function png(w, h) {
  const b = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}

const HEAD = [
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/site.webmanifest">',
  '<meta name="theme-color" content="#ffffff">',
].join('');

// The icon files of a DS7 site, all of the right size.
function iconFiles(dir, out = '.output/public') {
  put(dir, `${out}/favicon.ico`, 'ico');
  put(dir, `${out}/apple-touch-icon.png`, png(180, 180));
  put(dir, `${out}/android-chrome-192x192.png`, png(192, 192));
  put(dir, `${out}/android-chrome-512x512.png`, png(512, 512));
  put(dir, `${out}/maskable-icon-512x512.png`, png(512, 512));
  put(dir, `${out}/site.webmanifest`, read(root, 'templates/site.webmanifest'));
}

// Puts the head tags into every built page, as the layout does through app.head.
function headTags(dir) {
  for (const route of Object.keys(PAGES))
    editPage(dir, route, (html) =>
      html.replace('<link rel="stylesheet"', HEAD + '<link rel="stylesheet"'),
    );
}

// A site that passes `ds7 icons`; `mutate(dir)` may break it afterwards.
function iconSite(t, mutate) {
  return site(t, (dir) => {
    iconFiles(dir);
    headTags(dir);
    put(
      dir,
      '.output/public/404.html',
      `<!DOCTYPE html><html lang="en"><head><title>404</title>${HEAD}<meta property="og:image" content="https://example.test/og.jpg"></head><body>404</body></html>`,
    );
    put(dir, 'app/error.vue', read(root, 'templates/error.vue'));
    mutate?.(dir);
  });
}

const icons = (dir) => cli(dir, ['icons']);

test('icons passes when the icon set, the head tags and the error pages are in place', (t) => {
  const r = icons(iconSite(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /icons OK/);
});

test('icons names every missing icon file, the manifest and the error page', (t) => {
  const dir = site(t);
  const r = icons(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /favicon\.ico: missing/);
  assert.match(r.out, /apple-touch-icon\.png: missing/);
  assert.match(r.out, /site\.webmanifest: missing/);
  assert.match(r.out, /app\/error\.vue: missing/);
  assert.match(r.out, /404\.html: not in the build/);
});

test('icons flags a page without the icon and social head tags', (t) => {
  const dir = iconSite(t, (d) =>
    editPage(d, '/about', (html) => html.replace(/<meta name="theme-color"[^>]*>/, '')),
  );
  const r = icons(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /about\/index\.html: missing theme-color/);
});

test('icons checks the size of the apple touch icon', (t) => {
  const dir = iconSite(t, (d) => put(d, '.output/public/apple-touch-icon.png', png(100, 100)));
  assert.match(icons(dir).out, /apple-touch-icon\.png: is 100 x 100, expected 180 x 180/);
});

test('icons checks the manifest: a 512 icon, a maskable one and every file it names', (t) => {
  const dir = iconSite(t, (d) => {
    const m = JSON.parse(read(d, '.output/public/site.webmanifest'));
    m.icons = m.icons.filter((i) => i.purpose !== 'maskable' && i.sizes !== '512x512');
    m.icons.push({ src: '/gone.png', sizes: '96x96', type: 'image/png' });
    put(d, '.output/public/site.webmanifest', JSON.stringify(m));
  });
  const r = icons(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /no 512x512 icon/);
  assert.match(r.out, /no maskable icon/);
  assert.match(r.out, /icon \/gone\.png is missing/);
});

test('icons switches off with "icons": false', (t) => {
  const dir = site(t);
  put(dir, 'ds7.config.json', JSON.stringify({ icons: false }));
  const r = icons(dir);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /icons: off/);
});

test('icons skips the error page checks with errorPages: false', (t) => {
  const dir = iconSite(t, (d) => {
    fs.rmSync(path.join(d, 'app', 'error.vue'));
    fs.rmSync(path.join(d, '.output/public/404.html'));
    put(d, 'ds7.config.json', JSON.stringify({ icons: { errorPages: false } }));
  });
  const r = icons(dir);
  assert.equal(r.status, 0, r.out);
});

test('icons requires the error page to show the status code and at least three links', (t) => {
  const dir = iconSite(t, (d) => put(d, 'app/error.vue', '<template><p>Oops</p></template>\n'));
  const r = icons(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /app\/error\.vue: does not show the status code/);
  assert.match(r.out, /app\/error\.vue: links to the main sections: 0 found, at least 3 expected/);
});

test('the templates are valid: the manifest parses, the error page shows the code and three sections', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'templates', 'site.webmanifest'), 'utf8'),
  );
  assert.ok(manifest.icons.some((i) => i.sizes === '192x192'));
  assert.ok(manifest.icons.some((i) => i.sizes === '512x512'));
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  const vue = fs.readFileSync(path.join(root, 'templates', 'error.vue'), 'utf8');
  assert.match(vue, /statusCode/);
  assert.ok((vue.match(/\bto:\s*'/g) ?? []).length >= 3);
});

test('ds7 init gives a new project the error page and the manifest, and keeps its own', (t) => {
  const dir = tmp(t, 'ds7-icons-');
  put(dir, 'package.json', '{ "name": "fixture", "private": true }\n');
  put(dir, 'public/site.webmanifest', '{"name":"Mine"}\n');
  assert.equal(cli(dir).status, 0);
  assert.ok(has(dir, 'app/error.vue'));
  assert.match(read(dir, 'public/site.webmanifest'), /Mine/);
});
