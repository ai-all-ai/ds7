# DS7

[![npm](https://img.shields.io/npm/v/@ai.all/ds7)](https://www.npmjs.com/package/@ai.all/ds7)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![repo](https://img.shields.io/badge/github-ai--all--ai%2Fds7-blue)](https://github.com/ai-all-ai/ds7)

> **Brand first, then components, then pages.** A web architecture standard that AI agents can follow without long briefings.

```bash
npx @ai.all/ds7
```

DS7 is a set of rules, templates and reference documents for fast, multilingual Nuxt 4 / Vue 3 sites. AI agents start from the root `ALL.md`, which routes them to the DS7 rules in `ds7/ALL.md` and to the rules of your project.

## Requirements

- Node.js 18 or newer.
- A project folder where you run the command. DS7 writes `ds7/` and the agent entrypoints there.
- A web project that follows the stack in `ds7/SPEC.md` (Nuxt 4, Vue 3, Tailwind CSS v4). The rules are written for that stack.

## Related

- **npm:** [@ai.all/ds7](https://www.npmjs.com/package/@ai.all/ds7)
- **GitHub:** [ai-all-ai/ds7](https://github.com/ai-all-ai/ds7)
- **Delivered by:** [AI-ALL](https://github.com/ai-all-ai/aiall) (`@ai.all/aiall`) as the `ds7` pack. See [Packs](https://github.com/ai-all-ai/aiall#packs).

## Quick start

**New project**

```bash
npx @ai.all/ds7
```

Then add your project's own values to the root `ALL.md`, below the packs block, and run `npx @ai.all/aiall check`.

**Sync agent entrypoints only**

```bash
npx @ai.all/ds7 sync
```

**Update to the installed version**

```bash
npm i -D @ai.all/ds7@latest
npx @ai.all/ds7 update
```

## Commands

| Command | What it does |
|---|---|
| `npx @ai.all/ds7` | Copy the standard to `ds7/`, write `ds7/aiall-pack.json`, run `aiall init`, enable the `ds7` pack |
| `npx @ai.all/ds7 sync` | Run `aiall sync`; restores missing entrypoints, keeps existing files |
| `npx @ai.all/ds7 update` | Overwrite `ds7/` and `ds7/aiall-pack.json` with this version, then run `aiall sync`. Project text in the root `ALL.md` is kept |
| `npx @ai.all/ds7 --version` | Print the version |
| `npx @ai.all/ds7 --help` | Print usage |

## Files

| File | Owner | `init` | `update` |
|---|---|---|---|
| `ds7/**` | the standard | copies, keeps existing | overwrites |
| `ds7/aiall-pack.json` | the CLI, generated from its version | creates | overwrites |
| `ds7/VERSION` | the CLI | writes | writes |
| `ALL.md` (root) | AI-ALL; the text below the packs block is yours | created by AI-ALL | not changed by DS7 |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, ... | AI-ALL | created by AI-ALL | not changed by DS7 |

Put project values in the root `ALL.md`, below the AI-ALL packs block. Edits to `ds7/` are lost on `update`; propose a change to the standard instead.

## Git

- Commit `ds7/`, the root `ALL.md` and the agent entrypoints (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, ...).
- DS7 and AI-ALL do not change `.gitignore`. Add ignore rules to your project for `node_modules/`, `.nuxt/`, `.output/`, `dist/`, logs, and `.env` files. The `.gitignore` of the DS7 repository is an example.
- Never commit secrets. Keep them in a git-ignored `.env` or in the host's environment, and list only their names in `.env.example`. See `ds7/09-security-errors/SECURITY-AND-ERRORS.md`.

## Contributing and security

Contribution rules: [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Upgrading from DS7 1.x

DS7 1.x wrote `ALL.md` and `ALL.project.md` to the project root. From this version the standard is the `ds7` pack of AI-ALL. `update` does not delete or rewrite your files, and it prints a warning for each one that needs a manual step:

1. Move the project values from `ALL.project.md` into the root `ALL.md`, below the packs block.
2. Delete `ALL.project.md`.
3. In the root `ALL.md`, remove the copied DS7 rules and keep the packs block.
4. Run `npx @ai.all/ds7 update` and then `npx @ai.all/aiall check`.

## Build order

1. **Foundations:** tokens in `theme.css`.
2. **Brandbook:** every token and base atom on `/ui`.
3. **Atoms and molecules,** built from the brandbook.
4. **Sections and pages,** built from components.

A value that is not a token does not appear in a component. A pattern that is not in the brandbook is not finished.

## What you get

| Folder | Purpose |
|---|---|
| `ALL.md` | Agent contract: rules, build order, checklist, quick reference of component IDs |
| `SPEC.md` | Technical baseline: stack, directory layout, naming, quality gates |
| `01-architecture/` | Atomic Design levels, modifier system, component anatomy |
| `02-design-system/` | Tokens, naming, brandbook sandbox with stable component IDs |
| `03-performance-web-vitals/` | Assets pipeline, critical CSS, font metrics, hydration |
| `04-seo-ai-optimization/` | Answer blocks for AI search, structured data, local search |
| `05-internationalization/` | One locale hub, adding a language |
| `06-business-conversion/` | Commercial patterns for solar and EV projects (examples) |
| `07-testing/` | Targeted testing, accessibility gate, visual regression, agent checks |
| `08-token-optimization/` | Working efficiently with AI context |
| `09-security-errors/` | Security headers, secrets, dependencies, 404 and 500 pages |
| `10-operations/` | Real-user metrics, deployment and rollback, feature flags, content model, dependency policy, changesets |
| `templates/` | Starter component, tokens, Nuxt config, visual regression test |

## Release

Versioning, release steps and rules: [docs/RELEASE.md](docs/RELEASE.md). The change history is in [CHANGELOG.md](CHANGELOG.md).

## Language

All documents are in English. The owner may converse in any language; code and docs stay in English, UI copy goes through the i18n files.

## Note on examples

`06-business-conversion/` and the example values in `04-seo-ai-optimization/` describe a Spanish solar company. They show structure, not facts to reuse. Replace contact details, legal names and prices with your own.

## Prior art

- Atomic Design by Brad Frost: component levels.
- W3C Design Tokens Community Group: token file format.
- Style Dictionary: one token source, many platform outputs.
- Storybook and public design systems (GOV.UK, Material, Salesforce Lightning): foundations documented before components.

## License

MIT. See [LICENSE](LICENSE).
