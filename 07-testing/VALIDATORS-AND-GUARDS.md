# 07 · Validators, Guards, and Quality Gates

Fast, automated quality checks ensure code adheres to DS7 standards without bloating project repositories or requiring repetitive human explanation to AI agents.

---

## 1. Core Validation Commands

The DS7 CLI includes zero-footprint validators that run directly from the package or via `npx @ai.all/ds7`:

| Command | Target | Dependencies | Purpose |
|---|---|---|---|
| `npx @ai.all/ds7 guard` | `app/`, `src/`, templates | 0 (Built-in Node.js) | Enforces modifier naming (`.-modifier`), forbids baked-in modifier classes (`*-big`, `*-active`), prevents layer violations, limits page-level style bloat. |
| `npx @ai.all/ds7 guard --strict` | Templates & styles | 0 (Built-in Node.js) | Exits with code 1 on any violation. |
| `npx @ai.all/ds7 check` | Entire project | 0 (Built-in Node.js) | Comprehensive health check: runs modifier guard, raw color detection in UI atoms, i18n parity check, repo hygiene, and (when `ds7.config.json` exists) the layout gate. |
| `npx @ai.all/ds7 check --strict` | Entire project | 0 (Built-in Node.js) | Exits with code 1 on any issue. Recommended for `make check`, pre-commit hooks, and CI workflows. |
| `npx @ai.all/ds7 images` | `public/images/` | `sharp` (optional) | Generates responsive WebP variants (400, 800, 1200 px) and creates `image-variants.json`. |
| `npx @ai.all/ds7 images --check` | `public/images/` | `sharp` (optional) | Fails if responsive variants are missing or older than sources. |
| `npx @ai.all/ds7 layout` | project files | 0 | Every file sits where the placement rules say; component files carry their folder prefix; required docs exist; no import crosses a layer. Gate 5 of `check`. |
| `npx @ai.all/ds7 graph` | `app/`, `server/` | 0 | Generates `docs/SITE-GRAPH.md` and the placement table. `--check` fails when stale; `--uses X`, `--of X`, `--css X` answer queries; `--budget N` prints the most used files first within about N tokens; `--stats` compares the map with the files it covers. |
| `npx @ai.all/ds7 docs` | `docs/`, `ALL.md`, skills | 0 | Everything the docs name exists: scripts, paths, links, sections, registered skills. |
| `npx @ai.all/ds7 audit [html\|seo\|a11y\|perf]` | the build (`.output/public`) | 0 | Static audits over the generated site. See `04-seo-ai-optimization/SEO-CHECKLIST.md`. Run `nuxt generate` first. `perf` also prints advice that does not fail in this version: compressible files without `.br`/`.gz`, a build without `404.html` (`03-performance-web-vitals/DELIVERY-AND-CACHING.md`, section 6). |
| `npx @ai.all/ds7 lab [--axe]` | the build | Playwright | LCP, CLS and blocking on a phone profile; axe at three widths with `--axe`. |
| `npx @ai.all/ds7 psi <url>` | live URL | network | PageSpeed Insights scores and field data. |
| `npx @ai.all/ds7 doctor` | project | 0 | Reads the project and says what to do next: standard version, settings file, required documents, package scripts, stale graph, baseline, build. Changes nothing; `--json` for agents. |

Settings of these commands live in `ds7.config.json` (optional; defaults follow `SPEC.md` section 2): `layout.rules`, `layout.imports`, `layout.required`, `seo.site`, `seo.internal`, `seo.targets`, `seo.trailingSlash`, `seo.llms`, `seo.socialImage`, `a11y.css`, `a11y.exceptions`, `perf.budgets`, `docs.roots`.

### Reports for people, agents and CI

`layout`, `docs` and every `audit` end the same way:

- `--json` prints one JSON object instead of text: `command`, `summary`, `problems` (new findings), `known`, `fixed`, `findings` (`rule`, `where`, `detail`, `known`) and `notes`. `audit --json` joins the four audits as `{ audits: [...], failed }`; a build that is missing becomes an `error` entry.
- `ds7-baseline.json` (project root) lists findings accepted for now, per command. A project that adopts a gate late records today's findings with `--update-baseline`; from then on only new findings fail. A finding is identified by rule, place without the line number, and text; a finding that changes text counts as new. Known findings are counted but not listed, and entries that no longer occur are reported so they can be dropped. `--no-baseline` ignores the file for one run. The file is never created unless asked for, and a baseline is a debt list: shrink it, do not grow it to silence a new finding.

---

## 2. Guard Validator: Class Names and Atomic Layers

