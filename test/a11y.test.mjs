// `ds7 audit a11y`: the scriptable part of WCAG 2.2 A and AA. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { site, cli, editPage, edit, put } from './helpers.mjs';

const run = (dir) => cli(dir, ['audit', 'a11y']);
const inMain = (html) => (s) => s.replace('</main>', `${html}</main>`);
const broken = (t, html) => run(site(t, (d) => editPage(d, '/about', inMain(html))));

test('a11y passes on a good site', (t) => {
  const r = run(site(t));
  assert.equal(r.status, 0, r.out);
});

test('a11y names the success criterion of a finding', (t) => {
  assert.match(broken(t, '<img src="/og.jpg">').out, /img-alt \(WCAG 1\.1\.1\)/);
});

test('a11y reports a page without lang', (t) => {
  const dir = site(t, (d) => editPage(d, '/about', (s) => s.replace('<html lang="en">', '<html>')));
  assert.match(run(dir).out, /html-lang \(WCAG 3\.1\.1\)/);
});

test('a11y reports a page without a title', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(/<title>.*<\/title>/, '<title></title>')),
  );
  assert.match(run(dir).out, /title \(WCAG 2\.4\.2\)/);
});

test('a11y reports a viewport that blocks zoom', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace('initial-scale=1', 'initial-scale=1, user-scalable=no')),
  );
  assert.match(run(dir).out, /zoom \(WCAG 1\.4\.4\)/);
});

test('a11y reports a page with two main landmarks', (t) => {
  assert.match(broken(t, '</main><main>x').out, /landmark-main/);
});

test('a11y reports a page without a footer landmark', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(/<footer>[\s\S]*<\/footer>/, '')),
  );
  assert.match(run(dir).out, /landmark-contentinfo/);
});

test('a11y reports a link and a button without an accessible name', (t) => {
  const r = broken(t, '<a href="/contact"></a><button></button>');
  assert.match(
    r.out,
    /name-missing \(WCAG 4\.1\.2\)[\s\S]*<a href="\/contact"> has no accessible name/,
  );
  assert.match(r.out, /<button> has no accessible name/);
});

test('a11y accepts an image with alt and a decorative image with empty alt', (t) => {
  assert.equal(
    broken(
      t,
      '<img src="/og.jpg" alt="A bike" width="1" height="1"><img src="/og.jpg" alt="" width="1" height="1">',
    ).status,
    0,
  );
});

test('a11y reports a form field without a label', (t) => {
  assert.match(
    broken(t, '<form><input type="text" name="city"></form>').out,
    /field-label \(WCAG 3\.3\.2\)/,
  );
});

test('a11y accepts a form field with a label', (t) => {
  assert.equal(
    broken(t, '<form><label for="c">City</label><input id="c" type="text" name="city"></form>')
      .status,
    0,
  );
});

test('a11y reports a personal field without autocomplete', (t) => {
  assert.match(
    broken(t, '<form><label for="e">Email</label><input id="e" type="email" name="email"></form>')
      .out,
    /autocomplete \(WCAG 1\.3\.5\)/,
  );
});

test('a11y reports an iframe without a title', (t) => {
  assert.match(broken(t, '<iframe src="/about"></iframe>').out, /iframe-title/);
});

test('a11y reports an aria reference to an id that does not exist', (t) => {
  assert.match(broken(t, '<div aria-labelledby="nothing">x</div>').out, /aria-reference/);
});

test('a11y reports a positive tabindex', (t) => {
  assert.match(broken(t, '<div tabindex="3">x</div>').out, /tabindex \(WCAG 2\.4\.3\)/);
});

test('a11y reports a list that holds something other than list items', (t) => {
  assert.match(broken(t, '<ul><div>x</div></ul>').out, /list-children/);
});

test('a11y reports a stylesheet without a :focus-visible rule', (t) => {
  const dir = site(t, (d) =>
    edit(
      d,
      '.output/public/_nuxt/entry.css',
      () => '@media (prefers-reduced-motion:reduce){*{animation:none}}',
    ),
  );
  assert.match(run(dir).out, /focus-visible \(WCAG 2\.4\.7\)/);
});

test('a11y reports a stylesheet without a prefers-reduced-motion rule', (t) => {
  const dir = site(t, (d) =>
    edit(d, '.output/public/_nuxt/entry.css', () => 'a:focus-visible{outline:2px solid #000}'),
  );
  assert.match(run(dir).out, /reduced-motion \(WCAG 2\.3\.3\)/);
});

const a11ySettings = (dir, a11y) =>
  edit(dir, 'ds7.config.json', (s) => JSON.stringify({ ...JSON.parse(s), a11y }));
const withSkipLink = (s) =>
  s
    .replace('<header>', '<a href="#main">Skip to content</a><header>')
    .replace('<main>', '<main id="main">');

test('a11y advises on a page without a skip link, and fails on it when a11y.skipLink is "require"', (t) => {
  const dir = site(t);
  const r = run(dir);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /advice: .*skip link/);
  a11ySettings(dir, { skipLink: 'require' });
  assert.match(run(dir).out, /skip-link \(WCAG 2\.4\.1\)/);
});

test('a11y accepts a skip link to <main id> as the first link', (t) => {
  const dir = site(t, (d) => {
    for (const p of ['/', '/about', '/contact']) editPage(d, p, withSkipLink);
  });
  a11ySettings(dir, { skipLink: 'require' });
  const r = run(dir);
  assert.equal(r.status, 0, r.out);
});

test('a11y with exceptionPolicy "strict" wants a reason, the comment above the rule and no stale entry', (t) => {
  const dir = site(t);
  put(dir, 'app/assets/css/ui.css', '.faint { color: #999999; background: #ffffff }\n');
  a11ySettings(dir, {
    exceptionPolicy: 'strict',
    exceptions: [
      { selector: '.faint', reason: 'owner keeps it' },
      {
        selector: '.gone',
        reason:
          'a large display heading, decided by the owner on 2026-11-01, ends with the redesign',
      },
    ],
  });
  const out = run(dir).out;
  assert.match(out, /needs a reason that says why/);
  assert.match(out, /put \/\* a11y exception/);
  assert.match(out, /"\.gone" no longer matches a failing rule/);
});
