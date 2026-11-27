# 07 · Validators, Guards, and Quality Gates

The checks below keep a project on the standard without long briefings for agents and without scripts copied into every repository.

---

## 1. Core Validation Commands

The checks ship in the DS7 CLI. Most need nothing but Node.js; the few that need a browser or an image library load it from the project and say how to install it when it is missing.

| Command | Reads | Needs | Purpose |
|---|---|---|---|
| `npx ds7 check` | the project | Node.js | Gates 1 to 5: class names and layers, colour tokens in `components/ui`, locale keys, repository hygiene, file layout (when `ds7.config.json` exists). `--strict` exits 1 on a new issue; use it in `make check`, hooks and CI. |
| `npx ds7 guard` | templates and styles | Node.js | Gate 1 on its own: baked-in modifier classes (`card-big`), `is-*` state classes as set in `guard.stateClasses`, atoms that use upper layers, pages with too many style lines. |
| `npx ds7 layout` | project files | Node.js | Every file sits where the placement rules say; component files carry their folder prefix; required docs exist; no import crosses a layer. Gate 5 of `check`. |
| `npx ds7 graph` | `app/`, `server/` | Node.js | Writes `docs/SITE-GRAPH.md` and the placement table. `--check` fails when stale; `--uses X`, `--of X`, `--css X` answer questions; `--budget N` prints the most used files first within about N tokens; `--stats` compares the map with the files it covers. |
| `npx ds7 docs` | `docs/`, `ALL.md`, skills | Node.js | Everything the documents name exists: scripts, paths, links, sections, registered skills. Paths git ignores are skipped. |
| `npx ds7 css` | `app/assets/css` | postcss | Orphan stylesheets and dead classes fail; repeated selectors, identical blocks and `!important` (also in component `<style>`) are advice. `css diff [rev]` lists the rules a refactor lost or gained. |
| `npx ds7 unused` | the source | Node.js | Components, exports, data files and public assets nothing refers to. |
| `npx ds7 audit [html\|seo\|a11y\|perf]` | the build (`.output/public`) | Node.js | Static audits over the generated site; see `04-seo-ai-optimization/SEO-CHECKLIST.md`. Run `nuxt generate` first. `html --base /repo/` checks a build for a base path. `perf` also gives advice that does not fail: files without `.br`/`.gz`, a build without `404.html`. |
| `npx ds7 console` | the build | Playwright | Every page in a browser at each width: console errors and warnings, exceptions, failed requests, HTTP errors. |
| `npx ds7 lab [--axe]` | the build | Playwright | LCP, CLS and blocking on a phone profile; axe at three widths with `--axe`. |
| `npx ds7 psi <url>` | live URL | network | PageSpeed Insights scores and field data. |
| `npx ds7 images [--check]` | `public/images/` | sharp | Responsive WebP variants (400, 800, 1200 px) and `image-variants.json`; `--check` fails when one is missing or older than its picture. |
| `npx ds7 images strip --check` | `public/` | Node.js | Fails while a picture carries hidden metadata (C2PA, EXIF, XMP, text chunks). |
| `npx ds7 images dupes` | `public/images/` | sharp for near copies | The same picture saved twice. |
| `npx ds7 doctor` | the project | Node.js | What to do next: standard version, settings and what they switch off, required documents, package scripts, stale graph, baseline, optional packages, build. Changes nothing; `--json` for agents. |

Every setting of these commands, with its default and its off switch, is in `CONFIG.md`.

### Reports for people, agents and CI

`check`, `layout`, `docs`, `css`, `unused`, `console` and every `audit` end the same way:

- `--json` prints one JSON object instead of text: `command`, `summary`, `problems` (new findings), `known`, `fixed`, `findings` (`rule`, `where`, `detail`, `known`) and `notes`. `audit --json` joins the four audits as `{ audits: [...], failed }`; a build that is missing becomes an `error` entry.
- `ds7-baseline.json` (project root) lists findings accepted for now, per command. A project that adopts a gate late records today's findings with `--update-baseline`; from then on only new findings fail. A finding is identified by rule, place without the line number, and text; a finding that changes text counts as new. Known findings are counted but not listed, and entries that no longer occur are reported so they can be dropped. `--no-baseline` ignores the file for one run. The file is never created unless asked for, and a baseline is a debt list: shrink it, do not grow it to silence a new finding.

