// `ds7 console`: browser complaints on every page of the build. Without Playwright it says how to install it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { site, put, bin } from './helpers.mjs';

let playwright = null;
try {
  playwright = createRequire(import.meta.url)('playwright');
} catch {
  /* not installed: only the message is tested */
}
const run = (dir, env = {}) => {
  const r = spawnSync(process.execPath, [bin, 'console', '--widths', '390'], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, CI: '', ...env },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
};

test(
  'console says how to install Playwright when it is missing, and fails only on CI',
  { skip: !!playwright },
  (t) => {
    const dir = site(t);
    const r = run(dir);
    assert.equal(r.status, 0);
    assert.match(r.out, /npm i -D playwright/);
    assert.equal(run(dir, { CI: 'true' }).status, 1);
  },
);

test(
  'console reports a console error and passes a message listed in console.allow',
  { skip: !playwright },
  (t) => {
    const dir = site(t);
    put(
      dir,
      '.output/public/about/index.html',
      '<!doctype html><body><script>console.error("boom")</script></body>',
    );
    const r = run(dir);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /console-error: boom/);
    put(dir, 'ds7.config.json', JSON.stringify({ console: { allow: ['boom'], warnings: false } }));
    assert.doesNotMatch(run(dir).out, /boom/);
  },
);
