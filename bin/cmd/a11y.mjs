#!/usr/bin/env node
// Accessibility gate (WCAG 2.2 A and AA, the parts a script can prove) over generated HTML and CSS from any renderer.
// Static: it reads the HTML and the stylesheets, it does not render. What needs a rendered page (real contrast on photos, focus order,
// target size, zoom) needs a browser: `ds7 lab --axe`. Each finding names the success criterion.
//   ds7 audit a11y [--out .output/public]
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, internalRoutes } from '../lib/config.mjs';
import { conclude, showByRule } from '../lib/report.mjs';
import { optional } from '../lib/optional.mjs';

const cfg = loadConfig();
// postcss comes from the project (Nuxt and Vite bring it); without it the contrast check is skipped
const postcss = optional('postcss');
import { parse, all, text, attr, ancestors } from '../lib/html.mjs';
import { arg, buildDir, walk } from '../lib/cli.mjs';

const OUT = buildDir();
const walkBuild = (d) => walk(d, ['_nuxt']);
const isInternal = internalRoutes(cfg);

const problems = [];
const notes = [];
const skipAdvice = new Set();
const bad = (page, sc, rule, detail) => problems.push({ where: page, sc, rule, detail });
const brief = (n) =>
  `<${n.tag}${attr(n, 'class') ? ` class="${attr(n, 'class').slice(0, 40)}"` : ''}${attr(n, 'href') ? ` href="${attr(n, 'href').slice(0, 40)}"` : ''}>`;

// words that tell nothing out of context (Lighthouse list, plus Spanish)
const GENERIC = new Set([
  'click here',
  'click',
  'here',
  'this',
  'go',
  'more',
  'more info',
  'more information',
  'read more',
  'learn more',
  'see more',
  'information',
  'start',
  'aqui',
  'aquí',
  'clic aquí',
  'clic aqui',
  'haz clic aquí',
  'pincha aquí',
  'más',
  'mas',
  'ver más',
  'ver mas',
  'leer más',
  'leer mas',
  'saber más',
  'saber mas',
  'más información',
  'mas informacion',
  'info',
]);
const INPUT_SKIP = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
const AUTOCOMPLETE = [
  [/^(email|e-mail)$/i, 'email'],
  [/^(tel|phone|telefono|teléfono)$/i, 'tel'],
  [/^(name|nombre)$/i, 'name'],
];

const pages = walkBuild(OUT)
  .filter((f) => path.basename(f) === 'index.html')
  .map((f) => {
    const rel = '/' + path.relative(OUT, path.dirname(f)).split(path.sep).join('/');
    return {
      route: rel === '/.' || rel === '/' ? '/' : rel,
      root: parse(fs.readFileSync(f, 'utf8')),
    };
  })
  .filter((p) => !isInternal(p.route));

