#!/usr/bin/env node
// Placement check: every project file sits where the layout rules (SPEC section 2 plus "layout" in ds7.config.json) say, component files carry their folder's prefix, the documents DS7 requires exist,
// no import crosses a layer (data and utils do not know components, ui blocks do not know page sections) and no group of files imports itself in a cycle. `ds7 layout`; `ds7 check` runs it as Gate 5 when ds7.config.json exists.
import fs from 'node:fs';
import { listFiles, glob, ROOT } from '../lib/project.mjs';
import { loadConfig } from '../lib/config.mjs';
import { buildGraph } from '../lib/graph-model.mjs';
import path from 'node:path';
import { conclude } from '../lib/report.mjs';

const map = loadConfig().layout;
const files = listFiles();
const rules = map.rules.map((r) => ({ ...r, re: glob(r.path) }));
const problems = [];
const bad = (where, rule, detail) => problems.push({ where, rule, detail });

for (const f of files) {
  const rule = rules.find((r) => r.re.test(f));
  if (!rule) {
    bad(
      f,
      'placement',
      'no placement rule (move it to its place, or add a rule to "layout.rules" in ds7.config.json first)',
    );
    continue;
  }
  if (rule.prefix && !path.posix.basename(f).startsWith(rule.prefix))
    bad(f, 'prefix', `file names in this folder start with "${rule.prefix}"`);
}
for (const req of map.required)
  if (!fs.existsSync(path.join(ROOT, req)))
    bad(req, 'required', 'required (DS7 SPEC section 2) and missing');

const graph = buildGraph(files);
const imports = map.imports.map((i) => ({ ...i, from: glob(i.from), deny: i.deny.map(glob) }));
for (const node of graph.nodes.values()) {
  for (const rule of imports.filter((i) => i.from.test(node.id))) {
    for (const target of node.uses)
      if (rule.deny.some((d) => d.test(target))) bad(`${node.id} -> ${target}`, 'import', rule.why);
  }
}

// Import cycles: a group of files that import each other, directly or through others.
// A file that uses itself (a recursive component) is not a cycle.
{
  const index = new Map(),
    low = new Map(),
    onStack = new Set(),
    stack = [];
  let counter = 0;
  const visit = (id) => {
    index.set(id, counter);
    low.set(id, counter);
    counter++;
    stack.push(id);
    onStack.add(id);
    for (const next of graph.nodes.get(id)?.uses ?? []) {
      if (!graph.nodes.has(next) || next === id) continue;
      if (!index.has(next)) {
        visit(next);
        low.set(id, Math.min(low.get(id), low.get(next)));
      } else if (onStack.has(next)) low.set(id, Math.min(low.get(id), index.get(next)));
    }
    if (low.get(id) === index.get(id)) {
      const group = [];
      let top;
      do {
        top = stack.pop();
        onStack.delete(top);
        group.push(top);
      } while (top !== id);
      if (group.length > 1) bad('cycle', 'cycle', `${group.reverse().join(' -> ')} -> ${group[0]}`);
    }
  };
  for (const id of graph.nodes.keys()) if (!index.has(id)) visit(id);
}

conclude({
  command: 'layout',
  summary: (n) =>
    `layout-check: ${files.length} files, ${rules.length} placement rules, ${imports.length} import rules, ${n} problems`,
  findings: problems,
  show: (fresh) => {
    for (const p of fresh.slice(0, 40)) console.log(`  ${p.where}: ${p.detail}`);
    if (fresh.length > 40) console.log(`  ... ${fresh.length - 40} more`);
  },
});
