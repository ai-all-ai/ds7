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

## 2. Project graph

Keep a short graph in `docs/ARCHITECTURE.md`, one line per dependency, so the agent can find callers without searching:

```
pages/index.vue       → Hero, Systems, Equipment, Faq
composables/usePageSeo → useHead, all pages
data/catalog.ts       → ProductCard, Equipment
```

Update it when a dependency changes.

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

## 6. Useful commands

```bash
grep -rl "useModal" app/ --include="*.vue"          # who uses a composable
npx vitest run path/to/file.test.ts --reporter=dot   # one test, minimal output
git diff --name-only HEAD                            # what changed
```