for (const { route: r, root } of pages) {
  const byId = new Map(all(root, (n) => attr(n, 'id')).map((n) => [attr(n, 'id'), n]));
  const hidden = (n) => attr(n, 'aria-hidden') === 'true' || attr(n, 'hidden') !== undefined;
  const isHidden = (n) => hidden(n) || ancestors(n).some(hidden);
  const label = (n) => {
    const al = (attr(n, 'aria-label') || '').trim();
    if (al) return al;
    const lb = attr(n, 'aria-labelledby');
    if (lb !== undefined)
      return lb
        .split(/\s+/)
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((e) => text(e))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    const own = text(n, hidden).replace(/\s+/g, ' ').trim();
    const alts = all(n, (x) => x.tag === 'img' && !isHidden(x))
      .map((x) => (attr(x, 'alt') || '').trim())
      .join(' ');
    const svgTitle = all(n, (x) => x.tag === 'title' && ancestors(x).some((a) => a.tag === 'svg'))
      .map((x) => text(x))
      .join(' ');
    return (
      `${own} ${alts} ${svgTitle}`.replace(/\s+/g, ' ').trim() || (attr(n, 'title') || '').trim()
    );
  };

  // 3.1.1 language, 2.4.2 title, 1.4.4 zoom
  const html = all(root, (n) => n.tag === 'html')[0];
  if (!attr(html, 'lang')) bad(r, '3.1.1', 'html-lang', 'no lang on <html>');
  const title = all(root, (n) => n.tag === 'title')[0];
  if (!title || !text(title).trim()) bad(r, '2.4.2', 'title', 'empty or missing <title>');
  const viewport = all(root, (n) => n.tag === 'meta' && attr(n, 'name') === 'viewport')[0];
  if (!viewport) bad(r, '1.4.4', 'viewport', 'no viewport meta');
  else if (
    /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*(0?\.\d+|1(\.0+)?)\b/i.test(
      attr(viewport, 'content') || '',
    )
  )
    bad(r, '1.4.4', 'zoom', `zoom is blocked: ${attr(viewport, 'content')}`);

  // 1.3.1 / 2.4.1 landmarks
  const mains = all(root, (n) => n.tag === 'main' || attr(n, 'role') === 'main');
  if (mains.length !== 1)
    bad(r, '2.4.1', 'landmark-main', `${mains.length} main landmarks (exactly 1)`);
  if (!all(root, (n) => n.tag === 'header' || attr(n, 'role') === 'banner').length)
    bad(r, '1.3.1', 'landmark-banner', 'no header landmark');
  if (!all(root, (n) => n.tag === 'footer' || attr(n, 'role') === 'contentinfo').length)
    bad(r, '1.3.1', 'landmark-contentinfo', 'no footer landmark');
  // 2.4.1 skip link: the first link or button jumps to <main id>. Landmarks already meet the criterion; the link is for keyboard
  // users who would tab through the whole header menu. a11y.skipLink: "warn" (default, advice), "require" (a finding), "off".
  if (cfg.a11y.skipLink !== 'off' && mains.length === 1) {
    const first = all(
      root,
      (n) => (n.tag === 'a' && attr(n, 'href') !== undefined) || n.tag === 'button',
    )[0];
    const href = (first && attr(first, 'href')) || '';
    const target = href.startsWith('#') ? byId.get(decodeURIComponent(href.slice(1))) : null;
    if (target !== mains[0]) {
      const why = `the first link of the page is ${first ? brief(first) : 'missing'}; a skip link to <main id> should come first`;
      if (cfg.a11y.skipLink === 'require') bad(r, '2.4.1', 'skip-link', why);
      else skipAdvice.add(r);
    }
  }
  const navs = all(root, (n) => n.tag === 'nav' && !isHidden(n));
  if (navs.length > 1)
    for (const n of navs)
      if (!label(n))
        bad(
          r,
          '2.4.1',
          'landmark-nav-name',
          `${navs.length} nav landmarks and ${brief(n)} has no aria-label`,
        );

  // 1.1.1 images
  for (const img of all(root, (n) => n.tag === 'img')) {
    const alt = attr(img, 'alt');
    if (alt === undefined) bad(r, '1.1.1', 'img-alt', `${attr(img, 'src')} has no alt`);
    else if (/\.(webp|jpe?g|png|svg|gif)\b/i.test(alt) || alt.length > 125)
      bad(
        r,
        '1.1.1',
        'img-alt-quality',
        `alt "${alt.slice(0, 60)}": a file name or over 125 characters`,
      );
  }
  for (const s of all(root, (n) => n.tag === 'svg' && attr(n, 'role') === 'img' && !isHidden(n)))
    if (!label(s)) bad(r, '1.1.1', 'svg-name', 'svg with role="img" has no name');

  // 2.4.4 / 4.1.2 names of links and buttons
  for (const n of all(
    root,
    (x) =>
      (x.tag === 'a' && attr(x, 'href') !== undefined) ||
      x.tag === 'button' ||
      ['button', 'link'].includes(attr(x, 'role')),
  )) {
    if (isHidden(n)) continue;
    const name = label(n);
    if (!name) bad(r, '4.1.2', 'name-missing', `${brief(n)} has no accessible name`);
    else if (
      n.tag === 'a' &&
      GENERIC.has(
        name
          .toLowerCase()
          .replace(/[.!→>»]+$/g, '')
          .trim(),
      )
    )
      bad(r, '2.4.4', 'link-text', `${brief(n)} says "${name}" (describe the target)`);
  }
  for (const n of all(root, (x) => x.tag === 'a' && attr(x, 'href') === '#'))
    bad(r, '4.1.2', 'link-target', `${brief(n)} points at "#" (use a button for an action)`);

  // 3.3.2 / 1.3.1 / 1.3.5 form fields
  for (const n of all(root, (x) => ['input', 'select', 'textarea'].includes(x.tag))) {
    if (INPUT_SKIP.has((attr(n, 'type') || '').toLowerCase()) || isHidden(n)) continue;
    const id = attr(n, 'id');
    const forLabel =
      id &&
      all(root, (l) => l.tag === 'label' && attr(l, 'for') === id).some((l) => text(l).trim());
    const wrapped = ancestors(n).some((a) => a.tag === 'label' && text(a).trim());
    if (!forLabel && !wrapped && !label(n))
      bad(r, '3.3.2', 'field-label', `${brief(n)} name="${attr(n, 'name') || ''}" has no label`);
    const key = attr(n, 'name') || attr(n, 'type') || '';
    const want = AUTOCOMPLETE.find(([re]) => re.test(key) || re.test(attr(n, 'type') || ''));
    if (want && n.tag === 'input' && !attr(n, 'autocomplete'))
      bad(r, '1.3.5', 'autocomplete', `name="${key}" lacks autocomplete="${want[1]}"`);
  }

  // 4.1.2 dialogs and frames, 2.4.3 tab order, aria references, hidden focusables
  for (const d of all(root, (x) => x.tag === 'dialog' || attr(x, 'role') === 'dialog'))
    if (!label(d)) bad(r, '4.1.2', 'dialog-name', `${brief(d)} has no accessible name`);
  for (const f of all(root, (x) => x.tag === 'iframe'))
    if (!(attr(f, 'title') || '').trim())
      bad(r, '4.1.2', 'iframe-title', `${attr(f, 'src') || 'iframe'} has no title`);
  for (const n of all(root, (x) => Number(attr(x, 'tabindex')) > 0))
    bad(r, '2.4.3', 'tabindex', `${brief(n)} has tabindex ${attr(n, 'tabindex')}`);
  for (const k of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const n of all(root, (x) => attr(x, k) !== undefined))
      for (const id of attr(n, k).split(/\s+/).filter(Boolean))
        if (!byId.has(id))
          bad(r, '4.1.2', 'aria-reference', `${brief(n)} ${k}="${id}" points at nothing`);
  }
  // an inert element and everything in it cannot take focus (hidden slides of a carousel)
  const inert = (x) => {
    for (let p = x; p; p = p.parent) if (attr(p, 'inert') !== undefined) return true;
    return false;
  };
  for (const n of all(root, (x) => attr(x, 'aria-hidden') === 'true')) {
    const focusable = [n, ...all(n, () => true)].filter(
      (x) =>
        !inert(x) &&
        (['button', 'input', 'select', 'textarea'].includes(x.tag) ||
          (x.tag === 'a' && attr(x, 'href') !== undefined) ||
          attr(x, 'tabindex') === '0') &&
        attr(x, 'tabindex') !== '-1' &&
        attr(x, 'disabled') === undefined,
    );
    if (focusable.length && n.tag !== 'svg')
      bad(
        r,
        '4.1.2',
        'aria-hidden-focusable',
        `${brief(n)} is aria-hidden but holds ${brief(focusable[0])}`,
      );
  }
  for (const n of all(
    root,
    (x) => ['button', 'link'].includes(attr(x, 'role')) && !['a', 'button'].includes(x.tag),
  ))
    if (attr(n, 'tabindex') === undefined)
      bad(
        r,
        '2.1.1',
        'role-keyboard',
        `${brief(n)} has role="${attr(n, 'role')}" and cannot take focus (add a native element or tabindex)`,
      );
  // 1.3.1 lists
  for (const l of all(root, (x) => x.tag === 'ul' || x.tag === 'ol'))
    for (const c of l.children)
      if (c.tag !== '#text' && !['li', 'script', 'template'].includes(c.tag)) {
        bad(r, '1.3.1', 'list-children', `<${l.tag}> holds <${c.tag}> directly`);
        break;
      }
}

