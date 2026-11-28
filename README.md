# DS7

[![npm](https://img.shields.io/npm/v/@ai.all/ds7)](https://www.npmjs.com/package/@ai.all/ds7)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![repo](https://img.shields.io/badge/github-ai--all--ai%2Fds7-blue)](https://github.com/ai-all-ai/ds7)

> **Brand first, then components, then pages.** A web architecture standard that AI agents can follow without long briefings.

```bash
npm install -D @ai.all/ds7
npx ds7 init
```

DS7 is a frontend standard with rules, templates and checks. Its current installer scaffolds Nuxt 4 / Vue 3 projects; the CSS and architecture guidance can also be used for static HTML, vanilla JS, Astro and other stacks. Choose the CSS, rendering and build profiles in [Technology profiles](01-architecture/TECHNOLOGY-PROFILES.md). AI agents start from the root `ALL.md`, which routes them to `ds7/ALL.md` and the project's own rules.

## Requirements

- Node.js 18 or newer.
- A project folder where you run the command. DS7 writes `ds7/` and the agent entrypoints there.
- For the current `npx ds7` scaffold and its Nuxt-specific gates, a Nuxt 4 / Vue 3 project following [SPEC.md](SPEC.md). Other stacks may adopt the standards and applicable checks without the Nuxt scaffold. Tailwind, UnoCSS, SCSS and other CSS tools are optional choices.

## Related

- **npm:** [@ai.all/ds7](https://www.npmjs.com/package/@ai.all/ds7)
- **GitHub:** [ai-all-ai/ds7](https://github.com/ai-all-ai/ds7)
- **Delivered by:** [AI-ALL](https://github.com/ai-all-ai/aiall) (`@ai.all/aiall`) as the `ds7` pack. See [Packs](https://github.com/ai-all-ai/aiall#packs).

## Packages

| Package | Role |
|---|---|
| **DS7** (`@ai.all/ds7`) | The canonical standard: rules, recommendations, agent instructions, checks, production optimisation. |
| **DS Native Contextual** | Recommended CSS method; usable in project files now. It is not a package. |
| **DS Core** | Future framework-independent CSS package. No current DS7 dependency or subpath exports. |
| **AI-ALL** (`@ai.all/aiall`) | The same behaviour for every AI agent; delivers the current DS7 instructions as a pack. |
| **UI** (`@ai.all/ui`) | Existing Vue components and CSS foundation, plus development tools. |
| **DevTools, Brandbook, Asset Gallery** | Optional development helpers, left out of the public production build. UI components that pages use stay in it. |

Deferred work (class-name mangler, own CSS compiler, critical CSS engine and others): [ROADMAP.md](ROADMAP.md).

The [static HTML example](examples/static-html/README.md) demonstrates the same native CSS contract and independent calculator logic without Vue, Nuxt or DS Core.

## Quick start

```bash
npm i -D @ai.all/ds7
npx ds7            # install the standard; `npx ds7 --yes` skips the questions
npx ds7 doctor     # where the project stands and what to do next
npx ds7 check      # the five quality gates
```

Installing DS7 currently also installs `@ai.all/ui` and `@ai.all/aiall`. This is package installation, not proof that either package is in browser output. Init wires UI into standard Nuxt 4 projects so the development Brandbook is available at `/ui`. Other rendering profiles use their own setup and relevant DS7 checks.

Every site gets its own local address, `http://<name>.localhost:<port>`. The
name comes from the package (`velo.es` gives `velo.localhost`), so no hosts
file is needed. The port is the first free one of the series 3010, 3020,
3030, ...; 3000, 4000 and 4500 are never used. Init saves both in
`ds7.config.json` (`dev.port`, `dev.name`) and points a standard `npm run dev`
at `ds7 dev`, which keeps them from run to run and moves to the next free port
of the series when another program holds this one. Customized dev scripts are
kept.

Then write your project's own values in the root `ALL.md`, below the packs block, and the settings of the commands in `ds7.config.json` ([CONFIG.md](CONFIG.md)).

A project that already has its own scripts in `tools/` can see which ones a ds7 command replaces with `npx ds7 adopt`.

## Commands

**Set up and keep up to date**

| Command | What it does |
|---|---|
| `npx ds7` | Install: the standard in `ds7/`, the AI-ALL pack, `docs/` templates, `ds7.config.json`, starter skills, npm scripts and a CI workflow (none when your CI already runs the checks). Existing files are kept. |
| `npx ds7 update` | Replace `ds7/` with this version. Local edits are kept: patches in `ds7/local/patches/` are applied again, and an edit without a patch is saved to `ds7/local/edited/`. `--no-patches` (or `"update": { "patches": "off" }` in `ds7.config.json`) applies none: for a project that changed a lot, whose difference is described in `ds7/local/CUSTOM-LAYER.md`. |
| `npx ds7 patch <file>` | Record an edit of a vendored file as a patch that every update applies again. |
| `npx ds7 dev` | Nuxt dev server on the site's own address `http://<name>.localhost:<port>`, with a free port of 3010, 3020, ... kept in `ds7.config.json` (`dev`). `--dry-run` prints the command. |
| `npx ds7 sync` | Restore the agent entrypoints (`aiall sync`). |
| `npx ds7 doctor` | Where the project stands, what the settings switch off, which optional packages are installed, what to do next (`--json`). |
| `npx ds7 adopt` | Which local `tools/` scripts a ds7 command replaces (`--write` rewrites the npm scripts that only call them). |
| `npx ds7 skills link` | Link the skills of `.agents/skills` into `.claude/skills`. |
| `npx ds7 hooks` | Install the commit-msg hook that checks Conventional Commits. |
| `npx ds7 pages` | GitHub Pages under a base path: the `asset()` helper and a deploy workflow. |

**Check the source**

| Command | What it does |
|---|---|
| `npx ds7 check` | Gates 1 to 5: class names and layers, colour tokens, locale keys, repository hygiene, file layout. `--strict` fails on a new issue, `--json`, `--update-baseline`. |
| `npx ds7 guard` | Gate 1 on its own, every finding listed. |
| `npx ds7 layout` | Files sit where the layout rules say and no import crosses a layer. |
| `npx ds7 graph` | The code map `docs/SITE-GRAPH.md`; ask it with `--uses X`, `--of /route`, `--css class`. |
| `npx ds7 docs` | What the documents mention (scripts, paths, links, skills) exists. |
| `npx ds7 css` | Dead classes and orphan stylesheets; repeated selectors, identical blocks and `!important` as advice. `css diff [rev]` proves a CSS refactor changed no rule. |
| `npx ds7 unused` | Components, exports, data files and public assets nothing refers to. |

**Check the build** (after `npm run generate`)

| Command | What it does |
|---|---|
| `npx ds7 audit` | `html`, `seo`, `a11y`, `perf` over `.output/public`; name one to run one. `audit html --base /repo/` proves no path leaves a base path. |
| `npx ds7 console` | Console errors, exceptions and failed requests of every page in a browser. Needs Playwright. |
| `npx ds7 lab` | LCP, CLS and blocking in a browser; `--axe` for accessibility. Needs Playwright. |
| `npx ds7 psi <url>` | PageSpeed Insights scores and field data of a live URL. |

**Images**

| Command | What it does |
|---|---|
| `npx ds7 images` | Responsive WebP variants of the large pictures (`--check`). Needs sharp. |
| `npx ds7 images optimize` | Re-encode each WebP once, recorded so it never runs twice (`--dry`, `--check`). Needs sharp. |
| `npx ds7 images strip` | Remove hidden metadata (C2PA, EXIF, XMP, text chunks) without touching pixels (`--check`). |
| `npx ds7 images dupes` | The same picture saved twice, also as a near copy. |

Every checking command accepts `--json`, and `--update-baseline` to accept the findings of today in `ds7-baseline.json`: they are shown as known, new ones still fail. Every check can be configured or switched off in `ds7.config.json`; see [CONFIG.md](CONFIG.md).

## Files

| File | Owner | `init` | `update` |
|---|---|---|---|
| `ds7/**` | the standard | copies, keeps existing | overwrites, then applies `ds7/local/patches/` |
| `ds7/aiall-pack.json`, `ds7/VERSION`, `ds7/FILES` | the CLI | writes | writes |
| `ds7/local/**` | the project: notes, recurring rules, custom layer, patches | starter `README.md`, `RECURRING-RULES.md` and `CUSTOM-LAYER.md` | creates `CUSTOM-LAYER.md` if missing; otherwise never written (except `edited/`, see above) |
| `docs/BRAND.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/METRICS.md` | the project | creates if missing | not changed |
| `docs/SITE-GRAPH.md` | generated by `ds7 graph` | creates if missing | not changed |
| `ds7.config.json` | settings of the commands; its presence turns on Gate 5 | creates if missing | not changed |
| `ds7-baseline.json` | accepted findings, written by `--update-baseline` | not created | not changed |
| `.github/workflows/ds7.yml` | CI: gates, graph, docs, build and audits | creates if missing and no workflow runs the checks | not changed |
| `.agents/skills/*/SKILL.md` | starter skills: `project-rules`, `project-graph`, `seo-page`, `search-quality`, `code-audit`, `add-language` | creates if missing | not changed |
| `Makefile` | project automation | creates if missing | not changed |
| `ALL.md` (root) | AI-ALL; the text below the packs block is yours | created by AI-ALL | not changed by DS7 |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, ... | AI-ALL | created by AI-ALL | not changed by DS7 |

`update` copies files and does not delete: a file removed from the standard stays in `ds7/` until you delete it (the CHANGELOG says when one is removed).

## CI

`init` writes `.github/workflows/ds7.yml`. A site can instead call the reusable workflow of this repository, which runs the checks, the build and the audits, and can deploy to GitHub Pages:

```yaml
jobs:
  site:
    uses: ai-all-ai/ds7/.github/workflows/site.yml@v2.6.0
    with:
      pages: true
    permissions:
      contents: read
      pages: write
      id-token: write
```

Inputs: `node-version` (default from `.nvmrc`), `check` (`check:strict`), `build` (`generate`), `audit` (`audit`, empty to skip), `pages` (`false`), `noindex` (`true`: the Pages copy is a preview closed to search engines).

## Git

- Commit `ds7/`, `docs/BRAND.md`, the root `ALL.md` and the agent entrypoints (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, ...).
- Commit `ds7/`: a `.gitignore` rule such as `/ds[0-9]*/` must not hide it (`ds7 doctor` warns). On `init`, DS7 adds the local intake folders (`ds5/`, `.ds5/`, `*.tmp-pv`) to `.gitignore`. Add project-specific rules for `node_modules/`, `.nuxt/`, `.output/`, `dist/`, logs, and `.env` files.
- Never commit secrets. Keep them in a git-ignored `.env` or in the host's environment, and list only their names in `.env.example`. See `ds7/09-security-errors/SECURITY-AND-ERRORS.md`.

## Contributing and security

Contribution rules: [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Upgrading to 2.5

1. If you changed files under `ds7/`, record each small edit first (`npx ds7 patch <file>`), and describe larger differences in `ds7/local/CUSTOM-LAYER.md`. An edit you forget is not lost: `update` saves it to `ds7/local/edited/`.
2. `npm i -D @ai.all/ds7@2.5` and `npx ds7 update`.
3. `npx ds7 doctor`: it lists what is missing and which settings are in use.
4. `npx ds7 check`. Gate 3 now compares full key paths of TS locales and may find keys the old check missed. Add them, or record them with `npx ds7 check --update-baseline` and fix them later.
5. `is-` state classes now show as advice. Keep them with `"guard": { "stateClasses": "allow" }`, or move to dash modifiers (`.menu.-open`) at your pace.
6. Optional: `npx ds7 skills link`, `npx ds7 hooks`, and the reusable workflow from the CI section.

Every setting and its off switch: [CONFIG.md](CONFIG.md). All changes: [CHANGELOG.md](CHANGELOG.md).

## Upgrading from DS7 1.x

DS7 1.x wrote `ALL.md` and `ALL.project.md` to the project root. From this version the standard is the `ds7` pack of AI-ALL. `update` does not delete or rewrite your files, and it prints a warning for each one that needs a manual step:

1. Move the project values from `ALL.project.md` into the root `ALL.md`, below the packs block.
2. Delete `ALL.project.md`.
3. In the root `ALL.md`, remove the copied DS7 rules and keep the packs block.
4. Run `npx @ai.all/ds7 update` and then `npx @ai.all/aiall check`.

## Build order

1. **Foundations:** tokens in `theme.css`.
2. **Component contracts:** semantic structure, tokens, states and accessibility. Use `/ui` as a preview in the Nuxt/UI profile; other profiles can use their own fixtures.
3. **Reusable components,** composed from the foundations.
4. **Sections and pages,** composed from components.

Keep repeated design values in tokens and review reusable patterns in the preview available to the project.

## What you get

| Folder | Purpose |
|---|---|
| `ALL.md` | Agent contract: rules, build order, checklist, quick reference of component IDs |
| `SPEC.md` | Technical baseline: stack, directory layout, naming, quality gates |
| `01-architecture/` | Atomic Design levels, modifier system, component anatomy |
| `02-design-system/` | CSS conventions, optional CSS tools, tokens and themes, naming, brandbook sandbox with stable component IDs |
| `03-performance-web-vitals/` | Assets pipeline, critical CSS, font metrics, hydration, delivery and caching |
| `04-seo-ai-optimization/` | SEO checklist and gates, answer blocks for AI search, structured data, local search |
| `05-internationalization/` | One locale hub, adding a language |
| `06-business-conversion/` | Commercial patterns for solar and EV projects (examples) |
| `07-testing/` | Targeted testing, accessibility gate, visual regression, agent checks |
| `08-token-optimization/` | Working efficiently with AI context |
| `09-security-errors/` | Security headers, secrets, dependencies, 404 and 500 pages |
| `10-operations/` | Real-user metrics, deployment and rollback, feature flags, content model, dependency policy, changesets |
| `CONFIG.md` | Every setting of `ds7.config.json`, its default and how to switch it off |
| `templates/` | Starter component, tokens, Nuxt config, visual regression test, project documents, `ds7.config.json`, starter skills, CI and Pages workflows, `asset()` helper, commit-msg hook, `Dockerfile` and `compose.yml`, server configurations (`nginx.conf`, `Caddyfile`) |

## Release

Versioning, release steps and rules: [docs/RELEASE.md](docs/RELEASE.md). The change history is in [CHANGELOG.md](CHANGELOG.md).

## Language

All documents are in English. The language rules for agents, the owner and the site are in `ds7/ALL.md`, section 1.

## Note on examples

`06-business-conversion/` and the example values in `04-seo-ai-optimization/` describe a Spanish solar company. They show structure, not facts to reuse. Replace contact details, legal names and prices with your own.

## Prior art

- Atomic Design by Brad Frost: component levels.
- W3C Design Tokens Community Group: token file format.
- Style Dictionary: one token source, many platform outputs.
- Storybook and public design systems (GOV.UK, Material, Salesforce Lightning): foundations documented before components.

## License

MIT. See [LICENSE](LICENSE).
