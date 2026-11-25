// `ds7 audit html`: markup, links and assets of the build. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { site, cli, editPage, put } from './helpers.mjs';

const run = (dir) => cli(dir, ['audit', 'html']);

test('html passes on a good site', (t) => {
  const r = run(site(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /3 pages, 0 problems/);
});

test('html reports a second h1', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) =>
      s.replace('<h1>About our shop</h1>', '<h1>About our shop</h1><h1>Second</h1>'),
    ),
  );
  assert.match(run(dir).out, /h1-count[\s\S]*\/about\/ {2}2 h1 tags/);
});

test('html reports an image without alt', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) =>
      s.replace('</main>', '<img src="/og.jpg" width="1" height="1"></main>'),
    ),
  );
  assert.match(run(dir).out, /img-alt/);
});

test('html reports an image file that does not exist', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) =>
      s.replace('</main>', '<img src="/missing.png" alt="x" width="1" height="1"></main>'),
    ),
  );
  assert.match(run(dir).out, /missing-image[\s\S]*\/missing\.png/);
});

test('html reports an image without width and height', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace('</main>', '<img src="/og.jpg" alt="x"></main>')),
  );
  assert.match(run(dir).out, /img-size/);
});

test('html reports a page without lang on the html element', (t) => {
  const dir = site(t, (d) => editPage(d, '/about', (s) => s.replace('<html lang="en">', '<html>')));
  assert.match(run(dir).out, /html-lang/);
});

test('html reports a duplicate id', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace('</main>', '<i id="a"></i><i id="a"></i></main>')),
  );
  assert.match(run(dir).out, /duplicate-id/);
});

test('html reports a page without a title', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace(/<title>.*<\/title>/, '<title></title>')),
  );
  assert.match(run(dir).out, /title[\s\S]*empty <title>/);
});

test('html reports an internal link to a page that does not exist', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace('</main>', '<a href="/nowhere">x</a></main>')),
  );
  assert.equal(run(dir).status, 1);
  assert.match(run(dir).out, /\/nowhere/);
});

test('html explains what to run when there is no build', (t) => {
  const dir = site(t);
  put(dir, 'package.json', '{}');
  const r = cli(dir, ['audit', 'html', '--out', 'nowhere']);
  assert.equal(r.status, 1);
  assert.match(r.out, /npm run generate/);
});

test('html under a base path reports a root path outside the base and accepts one inside it', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) =>
      s.replace(
        '<h1>About our shop</h1>',
        '<h1>About our shop</h1><a href="/shop/contact/">in</a><a href="/contact/">out</a>',
      ),
    ),
  );
  const r = cli(dir, ['audit', 'html', '--base', '/shop/']);
  assert.match(r.out, /outside-base[\s\S]*\/contact\/ does not start with \/shop\//);
  assert.doesNotMatch(r.out, /broken-link[\s\S]*\/shop\/contact/);
});
