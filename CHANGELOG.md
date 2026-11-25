# Changelog

All notable changes to DS7 are recorded here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.4.0] — 2026-11-25

### Added
- `ds7 graph`: a generated code map, `docs/SITE-GRAPH.md` (routes, components, composables, data, styles, server), that resolves Nuxt auto-imports. Queries `--uses X`, `--of X`, `--css X` replace searching; `--check` fails when the map is stale. It also fills the placement table of `docs/ARCHITECTURE.md`.
- `ds7 layout` and Gate 5 of `ds7 check`: every file sits where the placement rules say (the defaults follow `SPEC.md` section 2), folder name prefixes, required documents, no import across a layer, no import cycle. The gate is on only when the project has a `ds7.config.json`, so existing projects keep passing.
- `ds7 docs`: what the documents name (npm scripts, paths, links, section numbers, skills) must exist; documents nothing refers to are reported.
- `ds7 audit [html|seo|a11y|perf]`: static audits over the build (`.output/public`). SEO: titles, descriptions, canonical, Open Graph, primary query per page, structured data, sitemap, robots, internal links, `hreflang`. Accessibility: the scriptable part of WCAG 2.2 A and AA, each finding with its success criterion, text contrast from the tokens when `postcss` is present. Performance: gzip budgets, LCP image rules, `srcset` and `sizes`, fonts, third-party origins.
- `ds7 lab [--axe]`: LCP, CLS and blocking in a real browser on a phone profile (needs Playwright). `ds7 psi <url>`: PageSpeed Insights scores and field data against the DS7 targets.
- `ds7 doctor`: reads the project and says where it stands with DS7 (standard version, settings file, required documents, package scripts, stale graph, baseline, build) and what to do next. Changes nothing; `--json`.
- `--json`, `--update-baseline` and `--no-baseline` for `layout`, `docs` and every `audit`: results as one JSON object for agents and CI, and a `ds7-baseline.json` of known findings so a project adopts a gate late and only new findings fail.
- `ds7 graph --budget N` (the most used files first within about N tokens) and `--stats` (size of the map next to the files it covers).
- `ds7 audit seo`: `seo.trailingSlash` for sites whose addresses end in a slash; the social image is checked for format, 1200 px width, a landscape ratio between 1.6:1 and 2.1:1 and 300 KB (`seo.socialImage`); `<lastmod>` in the sitemap must be a real past date; `llms.txt` is checked when present and required with `seo.llms`.
- `ds7.config.json` (optional): `layout`, `seo`, `a11y`, `perf` and `docs` settings of the commands.
- `init` creates `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/METRICS.md`, `ds7.config.json`, the starter skills `project-graph`, `add-language` and `seo-page` (registered in the root `ALL.md`), and a CI workflow `.github/workflows/ds7.yml`; it also generates `docs/SITE-GRAPH.md`.
- `04-seo-ai-optimization/SEO-CHECKLIST.md`: the page registry pattern, per-page requirements, WCAG 2.2 and speed gates, local SEO plan. Routed to agents as the `ds7.seo` directive; `08-token-optimization/TOKEN-STRATEGY.md` as `ds7.tokens`.
- `package.json` scripts `graph`, `graph:check`, `layout`, `docs:check` and `audit`.
- `03-performance-web-vitals/DELIVERY-AND-CACHING.md`: pre-compressed build, cache headers per kind of file, web server configurations, a failed build never deploys, and opt-in recipes (pages without JavaScript, speculation rules with `prefetch` only). Routed to agents as the `ds7.delivery` directive; summarised in `ALL.md` section 5.1.
- `templates/nginx.conf` (used by the Dockerfile) and `templates/Caddyfile`: pre-compressed files, the site's `404.html` with status 404, cache headers and the baseline security headers. Both were run against a generated site (nginx 1.24, Caddy 2.6, the version in Debian and Ubuntu packages) and return the same status and headers for pages, `/about` without a slash, unknown routes, hashed build files, images and other files.
- `ds7 audit perf` prints advice that does not fail in this version: compressible files without a `.br` or `.gz` variant, and a build without `404.html`. In `--json` the advice is in `notes`.
- `CONTRIBUTING.md`, "Safe changes": templates reach new projects only, new checks go from advice to failing rule over releases, anything that can move the layout is opt-in and checked against `/ui`, framework defaults are written out, fallbacks never hide a failure.
- `HYDRATION-STRATEGY.md`: native delayed hydration (`hydrate-on-idle`, `hydrate-on-visible`, `hydrate-on-interaction`) and facades for third-party embeds.
- Atomic deploy and rollback with a symbolic link for servers without Docker (`10-operations/DEPLOYMENT.md`, section 5).
- `npm run verify` runs what CI runs (format check, every test, `npm pack --dry-run`); `prepublishOnly` now runs the format check as well. `CONTRIBUTING.md` lists the CI matrix and the Node 18 API limit; `docs/RELEASE.md` adds a test run on Node 18.
- `test/standard.test.mjs`: the standard checks itself, so mistakes found once cannot come back: every `ds7` command named in the documents exists, removed names (`i18n-check`, `inlineSSRStyles`) do not return, the version matches across `package.json`, `package-lock.json`, `ALL.md`, `SPEC.md` and the CHANGELOG, code stays within Node 18 APIs, and every routed document is shipped. The integration test also runs `docs`, `graph --check` and `doctor` on a fresh install.
- `ds7/local/` is documented as the place for longer project documents for agents; `update` never writes it (`README.md`, `ALL.md`).
- Tests: one file per command, one behaviour per test, a fresh folder per test (238 tests, no network or browser needed); `npm run test:one` runs a single file.

