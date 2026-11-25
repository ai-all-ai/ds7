// Shared helpers for the project tools: the list of project files, a small glob matcher and the Nuxt component naming rule.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Every project file: what git knows about or would add (tracked plus untracked, minus ignored); without git, a walk that skips build and dependency folders.
const SKIP = new Set([
  'node_modules',
  '.git',
  '.output',
  '.nuxt',
  '.data',
  'dist',
  '.cache',
  '.idea',
]);
const walk = (dir, rel = '') =>
  fs
    .readdirSync(path.join(dir, rel), { withFileTypes: true })
    .flatMap((e) =>
      SKIP.has(e.name)
        ? []
        : e.isDirectory()
          ? walk(dir, path.posix.join(rel, e.name))
          : [path.posix.join(rel, e.name)],
    );
// True when git ignores the path: such files are local only (intake folders, private tools) and never exist in CI. Without git, nothing is ignored.
const ignoredCache = new Map();
export function isIgnored(rel) {
  if (!ignoredCache.has(rel)) {
    let hit = false;
    try {
      execFileSync('git', ['check-ignore', '-q', '--', rel], { cwd: ROOT, stdio: 'ignore' });
      hit = true;
    } catch {}
    ignoredCache.set(rel, hit);
  }
  return ignoredCache.get(rel);
}
export function listFiles() {
  try {
    const out = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    // a fresh project may not ignore node_modules yet: dependency and build folders are never project files
    return out
      .split('\0')
      .filter(
        (f) => f && !f.split('/').some((s) => SKIP.has(s)) && fs.existsSync(path.join(ROOT, f)),
      )
      .sort();
  } catch {
    return walk(ROOT).sort();
  }
}

// Glob to RegExp: `**/` any folders (or none), `**` anything, `*` inside one segment, `{a,b}` alternatives (which may use `*` too; no nesting).
const esc = (s) => s.replace(/[.+^$()|[\]\\?]/g, '\\$&');
const source = (pattern) => {
  let re = '';
  for (let i = 0; i < pattern.length; ) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 3;
      } else {
        re += '.*';
        i += 2;
      }
    } else if (c === '*') {
      re += '[^/]*';
      i++;
    } else if (c === '{') {
      const j = pattern.indexOf('}', i);
      re += `(?:${pattern
        .slice(i + 1, j)
        .split(',')
        .map(source)
        .join('|')})`;
      i = j + 1;
    } else {
      re += esc(c);
      i++;
    }
  }
  return re;
};
export const glob = (pattern) => new RegExp(`^${source(pattern)}$`);

const pascal = (s) =>
  s
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
// Nuxt auto-import name of a component file: folder names prefix the file name unless it already starts with them.
export function componentName(file) {
  const parts = file
    .replace(/^app\/components\//, '')
    .replace(/\.vue$/, '')
    .split('/');
  const stem = parts.pop();
  const prefix = parts.map(pascal).join('');
  return stem.startsWith(prefix) ? stem : prefix + stem;
}
export const kebabToPascal = pascal;
