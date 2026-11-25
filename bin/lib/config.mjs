// Project settings for the ds7 commands: an optional `ds7.config.json` in the project root, merged over the defaults below.
// The defaults follow SPEC section 2 (directory layout), so a project that keeps the standard layout needs no file at all.
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_RULES = [
  {
    path: '{.*,Makefile,Dockerfile,compose.yml,LICENSE,*.md,*.json,*.ts,*.js,*.mjs,*.cjs,*.yml,*.yaml}',
    what: 'Root: project configuration, root documents, dotfiles',
  },
  { path: '.github/**', what: 'CI workflows and templates' },
  { path: '.ai/**', what: 'AI-ALL instruction files' },
  {
    path: '.agents/skills/*/**',
    what: 'Project skills: one folder per workflow with a SKILL.md, registered in ALL.md',
  },
  { path: 'docs/*.md', what: 'Project documents (BRAND, ARCHITECTURE, DECISIONS, METRICS, rules)' },
  {
    path: 'ds7/**',
    what: 'Vendored DS7 standard; `ds7 update` replaces it. Local additions live in ds7/local/',
  },
  { path: 'app/app.vue', what: 'Application root' },
  { path: 'app/layouts/*.vue', what: 'Page layouts' },
  { path: 'app/pages/**/*.vue', what: 'Routes: data in, sections out' },
  {
    path: 'app/components/ui/*.vue',
    what: 'Atoms and molecules; know nothing of sections or the site shell',
  },
  { path: 'app/components/sections/*.vue', what: 'Sections and organisms' },
  { path: 'app/components/site/*.vue', what: 'Site shell: header, footer, modal host' },
  { path: 'app/composables/*.ts', what: 'Reusable logic with Vue state' },
  { path: 'app/utils/*.ts', what: 'Pure helpers' },
  { path: 'app/domain/**', what: 'Pure business maths, no Vue imports' },
  { path: 'app/data/**', what: 'Business data and schemas' },
  { path: 'app/assets/css/*.css', what: 'Stylesheets: main.css imports theme, base, components' },
  { path: 'i18n/locales/*', what: 'Locale hub: one file per language, same keys' },
  { path: 'server/**', what: 'Server routes, API and middleware' },
  { path: 'public/**', what: 'Static assets served as they are' },
  { path: '{tools,scripts}/**', what: 'Project scripts behind npm scripts' },
  { path: '{test,tests}/**', what: 'Tests' },
];
const DEFAULT_IMPORTS = [
  {
    from: 'app/data/**',
    deny: ['app/components/**', 'app/composables/**', 'app/pages/**', 'app/layouts/**'],
    why: 'data stays plain: no components or Vue state',
  },
  {
    from: 'app/utils/**',
    deny: ['app/components/**', 'app/composables/**', 'app/pages/**', 'app/layouts/**'],
    why: 'utils are pure helpers',
  },
  {
    from: 'app/domain/**',
    deny: ['app/components/**', 'app/composables/**', 'app/pages/**', 'app/layouts/**'],
    why: 'domain code has no Vue imports',
  },
  {
    from: 'app/composables/**',
    deny: ['app/components/**', 'app/pages/**', 'app/layouts/**'],
    why: 'composables never depend on the view layer',
  },
  {
    from: 'app/components/**',
    deny: ['app/pages/**', 'app/layouts/**'],
    why: 'components do not know the page that uses them',
  },
  {
    from: 'app/components/ui/**',
    deny: ['app/components/sections/**', 'app/components/site/**'],
    why: 'atoms and molecules do not depend on upper layers',
  },
  {
    from: 'server/**',
    deny: ['app/components/**', 'app/composables/**', 'app/pages/**', 'app/layouts/**'],
    why: 'server code shares only data and locale files with the app',
  },
];
// Words ignored when a page is matched against its primary query (articles and prepositions of the common site languages; extend with seo.stopwords)
const DEFAULT_STOPWORDS = [
  'the',
  'and',
  'for',
  'with',
  'your',
  'our',
  'del',
  'las',
  'los',
  'una',
  'por',
  'con',
  'para',
  'der',
  'die',
  'das',
  'und',
  'les',
  'des',
  'pour',
  'avec',
  'dei',
  'per',
  'uma',
  'com',
];
// The social preview image: wide enough, landscape between 16:10 and 2:1 (1.91:1 and 16:9 both pass), small enough for the chat apps that refuse large previews
const DEFAULT_SOCIAL_IMAGE = { minWidth: 1200, minRatio: 1.6, maxRatio: 2.1, maxKB: 300 };
const DEFAULT_REQUIRED = [
  'docs/BRAND.md',
  'docs/ARCHITECTURE.md',
  'docs/DECISIONS.md',
  'docs/METRICS.md',
];
const DEFAULT_BUDGETS = {
  js: 170 * 1024,
  css: 50 * 1024,
  html: 30 * 1024,
  scripts: 30,
  stylesheets: 4,
  lcp800: 150 * 1024,
};

export function loadConfig(root = process.cwd()) {
  const file = path.join(root, 'ds7.config.json');
  const user = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  return {
    exists: fs.existsSync(file),
    layout: {
      rules: [...(user.layout?.rules ?? []), ...DEFAULT_RULES],
      imports: [...DEFAULT_IMPORTS, ...(user.layout?.imports ?? [])],
      required: user.layout?.required ?? DEFAULT_REQUIRED,
    },
    seo: {
      site: user.seo?.site ?? null,
      internal: user.seo?.internal ?? ['/ui', '/ds'],
      targets: user.seo?.targets ?? null,
      placeholders: user.seo?.placeholders ?? ['example\\.com', '0000000', 'lorem ipsum'],
      stopwords: user.seo?.stopwords ?? DEFAULT_STOPWORDS,
      trailingSlash: user.seo?.trailingSlash ?? false,
      llms: user.seo?.llms ?? false,
      socialImage: { ...DEFAULT_SOCIAL_IMAGE, ...(user.seo?.socialImage ?? {}) },
    },
    a11y: { css: user.a11y?.css ?? 'app/assets/css', exceptions: user.a11y?.exceptions ?? [] },
    perf: { budgets: { ...DEFAULT_BUDGETS, ...(user.perf?.budgets ?? {}) } },
    docs: {
      roots: user.docs?.roots ?? [
        'app',
        'docs',
        'tools',
        'scripts',
        'ds7',
        'i18n',
        'server',
        'public',
        '.agents',
        '.ai',
      ],
    },
  };
}

// The site URL for the commands that need one: --site, then ds7.config.json (seo.site), then runtimeConfig.public.siteUrl in nuxt.config.ts.
export function siteUrl(cfg, flag, root = process.cwd()) {
  if (flag) return flag.replace(/\/$/, '');
  if (cfg.seo.site) return cfg.seo.site.replace(/\/$/, '');
  const nuxt = path.join(root, 'nuxt.config.ts');
  const m =
    fs.existsSync(nuxt) && fs.readFileSync(nuxt, 'utf8').match(/siteUrl:\s*['"]([^'"]+)['"]/);
  return m ? m[1].replace(/\/$/, '') : '';
}