---

## 2. Guard Validator: Class Names and Atomic Layers

`ds7 guard` (Gate 1) catches three mistakes agents make often. Each rule is set in `guard` of `ds7.config.json` and can be switched off (`CONFIG.md`).

### 2.1 Baked-in Modifier Class Names (Forbidden)
- **Anti-pattern:** Creating compounded classes like `card-orange-active`, `btn-big`, `fin-large`, `hero-active`.
- **Standard rule:** Base class in kebab-case plus separate modifier class prefixed with a dash:
  ```html
  <!-- CORRECT -->
  <article class="p-card -top -compact">
  <button class="btn -primary -lg">

  <!-- FORBIDDEN -->
  <article class="p-card-top-compact">
  <button class="btn-primary-lg">
  ```
- **State classes:** `is-active`, `is-open` and the like follow `guard.stateClasses`. The default `"warn"` lists them as advice; `"deny"` reports them like any baked-in modifier; `"allow"` stays silent. The standard writes state as a native state, ARIA or `data-state` (`[aria-expanded='true']`, `02-design-system/CSS-CONVENTIONS.md` section 7); the default becomes `"deny"` in 3.0.
- **Never reported:** Vue transition classes (`*-enter-active`, `*-leave-to`, ...) and the names in `guard.allowClasses`.
- **What the guard detects:** a class or selector whose last word is one of the modifier words of `guard.suffixes` (default `active`, `big`, `small`, `large`, `orange`, `red`, `green`, `blue`, `dark`, `light`, `new`, `alt`, `v1`, `v2`, ...), in `class="..."` attributes and in CSS selectors. It does not read dynamic `:class` bindings, and a compound with another word (`.card-gold`, `.btn-xl`) passes. The naming rule still applies to those; reviewers and agents enforce it.

### 2.2 Atomic Layer Boundaries
- Components in `components/ui/` (atoms and molecules) must be self-contained.
- **Rule:** A component inside `components/ui/` never renders a component of an upper layer.
- **What the guard detects:** a tag in an atom whose name starts with the prefix of another component folder next to `ui/` (`sections/` gives `<Sections*`, `site/` gives `<Site*`). `guard.upperLayers` can name the prefixes instead, and `guard.uiDir: false` turns the rule off.

### 2.3 Page-Level CSS Line Budget
- Pages in `pages/` (except dev sandbox pages `/ui`, `/ds`) must not accumulate massive inline `<style>` blocks.
- **Limit:** `guard.pageStyleLines`, 40 lines by default (`false`: no limit). Styles belonging to reusable sections or components must live in their respective component files or in the design system stylesheet.
- **What the guard measures:** the lines of the first `<style>` block of the page, blank lines included. A second `<style>` block is not counted yet.

### 2.4 Token Discipline: Raw Color Detection
- **Rule:** UI components inside `components/ui/` must consume semantic design tokens (`var(--color-*)`) defined in `theme.css`.
- `ds7 check` flags any literal `#hex` or `rgb(...)`/`rgba(...)` color declarations within `<style>` blocks of UI atoms, ensuring brand-wide recoloring remains trivial.
- **Scope:** files in `app/components/ui/` (the first `<style>` block of a `.vue` file, whole `.css`/`.scss` files), colour properties only. `hsl()`, `oklch()`, colour names and values inside `var(...)` are not flagged, and the gate does not check that a `--color-*` token exists. Contrast from the tokens is checked by `ds7 audit a11y`.

