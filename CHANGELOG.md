# Changelog

All notable changes to DS7 are recorded here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
