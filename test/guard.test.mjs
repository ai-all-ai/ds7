// `ds7 guard`: modifier names and atomic layers. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { project, cli, put, edit } from './helpers.mjs';

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

test('guard allows the is- state classes by default, with advice', (t) => {
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
  put(dir, 'app/components/home/HomeHero.vue', '<template><section>x</section></template>\n');
  put(dir, 'app/components/ui/UiBad.vue', '<template><HomeHero /></template>\n');
  const r = guard(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /ui → upper layer/);
});

const guardSettings = (dir, guard) =>
  edit(dir, 'ds7.config.json', (s) => JSON.stringify({ ...JSON.parse(s), guard }));
const stateMenu = (dir) =>
  put(
    dir,
    'app/components/ui/UiMenu.vue',
    '<template><nav class="menu is-open">x</nav></template>\n',
  );

test('guard advises on is- state classes without failing', (t) => {
  const dir = project(t);
  stateMenu(dir);
  const r = guard(dir);
  assert.equal(r.status, 0);
  assert.match(r.out, /is-\* state class[\s\S]*is-open[\s\S]*guard\.stateClasses/);
});

test('guard rejects is- state classes when guard.stateClasses is "deny"', (t) => {
  const dir = project(t);
  stateMenu(dir);
  guardSettings(dir, { stateClasses: 'deny' });
  const r = guard(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /is-open \(baked-in modifier\)/);
});

test('guard says nothing of is- state classes when guard.stateClasses is "allow"', (t) => {
  const dir = project(t);
  stateMenu(dir);
  guardSettings(dir, { stateClasses: 'allow' });
  assert.doesNotMatch(guard(dir).out, /is-open/);
});

test('guard leaves out the classes of guard.allowClasses', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiButton.vue',
    '<template><button class="btn-big">x</button></template>\n',
  );
  guardSettings(dir, { allowClasses: ['btn-big'] });
  assert.equal(guard(dir).status, 0);
});

test('guard takes its modifier words from guard.suffixes', (t) => {
  const dir = project(t);
  put(
    dir,
    'app/components/ui/UiButton.vue',
    '<template><button class="btn-big btn-huge">x</button></template>\n',
  );
  guardSettings(dir, { suffixes: ['huge'] });
  const r = guard(dir);
  assert.match(r.out, /btn-huge/);
  assert.doesNotMatch(r.out, /btn-big/);
});

test('guard takes the upper layers from guard.upperLayers, and false turns the layer rule off', (t) => {
  const dir = project(t);
  put(dir, 'app/components/ui/UiBad.vue', '<template><PromoBox /></template>\n');
  guardSettings(dir, { upperLayers: ['Promo'] });
  assert.match(guard(dir).out, /ui → upper layer[\s\S]*PromoBox/);
  guardSettings(dir, { uiDir: false });
  assert.equal(guard(dir).status, 0);
});

test('guard takes the page style limit from guard.pageStyleLines', (t) => {
  const dir = project(t);
  const style = Array.from({ length: 12 }, (_, i) => `.x${i} { color: red }`).join('\n');
  put(dir, 'app/pages/about.vue', `<template><p>x</p></template>\n<style>\n${style}\n</style>\n`);
  assert.equal(guard(dir).status, 0);
  guardSettings(dir, { pageStyleLines: 10 });
  assert.match(guard(dir).out, /page with 14 style lines/);
  guardSettings(dir, { pageStyleLines: false });
  assert.equal(guard(dir).status, 0);
});
