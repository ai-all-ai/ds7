// The shared libraries of the commands: path patterns, component names and the settings file. One test per behaviour.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, bare, put } from './helpers.mjs';

// import() takes a URL: a Windows path such as D:\a\... would be read as the scheme d:
const lib = (name) => import(pathToFileURL(path.join(root, 'bin', 'lib', name)).href);

test('glob: * stays inside one folder', async () => {
  const { glob } = await lib('project.mjs');
  assert.ok(glob('app/components/ui/*.vue').test('app/components/ui/UiButton.vue'));
  assert.ok(!glob('app/components/ui/*.vue').test('app/components/ui/deep/UiButton.vue'));
});

test('glob: ** crosses folders', async () => {
  const { glob } = await lib('project.mjs');
  assert.ok(glob('app/pages/**/*.vue').test('app/pages/a/b/c.vue'));
  assert.ok(glob('docs/**').test('docs/a/b.md'));
});

test('glob: {a,b} alternatives', async () => {
  const { glob } = await lib('project.mjs');
  assert.ok(glob('{tools,scripts}/**').test('scripts/build/x.mjs'));
  assert.ok(!glob('{tools,scripts}/**').test('other/x.mjs'));
});

test('glob: a dot is a dot, not any character', async () => {
  const { glob } = await lib('project.mjs');
  assert.ok(!glob('docs/a.md').test('docs/aXmd'));
});

test('componentName follows the Nuxt naming of folders and files', async () => {
  const { componentName } = await lib('project.mjs');
  assert.equal(componentName('app/components/ui/UiButton.vue'), 'UiButton');
  assert.equal(componentName('app/components/home/HomeHero.vue'), 'HomeHero');
  assert.equal(componentName('app/components/sections/Hero.vue'), 'SectionsHero');
  assert.equal(componentName('app/components/Logo.vue'), 'Logo');
});

test('config: defaults without a ds7.config.json', async (t) => {
  const { loadConfig } = await lib('config.mjs');
  const cfg = loadConfig(bare(t));
  assert.equal(cfg.exists, false);
  assert.ok(cfg.layout.rules.length > 10 && cfg.layout.imports.length > 5);
  assert.equal(cfg.perf.budgets.js, 170 * 1024);
  assert.deepEqual(cfg.seo.internal, ['/ui', '/ds']);
  assert.ok(cfg.seo.stopwords.includes('the'));
});

test('config: a project rule comes before the defaults, so it wins', async (t) => {
  const { loadConfig } = await lib('config.mjs');
  const dir = bare(t);
  put(
    dir,
    'ds7.config.json',
    JSON.stringify({ layout: { rules: [{ path: 'app/extra/*.ts', what: 'extra' }] } }),
  );
  assert.equal(loadConfig(dir).layout.rules[0].path, 'app/extra/*.ts');
});

test('config: a budget changes one number and keeps the others', async (t) => {
  const { loadConfig } = await lib('config.mjs');
  const dir = bare(t);
  put(dir, 'ds7.config.json', JSON.stringify({ perf: { budgets: { js: 1 } } }));
  const { budgets } = loadConfig(dir).perf;
  assert.equal(budgets.js, 1);
  assert.equal(budgets.css, 50 * 1024);
});

test('config: the site URL comes from the flag, then the file, then nuxt.config.ts', async (t) => {
  const { loadConfig, siteUrl } = await lib('config.mjs');
  const dir = bare(t);
  put(
    dir,
    'nuxt.config.ts',
    "export default { runtimeConfig: { public: { siteUrl: 'https://from-nuxt.test/' } } }\n",
  );
  assert.equal(siteUrl(loadConfig(dir), undefined, dir), 'https://from-nuxt.test');
  put(dir, 'ds7.config.json', JSON.stringify({ seo: { site: 'https://from-file.test' } }));
  assert.equal(siteUrl(loadConfig(dir), undefined, dir), 'https://from-file.test');
  assert.equal(siteUrl(loadConfig(dir), 'https://flag.test/', dir), 'https://flag.test');
});

// ---- imageSize: reads the pixels of a PNG, JPEG or WebP from the first bytes ----
const png = (w, h) => {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
};
const jpeg = (w, h) => {
  // SOI, an APP0 segment to skip, then SOF0 with the size
  const b = Buffer.alloc(40);
  b.writeUInt16BE(0xffd8, 0);
  b.writeUInt16BE(0xffe0, 2);
  b.writeUInt16BE(16, 4);
  b.writeUInt16BE(0xffc0, 20);
  b.writeUInt16BE(17, 22);
  b[24] = 8;
  b.writeUInt16BE(h, 25);
  b.writeUInt16BE(w, 27);
  return b;
};
const webpX = (w, h) => {
  const b = Buffer.alloc(40);
  b.write('RIFF', 0, 'latin1');
  b.write('WEBP', 8, 'latin1');
  b.write('VP8X', 12, 'latin1');
  b.writeUIntLE(w - 1, 24, 3);
  b.writeUIntLE(h - 1, 27, 3);
  return b;
};

test('imageSize reads a PNG', async () => {
  const { imageSize } = await lib('image-size.mjs');
  assert.deepEqual(imageSize(png(1200, 630)), { width: 1200, height: 630 });
});

test('imageSize reads a JPEG after skipping the segments before the frame header', async () => {
  const { imageSize } = await lib('image-size.mjs');
  assert.deepEqual(imageSize(jpeg(1200, 630)), { width: 1200, height: 630 });
});

test('imageSize reads an extended WebP', async () => {
  const { imageSize } = await lib('image-size.mjs');
  assert.deepEqual(imageSize(webpX(1200, 630)), { width: 1200, height: 630 });
});

test('imageSize returns null for bytes it does not recognise', async () => {
  const { imageSize } = await lib('image-size.mjs');
  assert.equal(imageSize(Buffer.from('not an image at all, just text')), null);
});

// ---- loadConfig: the new seo settings ----
test('loadConfig: seo defaults are no trailing slash, llms.txt optional, a 1200 px social image', async (t) => {
  const { loadConfig } = await lib('config.mjs');
  const { seo } = loadConfig(bare(t));
  assert.equal(seo.trailingSlash, false);
  assert.equal(seo.llms, false);
  assert.deepEqual(seo.socialImage, { minWidth: 1200, minRatio: 1.6, maxRatio: 2.1, maxKB: 300 });
});

test('internalRoutes leaves out the developer pages, what is under them and their locale copies', async () => {
  const { internalRoutes } = await lib('config.mjs');
  const isInternal = internalRoutes({ seo: { internal: ['/ui', '/owner/'] } });
  for (const r of ['/ui', '/ui/', '/ui/tokens/', '/owner', '/en/owner/', '/pt-br/ui'])
    assert.ok(isInternal(r), `${r} is internal`);
  for (const r of ['/', '/guide/', '/blog/ui-tips/', '/menu/'])
    assert.ok(!isInternal(r), `${r} is public`);
});
