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
| Playwright | flows (calculator, contact, 404) and screenshots for review |
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

Do not unit-test static data, copy or CSS. Copy is checked by the locale parity gate; CSS by the visual review in the sandbox.

---

## 7. Token-efficient testing for agents

1. Before editing, know which test covers the file.
2. After editing, run that test with `--reporter=dot`.
3. Widen the scope only if shared logic changed.
4. Run the full suite once at the end of the task.