// 2.4.7 / 2.3.3 from generated stylesheets, whether emitted by Nuxt or a static builder.
const css = walk(OUT)
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n');
if (!/:focus-visible/.test(css))
  bad('(css)', '2.4.7', 'focus-visible', 'no :focus-visible rule in the built CSS');
if (!/prefers-reduced-motion/.test(css))
  bad('(css)', '2.3.3', 'reduced-motion', 'no prefers-reduced-motion rule in the built CSS');

// 1.4.3 contrast of the colour pairs the stylesheets set together: a rule that sets `color` and `background` to tokens or hex values.
// Text on photos, gradients and semi-transparent colours cannot be proven here; those need the browser check.
// Accepted exceptions (large text, owner decisions) are listed with a reason in a11y.exceptions of ds7.config.json ({ selector, reason }).
const SRC = cfg.a11y.css;
// a11y.exceptionPolicy: "warn" (default) notes a weak exception, "strict" makes it a finding, "off" only applies the list.
// A good exception names why the colour stays, who decided and what ends it, has the comment
// /* a11y exception: ... */ right above its rule, and still matches a failing rule.
const exceptions = cfg.a11y.exceptions;
const policy = cfg.a11y.exceptionPolicy;
const weak = (where, detail) =>
  policy === 'strict'
    ? bad(where, '1.4.3', 'exception', detail)
    : policy === 'warn' && notes.push(`${where}: ${detail}`);
