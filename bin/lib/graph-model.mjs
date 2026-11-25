// Reads the project once and builds the dependency model that site-graph.mjs renders and queries and layout-check.mjs uses for import rules.
// Nuxt auto-imports components (folder-prefixed name), composables and utils, so most dependencies are not written as imports: they are found by tag name and by exported name.
import path from 'node:path';
import { read, componentName, kebabToPascal } from './project.mjs';

export const kindOf = (f) => {
  if (f === 'app/app.vue') return 'app';
  if (/^app\/pages\/.+\.vue$/.test(f)) return 'page';
  if (/^app\/layouts\/.+\.vue$/.test(f)) return 'layout';
  if (/^app\/components\/.+\.vue$/.test(f)) return 'component';
  if (f.startsWith('app/composables/')) return 'composable';
  if (f.startsWith('app/utils/')) return 'util';
  if (f.startsWith('app/data/')) return 'data';
  if (f.startsWith('i18n/')) return 'i18n';
  if (f.startsWith('server/')) return 'server';
  if (/^app\/assets\/css\/.+\.css$/.test(f)) return 'css';
  return null;
};

const routeOf = (f) =>
  '/' +
  f
    .replace(/^app\/pages\//, '')
    .replace(/\.vue$/, '')
    .replace(/\[(\w+)\]/g, ':$1')
    .replace(/(^|\/)index$/, '');
const blockOf = (src, tag) =>
  (src.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || '';
const templateOf = (src) => {
  const i = src.indexOf('<template>'),
    j = src.lastIndexOf('</template>');
  return i > -1 && j > i ? src.slice(i + 10, j) : '';
};
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1');
const exportsOf = (src) =>
  [...src.matchAll(/export\s+(?:async\s+)?(?:function|const|let)\s+([A-Za-z_$][\w$]*)/g)].map(
    (m) => m[1],
  );

function resolveImport(from, spec, fileSet) {
  let base;
  if (/^(~~|@@)\//.test(spec)) base = spec.slice(3);
  else if (/^(~|@)\//.test(spec)) base = 'app/' + spec.slice(2);
  else if (spec.startsWith('.')) base = path.posix.join(path.posix.dirname(from), spec);
  else return null;
  return (
    ['', '.ts', '.vue', '.json', '.mjs', '/index.ts']
      .map((e) => base + e)
      .find((c) => fileSet.has(c)) || null
  );
}

// Class selectors a stylesheet defines (comments, strings and url() removed first).
const classesOf = (css) =>
  new Set(
    [
      ...css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/url\([^)]*\)|"[^"]*"|'[^']*'/g, '')
        .matchAll(/\.(-?[A-Za-z_][\w-]*)/g),
    ].map((m) => m[1]),
  );

export function buildGraph(files) {
  const fileSet = new Set(files);
  const nodes = new Map();
  for (const f of files) {
    const kind = kindOf(f);
    if (!kind) continue;
    const node = { id: f, kind, uses: new Set(), i18n: new Set(), css: [], rootClass: null };
    if (kind === 'component') node.name = componentName(f);
    if (kind === 'page') node.route = routeOf(f);
    nodes.set(f, node);
  }
  const byKind = (k) => [...nodes.values()].filter((n) => n.kind === k);
  const componentByName = new Map(byKind('component').map((n) => [n.name, n]));
  // auto-imported functions of composables and utils
  const autoNames = [];
  for (const n of [...byKind('composable'), ...byKind('util')])
    for (const name of exportsOf(read(n.id))) autoNames.push([name, n]);

  const cssClasses = new Map(byKind('css').map((n) => [n.id, classesOf(read(n.id))]));
  const mainCss = nodes.get('app/assets/css/main.css');
  const cssOrder = mainCss
    ? [...read(mainCss.id).matchAll(/@import\s+["']\.\/([\w.-]+\.css)["']/g)].map(
        (m) => `app/assets/css/${m[1]}`,
      )
    : [];

  for (const node of nodes.values()) {
    if (node.kind === 'css') {
      node.lines = read(node.id).split('\n').length;
      continue;
    }
    const src = read(node.id);
    const isVue = node.id.endsWith('.vue');
    const script = stripComments(isVue ? blockOf(src, 'script') : src);
    const template = stripComments(isVue ? templateOf(src) : '');
    // components named by tag, PascalCase or kebab-case; a Lazy prefix is Nuxt's lazy loading
    if (isVue) {
      for (const [, tag] of template.matchAll(/<([A-Za-z][\w-]*)/g)) {
        const pascal = tag.includes('-') ? kebabToPascal(tag) : tag;
        const target =
          componentByName.get(pascal) || componentByName.get(pascal.replace(/^Lazy/, ''));
        if (target && target !== node) node.uses.add(target.id);
      }
      if (/<component\s[^>]*:is=/.test(template)) node.dynamic = true;
      if (/<style\b/.test(src)) node.scoped = true;
    }
    // auto-imported composables and utils
    const code = script + template;
    for (const [name, target] of autoNames)
      if (target !== node && new RegExp(`\\b${name}\\b`).test(code)) node.uses.add(target.id);
    // explicit imports
    for (const [, spec] of script.matchAll(
      /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    )) {
      const target = resolveImport(node.id, spec, fileSet);
      if (target && nodes.has(target) && target !== node.id) node.uses.add(target);
    }
    // text sections read from the locale file, `messages.home.timeValue`
    for (const [, a, b] of code.matchAll(/\bmessages\.(\w+)(?:\.(\w+))?/g))
      node.i18n.add(b ? `${a}.${b}` : a);
    const seo = script.match(/usePageSeo\(\s*'(\w+)'/);
    if (seo) node.seo = seo[1];
    // the stylesheet that defines the root class of the template
    if (isVue && node.kind !== 'page') {
      const root = template.match(/<(?!\/)[A-Za-z][^>]*?\sclass="([^"]*)"/);
      node.rootClass = root
        ? root[1].split(/\s+/).find((c) => c && !c.startsWith('-')) || null
        : null;
      if (node.rootClass)
        node.css = [...cssClasses]
          .filter(([, set]) => set.has(node.rootClass))
          .map(([f]) => path.posix.basename(f));
    }
  }
  const usedBy = new Map([...nodes.keys()].map((k) => [k, []]));
  for (const n of nodes.values()) for (const t of n.uses) usedBy.get(t)?.push(n.id);
  return { nodes, usedBy, cssOrder, cssClasses, componentByName };
}
