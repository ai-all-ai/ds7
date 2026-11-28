#!/usr/bin/env node
// `ds7 css`: audit of the global stylesheets, and `ds7 css diff` to prove a CSS refactor changed nothing.
//   ds7 css [--all]             orphan files (in the folder, not imported by the entry), dead classes (no template, script or
//                                locale names them), and as advice: selectors repeated in one context, identical declaration blocks,
//                                !important in the stylesheets and in the <style> blocks of the sources
//   ds7 css diff [REV] [FILE…]  selector + property pairs lost or gained against git REV (default HEAD) in the CSS of FILE…
//                                (default: the changed .css and .vue files); exits 1 when anything was lost or gained
// Settings: "css" in ds7.config.json: dir, entry, sources, orphans (true/false), dead (true/false), repeats and important
// ("warn"/"off").
// Needs postcss from the project (Nuxt and Vite bring it).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadConfig } from '../lib/config.mjs';
import { conclude, showByRule } from '../lib/report.mjs';
import { requireOptional } from '../lib/optional.mjs';

const cfg = loadConfig().css;
if (cfg.off) {
  console.log('css: off (css is false in ds7.config.json)');
  process.exit(0);
}
const postcss = requireOptional('postcss', 'ds7 css');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const read = (f) => fs.readFileSync(f, 'utf8');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const styleOf = (src, f) =>
  f.endsWith('.vue')
    ? [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    : src;

if (args[0] === 'diff') diff(args[1] ?? 'HEAD', args.slice(2));
else audit();

function diff(rev, files) {
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1e8 });
  if (!files.length)
    files = git('diff', '--name-only', rev, '--', '*.css', '*.vue')
      .split('\n')
      .filter((f) => f && fs.existsSync(f));
  const pairs = (css) => {
    const set = new Set();
    let root;
    try {
      root = postcss.parse(css);
    } catch {
      return set;
    }
    root.walkDecls((d) => {
      const r = d.parent;
      if (r.type !== 'rule') return;
      let ctx = '';
      for (let p = r.parent; p && p.type === 'atrule'; p = p.parent)
        ctx = `@${p.name} ${norm(p.params)} ${ctx}`;
      for (const sel of r.selectors) set.add(`${ctx}${norm(sel)} { ${d.prop}: ${norm(d.value)} }`);
    });
    return set;
  };
  let changed = 0;
  for (const f of files) {
    let old = '';
    try {
      old = git('show', `${rev}:${f}`);
    } catch {
      /* a new file: everything in it is gained */
    }
    const a = pairs(styleOf(old, f));
    const b = fs.existsSync(f) ? pairs(styleOf(read(f), f)) : new Set();
    const lost = [...a].filter((k) => !b.has(k));
    const gained = [...b].filter((k) => !a.has(k));
    if (!lost.length && !gained.length) continue;
    changed++;
    console.log(`${f}: lost ${lost.length}, gained ${gained.length}`);
    for (const k of lost.slice(0, 60)) console.log(`  - ${k}`);
    for (const k of gained.slice(0, 60)) console.log(`  + ${k}`);
  }
  console.log(
    changed
      ? `css diff: ${changed} of ${files.length} file(s) changed rules against ${rev}`
      : `css diff: ${files.length} file(s), the same rules as ${rev}`,
  );
  process.exit(changed ? 1 : 0);
}

