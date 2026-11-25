// `ds7 audit seo`: one test per rule of the search checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { site, cli, edit, editPage, put, PAGES, SITE } from './helpers.mjs';

const run = (dir, ...more) => cli(dir, ['audit', 'seo', ...more]);
const config = (dir, fn) => edit(dir, 'ds7.config.json', (s) => JSON.stringify(fn(JSON.parse(s))));

test('seo passes on a good site and lists the pages it checked', (t) => {
  const r = run(site(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /3 indexable pages of 3 built, 0 problems/);
});

test('seo reports a page without a canonical link', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(/<link rel="canonical"[^>]*>/, '')),
  );
  assert.match(run(dir).out, /canonical[\s\S]*\/about/);
});

test('seo reports a title that is too short or too long', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(PAGES['/about'].title, 'Short')),
  );
  assert.match(run(dir).out, /title-length/);
});

test('seo reports a description that is too short', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.split(PAGES['/about'].desc).join('Too short.')),
  );
  assert.match(run(dir).out, /description-length/);
});

test('seo reports two pages with the same title', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/contact', (s) => s.split(PAGES['/contact'].title).join(PAGES['/about'].title)),
  );
  assert.match(run(dir).out, /title-duplicate/);
});

test('seo reports a social image that does not exist', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) =>
      s.replace(/og:image" content="[^"]*"/, `og:image" content="${SITE}/gone.jpg"`),
    ),
  );
  assert.match(run(dir).out, /social-image[\s\S]*gone\.jpg/);
});

test('seo reports missing Open Graph tags', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(/<meta property="og:site_name"[^>]*>/, '')),
  );
  assert.match(run(dir).out, /social-tags[\s\S]*og:site_name/);
});

test('seo reports a page with too little text', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) =>
      s.replace(
        /<main>[\s\S]*<\/main>/,
        '<main><h1>About our shop</h1><h2>a</h2><h2>b</h2><p>Short.</p></main>',
      ),
    ),
  );
  assert.match(run(dir).out, /thin-content/);
});

test('seo reports a page linked from fewer than two other pages', (t) => {
  const dir = site(t, (d) => {
    for (const r of ['/', '/contact'])
      editPage(d, r, (s) => s.split('<a href="/about">About</a>').join(''));
  });
  assert.match(run(dir).out, /internal-links[\s\S]*\/about/);
});

test('seo reports broken structured data', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) =>
      s.replace(
        '"@type":"BreadcrumbList"',
        '"@type":"BreadcrumbList","x":{"@id":"https://example.test/nowhere"}',
      ),
    ),
  );
  assert.match(run(dir).out, /json-ld[\s\S]*referenced but not defined/);
});

test('seo reports placeholder text in structured data', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace('"name":"Fixture"', '"name":"lorem ipsum"')),
  );
  assert.match(run(dir).out, /placeholder/);
});

test('seo reports a page missing from the sitemap and a sitemap entry that is not a page', (t) => {
  const dir = site(t, (d) =>
    edit(d, '.output/public/sitemap.xml', (s) =>
      s.replace(`<url><loc>${SITE}/contact</loc></url>`, `<url><loc>${SITE}/ghost</loc></url>`),
    ),
  );
  const r = run(dir);
  assert.match(r.out, /\/contact is indexable but not listed/);
  assert.match(r.out, /\/ghost is listed but is noindex, internal or missing/);
});

test('seo reports a robots.txt without the sitemap line', (t) => {
  const dir = site(t, (d) =>
    put(d, '.output/public/robots.txt', 'User-agent: *\nAllow: /\nDisallow: /ui\nDisallow: /ds\n'),
  );
  assert.match(run(dir).out, /robots[\s\S]*no "Sitemap:/);
});

test('seo reports a robots.txt that does not block the internal tools', (t) => {
  const dir = site(t, (d) =>
    put(d, '.output/public/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`),
  );
  assert.match(run(dir).out, /does not block the internal tool \/ui/);
});

test('seo reports a robots.txt that blocks an indexable page', (t) => {
  const dir = site(t, (d) =>
    put(
      d,
      '.output/public/robots.txt',
      `User-agent: *\nDisallow: /ui\nDisallow: /ds\nDisallow: /about\nSitemap: ${SITE}/sitemap.xml\n`,
    ),
  );
  assert.match(run(dir).out, /blocks the indexable page \/about/);
});

test('seo skips a noindex page and does not require it in the sitemap', (t) => {
  const dir = site(t, (d) => {
    editPage(d, '/contact', (s) =>
      s.replace('<head>', '<head><meta name="robots" content="noindex">'),
    );
    edit(d, '.output/public/sitemap.xml', (s) =>
      s.replace(`<url><loc>${SITE}/contact</loc></url>`, ''),
    );
  });
  const r = run(dir);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /2 indexable pages of 3 built/);
});

test('seo checks the primary query: missing from the title', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/', (s) =>
      s.replace(
        '<title>Bike repair at your door in the city</title>',
        '<title>Welcome to our shop and workshop</title>',
      ),
    ),
  );
  assert.match(run(dir).out, /target-title/);
});

