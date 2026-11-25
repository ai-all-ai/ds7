// `ds7 audit perf`: static performance budgets and loading rules of the build. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { site, cli, editPage, edit, put } from './helpers.mjs';

const run = (dir) => cli(dir, ['audit', 'perf']);
const addScript = (dir, rel, bytes) => {
  fs.mkdirSync(path.join(dir, '.output/public/_nuxt'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.output/public', rel), crypto.randomBytes(bytes));
  editPage(dir, '/', (s) => s.replace('</head>', `<script src="/${rel}" defer></script></head>`));
};
// a photo with a srcset, as the image component writes it
const photo = (attrs) =>
  `<img src="/p-800.webp" srcset="/p-400.webp 400w, /p-800.webp 800w" sizes="100vw" alt="x" width="800" height="600" ${attrs}>`;
const withPhoto = (t, attrs) =>
  site(t, (d) => {
    put(d, '.output/public/p-400.webp', 'x');
    put(d, '.output/public/p-800.webp', 'x');
    editPage(d, '/', (s) => s.replace('<main>', `<main>${photo(attrs)}`));
  });

test('perf passes on a good site', (t) => {
  const r = run(site(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /3 pages/);
});

test('perf reports JavaScript over the gzip budget', (t) => {
  const dir = site(t, (d) => addScript(d, '_nuxt/big.js', 400 * 1024));
  assert.match(run(dir).out, /budget-js[\s\S]*\/ {2}\d+\.\d KB gzip \(budget 170\.0 KB\)/);
});

test('perf reports CSS over the gzip budget', (t) => {
  const dir = site(t, (d) =>
    put(d, '.output/public/_nuxt/entry.css', crypto.randomBytes(120 * 1024).toString('base64')),
  );
  assert.match(run(dir).out, /budget-css/);
});

test('perf reports HTML over the gzip budget', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/', (s) =>
      s.replace('</main>', `<p>${crypto.randomBytes(60 * 1024).toString('base64')}</p></main>`),
    ),
  );
  assert.match(run(dir).out, /budget-html/);
});

test('perf reports too many scripts on a page', (t) => {
  const dir = site(t, (d) => {
    const tags = Array.from(
      { length: 31 },
      (_, i) => `<script src="/_nuxt/s${i}.js" defer></script>`,
    ).join('');
    for (let i = 0; i < 31; i++) put(d, `.output/public/_nuxt/s${i}.js`, 'x');
    editPage(d, '/', (s) => s.replace('</head>', `${tags}</head>`));
  });
  assert.match(run(dir).out, /budget-scripts[\s\S]*31 scripts/);
});

test('perf reports too many blocking stylesheets', (t) => {
  const dir = site(t, (d) => {
    const tags = Array.from(
      { length: 5 },
      (_, i) => `<link rel="stylesheet" href="/_nuxt/c${i}.css">`,
    ).join('');
    for (let i = 0; i < 5; i++) put(d, `.output/public/_nuxt/c${i}.css`, 'a{color:#000}');
    editPage(d, '/', (s) => s.replace('</head>', `${tags}</head>`));
  });
  assert.match(run(dir).out, /budget-stylesheets/);
});

test('perf does not count disabled or print stylesheets as blocking', (t) => {
  // Nuxt 4.7 writes lazy component CSS as <link rel="stylesheet" disabled>
  const dir = site(t, (d) => {
    const tags = Array.from({ length: 5 }, (_, i) =>
      i < 3
        ? `<link rel="stylesheet" href="/_nuxt/c${i}.css" disabled>`
        : `<link rel="stylesheet" href="/_nuxt/c${i}.css" media="print">`,
    ).join('');
    for (let i = 0; i < 5; i++) put(d, `.output/public/_nuxt/c${i}.css`, 'a{color:#000}');
    editPage(d, '/', (s) => s.replace('</head>', `${tags}</head>`));
  });
  assert.doesNotMatch(run(dir).out, /budget-stylesheets/);
});

