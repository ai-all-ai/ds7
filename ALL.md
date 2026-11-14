# ALL.md — Agent Rules for DS7 Projects

> **How it fits with AI-ALL.** [AI-ALL](https://github.com/ai-all-ai/aiall) (`@ai.all/aiall`) creates the agent entrypoints and the routing file, and keeps them in sync. This document is delivered to agents as the `ds7` pack of AI-ALL. AI-ALL works without DS7; for web projects, install both.


> Single source of truth for every AI agent working in a DS7 project (Claude, Gemini, Codex, Copilot, Cursor, Windsurf, ChatGPT).
> Read this file completely before changing anything. Other files in `ds7/` explain *why* a rule exists; this file says *what to do*.
> Project-specific rules live in the root `ALL.md`, below the AI-ALL packs block (`<!-- aiall:begin packs -->` to `<!-- aiall:end packs -->`). AI-ALL keeps that text on sync. Where project rules and this file disagree, the project rules win for that project and the disagreement is recorded in `docs/DECISIONS.md`.
> This file is the `ds7` pack of AI-ALL. The root `ALL.md` lists it in the packs block. Every entrypoint (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*`, `.windsurf/rules/*`, `.github/copilot-instructions.md`) points to the root `ALL.md`. Sync them with `npx @ai.all/aiall sync`.

**Version:** 2.1.0 · **Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Tailwind CSS v4, `@nuxtjs/i18n`, static generation.

---

## 0. Ground rules (apply to everything below)

1. **Read before writing.** Read the file you change and its direct callers. Do not read whole folders.
2. **Smallest correct change.** Fix the cause in one place. Do not refactor around a bug you were not asked to fix.
3. **Describe reality.** Docs, comments, tests and UI copy state what the code does today. No marketing claims, no unmeasured numbers presented as facts.
4. **No junk in the repo.** No scratch files, debug logs, screenshots, backups or generated reports in tracked folders. Temporary work goes to a scratch directory outside the repo.
5. **Ask only when it changes the outcome.** Otherwise pick the most reasonable option, do it, and say what you chose.

---

## 0.1 Build order: brand first, then components

New projects and new sections are built **top-down from the brand**, never by styling pages one by one:

1. **Foundations** (project file `theme.css`, for example `app/assets/css/theme.css`; a starter is in `ds7/templates/theme.css`): colour, type scale, spacing, radius, shadow, breakpoints, z-index. Written as named tokens, with the W3C Design Tokens format (`$value`, `$type`) as the interchange shape if tools need it.
2. **Brandbook** (`/ui` sandbox): every foundation token shown, then the base atoms (`BTN-01`, `BTN-02`, `CTL-01`, `COUNTER-01`, `PRICE-01`) with their modifiers, states and contrast on light and dark backgrounds.
3. **Atoms and molecules** built from the brandbook only. A component that is not in the sandbox is not finished.
4. **Organisms and sections** composed from molecules.
5. **Pages** assembled from sections, with data from `app/data/`.

Rules that follow from this order:

- A new colour, size or spacing value is added to the foundations first. Components never introduce a raw value.
- A new pattern is added to the brandbook first, then used. If a page needs something that does not exist, add it to the brandbook, then use it.
- Changing a token changes the brandbook, which is the visual regression reference.
- The brandbook is the shared vocabulary: people and agents refer to `CARD-01 -top` instead of describing it again.

This approach is established practice, not an invention of DS7. Related references: the [W3C Design Tokens Format Module (2025.10)](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) defines the token file format; [Brad Frost's Atomic Design](https://atomicdesign.bradfrost.com/chapter-2/) defines the component levels; design systems such as Salesforce Lightning and Material Design publish foundations and component guidance before components are used in product pages. Token pipelines such as Style Dictionary turn one token file into CSS, iOS and Android values.

---

## 1. Languages

- **Code, comments, identifiers, commit messages, docs in `ds7/` and `docs/`:** English.
- **Conversation with the project owner:** the owner's language (unless the owner says otherwise).
- **Customer-facing text:** only through the i18n layer (`i18n/locales/`). Never hard-code a user-visible string in a component or page.
- **Business data** (`app/data/`) is separate from UI strings (`i18n/`). Missing translations must fail the build.

---

## 2. Components (Atomic Design)

Full model: `01-architecture/ATOMIC-DESIGN.md`.

| Level | Location | Rule |
|---|---|---|
| Atoms | `components/ui/` | No knowledge of pages or business state. Typed props only. |
| Molecules | `components/ui/` | Built from atoms. Props and slots only. No side effects. |
| Organisms | `components/ui/`, `components/sections/`, `components/site/` | Own their local state. Work through slots. |
| Sections / templates | `components/sections/` | Compose organisms. No hard-coded page content. |
| Pages | `pages/` | Only: fetch data from `app/data/`, set SEO, pass props. **No inline cards, grids or sliders.** |

- **Never copy a component for a page.** Vary it with modifiers or with the page class on `<body>`.
- **Every block works anywhere** (page, sidebar, modal, nested). It must not depend on its parent.
- **Every reusable pattern has a stable ID** (`CARD-01`, `BTN-01`, …) listed in `02-design-system/BRANDBOOK-SANDBOX.md`. A new pattern without an ID and a sandbox entry is unfinished.

---

## 3. CSS naming and modifiers

Full rules: `02-design-system/NAMING-CONVENTIONS.md` and `01-architecture/MODIFIER-SYSTEM.md`.

- **Base name:** short kebab-case: `.p-card`, `.btn`, `.field`.
- **Element:** double underscore: `.p-card__title`.
- **Modifier:** a **separate** class starting with a dash: `.-top`, `.-compact`, `.-lg`. Combine freely: `class="p-card -top -compact"`.
- **Forbidden:** appending a word to a base name (`.btn-lg`, `.card-big`, `.hero-active`). Use `.btn.-lg`.
- **State:** `is-` prefix: `.is-open`, `.is-active`, `.is-loading`.
- **Page context:** `body.page-<slug>` set by `usePageSeo`. Override shared components through that class or through CSS custom properties. Never through a new file.
- **Colour in components:** tokens only (`var(--color-…)`). No raw hex or `rgb()` in component CSS.
- **Yellow accent (`--color-sun`) is never text.** It is a fill, a badge background or a marker.

---

## 4. Responsive layout

- **Components** size themselves with `container-type: inline-size` and `@container`, so they work in any slot.
- **Pages** use the breakpoints defined in the project's `theme.css` (`--bp-*`). Do not invent new ones.
- **Grids** that cannot fit on a phone switch to two columns below 900 px, or to one column below 480 px. Check at 390, 820 and 1440 px.
- **No horizontal scroll** on any page at 390 px. Side gutter is 16 px on phones.

---

## 5. Images and fonts

Full rules: `03-performance-web-vitals/ASSETS-PIPELINE.md`, `03-performance-web-vitals/FONTS-ZERO-CLS.md`.

- **Every image from `public/` goes through the responsive image component** (`UiImg` in the reference project). Raw `<img src="/…">` is allowed only when the component wraps it.
- **Explicit `width` and `height`** (or an `aspect-ratio` box) on every image. This gives CLS 0.
- **Lazy by default.** The single LCP image above the fold is `eager` with `fetchpriority="high"`.
- **Tight trim:** remove transparent padding before export. Ship WebP (and AVIF where it helps). Generate 1x and 2x variants with the asset script; commit the generated manifest.
- **One preloaded font weight** on the first screen. Fallback font metrics (`size-adjust`, `ascent-override`, …) so swapping fonts moves nothing.
- **Missing asset = build error.** Check every `/images/…` and `/fonts/…` reference against `public/` in the QA gate.

---

## 6. Browser behaviour

- **Media with sound never starts silently on its own.** Autostart only after a real user activation (`pointerdown`, `keydown`, `touchend`) and only if the visitor did not switch it off. Store the visitor's choice explicitly. Probe on reload whether the browser allows playback.
- **Browser storage is listed** in `docs/ARCHITECTURE.md` (key, value shape, owner). Every read and write is wrapped in `try/catch`. The page must still render when storage is blocked.
- **Consent** is stored under one key, documented, and respected by every third-party script.
- **Section navigation** counts only visible sections (`offsetParent !== null`) and recalculates on resize.
- **Non-critical widgets** (chat, cookie banner, sound, modals) hydrate on idle or on visibility, not on load.
- **Floating controls** never overlap each other on phones. Offsets come from one variable.
- **Error pages.** An unknown route returns HTTP 404 with the site layout, a link home and translated copy. A server or build error shows a 500 page without stack traces or paths. See `09-security-errors/SECURITY-AND-ERRORS.md`.

---

## 7. Internationalisation

Full rules: `05-internationalization/I18N-ARCHITECTURE.md`.

- One hub: the project's `i18n/locales/<code>.ts`. Every locale has the same keys. `i18n-check --strict` must pass.
- Adding a language = one file plus one entry in the locale list. Nothing else changes.
- Keys are grouped by component or section (`businessScreens.night.title`). No keys named after pixels or colours.

---

## 8. Accessibility

Full rules: `07-testing/TESTING-STRATEGY.md`.

- **Target:** WCAG 2.2 AA. Axe reports **0 violations** at 390, 820 and 1440 px on every page.
- **Text contrast:** at least 4.5:1 for body text, 3:1 for large text and UI borders.
- **Every interactive element** is reachable by keyboard, has a visible focus style and a name.
- **Icons-only buttons** have an accessible name. Decorative images have `alt=""`.
- **Contrast is measured**, not estimated, when a palette changes.

---

## 9. SEO and AI search

Full rules: `04-seo-ai-optimization/`.

- Each page: one `<h1>`, a unique title and description, canonical URL, `hreflang` for every locale.
- Explanatory sections open with a **direct answer block** (40–50 words, factual).
- Structured data is a single `@graph` (`Organization`, `WebSite`, `Product`, `FAQPage`, `BreadcrumbList` as relevant).
- **Name, address and phone** in structured data match the business profile exactly. Use placeholders in the standard itself; never real contact data in `ds7/`.

---

## 10. Quality gates and metrics

- **Gates** are commands that must pass before a commit is called done: unit tests, type check, i18n parity, asset references, HTML validity, console errors, axe.
- **Performance and Web Vitals numbers** in `SPEC.md` are **targets**.
- **Measured values** go to a dated reference (`docs/METRICS.md`) with the machine, browser and build used. Sandbox or CI numbers are not evidence for LCP or INP. Measure those on a real device.
- Never write "Lighthouse 100/100" or similar as a fact in code, docs or UI.

---

## 11. Git and releases

- **Commit only when the owner asks, or when the task is explicitly "commit".** Never push unless the owner asks for it.
- **Small commits**, one concern each. Subject in imperative mood, under 72 characters. Body explains *why*.
- **Trailers:** commit trailers (for example `Co-Authored-By`) come from the project owner's instructions. If none are given, add none.
- **Do not commit** generated files unless the project lists them as tracked artifacts. Do not commit `node_modules/`, `.nuxt/`, `.output/`, logs or screenshots.
- **Semantic versioning** for this package:
  - `PATCH` (2.0.x): fixes and wording, no change to what the CLI copies.
  - `MINOR` (2.x.0): new rules, new docs, new template options. Existing projects keep working.
  - `MAJOR` (x.0.0): renamed IDs, removed rules, changed file layout, changed CLI behaviour.
- **Every user-visible change adds a line to `CHANGELOG.md`** under `Unreleased`, in Keep a Changelog format. Release = move the section to a version, bump `package.json`, commit, tag `vX.Y.Z`.
- **Publishing** to npm is done by the maintainer only.

---

## 12. Dependencies and environments

- **Do not install packages into the owner's working copy** just to check something. Use an isolated copy, or ask.
- **Platform-specific binaries** (native modules) break when `node_modules` is shared between macOS and Linux. Build in a separate copy with its own `node_modules`.
- **Pin major versions** of framework modules that break easily (for example `@nuxtjs/i18n`). Do not accept a lockfile change that moves them without a reason in the commit message.
- **Never edit `node_modules`.**
- **Operations.** Real-user metrics, deploy and rollback, feature flags, content model, dependency policy and changesets are in `10-operations/`. Read the file that matches the task.
- **Security baseline.** Headers, secrets and dependency rules are in `09-security-errors/SECURITY-AND-ERRORS.md`. Set headers where the site is served; never put a secret in the public configuration or in the repository.

---

## 13. Testing

Full rules: `07-testing/TESTING-STRATEGY.md`.

- **Visual references** of `/ui` change only with the token or pattern change that caused them (`07-testing/TESTING-STRATEGY.md`, section 8).
- Test names state the behaviour: `it('caps savings at the full bill')`, not `it('works')`.
- Test domain logic and composables. Do not unit-test static data, copy or CSS.
- During a task run **one targeted test**. Run the full suite once at the end.
- A test that is skipped or disabled must say why, in the same line.

---

## 14. Documentation

The project keeps these files, and agents read them when a task needs them: `docs/ARCHITECTURE.md` (layer map), `docs/DECISIONS.md` (dated decisions), `docs/METRICS.md` (measured values). The standard does not create them.

- Each rule has one home. Do not repeat a rule in several files; link to the home.
- Docs describe the current state. Decisions and their reasons go to `docs/DECISIONS.md` with a date.
- When behaviour changes, update the doc in the same commit.

---

## 15. Token economy (for agents)

Full strategy: `08-token-optimization/TOKEN-STRATEGY.md`.

1. Read `ALL.md`, then `docs/ARCHITECTURE.md` (the layer map), then only the files on the call chain of the task.
2. Use the component IDs and the sandbox (`/ui`) instead of long descriptions.
3. Put one-line file summaries at the top of non-trivial files.
4. Do not re-read a file you just edited unless the edit tool failed.
5. Do not start long processes in the background unless the task needs them.

---

## 16. Quick reference

| ID | Pattern | Where |
|---|---|---|
| `BTN-01` | Primary button (sun fill) | `02-design-system/BRANDBOOK-SANDBOX.md` |
| `BTN-02` | Outline button | same |
| `CTL-01` | Segmented switch | same |
| `COUNTER-01` | Bounded numeric counter with − / + | same |
| `PRICE-01` | Formatted price | same |
| `CARD-01` | Product card | same |
| `CARD-02` | Plan / tariff card | same |
| `SLD-01` | Card slider with scroll-snap | same |
| `HOOK-01` | Overlap hook under the cover | same |

**Before you finish any task, check:** no hard-coded UI text · no raw colours · no copied component · every image sized and routed through the image component · i18n keys in all locales · axe clean at 390 / 820 / 1440 · CHANGELOG line added · no junk left in the repo · security headers and the 404 page unchanged or documented.
