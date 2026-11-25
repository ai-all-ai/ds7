// `ds7 layout`: placement rules, required documents, import layers and cycles. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { project, miniApp, cli, put, edit } from './helpers.mjs';

const layout = (dir) => cli(dir, ['layout']);

test('layout passes on a project with a clean mini app', (t) => {
  const dir = project(t);
  miniApp(dir);
  const r = layout(dir);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /0 problems/);
});

test('layout reports a file that no placement rule covers', (t) => {
  const dir = project(t);
  put(dir, 'app/stray.ts', 'export const x = 1;\n');
  const r = layout(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /app\/stray\.ts: no placement rule/);
});

test('layout accepts a folder once the project adds a rule for it', (t) => {
  const dir = project(t);
  put(dir, 'app/extra/thing.ts', 'export const x = 1;\n');
  edit(dir, 'ds7.config.json', () =>
    JSON.stringify({ layout: { rules: [{ path: 'app/extra/*.ts', what: 'extra' }] } }),
  );
  assert.equal(layout(dir).status, 0);
});

test('layout enforces the file name prefix of a folder rule', (t) => {
  const dir = project(t);
  edit(dir, 'ds7.config.json', () =>
    JSON.stringify({
      layout: { rules: [{ path: 'app/widgets/*.vue', what: 'widgets', prefix: 'Widget' }] },
    }),
  );
  put(dir, 'app/widgets/Thing.vue', '<template><div /></template>\n');
  assert.match(
    layout(dir).out,
    /app\/widgets\/Thing\.vue: file names in this folder start with "Widget"/,
  );
});

test('layout reports a required document that is missing', (t) => {
  const dir = project(t);
  fs.rmSync(path.join(dir, 'docs/DECISIONS.md'));
  assert.match(layout(dir).out, /docs\/DECISIONS\.md: required .* and missing/);
});

test('layout rejects an atom that imports a section of an upper layer', (t) => {
  const dir = project(t);
  miniApp(dir);
  put(
    dir,
    'app/components/ui/UiBad.vue',
    "<script setup>\nimport SectionsHero from '../sections/SectionsHero.vue'\n</script>\n<template><div /></template>\n",
  );
  const r = layout(dir);
  assert.equal(r.status, 1);
  assert.match(
    r.out,
    /UiBad\.vue -> app\/components\/sections\/SectionsHero\.vue: atoms and molecules do not depend on upper layers/,
  );
});

test('layout rejects data that imports a component', (t) => {
  const dir = project(t);
  miniApp(dir);
  put(
    dir,
    'app/data/list.ts',
    "import UiButton from '../components/ui/UiButton.vue'\nexport const x = UiButton\n",
  );
  assert.match(
    layout(dir).out,
    /app\/data\/list\.ts -> app\/components\/ui\/UiButton\.vue: data stays plain/,
  );
});

test('layout rejects a composable that imports a page', (t) => {
  const dir = project(t);
  miniApp(dir);
  put(
    dir,
    'app/composables/useThing.ts',
    "import Page from '../pages/index.vue'\nexport const useThing = () => Page\n",
  );
  assert.match(layout(dir).out, /composables never depend on the view layer/);
});

test('layout rejects an import cycle between two components', (t) => {
  const dir = project(t);
  put(dir, 'app/components/sections/SectionsA.vue', '<template><SectionsB /></template>\n');
  put(dir, 'app/components/sections/SectionsB.vue', '<template><SectionsA /></template>\n');
  const r = layout(dir);
  assert.equal(r.status, 1);
  assert.match(
    r.out,
    /cycle: app\/components\/sections\/Sections[AB]\.vue -> .* -> app\/components\/sections\/Sections[AB]\.vue/,
  );
});

test('layout accepts a recursive component (a file that uses itself is not a cycle)', (t) => {
  const dir = project(t);
  put(dir, 'app/components/sections/SectionsTree.vue', '<template><SectionsTree /></template>\n');
  assert.equal(layout(dir).status, 0, layout(dir).out);
});
