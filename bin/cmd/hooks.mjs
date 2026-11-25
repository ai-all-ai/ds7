#!/usr/bin/env node
// `ds7 hooks`: installs the commit-msg hook (Conventional Commits subject line) into .git/hooks. An existing hook is kept.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let dir;
try {
  dir = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { encoding: 'utf8' }).trim();
} catch {
  console.log('hooks: not a git repository');
  process.exit(1);
}
const to = path.join(dir, 'commit-msg');
if (fs.existsSync(to)) {
  console.log(`hooks: ${to} exists, kept (compare it with ds7/templates/hooks/commit-msg)`);
  process.exit(0);
}
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'templates',
    'hooks',
    'commit-msg',
  ),
  to,
);
fs.chmodSync(to, 0o755);
console.log(`hooks: ${to} installed`);
