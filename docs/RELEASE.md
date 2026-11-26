# Release process

> **How it fits with AI-ALL.** [AI-ALL](https://github.com/ai-all-ai/aiall) (`@ai.all/aiall`) creates the agent entrypoints and the routing file, and keeps them in sync. This document is delivered to agents as the `ds7` pack of AI-ALL. AI-ALL works without DS7; for web projects, install both.


DS7 is published to npm as `@ai.all/ds7` and tagged on GitHub as `vX.Y.Z`. Publishing is done by the maintainer.

## Versioning

- **Patch** (2.0.x): fixes and wording. The CLI copies the same files.
- **Minor** (2.x.0): new rules, docs or templates. Existing projects keep working.
- **Major** (x.0.0): renamed component IDs, removed rules, changed file layout, changed CLI behaviour.

## Release order

Release `@ai.all/aiall` first. DS7 depends on it, and the `ds7` pack needs an AI-ALL version that supports packs. Depend only on AI-ALL versions that are already published. CI tests DS7 against the AI-ALL repository, so a DS7 change is always checked against the AI-ALL code it ships with.

## Steps

1. Move the `Unreleased` section of `CHANGELOG.md` to the new version, with the date.
2. Bump `version` in `package.json` and `package-lock.json`.
3. Run `npm run verify` (format check, every test, `npm pack --dry-run`): the same steps as CI, so CI cannot fail on them after the push. Check that the tarball has `ALL.md`, `CHANGELOG.md`, `README.md`, `SPEC.md`, `bin/`, the numbered folders and `templates/`, and nothing else. It must not contain an `ALL.project.md` at its root (`templates/ALL.project.md` is the starter and belongs there).
4. Run the tests on the oldest supported Node (`engines` in `package.json`, today 18): `npx -y -p node@18 node scripts/test.mjs`. CI runs Node 18, 20, 22 and 24 on Linux and macOS.
5. Check the version is unused: `npm view @ai.all/ds7 versions --json`.
6. Commit the release with a message such as `Release 2.1.0`. Tag it: `git tag v2.1.0`.
7. Publish: `npm publish --dry-run`, then `npm publish --access public`. Authenticate with 2FA.
8. Verify: `npm view @ai.all/ds7@2.1.0 version`, then `npx @ai.all/ds7` in a fresh empty folder.
9. Push the commit and the tag, and create a GitHub Release from the tag.

## Compatibility check before publishing

Run this once for each release, in an empty folder:

1. Create a project with the previous published DS7: `npm i @ai.all/ds7@PREVIOUS`, then `npx ds7`. Add a line of your own to the root `ALL.md`, below the packs block.
2. Install the new tarball into the same project (`npm i ./ds7-NEW.tgz @ai.all/aiall@VERSION-USED`) and run `npx ds7 update`.
3. Run `npx aiall check`. It must pass, and your line in the root `ALL.md` must still be there.
4. A change that breaks step 2 or 3 is a major version.

## Rules

- Never republish an existing version.
- Never publish from a dirty working tree.
- A release that changes `ALL.md` must say so in the changelog, under the rule it changed.