test('seo checks the primary query: two pages with the same query', (t) => {
  const dir = site(t);
  config(dir, (c) => ({
    ...c,
    seo: { ...c.seo, targets: { ...c.seo.targets, '/about': 'bike repair' } },
  }));
  assert.match(run(dir).out, /target-duplicate/);
});

test('seo reports a page that has no entry in the targets', (t) => {
  const dir = site(t);
  config(dir, (c) => {
    delete c.seo.targets['/about'];
    return c;
  });
  assert.match(run(dir).out, /target[\s\S]*no entry in seo\.targets/);
});

test('seo reads the targets from a JSON file when seo.targets is a path', (t) => {
  const dir = site(t);
  put(
    dir,
    'targets.json',
    JSON.stringify({
      '/': 'bike repair',
      '/about': 'about our shop',
      '/contact': 'contact the shop',
    }),
  );
  config(dir, (c) => ({ ...c, seo: { ...c.seo, targets: 'targets.json' } }));
  const r = run(dir);
  assert.equal(r.status, 0, r.out);
});

test('seo does not require targets when none are configured', (t) => {
  const dir = site(t);
  config(dir, (c) => {
    delete c.seo.targets;
    return c;
  });
  assert.equal(run(dir).status, 0);
});

test('seo takes the site URL from --site when the config has none', (t) => {
  const dir = site(t);
  config(dir, (c) => {
    delete c.seo.site;
    return c;
  });
  assert.equal(run(dir).status, 1);
  assert.equal(run(dir, '--site', SITE).status, 0);
});

test('seo finds the organisation node whatever its schema type is, by its @id', (t) => {
  const dir = site(t, (d) => {
    for (const r of ['/', '/about', '/contact'])
      editPage(d, r, (s) => s.replace('"@type":"Organization"', '"@type":"BicycleStore"'));
  });
  assert.equal(run(dir).status, 0, run(dir).out);
});

// ---- several languages ----
const alternates = (self) => (s) =>
  s.replace(
    '</head>',
    `<link rel="alternate" hreflang="en" href="${SITE}/about"><link rel="alternate" hreflang="es" href="${SITE}/contact"><link rel="alternate" hreflang="x-default" href="${SITE}/about"></head>`,
  );

test('seo accepts hreflang alternates that link to each other and include x-default', (t) => {
  const dir = site(t, (d) => {
    editPage(d, '/about', alternates('/about'));
    editPage(d, '/contact', alternates('/contact'));
  });
  const r = run(dir);
  assert.equal(r.status, 0, r.out);
});

test('seo reports an hreflang alternate that does not link back', (t) => {
  const dir = site(t, (d) => editPage(d, '/about', alternates('/about')));
  assert.match(run(dir).out, /hreflang[\s\S]*\/contact does not link back/);
});

test('seo reports hreflang without an x-default', (t) => {
  const dir = site(t, (d) => {
    for (const r of ['/about', '/contact'])
      editPage(d, r, (s) =>
        alternates(r)(s).replace(/<link rel="alternate" hreflang="x-default"[^>]*>/, ''),
      );
  });
  assert.match(run(dir).out, /no x-default alternate/);
});

test('seo reports hreflang that points at a page the build does not have', (t) => {
  const dir = site(t, (d) => {
    for (const r of ['/about', '/contact'])
      editPage(d, r, (s) =>
        alternates(r)(s).replace(
          `hreflang="es" href="${SITE}/contact"`,
          `hreflang="es" href="${SITE}/ghost"`,
        ),
      );
  });
  assert.match(run(dir).out, /es points at .*\/ghost, which is not a page of the build/);
});

test('seo reports an hreflang list that does not include the page itself', (t) => {
  const dir = site(t, (d) => {
    editPage(d, '/about', alternates('/about'));
    editPage(d, '/contact', (s) =>
      s.replace(
        '</head>',
        `<link rel="alternate" hreflang="en" href="${SITE}/about"><link rel="alternate" hreflang="x-default" href="${SITE}/about"></head>`,
      ),
    );
  });
  assert.match(run(dir).out, /\/contact {2}no alternate that points at the page itself/);
});

// ---- trailing slash ----
const slashed = (dir) => {
  // every canonical, og:url, structured-data url and sitemap entry of a non-home page ends in a slash
  for (const route of Object.keys(PAGES).filter((r) => r !== '/')) {
    editPage(dir, route, (s) => s.split(`${SITE}${route}"`).join(`${SITE}${route}/"`));
  }
  edit(dir, '.output/public/sitemap.xml', (s) =>
    s.replace(/<loc>([^<]+[^/])<\/loc>/g, (m, u) => (u === SITE ? m : `<loc>${u}/</loc>`)),
  );
  config(dir, (c) => ({ ...c, seo: { ...c.seo, trailingSlash: true } }));
};

