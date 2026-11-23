# 07 · Validators, Guards, and Quality Gates

Fast, automated quality checks ensure code adheres to DS7 standards without bloating project repositories or requiring repetitive human explanation to AI agents.

---

## 1. Core Validation Commands

The DS7 CLI includes zero-footprint validators that run directly from the package or via `npx @ai.all/ds7`:

| Command | Target | Dependencies | Purpose |
|---|---|---|---|
| `npx @ai.all/ds7 guard` | `app/`, `src/`, templates | 0 (Built-in Node.js) | Enforces modifier naming (`.-modifier`), forbids baked-in modifier classes (`*-big`, `*-active`), prevents layer violations, limits page-level style bloat. |
| `npx @ai.all/ds7 guard --strict` | Templates & styles | 0 (Built-in Node.js) | Exits with code 1 on any violation. |
| `npx @ai.all/ds7 check` | Entire project | 0 (Built-in Node.js) | Comprehensive health check: runs modifier guard, raw color detection in UI atoms, i18n parity check, and repo hygiene. |
| `npx @ai.all/ds7 check --strict` | Entire project | 0 (Built-in Node.js) | Exits with code 1 on any issue. Recommended for `make check`, pre-commit hooks, and CI workflows. |
| `npx @ai.all/ds7 images` | `public/images/` | `sharp` (optional) | Generates responsive WebP variants (400, 800, 1200 px) and creates `image-variants.json`. |
| `npx @ai.all/ds7 images --check` | `public/images/` | `sharp` (optional) | Fails if responsive variants are missing or older than sources. |

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
- Allowed exceptions: Standard Vue/Nuxt transitions (`page-enter-active`, `swap-leave-active`) and `is-` state classes (`is-active`, `is-open`).

### 2.2 Atomic Layer Boundaries
- Components in `components/ui/` (atoms and molecules) must be self-contained.
- **Rule:** A component inside `components/ui/` must **never** import or render upper-layer section/organism components (`<Home*`, `<Site*`, `<Sections*`, `<Shop*`).

### 2.3 Page-Level CSS Line Budget
- Pages in `pages/` (except dev sandbox pages `/ui`, `/ds`) must not accumulate massive inline `<style>` blocks.
- **Limit:** Maximum 40 lines of scoped CSS per page. Styles belonging to reusable sections or components must live in their respective component files or in the design system stylesheet.

### 2.4 Token Discipline: Raw Color Detection
- **Rule:** UI components inside `components/ui/` must consume semantic design tokens (`var(--color-*)`) defined in `theme.css`.
- `ds7 check` flags any literal `#hex` or `rgb(...)`/`rgba(...)` color declarations within `<style>` blocks of UI atoms, ensuring brand-wide recoloring remains trivial.

### 2.5 Internationalisation Parity
- **Rule:** Every registered locale in `i18n/locales/` must maintain identical translation keys. Missing keys result in broken production copy or untranslated fallback text.
- `ds7 check` parses JSON and TS locale files, performing automated cross-comparison of translation trees and flagging missing keys or empty strings across all language targets.

### 2.6 Repository Hygiene & Zero Repo Bloat
- **Rule:** Raw development intake media, PSD/AI source files, OS artifacts (`.DS_Store`), and temporary test previews must never be tracked in the Git tree.
- `ds7 check` verifies that `docs/BRAND.md` is present and flags any forbidden extensions (`.tmp`, `.psd`, `.raw`) or stray files across the project.

---

## 3. Image Optimization Pipeline

Unoptimized images are the leading cause of Core Web Vitals failures (LCP regressions and CLS layout shifts).

- **Library:** [Sharp](https://sharp.pixelplumbing.com/) (`^0.35.5`), powered by libvips.
- **Why Sharp:** 4–8x faster than legacy ImageMagick; automatically downloads prebuilt native binaries for macOS, Linux, and Windows without requiring system-level packages.
- **Output:** WebP with quality 72, generating srcset-ready sizes (400, 800, 1200 px).
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
