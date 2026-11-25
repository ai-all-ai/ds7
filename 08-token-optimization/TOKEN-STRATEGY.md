# 08 · Token and context optimisation

Goal: an agent reads what the task needs and nothing else, and does not repeat work.

---

## 1. Map before reading

Find the layer of the task first, then read only the files on its call chain:

```
task → layer → files of the layer → direct dependencies only
```

Reading order, from general to specific:

1. `ds7/ALL.md` (standard rules), then the project section of the root `ALL.md`, below the AI-ALL packs block (project rules and decisions).
3. `docs/ARCHITECTURE.md` (layer map).
4. `app/data/<relevant>` if the task concerns data.
5. `app/domain/<module>` if the task changes business logic.
6. `app/composables/<name>` if a composable is involved.
7. `app/components/<name>` if a component is changed.
8. `app/pages/<name>` if a page is changed.

Do not read all of `app/components/` or all of `app/data/`.

---

## 2. Project graph (generated)

Nuxt auto-imports components and composables, so the source does not show who uses what, and an agent ends up searching. `npx @ai.all/ds7 graph` writes the answer down:

- `docs/SITE-GRAPH.md` is generated. Never edit it by hand; `ds7 graph --check` fails when it is stale.
- `--uses X`, `--of X` and `--css X` answer "who uses X", "what is X made of" and "where does this class live" in a few lines. The procedure is the project skill `project-graph`. A query costs a few lines; the file reads it replaces cost thousands of tokens. `--budget 1500` prints the most used files first within about that many tokens (the map to hand to a sub-agent with little room); `--stats` shows how large the map is next to the files it covers.
- The placement table in `docs/ARCHITECTURE.md` (between the `placement` markers) is generated from the same rules that `ds7 layout` enforces, so it stays true. Edit the rest of that file by hand, for conventions only.

---

## 3. Working rules

**Before the task**
1. Read `ds7/ALL.md` and the project section of the root `ALL.md`.
2. Find the layer in `docs/ARCHITECTURE.md`.
3. Read only the files on the call chain.

**During the task**
4. After each change, run one targeted test.
5. Do not start background processes unless needed.
6. Use `--reporter=dot` for short test output.

**At the end**
7. Run the full suite once.
8. Record decisions in `docs/DECISIONS.md`, not in the chat.
9. Commit only what is verified.

---

## 4. File summaries

Each non-trivial file starts with one or two lines describing it. An agent can read the first line to decide whether to open the file:

```ts
// Residential savings calculator. Input: monthly kWh, panel kW, tariff €/kWh. Output: SavingsResult.
```

```vue
<!--
  UiProductCard — product card molecule.
  Modifiers: -top (highlight), -new (ribbon), -compact (slim).
-->
```

---

## 5. Budget guide

| File | Reading strategy |
|---|---|
| `ds7/ALL.md` | whole file, always |
| Project section of root `ALL.md` | whole section, always |
| `docs/ARCHITECTURE.md` | the section that matches the layer |
| `app/data/*.ts` | only when the task concerns data |
| `app/domain/*.ts` | only when business logic changes |
| `app/components/ui/*.vue` | only the file being changed |
| `i18n/locales/*.ts` | only when keys are added |
| `ds7/**/*.md` | on demand, one section |

---

## 6. Parallel work

Do not fan out to sub-agents for work where one finding shapes the next, nor for several locales or several pages of the same layout at once. Fan out only for independent reads. Language rules for agents and sub-agents: `ALL.md` section 1.

---

## 7. Useful commands

```bash
npx @ai.all/ds7 graph --uses useModal               # who uses a composable (instead of grep)
npx @ai.all/ds7 graph --budget 1500                  # the most used files, about 1500 tokens
npx vitest run path/to/file.test.ts --reporter=dot   # one test, minimal output
git diff --name-only HEAD                            # what changed
```
