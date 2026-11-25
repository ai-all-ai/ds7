#!/usr/bin/env node
// Documentation consistency: what the project documents must exist and agree with the repository. `ds7 docs`.
//  - every `npm run X` names a script of package.json
//  - every backticked project path and every relative markdown link points at a file that exists (write a path that does not exist yet as `path` (new): it is skipped; a path git ignores is local only and skipped too)
//  - every "file.md section 5" reference names a numbered heading ("## 5. Title") that exists in that file
//  - every skill folder has a SKILL.md whose name matches the folder and which is registered in ALL.md
//  - every document of docs/ is named by ALL.md or by another document (an unreferenced document is an orphan)
// History files (CHANGELOG), the files AI-ALL manages (.ai/) and the vendored DS7 standard (ds7/, except ds7/local/) are not scanned; the standard's ALL.md counts as naming the documents it lists.
import fs from 'node:fs';
import path from 'node:path';
import { isIgnored, listFiles, read, ROOT } from '../lib/project.mjs';
import { loadConfig } from '../lib/config.mjs';
import { conclude } from '../lib/report.mjs';

const cfg = loadConfig();
const files = listFiles();
const scan = files.filter(
  (f) =>
    /\.md$/.test(f) &&
    !/^(ds7\/(?!local\/)|node_modules\/|\.ai\/)/.test(f) &&
    !/(^|\/)CHANGELOG\.md$/.test(f) &&
    f !== 'docs/SITE-GRAPH.md',
);
const pkg = fs.existsSync(path.join(ROOT, 'package.json')) ? JSON.parse(read('package.json')) : {};
const scripts = pkg.scripts || {};
const problems = [];
const bad = (f, line, msg) => problems.push({ where: `${f}:${line}`, rule: 'docs', detail: msg });
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
// a path git ignores is local only (it exists on one machine, never in CI); docs.skipIgnored: false checks it anyway
const missing = (rel) => !exists(rel) && !(cfg.docs.skipIgnored && isIgnored(rel));

const roots = new RegExp(`^(${cfg.docs.roots.map((r) => r.replace(/[.]/g, '\\.')).join('|')})/`);
const rootFiles =
  /^(ALL|README|AGENTS|CLAUDE|GEMINI)\.md$|^(package\.json|nuxt\.config\.ts|tsconfig\.json|Makefile|ds7\.config\.json)$/;
const localOnly = /^(ds5|originaldata|node_modules|\.output|\.nuxt|dist)\//;
const headings = {};
const headingsOf = (f) =>
  (headings[f] ||= new Set([...read(f).matchAll(/^#{1,3}\s+(\d+[a-z]?)\./gm)].map((m) => m[1])));
const docFile = (name) =>
  exists(name) ? name : scan.find((f) => path.posix.basename(f) === path.posix.basename(name));

for (const f of scan) {
  let fence = false,
    generated = false;
  read(f)
    .split('\n')
    .forEach((text, i) => {
      if (/^```/.test(text)) {
        fence = !fence;
        return;
      }
      // the generated placement table lists rules (patterns of paths), not files that must already exist
      if (/<!-- placement:begin -->/.test(text)) generated = true;
      if (/<!-- placement:end -->/.test(text)) generated = false;
      if (generated) return;
      const n = i + 1;
      for (const [, name] of text.matchAll(/npm run ([a-z0-9:-]+)/g))
        if (!scripts[name]) bad(f, n, `npm run ${name}: no such script in package.json`);
      if (fence) return;
      for (const [, raw, planned] of text.matchAll(/`([^`\s]+)`( \(new\))?/g)) {
        if (planned) continue;
        const p = raw.replace(/[:#].*$/, '').replace(/[.,;)]+$/, '');
        if (!(roots.test(p) || rootFiles.test(p)) || /[*<>{}$]|\.\.\./.test(p) || localOnly.test(p))
          continue;
        if (missing(p.replace(/\/$/, ''))) bad(f, n, `\`${raw}\` does not exist`);
      }
      for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        if (missing(path.posix.join(path.posix.dirname(f), target.replace(/#.*$/, ''))))
          bad(f, n, `link (${target}) points at no file`);
      }
      for (const [, doc, num] of text.matchAll(
        /([A-Za-z0-9_./-]+\.md)`?,? (?:sections? )(\d+[a-z]?)\b/g,
      )) {
        const target = docFile(doc);
        if (target && !headingsOf(target).has(num))
          bad(f, n, `${doc} section ${num} does not exist`);
      }
    });
}

// skills
const all = exists('ALL.md') ? read('ALL.md') : '';
for (const f of files.filter((f) => /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(f))) {
  const folder = f.split('/')[2],
    fm = read(f).match(/^---\n([\s\S]*?)\n---/);
  const name = fm && (fm[1].match(/^name:\s*(.+)$/m) || [])[1],
    desc = fm && (fm[1].match(/^description:\s*(.+)$/m) || [])[1];
  if (!name || name.trim() !== folder) bad(f, 1, `frontmatter name must be "${folder}"`);
  if (!desc) bad(f, 1, 'frontmatter description is missing');
  if (!all.includes(f)) bad('ALL.md', 1, `skill ${f} is not registered`);
}
// orphans
for (const f of files.filter((f) => /^docs\/[^/]+\.md$/.test(f) && f !== 'docs/SITE-GRAPH.md')) {
  const base = path.posix.basename(f);
  const standard = exists('ds7/ALL.md') && read('ds7/ALL.md').includes(base);
  if (!standard && !scan.some((other) => other !== f && read(other).includes(base)))
    bad(f, 1, 'no document refers to it (route it from ALL.md)');
}

conclude({
  command: 'docs',
  summary: (n) => `docs: ${scan.length} documents, ${n} problems`,
  findings: problems,
  show: (fresh) => {
    for (const p of fresh.slice(0, 50)) console.log(`  ${p.where}: ${p.detail}`);
    if (fresh.length > 50) console.log(`  ... ${fresh.length - 50} more`);
  },
});
