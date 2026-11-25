# ds7.config.json

Every DS7 command reads its settings from `ds7.config.json` in the project root. The file is optional: without it the commands use the defaults below, which fit a Nuxt 4 site laid out as in `SPEC.md` section 2. Write only what differs from the defaults.

Three rules hold for every setting:

- **Generic.** No project name, folder or word is built into a check. Lists, paths and limits come from this file.
- **Switchable.** Every check can be turned off (`false` or `"off"`), and most new ones can be turned down to advice (`"warn"`), which prints a line and never fails.
- **Visible.** `npx ds7 doctor` lists what the file switches off and any key no command reads, so a typo does not go unnoticed.

The presence of the file also turns on Gate 5 (`layout`) of `ds7 check`.

## Example

```json
{
  "seo": { "site": "https://example.org", "internal": ["/ui", "/ds", "/owner"] },
  "guard": { "stateClasses": "deny" },
  "a11y": { "skipLink": "require" },
  "unused": { "ignore": ["public/images/cities/**"] },
  "check": { "gates": { "tokens": false } }
}
```

## check: the quality gates

| Key | Default | Meaning |
| --- | --- | --- |
| `check.gates` | all on | Turns a gate of `ds7 check` off by name: `guard`, `tokens`, `i18n`, `hygiene`, `layout`. Example: `{ "tokens": false }`. |

Accepted issues go to `ds7-baseline.json` with `npx ds7 check --update-baseline`; they are shown as known and do not fail `--strict`. A new issue still fails.

## guard: class names and layers (Gate 1)

| Key | Default | Meaning |
| --- | --- | --- |
| `guard.stateClasses` | `"warn"` | `is-*` state classes. `"warn"` prints advice, `"deny"` reports them like baked-in modifiers, `"allow"` says nothing. The standard is a dash modifier (`.menu.-open`). The default becomes `"deny"` in 3.0. |
| `guard.allowClasses` | `[]` | Class names never reported. |
| `guard.suffixes` | `active, big, small, large, orange, red, green, blue, dark, light, new, alt, v1…` | Words that make `card-big` a baked-in modifier. `[]` turns this rule off. |
| `guard.dirs` | `["app", "src", "components", "pages"]` | Folders searched for class names. |
| `guard.uiDir` | `"app/components/ui"` | The atoms. An atom must not use a component of an upper layer. `false` turns the rule off. |
| `guard.upperLayers` | `"auto"` | Name prefixes of the upper layers. `"auto"` takes the other folders next to `uiDir` (`sections/` gives `Sections`). Or a list: `["Home", "Site"]`. |
| `guard.pagesDir` | `"app/pages"` | Where the pages are. |
| `guard.pageStyleLines` | `40` | Most lines of `<style>` a page may hold before they belong in a component. `false`: no limit. |
| `guard.pageStyleSkip` | `["ui.vue", "ds.vue"]` | Page files left out of that limit. |

## i18n: locales (Gate 3)

| Key | Default | Meaning |
| --- | --- | --- |
| `i18n.check` | `true` | `false` turns Gate 3 off. |
| `i18n.dir` | first of `i18n/locales`, `locales`, `app/locales` | The locale folder. A locale is a file (`es.ts`, `en.json`) or a folder of files (`es/home.json` gives keys `home.*`). |
| `i18n.ignore` | `[]` | Locales left out of the comparison, for example one being written. |

Gate 3 reads `.ts` and `.js` locale files with a small tokenizer: words inside strings, templates and comments are never taken for keys, and a key written twice in one object is reported.

## layout: where files go (Gate 5, `ds7 layout`)

| Key | Default | Meaning |
| --- | --- | --- |
| `layout.rules` | the SPEC layout | Placement rules `{ "path": "<glob>", "what": "<purpose>" }`. Yours are tried before the defaults. |
| `layout.imports` | data and utils know no components, ui knows no sections | Import rules `{ "from": "<glob>", "deny": ["<glob>"], "why": "..." }`, added to the defaults. |
| `layout.required` | `docs/BRAND.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/METRICS.md` | Files that must exist. |

## graph: the code map

| Key | Default | Meaning |
| --- | --- | --- |
| `graph.check` | `"auto"` | What `ds7 doctor` runs to see if the map is current. `"auto"`: the project's own `graph:check` script when it has one that is not ds7's, else the built-in check. `"ds7"`: always the built-in one. `false`: no check. |

## docs: documents match the repository (`ds7 docs`)

| Key | Default | Meaning |
| --- | --- | --- |
| `docs.roots` | `app, docs, tools, scripts, ds7, i18n, server, public, .agents, .ai` | Folders a backticked path may point into. |
| `docs.skipIgnored` | `true` | A path git ignores exists on one machine only; it is not reported. |

## seo (`ds7 audit seo`)

