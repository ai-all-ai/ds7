// `ds7 dev`: a named local address and a port of the series 3010, 3020, ..., kept in ds7.config.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { bare, cli, put, read } from './helpers.mjs';
import { devName, freePort, validPort } from '../bin/lib/dev.mjs';

const dry = (dir) => cli(dir, ['dev', '--dry-run']);

test('the dev name comes from the package name', () => {
  assert.equal(devName('@team/velo.es'), 'velo');
  assert.equal(devName('miluzsolar.es'), 'miluzsolar');
  assert.equal(devName('My Shop'), 'my-shop');
  assert.equal(devName(''), 'project');
});

test('ports 3000, 4000 and 4500 are never used, and the series starts at 3010', async () => {
  for (const p of [3000, 4000, 4500]) assert.equal(validPort(p), false);
  const p = await freePort();
  assert.ok(p >= 3010 && (p - 3010) % 10 === 0);
});

test('dev picks a port, saves it with the name and keeps it on the next run', (t) => {
  const dir = bare(t);
  put(dir, 'package.json', JSON.stringify({ name: 'velo.es' }));
  const r = dry(dir);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /ds7 dev: http:\/\/velo\.localhost:\d+/);
  assert.doesNotMatch(r.out, /^.*127\.0\.0\.1:\d+/m);
  // a dry run saves nothing; a configured port is used as it is
  put(dir, 'ds7.config.json', JSON.stringify({ dev: { port: 3990, name: 'velo' } }));
  const again = dry(dir);
  assert.match(again.out, /--port 3990 --strictPort --publicURL http:\/\/velo\.localhost:3990/);
});

test('dev replaces 3000 with a port of the series', (t) => {
  const dir = bare(t);
  put(dir, 'ds7.config.json', JSON.stringify({ dev: { port: 3000, name: 'shop' } }));
  const r = dry(dir);
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /--port 3000 /);
  assert.match(r.out, /http:\/\/shop\.localhost:\d+0\b/);
});

test('dev moves on when another program holds the port', async (t) => {
  const dir = bare(t);
  const busy = await freePort();
  const srv = net.createServer().listen(busy, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  t.after(() => srv.close());
  put(dir, 'ds7.config.json', JSON.stringify({ dev: { port: busy, name: 'shop' } }));
  const { spawn } = await import('node:child_process');
  const { bin } = await import('./helpers.mjs');
  const out = await new Promise((resolve) => {
    let o = '';
    const c = spawn(process.execPath, [bin, 'dev', '--dry-run'], { cwd: dir });
    c.stdout.on('data', (d) => (o += d));
    c.on('close', () => resolve(o));
  });
  assert.match(out, new RegExp(`port ${busy} is taken`));
  assert.doesNotMatch(out, new RegExp(`--port ${busy} `));
});

test('"dev": false runs plain nuxt dev', (t) => {
  const dir = bare(t);
  put(dir, 'ds7.config.json', JSON.stringify({ dev: false }));
  const r = dry(dir);
  assert.match(r.out, /npx nuxt dev\s*$/m);
  assert.equal(JSON.parse(read(dir, 'ds7.config.json')).dev, false);
});