### Changed
- CI workflows (this repository and the `init` template) use `actions/checkout@v6` and `actions/setup-node@v6`, which run on Node 24; `@v4` printed the Node 20 deprecation warning. Self-hosted runners need version 2.327.1 or later.
- `ALL.md` section 1: the chat language is the language the owner writes in, detected from the first message and kept by every agent and sub-agent; code, comments and docs stay in English, one language per file; a multi-language site is finished in one language first, then extended one language at a time (`05-internationalization/I18N-ARCHITECTURE.md`, section 2b).
- `ALL.md` section 15 and `08-token-optimization/TOKEN-STRATEGY.md`: the code map is generated, not hand-written; parallel work is limited.
- `04-seo-ai-optimization/STRUCTURED-DATA.md`: FAQ markup no longer earns a rich result in Google Search (ended in 2026); the sample stays for other consumers.
- `ALL.md` section 16 checklist: every file in its place and the graph current.
- `templates/BRAND.md`: the dev-server port example no longer names a project.
- `templates/nuxt.config.ts`: `nitro.compressPublicAssets` (Brotli and gzip) and `nitro.prerender.failOnError: true`.

### Fixed
- `templates/nuxt.config.ts` and `CRITICAL-CSS.md` used `experimental.inlineSSRStyles`, a name Nuxt 4 no longer reads; the setting was silently ignored. They now use `features.inlineStyles` with the Nuxt 4 default written out, so the generated pages do not change. Inlining global CSS is documented as an opt-in, checked against the `/ui` references.
- `templates/Dockerfile` fell back to `npm run build` when `npm run generate` failed and shipped an image without pages. It now accepts only `generate`, checks that `index.html` exists, and serves the build with `nginx.conf` (before: the stock nginx 404 page, no compression, no headers).
- `HYDRATION-STRATEGY.md`: a stray `}` in the idle-widget example, and the lazy-section example named after a page (`HomeProjectMap`) now follows the naming rule (`SectionsProjectMap`).
- `ds7 guard` rejected `is-` state classes other than `is-active` (for example `is-dark`, `is-new`), although `ALL.md`, `SPEC.md` and the naming rules allow every `is-` class. Every `is-` class now passes. The change only relaxes the gate.
- `ALL.md` and `07-testing/TESTING-STRATEGY.md` named `i18n-check --strict`, a command DS7 does not have; they now name `ds7 check --strict`.
- `test/doctor.test.mjs` used `fs.readdirSync` with `recursive`, which early Node 18 releases lack (`engines` is `>=18`).
- `07-testing/VALIDATORS-AND-GUARDS.md` now describes what each gate of `ds7 check` really detects and where it stops (fixed list of modifier words, first `<style>` block, colour properties in `components/ui/`, key names in TS locales), instead of promising more.
- `docs/RELEASE.md` forbade `ALL.project.md` in the tarball, which ships `templates/ALL.project.md`; it now means a file at the tarball root.
- WebP quality was 82 in `ASSETS-PIPELINE.md` and 72 elsewhere; `ds7 images` uses 72. The settings now have one home (`07-testing/VALIDATORS-AND-GUARDS.md`, section 3) and the other documents link to it.

### Compatibility
Minor release. `ds7 update` does not create `ds7.config.json`, so Gate 5 stays off for a project made by 2.3 until its owner adds the file. New commands are opt-in. The new `ds7 audit perf` advice does not fail. Existing projects adopt the delivery changes by hand: replace `experimental.inlineSSRStyles` with `features.inlineStyles` (no visual change with the default), add `compressPublicAssets`, run `nuxt generate` once with `failOnError: true` in a branch and fix what it reports, and copy the new `Dockerfile` if they use one.

## [2.3.0] — 2026-11-23