### 2.5 Internationalisation Parity
- **Rule:** Every registered locale in `i18n/locales/` must maintain identical translation keys. Missing keys result in broken production copy or untranslated fallback text.
- `ds7 check` compares the locale files in `i18n/locales/` (or `locales/`, `app/locales/`) with each other.
- **JSON locales:** full key paths (`hero.title`) and empty strings are compared.
- **TS and JS locales:** the exported object is read with a small tokenizer, so full key paths are compared, words inside strings, templates and comments are never taken for keys, and a key written twice in one object is reported (the second silently replaces the first).
- **Locales in folders:** `es/home.json` gives the keys `home.*` of the locale `es`.
- With one locale the gate says so: there is nothing to compare yet. `i18n.dir`, `i18n.ignore` and `i18n.check` are in `CONFIG.md`.

### 2.6 Repository Hygiene & Zero Repo Bloat
- **Rule:** Raw development intake media, PSD/AI source files, OS artifacts (`.DS_Store`), and temporary test previews must never be tracked in the Git tree.
- `ds7 check` verifies that `docs/BRAND.md` is present and flags forbidden extensions (`.tmp`, `.psd`, `.raw`, `.cr2`, `.nef`) and `.DS_Store` files in `app/`, `public/` and `docs/`.
- `ds7 doctor` adds two checks on the standard itself: `ds7/` must not be a git clone of the DS7 source, and `.gitignore` must not hide it.

---

## 3. Image Optimization Pipeline

Unoptimized images are the leading cause of Core Web Vitals failures (LCP regressions and CLS layout shifts).

- **Library:** [Sharp](https://sharp.pixelplumbing.com/) (`^0.35.5`), powered by libvips.
- **Why Sharp:** 4–8x faster than legacy ImageMagick; automatically downloads prebuilt native binaries for macOS, Linux, and Windows without requiring system-level packages.
- **Output:** WebP with quality 72, generating srcset-ready sizes (400, 800, 1200 px). Originals narrower than 900 px are left as they are, and a size wider than the original is never written. This is the one home of these settings; other documents link here.
- **Zero CLS Rule:** Every image rendered in markup must define explicit `width` and `height` attributes or an aspect-ratio container to eliminate layout shift before image bytes load.

Three more modes of `ds7 images` keep the pictures in order:

- `images optimize` re-encodes each WebP once at quality 75 and records it, so a second run never compresses the same picture again; pictures whose PSNR drops under 36 dB are listed to look at by eye. `--check` fails while a picture over 300 kB has not been optimised.
- `images strip` removes hidden metadata (C2PA manifests, EXIF, XMP, PNG text chunks, JPEG comments) without touching pixels (`--verify` compares them), and gives each WebP in `public/` a small XMP title from its file name.
- `images dupes` finds the same picture saved twice: identical files, and near copies by a perceptual hash.

For vector assets, [SVGO](https://svgo.dev/) (`^3.3.x`) strips editor metadata and unused IDs from SVG files in `public/brand/` and `public/icons.svg`.

---

## 4. Runtime and Accessibility Gates

Before a release, these run on the build:

1. **HTML & Semantic Structure:**
   - Single `<h1>` per page.
   - `lang` attribute present on `<html>`.
   - Every `<img>` has a meaningful `alt` attribute (or `alt=""` for decorative elements).
   - No broken internal links (404) to static pages or assets.

2. **Browser console and hydration (`ds7 console`, Playwright):**
   - Opens every prerendered route at each width of `console.widths` and scrolls it to the end.
   - Fails on hydration mismatches, uncaught exceptions, console errors and warnings, failed requests and HTTP errors. Known, explained messages go into `console.allow`.

3. **Accessibility (WCAG 2.1 AA via Axe-Core):**
   - Evaluates contrast ratio, ARIA landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`), and keyboard focus indicators.
   - Verifies no horizontal layout overflow on mobile viewports (390 px, 820 px, 1440 px).

---

## 5. Tooling Documentation References

- **Sharp:** [https://sharp.pixelplumbing.com/](https://sharp.pixelplumbing.com/)
- **SVGO:** [https://svgo.dev/](https://svgo.dev/)
- **Playwright:** [https://playwright.dev/](https://playwright.dev/)
- **Axe-core:** [https://github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core)
- **W3C Web Content Accessibility Guidelines (WCAG) 2.1:** [https://www.w3.org/TR/WCAG21/](https://www.w3.org/TR/WCAG21/)