test('perf reports a resource that loads from another origin', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/', (s) =>
      s.replace('</head>', '<script src="https://cdn.other.test/x.js" defer></script></head>'),
    ),
  );
  assert.match(run(dir).out, /third-party[\s\S]*cdn\.other\.test/);
});

test('perf reports a first photo that is lazy-loaded', (t) => {
  assert.match(run(withPhoto(t, 'loading="lazy"')).out, /lcp-lazy/);
});

test('perf reports a first photo without fetchpriority high', (t) => {
  assert.match(run(withPhoto(t, 'loading="eager"')).out, /lcp-priority/);
});

test('perf accepts a first photo that is eager with fetchpriority high', (t) => {
  const r = run(withPhoto(t, 'loading="eager" fetchpriority="high"'));
  assert.equal(r.status, 0, r.out);
});

test('perf reports a srcset in w units without sizes', (t) => {
  const dir = site(t, (d) => {
    put(d, '.output/public/p-800.webp', 'x');
    editPage(d, '/', (s) =>
      s.replace(
        '<main>',
        '<main><img src="/p-800.webp" srcset="/p-400.webp 400w, /p-800.webp 800w" alt="x" width="800" height="600" loading="eager" fetchpriority="high">',
      ),
    );
  });
  assert.match(run(dir).out, /srcset-sizes/);
});

test('perf reports a font-face without font-display', (t) => {
  const dir = site(t, (d) =>
    edit(
      d,
      '.output/public/_nuxt/entry.css',
      (s) => `${s}@font-face{font-family:F;src:url(/f.woff2) format("woff2")}`,
    ),
  );
  assert.match(run(dir).out, /font-display/);
});

test('perf reports a font-face that lists woff before woff2', (t) => {
  const dir = site(t, (d) =>
    edit(
      d,
      '.output/public/_nuxt/entry.css',
      (s) =>
        `${s}@font-face{font-family:F;font-display:swap;src:url(/f.woff) format("woff"),url(/f.woff2) format("woff2")}`,
    ),
  );
  assert.match(run(dir).out, /font-order/);
});

test('perf takes a changed budget from ds7.config.json', (t) => {
  const dir = site(t, (d) => addScript(d, '_nuxt/big.js', 400 * 1024));
  assert.equal(run(dir).status, 1);
  edit(dir, 'ds7.config.json', (s) =>
    JSON.stringify({ ...JSON.parse(s), perf: { budgets: { js: 500 * 1024 } } }),
  );
  assert.equal(run(dir).status, 0);
});

// advice: printed, never fails in this version
const compressAll = (d) => {
  const out = path.join(d, '.output/public');
  const walk = (x) =>
    fs
      .readdirSync(x, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(x, e.name)) : [path.join(x, e.name)]));
  for (const f of walk(out)) fs.writeFileSync(`${f}.gz`, 'gz');
};

test('perf advises on files without a pre-compressed variant and still passes', (t) => {
  const r = run(site(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /advice[\s\S]*precompressed: \d+ compressible file/);
});

test('perf gives no precompressed advice when every file has a .gz variant', (t) => {
  const r = run(site(t, compressAll));
  assert.doesNotMatch(r.out, /precompressed:/);
});

test('perf advises on a missing 404.html and still passes', (t) => {
  const r = run(site(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /404-page: the build has no 404\.html/);
});

test('perf prints no advice for a build with 404.html and pre-compressed files', (t) => {
  const r = run(
    site(t, (d) => {
      put(d, '.output/public/404.html', '<!DOCTYPE html><title>Not found</title>');
      compressAll(d);
    }),
  );
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /advice/);
});

test('perf lists advice as notes in --json', (t) => {
  const r = cli(site(t), ['audit', 'perf', '--json']);
  const json = JSON.parse(r.out);
  assert.equal(json.problems, 0);
  assert.ok(json.notes.some((n) => n.startsWith('404-page:')));
});