function audit() {
  const walk = (d) =>
    !fs.existsSync(d)
      ? []
      : fs.statSync(d).isDirectory()
        ? fs
            .readdirSync(d, { withFileTypes: true })
            .flatMap((e) => (e.name === 'node_modules' ? [] : walk(path.join(d, e.name))))
        : [d];
  const entryFile = path.join(cfg.dir, cfg.entry);
  if (!fs.existsSync(entryFile)) {
    console.log(
      `css: ${entryFile} does not exist; set css.dir and css.entry in ds7.config.json, or css to false`,
    );
    process.exit(0);
  }
  const imported = [
    ...read(entryFile).matchAll(/@import\s+(?:url\()?["']\.?\/?([^"')]+\.css)["']/g),
  ].map((m) => m[1]);
  const files = [cfg.entry, ...imported];
  // The @ai.all/ui scaffold writes theme-base.css (a token reference for agents) and theme.css (an empty stub);
  // neither has to be imported, so they are not orphans while the scaffold is present.
  const scaffold = fs.existsSync('ui/.manifest.json') ? ['theme-base.css', 'theme.css'] : [];
  const orphans = cfg.orphans
    ? fs
        .readdirSync(cfg.dir)
        .filter((f) => f.endsWith('.css') && !files.includes(f) && !scaffold.includes(f))
    : [];

  const sourceFiles = cfg.sources
    .flatMap(walk)
    .filter((f) => /\.(vue|ts|tsx|js|mjs|jsx|json|html|md)$/.test(f) && !f.startsWith(cfg.dir));
  const src = sourceFiles.map(read).join('\n');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const seen = (t) => new RegExp(`(^|[^\\w-])${esc(t)}(?![\\w-])`).test(src);
  const quoted = (t) => new RegExp(`['"\`]${esc(t)}['"\`]`).test(src);
  // Vue <Transition name="x"> makes x-enter-from, x-leave-active ... without writing them anywhere
  const transition = (c) => {
    const m = c.match(/^(.+)-(?:enter|leave)-(?:from|to|active)$/);
    return m
      ? new RegExp(`name=["']${esc(m[1])}["']|name:\\s*['"]${esc(m[1])}['"]`).test(src)
      : false;
  };
  // a dash modifier (-dark) is often built from a prop (`-${tone}`): the bare word in quotes counts as use
  const used = (c) =>
    seen(c) || (c.startsWith('-') && quoted(c.slice(1))) || transition(c) || cfg.allow.includes(c);
  // a class named only inside :not(...) is a guard, it needs no template
  const withoutNot = (s) => {
    let prev;
    do {
      prev = s;
      s = s.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '');
    } while (s !== prev);
    return s;
  };

  const selectors = new Map();
  const blocks = new Map();
  // !important: the places it is written, in the stylesheets and in component <style> blocks
  const important = [];
  const classes = new Map();
  const nativeIssues = [];
  const viewportAdvice = [];
  const baseBreakpoints = new Set([480, 768, 1024, 1280, 1440]);
  let rules = 0;
  for (const name of files) {
    const file = path.join(cfg.dir, name);
    if (!fs.existsSync(file)) continue;
    const tree = postcss.parse(read(file), { from: file });
    tree.walkAtRules('media', (atRule) => {
      const at = `${path.posix.join(cfg.dir, name)}:${atRule.source.start.line}`;
      if (/\bvar\s*\(/i.test(atRule.params))
        nativeIssues.push({
          rule: 'media-variable',
          where: at,
          detail: 'var() cannot be used in a media query condition',
        });
      if (cfg.profile !== 'ds-native') return;
      const conditions = [
        ...atRule.params.matchAll(
          /\b(?:min-|max-)?width\s*(?::|<=|>=|<|>|=)\s*(\d+(?:\.\d+)?)px/gi,
        ),
        ...atRule.params.matchAll(/(\d+(?:\.\d+)?)px\s*(?:<=|>=|<|>)\s*width\b/gi),
      ];
      for (const [, value] of conditions)
        if (!baseBreakpoints.has(Number(value)))
          viewportAdvice.push(
            `${at}: ${value}px is outside the base viewport scale; document the content-driven reason if intentional`,
          );
    });
    tree.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
      rules++;
      const ctx =
        rule.parent?.type === 'atrule' ? `@${rule.parent.name} ${rule.parent.params}` : '';
      const at = `${path.posix.join(cfg.dir, name)}:${rule.source.start.line}`;
      if (cfg.profile === 'ds-native' && /&(?:__|--|-[a-zA-Z])/.test(rule.selector))
        nativeIssues.push({
          rule: 'sass-concatenation',
          where: at,
          detail: `${norm(rule.selector)} is Sass-style string joining, not native CSS nesting`,
        });
      for (const raw of rule.selectors) {
        const sel = raw.trim();
        if (sel === ':root') continue;
        const key = `${ctx} ${sel}`.trim();
        if (!selectors.has(key)) selectors.set(key, []);
        selectors.get(key).push(at);
        for (const m of withoutNot(sel)
          .replace(/\[[^\]]*\]|"[^"]*"|'[^']*'/g, '')
          .matchAll(/\.(-?[a-zA-Z][\w-]*)/g))
          if (!classes.has(m[1])) classes.set(m[1], at);
      }
      for (const n of rule.nodes)
        if (n.type === 'decl' && n.important)
          important.push(`${path.posix.join(cfg.dir, name)}:${n.source.start.line} ${n.prop}`);
      const decls = rule.nodes
        .filter((n) => n.type === 'decl')
        .map((n) => `${n.prop}:${n.value}`)
        .sort();
      if (decls.length >= 3) {
        const key = `${ctx} | ${decls.join(';')}`;
        if (!blocks.has(key)) blocks.set(key, []);
        blocks.get(key).push(`${at} ${norm(rule.selector).slice(0, 48)}`);
      }
    });
  }

  const findings = [
    ...nativeIssues,
    ...orphans.map((f) => ({
      rule: 'orphan-file',
      where: path.posix.join(cfg.dir, f),
      detail: `not imported by ${cfg.entry}`,
    })),
    ...(cfg.dead
      ? [...classes]
          .filter(([c]) => !used(c))
          .map(([c, at]) => ({
            rule: 'dead-class',
            where: at,
            detail: `.${c} is used by no template, script or locale`,
          }))
      : []),
  ];
  const notes = [];
  const advice = [];
  if (viewportAdvice.length) {
    notes.push(`${viewportAdvice.length} non-base viewport threshold(s)`);
    advice.push([`${viewportAdvice.length} non-base viewport threshold(s)`, viewportAdvice]);
  }
  if (cfg.repeats !== 'off') {
    const sels = [...selectors].filter(([, at]) => at.length > 1);
    const blks = [...blocks].filter(([, at]) => at.length > 1);
    if (sels.length) {
      notes.push(`${sels.length} selector(s) defined more than once in one context`);
      advice.push([
        `${sels.length} selector(s) defined more than once in one context (merge, then prove it with: ds7 css diff)`,
        sels.map(([k, at]) => `${k}  ${at.join(', ')}`),
      ]);
    }
    if (blks.length) {
      notes.push(`${blks.length} identical declaration block(s) in several rules`);
      advice.push([
        `${blks.length} identical declaration block(s) in several rules (a shared rule or a token?)`,
        blks.map(([, at]) => at.join('  |  ')),
      ]);
    }
  }
  if (cfg.important !== 'off') {
    for (const f of sourceFiles.filter((f) => f.endsWith('.vue'))) {
      const text = read(f);
      for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
        const start = text.slice(0, m.index).split('\n').length - 1;
        m[1].split('\n').forEach((line, i) => {
          if (/!\s*important/i.test(line)) important.push(`${f}:${start + i + 1}`);
        });
      }
    }
    if (important.length) {
      notes.push(`${important.length} !important declaration(s)`);
      advice.push([
        `${important.length} !important declaration(s) (order, @layer, a modifier or a variable instead? CSS-CONVENTIONS.md, section 8)`,
        important,
      ]);
    }
  }
  const limit = process.argv.includes('--all') ? Infinity : 10;
  conclude({
    command: 'css',
    summary: (n) =>
      n
        ? `css: ${n} problem(s) in ${files.length} file(s), ${rules} rules`
        : `css OK: ${files.length} file(s), ${rules} rules, no orphan files, no dead classes`,
    findings,
    notes,
    show: (fresh) => {
      showByRule(process.argv.includes('--all') ? Infinity : 25)(fresh);
      for (const [title, lines] of advice) {
        console.log(`\nadvice: ${title}`);
        for (const l of lines.slice(0, limit)) console.log(`  ${l}`);
        if (lines.length > limit) console.log(`  ... ${lines.length - limit} more (--all)`);
      }
    },
  });
}
