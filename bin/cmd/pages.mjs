#!/usr/bin/env node
// `ds7 pages`: the preset for a static site on GitHub Pages under a base path. Writes what is missing and never overwrites:
//   app/utils/asset.ts             asset('/images/x.webp') puts a path under app.baseURL
//   .github/workflows/pages.yml    build with NUXT_APP_BASE_URL, prove no path leaves the base, close the preview to search engines, deploy
// A project whose own workflow already deploys to Pages keeps it: the command says so and writes no second one.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const templates = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');
const wf = '.github/workflows';
const ownDeploy = fs.existsSync(wf)
  ? fs
      .readdirSync(wf)
      .find(
        (f) =>
          /\.ya?ml$/.test(f) &&
          /actions\/deploy-pages@/.test(fs.readFileSync(path.join(wf, f), 'utf8')),
      )
  : null;
const plan = [
  ['asset.ts', 'app/utils/asset.ts'],
  ...(ownDeploy ? [] : [['workflows/pages.yml', `${wf}/pages.yml`]]),
];
for (const [from, to] of plan) {
  if (fs.existsSync(to)) {
    console.log(`  kept     ${to} (exists)`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(templates, from), to);
  console.log(`  created  ${to}`);
}
if (ownDeploy)
  console.log(
    `  kept     ${wf}/${ownDeploy} (it already deploys to Pages; compare it with ds7/templates/workflows/pages.yml)`,
  );
console.log(`
Next:
  1. GitHub → Settings → Pages → Source: GitHub Actions.
  2. Wrap every root path that leaves the app in asset(): img src, srcset, inline style url(), plain <a href>.
  3. Prove it locally: NUXT_APP_BASE_URL=/repo/ npm run generate && npx ds7 audit html --base /repo/`);
