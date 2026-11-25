// Optional packages (peerDependenciesMeta.optional): postcss, sharp, playwright. They are loaded from the project, so ds7 itself
// installs nothing. A command that needs one and does not find it prints one line with the install command and stops without failing.
import path from 'node:path';
import { createRequire } from 'node:module';

const fromProject = createRequire(path.resolve('package.json'));
const fromDs7 = createRequire(import.meta.url);

export function optional(name) {
  for (const req of [fromProject, fromDs7]) {
    try {
      return req(name);
    } catch {
      /* try the next place */
    }
  }
  return null;
}

const hint = { playwright: ' && npx playwright install chromium' };

export function requireOptional(name, why) {
  const mod = optional(name);
  if (mod) return mod;
  console.log(
    `${why} needs ${name}, which this project does not have: npm i -D ${name}${hint[name] ?? ''}`,
  );
  // locally the command is skipped; on CI a missing tool must not look like a passed check
  process.exit(process.env.CI ? 1 : 0);
}

export const OPTIONAL = ['postcss', 'sharp', 'playwright'];