| Key | Default | Meaning |
| --- | --- | --- |
| `seo.site` | from `nuxt.config.ts` | The public URL. `--site` wins over it. |
| `seo.internal` | `["/ui", "/ds"]` | Developer pages. Every command that walks the build leaves them out, with what is under them and their copies under a locale prefix (`/en/ui`). |
| `seo.targets` | none | The primary query per page: an object `{ "/route": "query" }` or the path of a JSON file with it. |
| `seo.placeholders` | `example\.com`, `0000000`, `lorem ipsum` | Patterns of test data that must not reach structured data. |
| `seo.stopwords` | English, Spanish and a few more | Words left out when a query is compared with a title. |
| `seo.trailingSlash` | `false` | `true` when the site serves `/about/`. |
| `seo.llms` | `false` | `true` requires `llms.txt`. |
| `seo.lastmod` | `"warn"` | A sitemap without `<lastmod>`: `"warn"` notes it, `"require"` fails, `false` says nothing. |
| `seo.socialImage` | `{ minWidth: 1200, minRatio: 1.6, maxRatio: 2.1, maxKB: 300 }` | Limits of the Open Graph image. |

## a11y (`ds7 audit a11y`)

| Key | Default | Meaning |
| --- | --- | --- |
| `a11y.css` | `"app/assets/css"` | Stylesheets read for colour contrast (needs postcss). |
| `a11y.exceptions` | `[]` | Accepted contrast exceptions: `{ "selector": ".x", "reason": "why it stays, who decided, what ends it" }`. |
| `a11y.exceptionPolicy` | `"warn"` | How strictly an exception is held: a reason of 30 characters or more, the comment `/* a11y exception: ... */` above its rule, and no entry that no longer matches a failing rule. `"warn"` notes, `"strict"` fails, `"off"` only applies the list. |
| `a11y.skipLink` | `"warn"` | The first link of a page jumps to `<main id>`. `"warn"` notes, `"require"` fails, `false` says nothing. |

## perf (`ds7 audit perf`)

| Key | Default | Meaning |
| --- | --- | --- |
| `perf.budgets` | `js` 170 kB, `css` 50 kB, `html` 30 kB, `scripts` 30, `stylesheets` 4, `lcp800` 150 kB | Gzip budgets per page. A stylesheet that is `disabled` or for print does not count as render-blocking. |

## css (`ds7 css`)

| Key | Default | Meaning |
| --- | --- | --- |
| `css` | on | `false` turns the command off. |
| `css.dir`, `css.entry` | `"app/assets/css"`, `"main.css"` | The stylesheet folder and the file that imports the others. |
| `css.sources` | `app, components, pages, layouts, src, i18n, nuxt.config.ts` | Where a class counts as used. |
| `css.orphans` | `true` | Report stylesheets the entry does not import. |
| `css.dead` | `true` | Report classes nothing uses. A dash modifier built from a prop (`-${tone}`) counts as used when the bare word is quoted somewhere. |
| `css.repeats` | `"warn"` | Selectors repeated in one context and identical declaration blocks, as advice. `"off"` hides them. |
| `css.allow` | `[]` | Classes that are used in a way a search cannot see. |

## unused (`ds7 unused`)

| Key | Default | Meaning |
| --- | --- | --- |
| `unused` | on | `false` turns the command off. |
| `unused.components`, `.composables`, `.data`, `.assets` | `true` | Each kind can be switched off. |
| `unused.publicDir` | `"public"` | Where the assets are. A responsive variant (`hero-800.webp`) counts as used when its base image is named. |
| `unused.sources` | the app, server, locales, tools and settings files | Where a name counts as used. |
| `unused.ignore` | `[]` | Globs of files never reported: folders filled by a dynamic path, generated files. |

## console (`ds7 console`)

| Key | Default | Meaning |
| --- | --- | --- |
| `console.widths` | `[1440, 390]` | Viewport widths. `--widths` wins. |
| `console.warnings` | `true` | Warnings fail too. `false`: errors only. |
| `console.allow` | `[]` | Regular expressions of known, explained messages. |

## images (`ds7 images`)

| Key | Default | Meaning |
| --- | --- | --- |
| `images` | on | `false` turns the command off. |
| `images.dir`, `images.publicDir` | `"public/images"`, `"public"` | Where the pictures are. |
| `images.widths`, `.minWidth`, `.quality` | `[400, 800, 1200]`, `900`, `72` | Responsive variants: written for pictures wider than `minWidth`. |
| `images.manifest` | `"app/data/image-variants.json"` | The list of variants per picture. `false`: none. |
| `images.optimize` | `{ quality: 75, alphaQuality: 90, minSaving: 0.1, minPsnr: 36, checkOverKB: 300, record: "app/data/image-optimized.json" }` | One re-encode per picture, recorded so it never runs twice; pictures under `minPsnr` dB are listed to look at. |
| `images.strip` | `{ dirs: ["public"], xmp: true, stopwords: [...] }` | Metadata removal. With `xmp`, a WebP in `public/` gets a title and keywords from its file name. |
| `images.dupes` | `{ distance: 4 }` | How close two perceptual hashes may be to count as the same picture. |

## Optional packages

`postcss` (`ds7 css`, contrast in `audit a11y`), `sharp` (`ds7 images` except `strip`) and `playwright` (`ds7 console`, `ds7 lab`) are optional. They are loaded from the project. A command that needs a missing one prints the install line and stops without failing; on CI (`CI` is set) it fails, so a missing tool never looks like a passed check. `ds7 doctor` shows which are installed.
