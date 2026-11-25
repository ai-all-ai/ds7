// `ds7 audit`: the runner that runs html, seo, a11y and perf. The rules of each audit are in html.test.mjs, seo.test.mjs,
// a11y.test.mjs and perf.test.mjs; here only what the runner itself does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { site, cli, editPage, bare } from './helpers.mjs';

test('audit runs all four audits and passes on a good site', (t) => {
  const r = cli(site(t), ['audit']);
  assert.equal(r.status, 0, r.out);
  for (const name of ['html', 'seo', 'a11y', 'perf'])
    assert.match(r.out, new RegExp(`ds7 audit ${name}`));
});

test('audit fails when one audit fails and still runs the others', (t) => {
  const dir = site(t, (d) =>
    editPage(d, '/about', (s) => s.replace('</main>', '<img src="/og.jpg"></main>')),
  );
  const r = cli(dir, ['audit']);
  assert.equal(r.status, 1);
  for (const name of ['html', 'seo', 'a11y', 'perf'])
    assert.match(r.out, new RegExp(`ds7 audit ${name}`));
  assert.match(r.out, /audits? failed/);
});

test('audit with a name runs only that audit', (t) => {
  const r = cli(site(t), ['audit', 'seo']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /ds7 audit seo/);
  assert.doesNotMatch(r.out, /ds7 audit perf/);
});

test('audit rejects a name it does not know and lists the ones it has', (t) => {
  const r = cli(site(t), ['audit', 'nope']);
  assert.equal(r.status, 1);
  assert.match(r.out, /Unknown audit: nope \(html, seo, a11y, perf\)/);
});

test('audit says what to run when there is no build', (t) => {
  const r = cli(bare(t), ['audit']);
  assert.equal(r.status, 1);
  assert.match(r.out, /npm run generate/);
});
