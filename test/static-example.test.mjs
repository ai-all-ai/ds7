import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { calculateEnergy } from '../examples/static-html/calculate.mjs';

const fixture = path.dirname(
  fileURLToPath(new URL('../examples/static-html/index.html', import.meta.url)),
);

test('static example shares pure logic without browser globals', async () => {
  assert.equal(calculateEnergy({ powerKw: 5, hours: 6 }), 25.5);
  assert.throws(() => calculateEnergy({ powerKw: -1, hours: 6 }), RangeError);
  await import('../examples/static-html/calculator-dom.mjs');
});

test('static example serves its content without a framework or remote assets', () => {
  const html = fs.readFileSync(path.join(fixture, 'index.html'), 'utf8');
  assert.match(html, /<main id="main">/);
  assert.match(html, /<details class="faq-item">/);
  assert.match(html, /<script type="module" src="\.\/boot\.mjs"><\/script>/);
  for (const asset of ['site.css', 'boot.mjs', 'calculator-dom.mjs', 'calculate.mjs'])
    assert.ok(fs.existsSync(path.join(fixture, asset)));
});

test('DS7 HTML and accessibility audits accept the static example', () => {
  for (const name of ['html', 'a11y']) {
    const run = spawnSync(
      process.execPath,
      ['../../bin/ds7.js', 'audit', name, '--out', '.', '--strict'],
      {
        cwd: fixture,
        encoding: 'utf8',
      },
    );
    assert.equal(run.status, 0, run.stdout + run.stderr);
  }
});
