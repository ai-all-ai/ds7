# 07 · Testing strategy

Run the smallest test that proves the change. Run the full suite once before a commit that finishes a task.

---

## 1. Layers, fastest first

```
1. Unit (domain logic)         ~10 ms per test    run when logic changes
2. Composable (Vue reactivity) ~50 ms per test    run when a composable changes
3. Component (Vue Test Utils)  ~200 ms per test   run when a component changes
4. End-to-end (Playwright)     ~5 s per flow      key paths, before release
```

Accessibility checks (axe) run on every page at 390, 820 and 1440 px as part of the quality gates.

---

## 2. Tools

| Tool | Use |
|---|---|
| Vitest | unit, composable and component tests |
| `@vue/test-utils` | mounting components without a browser |
| Playwright | flows (calculator, contact, 404), visual regression of `/ui` (section 8) |
| axe-core | accessibility rules, through Playwright |

---

## 3. Commands

```bash
npx vitest run path/to/file.test.ts          # one file
npx vitest run path/to/folder/               # one folder
npx vitest run -t "savings"                  # by test name
npx vitest run --reporter=dot                # short output
npx vitest run                               # full suite, before a finishing commit
```

---

## 4. Naming

```ts
// good: what is tested and what is expected
it('calculates savings with 30% self-consumption', () => { … })

// poor: says nothing about what breaks
it('works', () => { … })
```

---

## 5. Test file shape

```ts
import { describe, it, expect } from 'vitest'
import { calcSavings } from './residential'

describe('calcSavings', () => {
  it('returns zero savings for zero consumption', () => {
    expect(calcSavings({ kwhMonth: 0, panelKw: 5, tariff: 0.18 })).toBe(0)
  })

  it('caps savings at the full bill', () => {
    const r = calcSavings({ kwhMonth: 100, panelKw: 20, tariff: 0.18 })
    expect(r.savingsPct).toBeLessThanOrEqual(100)
  })
})
```

Each test file runs alone, without a global setup that the test depends on.

---

## 6. Coverage expectations

| Layer | Expectation |
|---|---|
| `domain/` | high; every branch of business rules |
| `composables/` | main paths and error paths |
| `components/ui/` | critical interactions only |
| `pages/` | smoke test: renders, has one `h1`, no console errors |

Do not unit-test static data, copy or CSS. Copy is checked by the locale parity gate; CSS by the visual regression in section 8.

---

## 7. Token-efficient testing for agents

1. Before editing, know which test covers the file.
2. After editing, run that test with `--reporter=dot`.
3. Widen the scope only if shared logic changed.
4. Run the full suite once at the end of the task.

---

## 8. Visual regression

- **Scope:** every brandbook entry on `/ui` at 390, 820 and 1440 px, plus the full `/ui` page. Each entry carries `data-pattern="<ID>"`, so a test can take a screenshot of one pattern. The template is `templates/visual.spec.ts`.
- **Tool:** Playwright `toHaveScreenshot`. Reference images are committed to the repository. Rendering differs between operating systems, so create and check the references on the CI system (Linux).
- **Tolerance:** `maxDiffPixelRatio: 0.002` by default. A larger value needs a comment in the test that says why.
- **Stability:** disable animations (`animations: 'disabled'`), wait for `document.fonts.ready`, and fix any date, random value or auto-playing carousel that appears on `/ui`.
- **Changes:** a change to a token or a pattern updates the references in the same commit, and the CHANGELOG says which patterns changed. Look at the diff images before accepting them. Never update a reference to hide a change you cannot explain.

## 9. Agent checks

A fixed set of tasks shows whether an agent follows these rules. Each task has a pass condition that a command or a reviewer can decide. Run each task in a new session that starts from `ALL.md` only.

| # | Task given to the agent | Pass when |
|---|---|---|
| 1 | Add an atom with one modifier | The pattern has an ID and a `/ui` entry. The component uses tokens only (no raw hex or `rgb()`). A visual reference exists. |
| 2 | Add one text string to a section | The key exists in every locale. `i18n-check --strict` passes. The component has no hard-coded text. |
| 3 | Add one image | The image goes through `UiImg` with `width` and `height`. The file is in `public/`. The asset check passes. |
| 4 | Add a page that shows a product grid | The page file has no inline card or grid. It uses section components. It has one `h1`. The 404 page is unchanged. |
| 5 | Change one colour token | The brandbook references change in the same commit. The contrast gate still passes at 4.5:1 for body text. |
| 6 | Add a third-party script for a feature | The agent does not add it before consent exists, and it asks the owner first. |

Record each run in `docs/METRICS.md`: date, agent and version, the tasks passed or failed, and the reason for each failure. A result describes one agent at one version. It is not a guarantee for other agents or later versions.
