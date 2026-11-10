# AI Agent Standard & Single Source of Truth

> This document is the absolute single source of truth for any AI agent (Claude, Gemini, Codex, Copilot, Cursor, Windsurf, ChatGPT) working on this codebase. Read and follow these rules strictly before editing or creating files.
> All agent entrypoints are managed and kept synchronized using [`@ai.all/aiall`](https://www.npmjs.com/package/@ai.all/aiall) (`npx @ai.all/aiall`).

---

## 1. General Engineering & Language Rules

- **Agent Entrypoints Management:** All platform-specific entrypoints (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*`, `.windsurf/rules/*`, `.github/copilot-instructions.md`) must point directly to `ALL.md`. Run `npx @ai.all/aiall` to initialize, sync, and validate entrypoints.
- **Git Commits:** Plain, clear, professional English. Never include co-author trailers (`Co-authored-by:`).
- **Code & Comments:** All TypeScript/Vue code, variables, functions, and inline code comments must be in standard English.
- **Documentation & User Communication:** Guides, architecture docs, and conversational responses to the project owner must be in Russian.
- **Customer Facing Content:** Strictly localized via the project's i18n layer (`es`, `en`, `uk`, etc.).

---

## 2. Component Architecture: Atomic Design & Composability

- **Strict Atomic Hierarchy:**
  - `Atoms` (in `components/ui/`): Indivisible elements (`UiButton`, `UiPrice`, `UiIcon`, `UiBadge`, `UiField`). Zero dependencies on business or page state.
  - `Molecules` (in `components/ui/`): Composable element groups (`UiProductCard`, `UiPlanCard`, `UiHeading`, `UiSliderNav`). Driven strictly by typed props and slots.
  - `Organisms` (in `components/ui/`, `sections/`): Self-contained functional widgets (`UiCardSlider`, `UiFeatureGrid`, `UiHeroHook`, `UiFaq`, `CalcPanel`). Manages local state (scrolling, active tabs).
  - `Templates / Sections`: Composed structures with zero hardcoded page content.
  - `Pages` (in `pages/`): Responsible **only** for data retrieval, setting page SEO metadata, and feeding props into sections. **Never inline product cards or raw grids directly in page files.**
- **Autonomous & Nested:** Every block must be able to live on any page, inside a sidebar, inside a modal, or nested inside another component without knowing its parent context.
- **Zero Component Duplication:** Never create page-specific copies of existing components. Use modifiers and parent ancestry styling.

---

## 3. Modifier Syntax & Class Naming Standard

- **Minimalist, semantic class names:**
  Base class + separate modifier classes prefixed with a dash:
  ```html
  <article class="p-card -top -new -compact">
  ```
- **CSS Cascading from Modifiers:**
  Modifiers on the root element must cascade down to internal elements:
  ```css
  .p-card { /* base styles */ }
  .p-card.-top { /* modifier styles */ }
  .p-card.-top .p-card__title { font-weight: 700; }
  ```
- **Page Context via Ancestry:**
  Customizing a shared component for a specific page must be achieved through the parent class on `<body>` (e.g. `body.page-hogares .hero-hook`) or CSS custom properties, never by creating a new component file.

---

## 4. Performance & Core Web Vitals (Target: Lighthouse 95–100)

- **Critical CSS:** Enforce above-the-fold inline CSS (`experimental.inlineSSRStyles: true` in Nuxt 4) for First Contentful Paint < 0.4s.
- **Zero Layout Shift (CLS = 0.000):** Explicit `aspect-ratio`, `width`, and `height` on all media/containers. Preload critical fonts and use `@nuxtjs/fontaine` fallback metric matching.
- **LCP < 1.2s:** Top hero images must use `fetchpriority="high"` and `loading="eager"`. All lower images must have `loading="lazy"` and `decoding="async"`.
- **Deferred Hydration:** Non-critical widgets (chat widgets, complex modals, cookie banners) must not hydrate on initial load; defer via `requestIdleCallback`.

---

## 5. Assets Pipeline: Tight Trim & Multi-Device Sizing

- Never include raw oversized images with excess transparent padding.
- Trim transparent padding tightly around graphics (tight trim).
- Export optimized modern formats (WebP and AVIF).
- Provide responsive sizing (`srcset` and `<picture>`) for mobile (1x) and retina (2x) viewports.

---

## 6. Internationalization (i18n Single Hub)

- All interface strings must reside in the centralized `i18n/locales/` directory.
- Adding a new locale must only require adding its ISO code (`de`, `fr`, `it`) and a translation file.
- Strictly separate UI strings (in `i18n/`) from business data (in `app/data/`).
- Validate data schemas so missing translations break build time, not production.

---

## 7. AI Search & Semantic SEO (AEO / GEO)

- Structure explanatory sections with **Direct Answer Blocks** (40–50 words concise factual answer under `H2/H3`).
- Use rich markdown/HTML data tables for specs and comparisons (AI crawlers prioritize structured tables).
- Provide full Schema.org JSON-LD graphs (`Product`, `LocalBusiness`, `FAQPage`, `BreadcrumbList`).