### Added
- `npx @ai.all/ds7 check`: comprehensive multi-gate health checker combining modifier/atomic guard, raw color token discipline, i18n locale key parity, and repository hygiene.
- Interactive Brand Intake questionnaire in CLI `init` prompting for brand name, dev server port, brand color, and locales to automatically personalize `docs/BRAND.md`.
- `package.json` scripts `check` (`ds7 check`) and `check:strict` (`ds7 check --strict`) automatically scaffolded on `init`.
- `Makefile` template configures `make check` to trigger `npx @ai.all/ds7 check --strict`.

### Changed
- Pre-finish checklist in `ds7/ALL.md` requires `npx @ai.all/ds7 check` verification.

## [2.2.0] — 2026-11-16

### Added
- `07-testing/VALIDATORS-AND-GUARDS.md`: documentation for zero-footprint CLI validators and automated quality gates.
- `03-performance-web-vitals/MEDIA-LIBRARY-DS5.md`: architecture specification for the isolated developer media library (DS5), zero-repo-bloat `.gitignore` policy, and `sharp` processing pipeline.
- `01-architecture/PROJECT-ONBOARDING.md`: fast 4-step onboarding guide and brand intake workflow.
- `templates/BRAND.md`: standardized project brand specification template.
- `templates/ui.vue`: clean starter brandbook sandbox page with neutral monochrome styling, token swatches, and atomic component previews.
- `templates/ALL.project.md`: concise project-specific instruction block for root `ALL.md`.
- `npx @ai.all/ds7 guard`: built-in zero-dependency validator enforcing modifier class naming (`.-modifier`), atomic-design layer boundaries, and page scoped CSS line budgets.
- `npx @ai.all/ds7 images`: built-in responsive WebP image generator and manifest updater (`--check` in CI).
- CLI `init` automatically scaffolds `docs/BRAND.md`, updates `.gitignore` for DS5 media, and configures `guard` scripts in `package.json`.

### Changed
- The pack routes agents to `ds7.validators`, `ds7.medialib`, and `ds7.onboarding`.
- Pre-finish checklist in `ds7/ALL.md` requires `npx @ai.all/ds7 guard` verification.

## [2.1.0] — 2026-11-14

### Added
- `09-security-errors/`: security headers, secrets, dependency rules, input, 404 and 500 pages, with checks.
- `07-testing/TESTING-STRATEGY.md` sections 8 and 9: visual regression of `/ui` and a fixed set of agent checks.
- `templates/visual.spec.ts`: Playwright visual regression template for the brandbook.
- `10-operations/`: real-user Web Vitals and error reporting, deployment and rollback, feature flags, content model, dependency policy and changesets.
- The pack routes agents to the security and operations documents (`ds7.security`, `ds7.operations`).
- `CONTRIBUTING.md`, `SECURITY.md` and a pull request template.
- `scripts/release-check.sh` and `.github/workflows/release.yml`: checks before a release; creates the GitHub Release for a tag.

### Changed
- Depends on `@ai.all/aiall` ^1.0.0. CI tests DS7 against the AI-ALL version in `package.json`, not against `main`.
- `package-lock.json` pins `@ai.all/aiall` 1.0.0.
- Versioning examples in `ALL.md` and `docs/RELEASE.md` match 2.x.
- Quick checks in `ALL.md` include security headers and the 404 page.
- The integration test is `test/integration.test.mjs`.
- Code is formatted with Prettier 3.6.2 using a shared `.prettierrc.json`; CI checks it.

### Compatibility
- Projects made with DS7 2.0.0 upgrade with `npx @ai.all/ds7 update`. Nothing is deleted, and your text in the root `ALL.md` is kept.
- Requires `@ai.all/aiall` 1.0.0, which is installed as a dependency.

## [2.0.0] — 2026-11-14

### Added
- DS7 is the `ds7` pack of AI-ALL. `init` and `update` enable and refresh it.
- Integration test against AI-ALL, `.editorconfig`, one shared `.gitignore`.
- Brand-first build order and English-only documents.

### Changed
- The root `ALL.md` belongs to AI-ALL. DS7 rules live in `ds7/ALL.md`.
- The CLI runs the pinned `@ai.all/aiall` 0.3.0.
- Performance figures are labelled as targets.

### Removed
- `ALL.project.md`. Project values go in the root `ALL.md`, below the packs block.
- `ff.md` and `ANDALUSIA.md`, kept in git history.

### Notes
- 1.1.0 was never published; its changes are part of 2.0.0. Upgrade steps: README, "Upgrading from DS7 1.x".

## [1.0.0] — 2026-11-10

### Added
- Initial standard: `ALL.md`, `SPEC.md`, `README.md`, folders `01` to `08`, templates, and the `ds7` CLI with `init`, `sync` and `update`.
