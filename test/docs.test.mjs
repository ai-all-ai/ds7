// `ds7 docs`: what the documents name must exist. One test per kind of finding.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { project, cli, put, edit } from './helpers.mjs';

const docs = (dir) => cli(dir, ['docs']);
// a document that ALL.md routes to, so it is not an orphan
const note = (dir, text) => {
  put(dir, 'docs/NOTES.md', text);
  edit(dir, 'ALL.md', (s) => `${s}\nSee docs/NOTES.md.\n`);
};

test('docs passes on a fresh project', (t) => {
  const r = docs(project(t));
  assert.equal(r.status, 0, r.out);
});

test('docs reports an npm script that package.json does not have', (t) => {
  const dir = project(t);
  note(dir, '# Notes\n\nRun `npm run nope`.\n');
  assert.match(docs(dir).out, /docs\/NOTES\.md:3: npm run nope: no such script/);
});

test('docs accepts an npm script that exists', (t) => {
  const dir = project(t);
  note(dir, '# Notes\n\nRun `npm run audit`.\n');
  assert.equal(docs(dir).status, 0);
});

test('docs reports a project path that does not exist', (t) => {
  const dir = project(t);
  note(dir, '# Notes\n\nSee `app/ghost.ts`.\n');
  assert.match(docs(dir).out, /`app\/ghost\.ts` does not exist/);
});

test('docs skips a path marked (new) because it is planned', (t) => {
  const dir = project(t);
  note(dir, '# Notes\n\nSoon: `app/future.ts` (new).\n');
  assert.equal(docs(dir).status, 0);
});

test('docs reports a relative link that points at no file', (t) => {
  const dir = project(t);
  note(dir, '# Notes\n\nSee [missing](MISSING.md).\n');
  assert.match(docs(dir).out, /link \(MISSING\.md\) points at no file/);
});

test('docs reports a section reference to a heading that does not exist', (t) => {
  const dir = project(t);
  note(dir, '# Notes\n\nSee `docs/ARCHITECTURE.md` section 99.\n');
  assert.match(docs(dir).out, /docs\/ARCHITECTURE\.md section 99 does not exist/);
});

test('docs reports a skill that ALL.md does not register', (t) => {
  const dir = project(t);
  put(
    dir,
    '.agents/skills/extra/SKILL.md',
    '---\nname: extra\ndescription: Does a thing.\n---\n# Extra\n',
  );
  assert.match(docs(dir).out, /skill \.agents\/skills\/extra\/SKILL\.md is not registered/);
});

test('docs reports a skill whose frontmatter name is not its folder', (t) => {
  const dir = project(t);
  edit(dir, '.agents/skills/seo-page/SKILL.md', (s) => s.replace('name: seo-page', 'name: other'));
  assert.match(docs(dir).out, /frontmatter name must be "seo-page"/);
});

test('docs reports a document in docs/ that nothing refers to', (t) => {
  const dir = project(t);
  put(dir, 'docs/LONELY.md', '# Lonely\n');
  assert.match(docs(dir).out, /docs\/LONELY\.md:1: no document refers to it/);
});

test('docs does not scan the files AI-ALL manages', (t) => {
  const dir = project(t);
  put(dir, '.ai/NOTE.md', '# x\n\nSee [nothing](../nothing.md) and `npm run nope`.\n');
  assert.equal(docs(dir).status, 0);
});

test('docs does not check the generated placement table', (t) => {
  const dir = project(t);
  edit(dir, 'docs/ARCHITECTURE.md', (s) =>
    s.replace('<!-- placement:end -->', '| `app/not-yet.vue` | x |\n<!-- placement:end -->'),
  );
  assert.equal(docs(dir).status, 0);
  assert.ok(fs.existsSync(path.join(dir, 'docs/ARCHITECTURE.md')));
});
