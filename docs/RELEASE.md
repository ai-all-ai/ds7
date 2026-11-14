# Release process

> **How it fits with AI-ALL.** [AI-ALL](https://github.com/ai-all-ai/aiall) (`@ai.all/aiall`) creates the agent entrypoints and the routing file, and keeps them in sync. This document is delivered to agents as the `ds7` pack of AI-ALL. AI-ALL works without DS7; for web projects, install both.


DS7 is published to npm as `@ai.all/ds7` and tagged on GitHub as `vX.Y.Z`. Publishing is done by the maintainer.

## Versioning

- **Patch** (1.1.x): fixes and wording. The CLI copies the same files.
- **Minor** (1.x.0): new rules, docs or templates. Existing projects keep working.
- **Major** (x.0.0): renamed component IDs, removed rules, changed file layout, changed CLI behaviour.

## Release order

Release `@ai.all/aiall` first. DS7 depends on it, and the `ds7` pack needs an AI-ALL version that supports packs. Depend only on AI-ALL versions that are already published. CI tests DS7 against the AI-ALL repository, so a DS7 change is always checked against the AI-ALL code it ships with.

## Steps

1. Move the `Unreleased` section of `CHANGELOG.md` to the new version, with the date.
2. Bump `version` in `package.json` and `package-lock.json`.
3. Run `npm test` and `npm pack --dry-run`. Check that the tarball has `ALL.md`, `CHANGELOG.md`, `README.md`, `SPEC.md`, `bin/`, the numbered folders and `templates/`, and nothing else. It must not contain `ALL.project.md`.
4. Check the version is unused: `npm view @ai.all/ds7 versions --json`.
5. Commit the release with a message such as `Release 1.2.0`. Tag it: `git tag v1.2.0`.
6. Publish: `npm publish --dry-run`, then `npm publish --access public`. Authenticate with 2FA.
7. Verify: `npm view @ai.all/ds7@1.2.0 version`, then `npx @ai.all/ds7` in a fresh empty folder.
8. Push the commit and the tag, and create a GitHub Release from the tag.

## Rules

- Never republish an existing version.
- Never publish from a dirty working tree.
- A release that changes `ALL.md` must say so in the changelog, under the rule it changed.
