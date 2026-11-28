// `ds7 css`: the stylesheet audit and the refactor diff. One test per rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { project, cli, put, edit } from './helpers.mjs';

const css = (dir, ...args) => cli(dir, ['css', ...args]);
// main.css keeps the imports `ds7 init` gets from @ai.all/ui (theme-base.css, base.css)
const uiImports = "@import './theme-base.css';\n@import './base.css';\n";
const styled = (t, { main = '@import "./ui.css";\n', ui = '.card { color: red }\n' } = {}) => {
  const dir = project(t);
  put(dir, 'app/assets/css/main.css', uiImports + main);
  put(dir, 'app/assets/css/ui.css', ui);
  put(dir, 'app/components/ui/UiCard.vue', '<template><div class="card">x</div></template>\n');
  return dir;
};

test('css passes when every class is used and every file imported', (t) => {
  const r = css(styled(t));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /css OK/);
});

test('css reports a class no template uses', (t) => {
  // a name no template uses; the brandbook page from @ai.all/ui uses many words (ghost, outline…)
  const r = css(styled(t, { ui: '.card { color: red }\n.phantom { color: blue }\n' }));
  assert.equal(r.status, 1);
  assert.match(r.out, /dead-class[\s\S]*\.phantom/);
});

test('css counts a dash modifier built from a prop as used', (t) => {
  const dir = styled(t, { ui: '.card { color: red }\n.card.-dark { color: blue }\n' });
  put(dir, 'app/components/ui/UiTone.vue', "<script setup>\nconst tone = 'dark'\n</script>\n");
  assert.equal(css(dir).status, 0);
});

test('css reports a stylesheet the entry does not import', (t) => {
  const dir = styled(t);
  put(dir, 'app/assets/css/old.css', '.card { color: red }\n');
  assert.match(css(dir).out, /orphan-file[\s\S]*old\.css/);
});

test('css advises on a selector defined twice in one context, without failing', (t) => {
  const r = css(styled(t, { ui: '.card { color: red }\n.card { margin: 0 }\n' }));
  assert.equal(r.status, 0);
  assert.match(r.out, /advice: 1 selector/);
});

test('css advises on !important in stylesheets and component styles, without failing', (t) => {
  const dir = styled(t, { ui: '.card { color: red !important }\n' });
  put(
    dir,
    'app/components/ui/UiCard.vue',
    '<template><div class="card">x</div></template>\n<style>\n.card { margin: 0 ! important }\n</style>\n',
  );
  const r = css(dir);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /advice: 2 !important/);
  assert.match(r.out, /UiCard\.vue:3/);
  edit(dir, 'ds7.config.json', (s) =>
    JSON.stringify({ ...JSON.parse(s), css: { important: 'off' } }),
  );
  assert.doesNotMatch(css(dir).out, /!important/);
});

test('css takes its folder and switches from ds7.config.json', (t) => {
  const dir = styled(t, { ui: '.card { color: red }\n.ghost { color: blue }\n' });
  edit(dir, 'ds7.config.json', (s) => JSON.stringify({ ...JSON.parse(s), css: { dead: false } }));
  assert.equal(css(dir).status, 0);
  edit(dir, 'ds7.config.json', (s) => JSON.stringify({ ...JSON.parse(s), css: false }));
  assert.match(css(dir).out, /css: off/);
});

test('css checks native nesting only in the selected CSS profile', (t) => {
  const dir = styled(t, { ui: '.card { &-large { color: red } }\n' });
  edit(dir, 'ds7.config.json', (s) =>
    JSON.stringify({ ...JSON.parse(s), css: { profile: 'existing', dead: false } }),
  );
  assert.equal(css(dir).status, 0, 'an existing Sass profile keeps its syntax');
  edit(dir, 'ds7.config.json', (s) =>
    JSON.stringify({ ...JSON.parse(s), css: { profile: 'ds-native', dead: false } }),
  );
  const r = css(dir);
  assert.equal(r.status, 1);
  assert.match(r.out, /sass-concatenation[\s\S]*&-large/);
});

test('css rejects media variables and advises on non-base viewport widths without banning container widths', (t) => {
  const dir = styled(t, {
    ui: '.card { color: red; @container (width >= 520px) { > .title { color: blue } } }\n@media (width >= 768px) { .card { color: blue } }\n',
  });
  put(
    dir,
    'app/components/ui/UiCard.vue',
    '<template><div class="card"><span class="title">x</span></div></template>\n',
  );
  edit(dir, 'ds7.config.json', (s) =>
    JSON.stringify({ ...JSON.parse(s), css: { profile: 'ds-native' } }),
  );
  assert.equal(css(dir).status, 0);
  put(dir, 'app/assets/css/ui.css', '@media (width >= 900px) { .card { color: red } }\n');
  const advice = css(dir);
  assert.equal(advice.status, 0);
  assert.match(advice.out, /advice: 1 non-base viewport threshold/);
  put(dir, 'app/assets/css/ui.css', '@media (width >= var(--bp-md)) { .card { color: red } }\n');
  const invalid = css(dir);
  assert.equal(invalid.status, 1);
  assert.match(invalid.out, /media-variable/);
});

test('css diff passes a refactor that keeps every rule and reports one that loses a rule', (t) => {
  const dir = styled(t, { ui: '.card { color: red; margin: 0 }\n' });
  const git = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');
  put(dir, 'app/assets/css/ui.css', '.card {\n  margin: 0;\n  color: red;\n}\n');
  assert.equal(css(dir, 'diff').status, 0);
  put(dir, 'app/assets/css/ui.css', '.card { color: red }\n');
  const r = css(dir, 'diff');
  assert.equal(r.status, 1);
  assert.match(r.out, /- \.card \{ margin: 0 \}/);
});