test('seo accepts a site whose addresses end in a slash when seo.trailingSlash is on', (t) => {
  const r = run(site(t, slashed));
  assert.equal(r.status, 0, r.out);
});

test('seo reports a canonical without the slash when seo.trailingSlash is on', (t) => {
  const dir = site(t, (d) => {
    slashed(d);
    editPage(d, '/about', (s) =>
      s.replace(
        `<link rel="canonical" href="${SITE}/about/">`,
        `<link rel="canonical" href="${SITE}/about">`,
      ),
    );
  });
  assert.match(run(dir).out, /canonical[\s\S]*\/about/);
});

test('seo accepts robots rules written with a trailing slash when seo.trailingSlash is on', (t) => {
  const dir = site(t, (d) => {
    slashed(d);
    put(
      d,
      '.output/public/robots.txt',
      `User-agent: *\nAllow: /\nDisallow: /ui/\nDisallow: /ds/\nSitemap: ${SITE}/sitemap.xml\n`,
    );
  });
  assert.equal(run(dir).status, 0, run(dir).out);
});

// ---- sitemap lastmod ----
const withLastmod = (value) => (d) =>
  edit(d, '.output/public/sitemap.xml', (s) =>
    s.replace('</loc></url>', `</loc><lastmod>${value}</lastmod></url>`),
  );

test('seo accepts a sitemap with real past lastmod dates', (t) => {
  assert.equal(run(site(t, withLastmod('2026-01-15'))).status, 0);
});

test('seo reports a lastmod that is not a date', (t) => {
  assert.match(run(site(t, withLastmod('yesterday'))).out, /sitemap-lastmod[\s\S]*not a W3C date/);
});

test('seo reports a lastmod in the future', (t) => {
  assert.match(run(site(t, withLastmod('2099-01-01'))).out, /sitemap-lastmod[\s\S]*in the future/);
});

test('seo notes, but does not fail, a sitemap without lastmod', (t) => {
  const r = run(site(t));
  assert.equal(r.status, 0);
  assert.match(r.out, /no <lastmod>/);
});

// ---- llms.txt ----
const llms = (text) => (d) => put(d, '.output/public/llms.txt', text);

test('seo accepts an llms.txt with a title and links that resolve', (t) => {
  const r = run(
    site(
      t,
      llms(
        `# Fixture\n\n> A shop.\n\n- [About](${SITE}/about): who we are\n- [Contact](/contact)\n`,
      ),
    ),
  );
  assert.equal(r.status, 0, r.out);
});

test('seo reports an llms.txt link to a page the build does not have', (t) => {
  assert.match(run(site(t, llms('# Fixture\n\n- [Gone](/gone)\n'))).out, /llms-txt[\s\S]*\/gone/);
});

test('seo reports an llms.txt without a title line', (t) => {
  assert.match(run(site(t, llms('Just text\n'))).out, /must start with a "# Title"/);
});

test('seo does not require llms.txt unless seo.llms is on', (t) => {
  assert.equal(run(site(t)).status, 0);
});

test('seo reports a missing llms.txt when seo.llms is on', (t) => {
  const dir = site(t, (d) => config(d, (c) => ({ ...c, seo: { ...c.seo, llms: true } })));
  assert.match(run(dir).out, /llms-txt[\s\S]*missing/);
});

// ---- social image ----
const png = (w, h) => {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b);
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
};
const og = (buf) => (d) => put(d, '.output/public/og.jpg', buf);

test('seo accepts a 1200 x 630 social image', (t) => {
  assert.equal(run(site(t, og(png(1200, 630)))).status, 0);
});

test('seo reports a social image narrower than 1200 px', (t) => {
  assert.match(run(site(t, og(png(600, 315)))).out, /social-image[\s\S]*600 px wide/);
});

test('seo accepts a 16:9 social image, as well as 1.91:1', (t) => {
  assert.equal(run(site(t, og(png(1672, 941)))).status, 0);
});

test('seo reports a social image that is square', (t) => {
  assert.match(run(site(t, og(png(1200, 1200)))).out, /social-image[\s\S]*1200x1200/);
});

test('seo reports a social image over the size limit', (t) => {
  const big = Buffer.concat([png(1200, 630), Buffer.alloc(400 * 1024)]);
  assert.match(run(site(t, og(big))).out, /social-image[\s\S]*400 KB/);
});

test('seo takes the social image limits from the config', (t) => {
  const dir = site(t, (d) => {
    og(png(800, 420))(d);
    config(d, (c) => ({ ...c, seo: { ...c.seo, socialImage: { minWidth: 800 } } }));
  });
  assert.equal(run(dir).status, 0, run(dir).out);
});

test('seo reports an SVG social image', (t) => {
  const dir = site(t, (d) => {
    put(d, '.output/public/og.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
    for (const route of Object.keys(PAGES))
      editPage(d, route, (s) => s.split(`${SITE}/og.jpg`).join(`${SITE}/og.svg`));
  });
  assert.match(run(dir).out, /social-image[\s\S]*is an SVG/);
});