The guard validator (`ds7 guard`) protects the codebase against three frequent agent anti-patterns:

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
- Allowed exceptions: every `is-` state class (`is-active`, `is-open`, `is-dark`), Vue/Nuxt transition classes (`*-enter-active`, `*-leave-active`), and `btn-active`, kept so existing projects keep passing. New code writes `.btn.is-active`.
- **What the guard detects:** a class or selector whose last word is one of a fixed list of modifier words (`active`, `big`, `small`, `large`, `orange`, `red`, `green`, `blue`, `dark`, `light`, `new`, `alt`, `v1`, `v2`, ...), in `class="..."` attributes and in CSS selectors. It does not read dynamic `:class` bindings, and a compound with another word (`.card-gold`, `.btn-xl`) passes. The naming rule still applies to those; reviewers and agents enforce it.

### 2.2 Atomic Layer Boundaries
- Components in `components/ui/` (atoms and molecules) must be self-contained.
- **Rule:** A component inside `components/ui/` must **never** import or render upper-layer section/organism components (`<Home*`, `<Site*`, `<Sections*`, `<Shop*`).

### 2.3 Page-Level CSS Line Budget
- Pages in `pages/` (except dev sandbox pages `/ui`, `/ds`) must not accumulate massive inline `<style>` blocks.
- **Limit:** Maximum 40 lines of scoped CSS per page. Styles belonging to reusable sections or components must live in their respective component files or in the design system stylesheet.
- **What the guard measures:** the lines of the first `<style>` block of the page, blank lines included. A second `<style>` block is not counted yet.

### 2.4 Token Discipline: Raw Color Detection
- **Rule:** UI components inside `components/ui/` must consume semantic design tokens (`var(--color-*)`) defined in `theme.css`.
- `ds7 check` flags any literal `#hex` or `rgb(...)`/`rgba(...)` color declarations within `<style>` blocks of UI atoms, ensuring brand-wide recoloring remains trivial.
- **Scope:** files in `app/components/ui/` (the first `<style>` block of a `.vue` file, whole `.css`/`.scss` files), colour properties only. `hsl()`, `oklch()`, colour names and values inside `var(...)` are not flagged, and the gate does not check that a `--color-*` token exists. Contrast from the tokens is checked by `ds7 audit a11y`.

### 2.5 Internationalisation Parity
- **Rule:** Every registered locale in `i18n/locales/` must maintain identical translation keys. Missing keys result in broken production copy or untranslated fallback text.
- `ds7 check` compares the locale files in `i18n/locales/` (or `locales/`, `app/locales/`) with each other.
- **JSON locales:** full key paths (`hero.title`) and empty strings are compared.
- **TS and JS locales:** the key names are read with a pattern, not the full paths, so a key that is missing in one place but has the same name elsewhere is not reported. Locales in subfolders are not read. With one locale there is nothing to compare.
- Full-path parsing of TS locales is planned as advice first, then as a failing rule (`CONTRIBUTING.md`, "Safe changes").

### 2.6 Repository Hygiene & Zero Repo Bloat
- **Rule:** Raw development intake media, PSD/AI source files, OS artifacts (`.DS_Store`), and temporary test previews must never be tracked in the Git tree.
- `ds7 check` verifies that `docs/BRAND.md` is present and flags any forbidden extensions (`.tmp`, `.psd`, `.raw`) or stray files across the project.

---

## 3. Image Optimization Pipeline

Unoptimized images are the leading cause of Core Web Vitals failures (LCP regressions and CLS layout shifts).

- **Library:** [Sharp](https://sharp.pixelplumbing.com/) (`^0.35.5`), powered by libvips.
- **Why Sharp:** 4–8x faster than legacy ImageMagick; automatically downloads prebuilt native binaries for macOS, Linux, and Windows without requiring system-level packages.
- **Output:** WebP with quality 72, generating srcset-ready sizes (400, 800, 1200 px). Originals narrower than 900 px are left as they are, and a size wider than the original is never written. This is the one home of these settings; other documents link here.
- **Zero CLS Rule:** Every image rendered in markup must define explicit `width` and `height` attributes or an aspect-ratio container to eliminate layout shift before image bytes load.

For vector assets, [SVGO](https://svgo.dev/) (`^3.3.x`) strips editor metadata and unused IDs from SVG files in `public/brand/` and `public/icons.svg`.

---

## 4. Runtime and Accessibility Gates

For complete pre-release QA, projects can integrate automated headless checks:

1. **HTML & Semantic Structure:**
   - Single `<h1>` per page.
   - `lang` attribute present on `<html>`.
   - Every `<img>` has a meaningful `alt` attribute (or `alt=""` for decorative elements).
   - No broken internal links (404) to static pages or assets.

2. **Browser Console & Hydration (Headless Chromium via Playwright):**
   - Opens every prerendered route.
   - Catches SSR/client hydration mismatches, uncaught exceptions, and console warnings.

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
