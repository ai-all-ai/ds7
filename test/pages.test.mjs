// `ds7 pages`: the GitHub Pages preset writes what is missing and never a second deploy workflow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { project, cli, put, has, read } from './helpers.mjs';

test('pages writes the asset() helper and the Pages workflow', (t) => {
  const dir = project(t);
  const r = cli(dir, ['pages']);
  assert.equal(r.status, 0, r.out);
  assert.match(read(dir, 'app/utils/asset.ts'), /export function asset/);
  assert.match(read(dir, '.github/workflows/pages.yml'), /NUXT_APP_BASE_URL/);
});

test('pages keeps a workflow that already deploys to Pages and an existing helper', (t) => {
  const dir = project(t);
  put(dir, '.github/workflows/site.yml', 'steps:\n  - uses: actions/deploy-pages@v4\n');
  put(dir, 'app/utils/asset.ts', '// mine\n');
  const r = cli(dir, ['pages']);
  assert.ok(!has(dir, '.github/workflows/pages.yml'));
  assert.equal(read(dir, 'app/utils/asset.ts'), '// mine\n');
  assert.match(r.out, /site\.yml \(it already deploys to Pages/);
});
