# ALL.md — Agent Rules for DS7 Projects

> **How it fits with AI-ALL.** [AI-ALL](https://github.com/ai-all-ai/aiall) (`@ai.all/aiall`) creates the agent entrypoints and the routing file, and keeps them in sync. This document is delivered to agents as the `ds7` pack of AI-ALL. AI-ALL works without DS7; for web projects, install both.


> Single source of truth for every AI agent working in a DS7 project (Claude, Gemini, Codex, Copilot, Cursor, Windsurf, ChatGPT).
> Read this file completely before changing anything. Other files in `ds7/` explain *why* a rule exists; this file says *what to do*.
> Project-specific rules live in the root `ALL.md`, below the AI-ALL packs block (`<!-- aiall:begin packs -->` to `<!-- aiall:end packs -->`). AI-ALL keeps that text on sync. Longer project documents for agents live in `ds7/local/`, which `ds7 update` never writes; the root `ALL.md` links to them. Where project rules and this file disagree, the project rules win for that project and the disagreement is recorded in `docs/DECISIONS.md`.
> This file is the `ds7` pack of AI-ALL. The root `ALL.md` lists it in the packs block. Every entrypoint (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*`, `.windsurf/rules/*`, `.github/copilot-instructions.md`) points to the root `ALL.md`. Sync them with `npx @ai.all/aiall sync`.

**Version:** 2.9.0 · **Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, plain CSS with custom properties and native nesting (Tailwind, UnoCSS, SCSS and other tools optional), `@nuxtjs/i18n`, static generation.

---

## 0. Ground rules (apply to everything below)

1. **Read before writing.** Read the file you change and its direct callers. Do not read whole folders.
2. **Smallest correct change.** Fix the cause in one place. Do not refactor around a bug you were not asked to fix.
3. **Describe reality.** Docs, comments, tests and UI copy state what the code does today. No marketing claims, no unmeasured numbers presented as facts.
4. **No junk in the repo.** No scratch files, debug logs, screenshots, backups or generated reports in tracked folders. Temporary work goes to a scratch directory outside the repo.
5. **Ask only when it changes the outcome.** Otherwise pick the most reasonable option, do it, and say what you chose.

---

## 0.1 Build order: brand first, then components

New projects and new sections are built **top-down from the brand**, never by styling pages one by one (see `01-architecture/PROJECT-ONBOARDING.md`):

1. **Brand Specification & Foundations** (`docs/BRAND.md` intake and `theme.css`): colour, type scale, spacing, radius, shadow, breakpoints, z-index. Written as named tokens.
   The project theme takes precedence. The UI kit's foundation layer supplies missing token values and plain HTML defaults. Import the project theme through `main.css` and load the package foundation once. See `02-design-system/TOKENS-SPEC.md`.

2. **Brandbook** (`/ui` sandbox from `@ai.all/ui`, which `npx @ai.all/ds7` installs as `app/pages/ui.vue`): every foundation token shown, then the base atoms (`BTN-01`, `BTN-02`, `CTL-01`, `COUNTER-01`, `PRICE-01`) with their modifiers, states and contrast on light and dark backgrounds.
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

## 0.2 Packages and their roles

| Package | Role |
|---|---|
| **DS7** (`@ai.all/ds7`) | The canonical standard: rules, recommendations, agent instructions, checks and production optimisation. |
| **DS** (the CSS layer) | The CSS implementation of the standard: tokens, themes, base styles, helpers and utilities. Today it ships as the foundation of `@ai.all/ui` (`aiall-ui-foundation`) and the project's `theme.css`. |
| **AI-ALL** (`@ai.all/aiall`) | The same behaviour for every AI agent, and delivery of the current DS7 instructions as a pack. |
| **UI** (`@ai.all/ui`) | Reusable components and extra development tools. |
| **DevTools, Brandbook, Asset Gallery** | Optional development helpers from UI. They are left out of the public production build; UI components that pages use stay in it. |

Each rule has one home: CSS rules live in DS7, their implementation in DS, components in UI. A conflict between packages is resolved in favour of DS7 and reported.

---

## 1. Languages

- **Code, comments, identifiers, commit messages, docs in `ds7/` and `docs/`:** English. One language per file: never mix languages in code or comments.
- **Conversation with the project owner:** the language the owner writes in. Detect it from the first message and keep it in every reply, summary, question and message to a sub-agent, unless the owner changes it. Chat language never leaks into files.
- **Customer-facing text:** only through the i18n layer (`i18n/locales/`). Never hard-code a user-visible string in a component or page.
- **A site in several languages:** finish one language version first (all pages, all strings in one locale file), then add the next one at a time. Parallel languages multiply tokens and review work. Procedure: `05-internationalization/I18N-ARCHITECTURE.md`, section 2b.
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

## 3. CSS

Full rules, with before and after examples: `02-design-system/CSS-CONVENTIONS.md`. Optional tools (Tailwind, UnoCSS, SCSS, LESS, CSS Modules): `02-design-system/CSS-SOURCES.md`.

**Before writing new CSS**, check in this order and use the first that fits: an existing component or modifier, base element styles, inheritance from the parent, a token or a component variable, a parent setting, a grouped selector, a helper, a utility. Then write the shortest rule that works.

- **MUST:** semantic HTML first; WCAG 2.2 AA (contrast, focus, keyboard, reduced motion); values from tokens, no raw colours in components; selectors start at the component's root; one mechanism per state (native, then ARIA, then `data-state`).
- **SHOULD:** short root names (`.btn`, `.hero`, `.model-card`); dash modifiers that name only the difference (`.-hor`, `.-sm`, `.-dark`, `.-compact`); parts nested under the root, with a class only when the tag is not enough; native CSS nesting; component variables read with a fallback (`var(--card-p, var(--space-4))`) so a parent or a theme can set them; themes through `data-theme`; priority through order and `@layer`.
- **MAY:** flat selectors where simpler; an optional tool with a reason in `docs/DECISIONS.md`; layout primitives after Every Layout (`stack`, `center`, `cluster`, `grid`, `cover`), small utilities (`row`, `between`, `absfill`, `ellipsis`) and grouped selectors (`:where(h1, h2, .price)`) once a need repeats.
- **MUST NOT:** BEM in new code; a word appended to a root (`.btn-lg`; write `.btn.-lg`); `!important` in components; a copy of a component for a page (use a modifier, a variable or `body.page-<slug>`); a second class for a state that ARIA or a native attribute already holds; helpers or merged rules made in advance for styles that only look alike.
- **No artificial limits:** no closed list of names, no forced splitting of components, no nesting depth limit. These three specifically must not be forced on you; other limits (page style lines, performance budgets) are configurable via `ds7.config.json` and can be turned off or adjusted. Do not nest deeply, and flatten the HTML first (fewer wrapper elements, `gap` and layout helpers instead of spacing `div`s).
- **Yellow accent (`--color-sun`) is never text.** It is a fill, a badge background or a marker.
- **Existing projects** keep their method; nothing forces a migration. `guard.stateClasses` in `ds7.config.json` decides how `is-*` classes are reported.
- **Enforcement:** `npx @ai.all/ds7 guard` (appended modifier words, `is-*`, layer boundaries, page style budgets), `ds7 css` (dead classes; repeated rules and `!important` as advice). Every rule is set or switched off in `ds7.config.json` (`CONFIG.md`).

---

## 4. Responsive layout

- **Components** size themselves with `container-type: inline-size` and `@container`, so they work in any slot.
- **Pages** use the breakpoints defined in the project's `theme.css` (`--bp-*`). Do not invent new ones.
- **Grids** that cannot fit on a phone switch to two columns below 900 px, or to one column below 480 px. Check at 390, 820 and 1440 px.
- **No horizontal scroll** on any page at 390 px. Side gutter is 16 px on phones.

---

## 5. Images and fonts

Full rules: `03-performance-web-vitals/ASSETS-PIPELINE.md`, `03-performance-web-vitals/FONTS-ZERO-CLS.md`, `03-performance-web-vitals/MEDIA-LIBRARY-DS5.md`.

- **Developer Media Library:** Unprocessed originals (`ds5/`, `.ds5/`) remain in `.gitignore`. Production assets live in `public/`.
- **Responsive variants:** Generate multi-resolution WebP variants via `npx @ai.all/ds7 images` (`--check` in CI); `images optimize`, `images strip` and `images dupes` compress once, remove hidden metadata and find the same photo saved twice.
- **Every image from `public/` goes through the responsive image component** (`UiImg` in the reference project). Raw `<img src="/…">` is allowed only when the component wraps it.
- **Explicit `width` and `height`** (or an `aspect-ratio` box) on every image. This gives CLS 0.
- **Lazy by default.** The single LCP image above the fold is `eager` with `fetchpriority="high"`.
- **Tight trim:** remove transparent padding before export. Ship WebP (and AVIF where it helps). Generate 1x and 2x variants with the asset script; commit the generated manifest.
- **One preloaded font weight** on the first screen. Fallback font metrics (`size-adjust`, `ascent-override`, …) so swapping fonts moves nothing.
- **Missing asset = build error.** Check every `/images/…` and `/fonts/…` reference against `public/` in the QA gate.

## 5.1 Delivery

Full rules: `03-performance-web-vitals/DELIVERY-AND-CACHING.md`.

- **Pre-compressed build:** `nitro.compressPublicAssets` writes `.br` and `.gz` files during `nuxt generate`; the web server sends them as they are.
- **Cache headers:** hashed files under `/_nuxt/` are `immutable` for a year, HTML is revalidated on every visit, other files in `public/` are cached for a week. A file in `public/` whose content changes gets a new name.
- **Web server:** use `templates/nginx.conf` (Docker) or `templates/Caddyfile`. Both serve the 404 page with status 404 and the baseline security headers.
- **A failed build never deploys:** `nitro.prerender.failOnError: true`, and no fallback build command.
- **Opt-in only, one page group at a time, recorded in `docs/DECISIONS.md`:** inlining global CSS (`03-performance-web-vitals/CRITICAL-CSS.md`), pages without JavaScript, speculation rules (`prefetch`, never `prerender`).
- **Third-party embeds** (video, maps, chat) load behind a facade, after a click and consent (`03-performance-web-vitals/HYDRATION-STRATEGY.md`, section 3).

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

- One hub: the project's `i18n/locales/<code>.ts`. Every locale has the same keys. `npx @ai.all/ds7 check --strict` must pass.
- Adding a language = one file plus one entry in the locale list. Nothing else changes.
- Keys are grouped by component or section (`businessScreens.night.title`). No keys named after pixels or colours.

---

## 8. Accessibility

Full rules: `07-testing/TESTING-STRATEGY.md`.

- **Target:** WCAG 2.2 AA. Axe reports **0 violations** at 390, 820 and 1440 px on every page. The scripted gate and the manual checklist: `04-seo-ai-optimization/SEO-CHECKLIST.md`, section 4.
- **Text contrast:** at least 4.5:1 for body text, 3:1 for large text and UI borders.
- **Every interactive element** is reachable by keyboard, has a visible focus style and a name.
- **Icons-only buttons** have an accessible name. Decorative images have `alt=""`.
- **Contrast is measured**, not estimated, when a palette changes.

---

## 9. SEO and AI search

Full rules: `04-seo-ai-optimization/`.

- Each page: one `<h1>`, a unique title and description, canonical URL, `hreflang` for every locale.
- Explanatory sections open with a **direct answer block** (40–50 words, factual).
- Structured data is a single `@graph` (`Organization`, `WebSite`, `Product`, `BreadcrumbList` as relevant).
- Page registry, per-page requirements, WCAG 2.2 and speed gates, and the order of work: `04-seo-ai-optimization/SEO-CHECKLIST.md`.
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
- **Small commits**, one concern each, in [Conventional Commits](https://www.conventionalcommits.org/) form: `type(scope): subject` (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`). Subject in imperative mood, under 72 characters. Body explains *why*. `ds7 hooks` installs a `commit-msg` hook that checks the form.
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

The project keeps these files, and agents read them when a task needs them: `docs/BRAND.md` (brand specification and foundations intake, created during `init`), `docs/ARCHITECTURE.md` (layer map), `docs/DECISIONS.md` (dated decisions), `docs/METRICS.md` (measured values).

- Each rule has one home. Do not repeat a rule in several files; link to the home.
- Docs describe the current state. Decisions and their reasons go to `docs/DECISIONS.md` with a date.
- When behaviour changes, update the doc in the same commit.

---

## 15. Token economy (for agents)

Full strategy: `08-token-optimization/TOKEN-STRATEGY.md`.

1. Read `ALL.md`, then `docs/ARCHITECTURE.md` (the layer map and where files live), then only the files on the call chain of the task.
2. Ask the generated site graph instead of searching (`ds7 graph --uses X`). Details: `08-token-optimization/TOKEN-STRATEGY.md`, section 2.
3. Use the component IDs and the sandbox (`/ui`) instead of long descriptions.
4. Put one-line file summaries at the top of non-trivial files.
5. Do not re-read a file you just edited unless the edit tool failed.
6. Do not start long processes in the background unless the task needs them.

---

## 16. Quick reference

| ID | Pattern | Where |
|---|---|---|
| `BTN-01` | Default button (`.btn`) | `02-design-system/BRANDBOOK-SANDBOX.md` |
| `BTN-02` | Outline button | same |
| `CTL-01` | Segmented switch | same |
| `COUNTER-01` | Bounded numeric counter with − / + | same |
| `PRICE-01` | Formatted price | same |
| `CARD-01` | Product card | same |
| `CARD-02` | Plan / tariff card | same |
| `SLD-01` | Card slider with scroll-snap | same |
| `HOOK-01` | Overlap hook under the cover | same |

**Before you finish any task, check:** every file in its place (`ds7 layout`) · graph current (`ds7 graph --check`) · no hard-coded UI text · no raw colours · existing components, tokens and helpers reused before new CSS · no `!important` · no copied component · every image sized and routed through the image component · `npx @ai.all/ds7 check` clean · no dead CSS or unused component (`ds7 css`, `ds7 unused`) · console clean (`ds7 console`) · i18n keys in all locales · axe clean at 390 / 820 / 1440 · CHANGELOG line added · no junk left in the repo · security and cache headers and the 404 page unchanged or documented · no new advice lines from `ds7 audit perf`.
