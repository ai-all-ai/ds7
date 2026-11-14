# Changelog

All notable changes to DS7 are recorded here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

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
