---
name: project-rules
description: The working rules of this project for every change: read the rules first, build on /ui before pages, fix components not pages, one language in code, small proven commits. Use at the start and at the end of any change.
---

# Project rules

The project's own documents and the vendored `ds7/` standard win over this skill. When they say something different, follow them and tell the owner this skill needs an update. These are the rules that hold when they are silent.

## Start

1. Read `ALL.md`, then only the document it routes to for the task. `npx ds7 doctor` says where the project stands and what to do next. Never edit files under `ds7/` except `ds7/local/`: `ds7 update` replaces them (a small deliberate edit becomes a patch with `ds7 patch <file>`; what the project does differently is described in `ds7/local/CUSTOM-LAYER.md`, which survives every update).
2. Find the code before opening files: `npx ds7 graph --uses <Name>`, `--of <route>`, `--css <class>`. Read the call chain only.
3. When a rule is missing, ask the owner. Do not invent facts, prices, dates, routes or contact data.

## Build

- **/ui first.** A new element or block appears on the brandbook page with every variant before a page uses it.
- **Fix the component, not the page.** No page overrides of component styles. Blocks are named by pattern, never by page; content comes through props and slots.
- **Names.** A short base class, parts nested under it without `__`, variants as dash modifiers (`.card.-dark`), states from native attributes, ARIA or `data-state`. Search templates, styles and scripts before a rename.
- **Reuse first.** Before new CSS: an existing component or modifier, inheritance, a token or component variable, a parent setting, a grouped selector, a helper (`ds7/02-design-system/CSS-CONVENTIONS.md`).
- **CSS.** Colours from tokens only, no `!important` (order, `@layer` or a modifier instead), no rules for classes no template uses (`npx ds7 css`).
- **Looks.** Do not change the look of a live site unless asked. A refactor keeps the appearance and proves it (`npx ds7 css diff`, screenshots at 390, 820 and 1440 px).
- **Safe changes.** Anything that can move the layout or change behaviour is opt-in, proven on `/ui` and the main pages, and recorded in `docs/DECISIONS.md`. A failing build or check stops the work; never add a fallback that hides it.
- **Photos.** Readable file names, each photo used once (`npx ds7 images dupes`), no generator metadata (`npx ds7 images strip`).

## Languages

- Code, identifiers, comments, docs and commit messages are in English.
- Talk to the owner in the owner's language and keep it in every reply.
- A site with several languages is finished in one source language first; other locales follow one file at a time.

## Finish

- Run the checks: `npx ds7 check --strict`, the build, `npx ds7 audit`. Say which checks were not run.
- Record the change in `CHANGELOG.md` and the owner's decisions in `docs/`, not only in chat.
- Commit only when the owner asks: one concern per commit, Conventional Commits (`fix(seo): ...`), the configured author, no tool trailers.
