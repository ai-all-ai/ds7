# DS7 · 07 — Targeted Testing Strategy

> **Принцип:** Запускай минимально достаточный тест — не весь suite.  
> Полный прогон — только перед PR/деплоем. Ежедневная разработка — точечные проверки.

---

## Иерархия тестов (от быстрого к медленному)

```
1. Unit (domain logic)      ~10ms/test    → запускать всегда при изменении логики
2. Composable (Vue reactive) ~50ms/test   → при изменении composable
3. Component (Vue TU)        ~200ms/test  → при изменении компонента
4. E2E / Playwright          ~5s/flow     → только критичные пути, перед релизом
```

---

## Инструменты

| Инструмент | Назначение |
|---|---|
| **Vitest** | Unit + composable + component тесты |
| **@vue/test-utils** | Маунт Vue-компонентов без браузера |
| **Playwright** | E2E (checkout, calculator flow, 404) |

---

## Команды — точечные запуски

```bash
# Один файл
npx vitest run app/domain/calculators/residential.test.ts

# Одна папка
npx vitest run app/domain/calculators/

# По имени теста
npx vitest run -t "savings calculator"

# Минимальный вывод (экономит токены в AI-диалоге)
npx vitest run --reporter=dot

# Полный suite — только перед коммитом
npx vitest run

# Watch (только при локальной разработке)
npx vitest --reporter=dot
```

---

## Правила именования тестов

```typescript
// ✅ Описательное: что тестируем + ожидаемый результат
it('calculates savings with 30% self-consumption correctly', () => { ... })

// ❌ Слабое: непонятно что ломается
it('works', () => { ... })
```

---

## Структура тест-файла

```typescript
// app/domain/calculators/residential.test.ts

import { describe, it, expect } from 'vitest'
import { calcSavings } from './residential'

// Self-contained: тест запускается изолированно без глобального setup
describe('calcSavings', () => {
  it('returns zero savings for zero consumption', () => {
    expect(calcSavings({ kwhMonth: 0, panelKw: 5, tariff: 0.18 })).toBe(0)
  })

  it('caps savings at 100% of bill', () => {
    const r = calcSavings({ kwhMonth: 100, panelKw: 20, tariff: 0.18 })
    expect(r.savingsPct).toBeLessThanOrEqual(100)
  })
})
```

---

## Правила тестового покрытия

| Слой | Покрытие | Инструмент |
|---|---|---|
| `domain/calculators/` | **≥ 90%** | Vitest unit |
| `composables/` | **≥ 70%** | Vitest + @vue/test-utils |
| `components/ui/` | **критичные пути** | @vue/test-utils |
| `pages/` | **smoke только** | Playwright |

> **Не тестировать:** статичные данные (`app/data/`), CSS, переводы (i18n) — их не нужно юнит-тестировать.

---

## Стратегия для AI-агентов (экономия токенов)

1. **Перед правкой** — запусти только тест изменяемого файла
2. **После правки** — снова только этот тест (`--reporter=dot`)
3. **Расширяй scope** только если изменение затронуло shared logic
4. **Полный suite** — один раз в конце задачи, не в каждой итерации

```bash
# Шаблон для AI-итерации (минимум токенов):
npx vitest run path/to/changed.test.ts --reporter=dot
```

---

## Vitest Config (рекомендуемый минимум)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'ds7', 'dist'],
    reporter: process.env.CI ? 'verbose' : 'dot',  // dot = меньше вывода
    coverage: {
      include: ['app/domain/**', 'app/composables/**'],
      reporter: ['text-summary'],  // краткий отчёт, не таблицы
    },
  },
})
```
