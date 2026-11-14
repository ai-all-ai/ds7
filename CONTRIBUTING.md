# Contributing to DS7

DS7 is a standard: rules, templates and reference documents for web projects. Changes should make the standard clearer, more checkable or more correct.

## Before you start

- Open an issue first for a new section, a new rule or a change that breaks existing projects (major version).
- Small corrections (typos, broken links, wrong versions) can go straight to a pull request.

## Development

```bash
npm test                                   # CLI checks and the integration test
AIALL_TARBALL=/path/to/aiall.tgz npm test  # test against a local AI-ALL build
npm pack --dry-run                         # the files that would be published
```

The integration test installs DS7 with `@ai.all/aiall` into an empty project. Without `AIALL_TARBALL` it uses the registry version in `package.json`.

## Rules

- Every document is in English. Customer-facing copy in examples is placeholder text.
- Each rule has one home. Link to it instead of repeating it.
- A rule that a project can check mechanically should have a check (a test, a script or a documented command).
- Examples describe a structure, not facts. Do not add real contact details, prices or legal names.
- A user-visible change needs a line in `CHANGELOG.md` under `Unreleased`.

## Code style

- JavaScript, JSON and YAML are formatted with Prettier 3.6.2 using the shared `.prettierrc.json`. Run `npm run format`, then `npm run format:check` before committing. CI checks it.
- Editor settings (indentation, line endings, final newline) come from `.editorconfig`.
- Markdown, shell scripts and Ruby files are not formatted by Prettier; keep them consistent with the files around them.

## Commits and pull requests

- One concern per commit. Subject in the imperative mood, under 72 characters. The body explains why.
- No `Co-Authored-By` or tool trailers unless the maintainer asks for them.
- The pull request says what changed, why, and how it was checked.
- Releases are made by the maintainer; see [docs/RELEASE.md](docs/RELEASE.md).
