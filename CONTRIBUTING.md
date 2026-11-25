# Contributing to DS7

DS7 is a standard: rules, templates and reference documents for web projects. Changes should make the standard clearer, more checkable or more correct.

## Before you start

- Open an issue first for a new section, a new rule or a change that breaks existing projects (major version).
- Small corrections (typos, broken links, wrong versions) can go straight to a pull request.

## Development

```bash
npm test                                          # every test file
npm run test:one -- test/layout.test.mjs          # one file: one command or one feature
npm run test:one -- --test-name-pattern="cycle"   # tests whose name contains a word
AIALL_TARBALL=/path/to/aiall.tgz npm test         # test against a local AI-ALL build
npm pack --dry-run                                # the files that would be published
npm run verify                                    # what CI runs: format check, every test, pack; run it before each push
```

CI runs on Linux and macOS with Node 18, 20, 22 and 24 (`.github/workflows/ci.yml`). Keep code and tests to APIs that Node 18 has: for example no `fs.readdirSync(dir, { recursive: true })`, `Object.groupBy`, `Array.prototype.toSorted` or `import.meta.dirname`. Write a small helper instead.

## Tests

- One file per command or feature (`layout.test.mjs`, `seo.test.mjs`, ...); one test per behaviour, named by what it proves. A test checks its own function and nothing else, so it can run alone.
- Every test starts from a fresh folder made by a helper in `test/helpers.mjs` (`bare`, `project`, `site`, `installed`) and removes it when it ends. No test depends on the result of another, and none changes a folder it did not create.
- A rule of a command gets a passing case and a failing case. The failing case breaks one thing in a good fixture and asserts on the name of the rule, not on the whole output.
- No test needs a network, a browser or a Nuxt build. `test/integration.test.mjs` packs DS7 and installs it with `@ai.all/aiall` (once per file, a copy per test); without `AIALL_TARBALL` it uses the registry version in `package.json`.

## Rules

- Every document is in English. Customer-facing copy in examples is placeholder text.
- Each rule has one home. Link to it instead of repeating it.
- A rule that a project can check mechanically should have a check (a test, a script or a documented command).
- Examples describe a structure, not facts. Do not add real contact details, prices or legal names.
- A user-visible change needs a line in `CHANGELOG.md` under `Unreleased`.

## Safe changes

DS7 runs in live projects. A change improves them without breaking them:

1. **Project files are never edited by `update`.** What `init` copies into the project (documents, `ds7.config.json`, skills, the CI workflow) is created once and then belongs to the project; a change to those templates reaches existing projects as a note in `CHANGELOG.md` with the steps to adopt it. `ds7/templates/` itself is replaced on `update` like the rest of `ds7/`: a project file that points into it on purpose (the `Dockerfile` reads `ds7/templates/nginx.conf`) follows the standard, so every change to such a file is listed in the CHANGELOG.
2. **A new check goes through three stages:** a document, then advice that is printed but does not fail (one release), then a failing rule in a later minor release. A check that would fail existing projects on day one is a major change.
3. **Anything that can move the layout** (CSS order, inlining, fonts, tokens) is opt-in and is accepted only after the `/ui` visual references and the main pages at 390, 820 and 1440 px show no difference.
4. **Framework defaults are written out** in the templates when DS7 depends on them, so a framework update cannot change the behaviour unnoticed.
5. **Every rule names its check.** A rule that no script can check goes into a checklist, not into a gate.
6. **A fallback never hides a failure.** A build, a deploy or a check that fails stops; it does not switch to a weaker path.

## Code style

- JavaScript, JSON and YAML are formatted with Prettier 3.6.2 using the shared `.prettierrc.json`. Run `npm run format`, then `npm run format:check` before committing. CI checks it.
- Editor settings (indentation, line endings, final newline) come from `.editorconfig`.
- Markdown, shell scripts and Ruby files are not formatted by Prettier; keep them consistent with the files around them.

## Commits and pull requests

- One concern per commit. Subject in the imperative mood, under 72 characters. The body explains why.
- No `Co-Authored-By` or tool trailers unless the maintainer asks for them.
- The pull request says what changed, why, and how it was checked.
- Releases are made by the maintainer; see [docs/RELEASE.md](docs/RELEASE.md).
