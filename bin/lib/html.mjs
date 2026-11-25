// Minimal HTML parser for the checks in tools/: builds a tree of elements from the pages Nuxt generates (well-formed, no tag soup).
// Not a browser: no error recovery beyond closing void and implied-end elements, no entity decoding of attribute names.
// Exports parse(html) -> root node, and small helpers: all(node, predicate), text(node), attr(node, name).
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const ENT = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x2F;': '/',
  '&nbsp;': ' ',
};
export const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|#39|#x2F|nbsp);/g, (m) => ENT[m]);

export function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  let node = root;
  const re =
    /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s"'<>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>|([^<]+|<)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      // end tag: close up to the matching open element
      let n = node;
      while (n && n.tag !== m[1].toLowerCase()) n = n.parent;
      if (n && n.parent) node = n.parent;
    } else if (m[2]) {
      const tag = m[2].toLowerCase();
      const attrs = {};
      for (const a of m[3].matchAll(
        /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
      ))
        attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? '');
      const el = { tag, attrs, children: [], parent: node };
      node.children.push(el);
      if (RAW.has(tag) && !m[4]) {
        // raw text up to the closing tag
        const end = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
        const stop = end < 0 ? html.length : end;
        el.children.push({ tag: '#text', text: html.slice(re.lastIndex, stop), parent: el });
        re.lastIndex = stop;
        const close = html.indexOf('>', stop);
        re.lastIndex = close < 0 ? html.length : close + 1;
      } else if (!VOID.has(tag) && !m[4]) node = el;
    } else if (m[5]) node.children.push({ tag: '#text', text: m[5], parent: node });
  }
  return root;
}

export const all = (n, pred, out = []) => {
  for (const c of n.children || []) {
    if (c.tag !== '#text' && pred(c)) out.push(c);
    all(c, pred, out);
  }
  return out;
};
export const attr = (n, k) => n.attrs?.[k];
/** Visible-ish text of a node; `skip` can exclude subtrees (for example aria-hidden icons) */
export const text = (n, skip = () => false) =>
  n.tag === '#text'
    ? decode(n.text)
    : skip(n) || ['script', 'style'].includes(n.tag)
      ? ''
      : (n.children || []).map((c) => text(c, skip)).join(' ');
export const ancestors = (n) => {
  const a = [];
  for (let p = n.parent; p && p.tag !== '#root'; p = p.parent) a.push(p);
  return a;
};
