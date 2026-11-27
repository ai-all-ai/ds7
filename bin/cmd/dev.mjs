// `ds7 dev`: the Nuxt dev server on the project's own address, http://<name>.localhost:<port>. The name and the port
// are kept in ds7.config.json ("dev": { "port", "name" }), so they stay the same from run to run. A port that another
// program holds is replaced by the next free one of the series, and the new one is saved. `"dev": false` runs plain
// `nuxt dev`. --dry-run prints the command and starts nothing; any other argument goes on to Nuxt.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../lib/project.mjs';
import { devName, devUrl, validPort, isFree, freePort } from '../lib/dev.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const rest = args.filter((a) => a !== '--dry-run');

const cfgFile = path.join(ROOT, 'ds7.config.json');
const readJson = (f) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return null;
  }
};
const cfg = fs.existsSync(cfgFile) ? readJson(cfgFile) : {};
if (cfg === null) {
  console.log('ds7 dev: ds7.config.json is not valid JSON; fix it first (ds7 doctor shows where)');
  process.exit(1);
}

let nuxt = ['nuxt', 'dev', ...rest];
if (cfg.dev !== false) {
  const pkg = readJson(path.join(ROOT, 'package.json')) ?? {};
  const name = cfg.dev?.name || devName(pkg.name || path.basename(ROOT));
  let port = Number(cfg.dev?.port);
  let save = cfg.dev?.name !== name || cfg.dev?.port !== port;
  if (!validPort(port)) {
    port = await freePort();
    save = true;
  } else if (!(await isFree(port))) {
    const next = await freePort(port);
    console.log(`ds7 dev: port ${port} is taken by another program; this site moves to ${next}`);
    port = next;
    save = true;
  }
  if (!port) {
    console.log('ds7 dev: no free port in the series 3010-9990');
    process.exit(1);
  }
  if (save && !dry) {
    cfg.dev = { ...(cfg.dev || {}), port, name };
    fs.writeFileSync(cfgFile, `${JSON.stringify(cfg, null, 2)}\n`);
  }
  const url = devUrl(name, port);
  nuxt = ['nuxt', 'dev', '--host', '127.0.0.1', '--port', String(port), '--strictPort'];
  nuxt.push('--publicURL', url, ...rest);
  console.log(`ds7 dev: ${url}`);
}

if (dry) {
  console.log(`npx ${nuxt.join(' ')}`);
  process.exit(0);
}
const r = spawnSync('npx', ['--no-install', ...nuxt], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(r.status ?? 1);
