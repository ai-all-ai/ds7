// Small helpers every command shares: flags, the build folder, and a recursive file list.
import fs from 'node:fs';
import path from 'node:path';

// the value after --name, or the default
export const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
export const flag = (name) => process.argv.includes(`--${name}`);

// the generated site (--out, default .output/public); stops with a hint when it was not built yet
export function buildDir() {
  const out = path.resolve(arg('out', '.output/public'));
  if (!fs.existsSync(out)) {
    console.error(`Folder ${out} is missing. Run first: npm run generate`);
    process.exit(1);
  }
  return out;
}

// every file under dir; folders named in skip (by name) are not entered
export const walk = (dir, skip = []) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) =>
          e.isDirectory()
            ? skip.includes(e.name)
              ? []
              : walk(path.join(dir, e.name), skip)
            : [path.join(dir, e.name)],
        )
    : [];
