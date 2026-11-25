// `ds7 guard`: modifier names and atomic layers. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { project, cli, put } from './helpers.mjs';

const guard = (dir) => cli(dir, ['guard', '--strict']);

test('guard passes on a project without components', (t) => {
  assert.equal(guard(project(t)).status, 0);
});

test('guard passes on a base class with a separate dash modifier', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiCard.vue',
    '<template><article class="p-card -top -compact">x</article></template>\n',
  );
  assert.equal(guard(dir).status, 0);
});

test('guard rejects a baked-in modifier in a template', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiButton.vue',
    '<template><button class="btn-big">x</button></template>\n',
  );
  const r = guard(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /btn-big \(baked-in modifier\)/);
});

test('guard rejects a baked-in modifier defined in a stylesheet block', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiButton.vue',
    '<template><button class="btn">x</button></template>\n<style>\n.btn-big { padding: 2rem }\n</style>\n',
  );
  assert.match(guard(dir).out, /btn-big \(baked-in modifier\)/);
});

test('guard allows the is- state classes', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiMenu.vue',
    '<template><nav class="menu is-open is-new is-dark">x</nav></template>\n',
  );
  assert.equal(guard(dir).status, 0);
});

test('guard rejects an atom that renders a section of an upper layer', (t) => {
  const dir = project(t);
  put(dir, 'app/components/ui/UiBad.vue', '<template><HomeHero /></template>\n');
  const r = guard(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /ui → upper layer/);
});
