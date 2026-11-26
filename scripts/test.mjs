// `npm test`: a smoke run of the CLI, then every test/*.test.mjs file.
// Written in Node rather than in the npm script, because cmd.exe on Windows
// knows neither `/dev/null` nor the `*` glob, and Node 18 and 20 do not expand it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cli = path.join(root, 'bin', 'ds7.js');

const run = (args, stdio) => {
  const { status, error } = spawnSync(process.execPath, args, { cwd: root, stdio });
  if (error) throw error;
  if (status !== 0) process.exit(status ?? 1);
};

run([cli, '--version'], 'inherit');
run([cli, '--help'], ['ignore', 'ignore', 'inherit']);

const files = fs
  .readdirSync(path.join(root, 'test'))
  .filter((f) => f.endsWith('.test.mjs'))
  .sort()
  .map((f) => path.join('test', f));
// spec lists every failure again at the end, where a CI log is read first
run(['--test', '--test-reporter=spec', ...files], 'inherit');
