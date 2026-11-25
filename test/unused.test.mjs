// `ds7 unused`: components, exports, data files and assets nothing refers to. One test per kind.
import test from 'node:test';
import assert from 'node:assert/strict';
import { project, miniApp, cli, put, edit } from './helpers.mjs';

const unused = (dir) => cli(dir, ['unused']);
const ready = (t) => {
  const dir = project(t);
  miniApp(dir);
  return dir;
};

test('unused passes when everything is referred to', (t) => {
  const r = unused(ready(t));
  assert.equal(r.status, 0, r.out);
});

test('unused reports a component nobody renders, and accepts a Lazy one', (t) => {
  const dir = ready(t);
  put(dir, 'app/components/ui/UiGhost.vue', '<template><i /></template>\n');
  put(dir, 'app/components/ui/UiLate.vue', '<template><i /></template>\n');
  put(dir, 'app/pages/about.vue', '<template><LazyUiLate /></template>\n');
  const r = unused(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /UiGhost is used nowhere/);
  assert.doesNotMatch(r.out, /UiLate/);
});

test('unused reports an export nobody calls', (t) => {
  const dir = ready(t);
  put(dir, 'app/utils/money.ts', 'export const euros = (n) => n\nexport const cents = (n) => n\n');
  put(dir, 'app/pages/about.vue', '<script setup>\nconst x = euros(1)\n</script>\n');
  assert.match(unused(dir).out, /cents is exported but used nowhere/);
});

test('unused reports a public image nobody names, and accepts the variants of a used one', (t) => {
  const dir = ready(t);
  put(dir, 'public/images/hero.webp', 'x');
  put(dir, 'public/images/hero-800.webp', 'x');
  put(dir, 'public/images/stale.webp', 'x');
  put(dir, 'app/pages/about.vue', '<template><img src="/images/hero.webp" /></template>\n');
  const r = unused(dir);
  assert.match(r.out, /public\/images\/stale\.webp/);
  assert.doesNotMatch(r.out, /hero/);
});

test('unused leaves out unused.ignore and kinds switched off', (t) => {
  const dir = ready(t);
  put(dir, 'public/images/cities/sevilla.webp', 'x');
  put(dir, 'app/components/ui/UiGhost.vue', '<template><i /></template>\n');
  edit(dir, 'ds7.config.json', (s) =>
    JSON.stringify({
      ...JSON.parse(s),
      unused: { ignore: ['public/images/cities/**'], components: false },
    }),
  );
  assert.equal(unused(dir).status, 0);
});
