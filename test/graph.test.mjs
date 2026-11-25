// `ds7 graph`: the generated code map and its queries. One test per behaviour.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bare, project, miniApp, cli, put, read, has } from './helpers.mjs';

const graph = (dir, ...args) => cli(dir, ['graph', ...args]);
const ready = (t) => {
  const dir = project(t);
  miniApp(dir);
  assert.equal(graph(dir).status, 0);
  return dir;
};

test('graph writes docs/SITE-GRAPH.md with the routes and components of the app', (t) => {
  const text = read(ready(t), 'docs/SITE-GRAPH.md');
  for (const name of ['SectionsHero', 'UiButton'])
    assert.ok(text.includes(name), `${name} is in the graph`);
});

test('graph fills the placement table of docs/ARCHITECTURE.md between its markers', (t) => {
  const text = read(ready(t), 'docs/ARCHITECTURE.md');
  assert.match(
    text,
    /<!-- placement:begin -->[\s\S]*app\/components\/ui[\s\S]*<!-- placement:end -->/,
  );
});

test('graph --check passes on a current graph', (t) => {
  assert.equal(graph(ready(t), '--check').status, 0);
});

test('graph --check fails when the code changed after the graph was written', (t) => {
  const dir = ready(t);
  put(dir, 'app/components/sections/SectionsNew.vue', '<template><UiButton /></template>\n');
  assert.equal(graph(dir, '--check').status, 1);
});

test('graph --uses lists who uses a component', (t) => {
  assert.match(graph(ready(t), '--uses', 'UiButton').stdout, /SectionsHero/);
});

test('graph --of shows what a page is made of', (t) => {
  const r = graph(ready(t), '--of', '/');
  assert.match(r.stdout, /SectionsHero/);
  assert.match(r.stdout, /UiButton/);
});

test('graph --css finds where a class is the root of a component', (t) => {
  assert.match(graph(ready(t), '--css', 'btn').stdout, /UiButton/);
});

test('graph answers an unknown name with a message and a failing exit code', (t) => {
  const r = graph(ready(t), '--uses', 'NoSuchThing');
  assert.equal(r.status, 1);
});

test('graph ignores a component named only in a comment', (t) => {
  const dir = project(t);
  miniApp(dir);
  put(
    dir,
    'app/components/sections/SectionsNote.vue',
    '<template><p>x</p></template>\n<!-- <UiButton /> -->\n',
  );
  assert.equal(graph(dir).status, 0);
  assert.doesNotMatch(graph(dir, '--uses', 'UiButton').stdout, /SectionsNote/);
});

test('graph --budget puts the most used file first', (t) => {
  const dir = ready(t);
  put(
    dir,
    'app/components/sections/SectionsMore.vue',
    '<template><UiButton>More</UiButton></template>\n',
  );
  const lines = graph(dir, '--budget', '1000').stdout.split('\n');
  assert.match(lines[1], /^- UiButton /);
  assert.match(lines[1], /by SectionsHero, SectionsMore/);
});

test('graph --budget stops when the budget is spent and says how much it left out', (t) => {
  const dir = ready(t);
  const all = graph(dir, '--budget', '5000').stdout.match(/\((\d+) of (\d+) files shown/);
  const few = graph(dir, '--budget', '80').stdout.match(/\((\d+) of (\d+) files shown/);
  assert.equal(all[1], all[2]);
  assert.ok(Number(few[1]) < Number(few[2]), `${few[0]} must be fewer than ${few[2]}`);
});

test('graph --budget needs a number', (t) => {
  const r = graph(ready(t), '--budget', 'many');
  assert.equal(r.status, 1);
  assert.match(r.out, /--budget needs a number of tokens/);
});

test('graph --stats compares the size of the map with the files it covers', (t) => {
  const r = graph(ready(t), '--stats');
  assert.equal(r.status, 0, r.out);
  assert.match(
    r.stdout,
    /the map is about \d+ tokens; the \d+ files it covers are about \d+ tokens/,
  );
});

test('graph --budget and --stats do not write the map', (t) => {
  const dir = bare(t);
  miniApp(dir);
  assert.equal(graph(dir, '--budget', '500').status, 0);
  assert.equal(graph(dir, '--stats').status, 0);
  assert.equal(has(dir, 'docs/SITE-GRAPH.md'), false);
});