for (const e of exceptions)
  if (!e.selector || !e.reason || e.reason.trim().length < 30)
    weak(
      'ds7.config.json',
      `exception ${JSON.stringify(e.selector)} needs a reason that says why it stays, who decided and what ends it`,
    );
const used = new Set();
let pairs = 0;
if (!postcss || !fs.existsSync(SRC))
  console.log(
    `a11y: contrast check skipped (${postcss ? `folder ${SRC} is missing` : 'postcss is not installed'})`,
  );
else {
  const srcFiles = fs
    .readdirSync(SRC)
    .filter((f) => f.endsWith('.css') && f !== 'main.css')
    .map((f) => path.join(SRC, f));
  const vars = {};
  for (const f of srcFiles)
    postcss.parse(fs.readFileSync(f, 'utf8')).walkDecls(/^--/, (d) => {
      if (!(d.prop in vars)) vars[d.prop] = d.value.trim();
    });
  const hex = (v, depth = 0) => {
    v = v.trim();
    const m = v.match(/^var\((--[\w-]+)(?:,\s*([^)]+))?\)$/);
    if (m) return depth < 6 ? hex(vars[m[1]] ?? m[2] ?? '', depth + 1) : null;
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + [...v.slice(1)].map((c) => c + c).join('');
    return null;
  };
  const lum = (h) => {
    const c = [1, 3, 5]
      .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  for (const f of srcFiles)
    postcss.parse(fs.readFileSync(f, 'utf8'), { from: f }).walkRules((rule) => {
      const last = (prop) =>
        rule.nodes
          .filter(
            (n) =>
              n.type === 'decl' && (Array.isArray(prop) ? prop.includes(n.prop) : n.prop === prop),
          )
          .pop();
      const fg = last('color'),
        bg = last(['background-color', 'background']);
      const a = fg && hex(fg.value),
        b = bg && hex(bg.value);
      if (!a || !b) return;
      pairs++;
      const sel = rule.selector.replace(/\s+/g, ' ');
      const got = ratio(a, b);
      const accepted = got < 4.5 && exceptions.find((e) => e.selector && sel.includes(e.selector));
      if (accepted) {
        used.add(accepted);
        const note = rule.prev();
        if (!(note && note.type === 'comment' && /a11y exception/i.test(note.text)))
          weak(
            `${path.basename(f)}:${rule.source.start.line}`,
            `${sel.slice(0, 50)} is an accepted exception: put /* a11y exception: <reason> */ right above the rule`,
          );
      }
      if (got < 4.5 && !accepted)
        bad(
          `${path.basename(f)}:${rule.source.start.line}`,
          '1.4.3',
          'contrast',
          `${sel.slice(0, 50)}: ${fg.value} on ${bg.value} is ${got.toFixed(2)}:1 (4.5:1)`,
        );
    });
}

if (policy !== 'off' && postcss && fs.existsSync(SRC))
  for (const e of exceptions)
    if (e.selector && !used.has(e))
      weak(
        'ds7.config.json',
        `exception ${JSON.stringify(e.selector)} no longer matches a failing rule: remove it`,
      );
if (skipAdvice.size)
  notes.push(
    `${skipAdvice.size} page(s) do not start with a skip link to <main id> (${[...skipAdvice].slice(0, 3).join(', ')}); set a11y.skipLink to "require" to enforce, "off" to silence`,
  );

conclude({
  command: 'a11y',
  notes,
  cli: 'audit a11y',
  summary: (n) => `a11y-check: ${pages.length} pages, ${pairs} colour pairs, ${n} problems`,
  findings: problems,
  show: (fresh) => {
    showByRule(8, (rule, list) => `${rule} (WCAG ${list[0].sc}): ${list.length}`)(fresh);
    for (const n of notes) console.log(`\nadvice: ${n}`);
  },
});
