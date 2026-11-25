// Shared helpers of the tests. Every test builds its own fresh folder (`bare`, `project`, `site`, `installed`),
// removed when the test ends, so a test can run alone and never depends on another one.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const bin = path.join(root, 'bin', 'ds7.js');
export const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
export const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

// A temp folder that is removed when the test ends.
export function tmp(t, prefix = 'ds7-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

// Runs the DS7 CLI in `cwd`. `out` is stdout and stderr together, without colours.
export function cli(cwd, args = [], script = bin) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, out: strip(`${r.stdout}${r.stderr}`), stdout: strip(r.stdout) };
}

export const put = (dir, rel, text) => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), text);
};
export const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
export const has = (dir, rel) => fs.existsSync(path.join(dir, rel));
export const edit = (dir, rel, fn) => put(dir, rel, fn(read(dir, rel)));

// A folder with only a package.json: the state before `ds7` ran.
export function bare(t) {
  const dir = tmp(t, 'ds7-bare-');
  put(dir, 'package.json', '{ "name": "fixture", "private": true }\n');
  return dir;
}

// A project after `ds7 init`.
export function project(t) {
  const dir = bare(t);
  const r = cli(dir);
  if (r.status !== 0) throw new Error(`init failed:\n${r.out}`);
  return dir;
}

// Three files that use each other: a page uses a section, the section uses an atom.
export function miniApp(dir) {
  put(
    dir,
    'app/components/ui/UiButton.vue',
    '<template><button class="btn"><slot /></button></template>\n',
  );
  put(
    dir,
    'app/components/sections/SectionsHero.vue',
    '<template><section><UiButton>Go</UiButton></section></template>\n',
  );
  put(dir, 'app/pages/index.vue', '<template><SectionsHero /></template>\n');
}

// ---- a tiny built site (what `nuxt generate` leaves in .output/public) ----
export const SITE = 'https://example.test';
const SENTENCE =
  'We repair bikes at your door in the city. Every repair starts with a free check, then a clear price, then the work. Our mechanics bring the tools, the parts and care to every visit, and they explain what they did. You keep riding, we keep the bike in good shape all year, in all weather, for all ages. ';
export const PAGES = {
  '/': {
    title: 'Bike repair at your door in the city',
    h1: 'Bike repair at your door',
    desc: 'We repair bikes at your door: a free check, a clear price and the work done in one visit. Book online in two minutes.',
  },
  '/about': {
    title: 'About our shop and the mechanics team',
    h1: 'About our shop',
    desc: 'Meet the mechanics behind the shop: who we are, how we work and why we come to you instead of asking you to come to us.',
  },
  '/contact': {
    title: 'Contact the shop and book a bike repair visit',
    h1: 'Contact the shop',
    desc: 'Write or call to book a visit: tell us the problem with the bike and we will propose a day, a price and a time slot.',
  },
};
export const urlOf = (route) => (route === '/' ? `${SITE}/` : `${SITE}${route}`);

function pageHtml(route, { title, h1, desc }) {
  const url = urlOf(route);
  const links = '<a href="/">Home</a> <a href="/about">About</a> <a href="/contact">Contact</a>';
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Fixture',
        url: `${SITE}/`,
        logo: `${SITE}/logo.png`,
      },
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: title },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }],
      },
    ],
  };
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Fixture"><meta property="og:locale" content="en_GB"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:image" content="${SITE}/og.jpg"><meta property="og:image:alt" content="A bike at a door"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/og.jpg"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}">
<link rel="stylesheet" href="/_nuxt/entry.css">
<script type="application/ld+json">${JSON.stringify(graph)}</script>
</head><body><header><nav aria-label="Main">${links}</nav></header><main><h1>${h1}</h1><h2>How it works</h2><p>${SENTENCE.repeat(4)}</p><h2>Why choose us</h2><p>${SENTENCE.repeat(4)}</p></main><footer>${links}</footer></body></html>`;
}

// A good site in a fresh folder; `mutate(dir)` may break it. Every audit passes on the unbroken site.
export function site(t, mutate) {
  const dir = tmp(t, 'ds7-site-');
  const out = '.output/public';
  for (const [route, page] of Object.entries(PAGES))
    put(
      dir,
      `${out}/${route === '/' ? '' : route.slice(1) + '/'}index.html`,
      pageHtml(route, page),
    );
  put(
    dir,
    `${out}/sitemap.xml`,
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
      PAGES,
    )
      .map((r) => `<url><loc>${urlOf(r)}</loc></url>`)
      .join('')}</urlset>`,
  );
  put(
    dir,
    `${out}/robots.txt`,
    `User-agent: *\nAllow: /\nDisallow: /ui\nDisallow: /ds\nSitemap: ${SITE}/sitemap.xml\n`,
  );
  put(
    dir,
    `${out}/_nuxt/entry.css`,
    'body{margin:0;font:1rem/1.5 system-ui;color:#111;background:#fff}a:focus-visible{outline:2px solid #000}@media (prefers-reduced-motion:reduce){*{animation:none}}',
  );
  put(dir, `${out}/og.jpg`, 'jpeg');
  put(dir, `${out}/logo.png`, 'png');
  put(
    dir,
    'ds7.config.json',
    JSON.stringify({
      seo: {
        site: SITE,
        targets: {
          '/': 'bike repair',
          '/about': 'about our shop',
          '/contact': { primary: 'contact the shop' },
        },
      },
    }),
  );
  mutate?.(dir);
  return dir;
}
export const editPage = (dir, route, fn) =>
  edit(dir, `.output/public/${route === '/' ? '' : route.slice(1) + '/'}index.html`, fn);

// ---- DS7 packed and installed together with AI-ALL, as a user gets it ----
let template;
function installedTemplate() {
  if (template) return template;
  template = fs.mkdtempSync(path.join(os.tmpdir(), 'ds7-installed-'));
  const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds7-tarball-'));
  process.on('exit', () => {
    fs.rmSync(template, { recursive: true, force: true });
    fs.rmSync(packDir, { recursive: true, force: true });
  });
  const run = (cmd, args, cwd) => {
    const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
    if (r.status !== 0)
      throw new Error(`${cmd} ${args.join(' ')} failed:\n${r.stdout}\n${r.stderr}`);
    return r.stdout;
  };
  const [{ filename }] = JSON.parse(
    run('npm', ['pack', '--json', '--pack-destination', packDir], root),
  );
  const extra = process.env.AIALL_TARBALL ? [process.env.AIALL_TARBALL] : [];
  run('npm', ['init', '-y'], template);
  run(
    'npm',
    ['install', '--no-audit', '--no-fund', path.join(packDir, filename), ...extra],
    template,
  );
  return template;
}
// A copy of the project with the packed DS7 and AI-ALL installed, before `init`.
export function installed(t) {
  const dir = tmp(t, 'ds7-pack-');
  fs.cpSync(installedTemplate(), dir, { recursive: true });
  return {
    dir,
    ds7: path.join(dir, 'node_modules', '@ai.all', 'ds7', 'bin', 'ds7.js'),
    aiall: path.join(dir, 'node_modules', '@ai.all', 'aiall', 'bin', 'cli.js'),
  };
}
