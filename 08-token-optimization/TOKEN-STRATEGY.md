# DS7 · 08 — Token & Context Optimization

> **Цель:** Работать с AI-агентами эффективно — читать только нужные файлы,  
> не тратить токены на повторные чтения и полные прогоны тестов.

---

## Принцип: «Граф проекта прежде всего»

Перед чтением файлов — понять **где находится задача** в дереве зависимостей.

```
Задача → Слой → Файлы слоя → Только связанные зависимости
```

**Порядок чтения (от общего к частному):**

```
1. ALL.md           ← правила проекта (всегда первым)
2. docs/ARCHITECTURE.md  ← где лежит нужный слой
3. app/data/<relevant>   ← данные затронутого домена
4. app/domain/<module>   ← бизнес-логика (если меняем)
5. app/composables/<x>   ← только если composable затронут
6. app/components/<X>    ← только если компонент затронут
7. app/pages/<p>         ← только если страница затронута
```

> Никогда не читать всё подряд. Читать только call chain задачи.

---

## Project Graph — быстрая карта зависимостей

```
pages/
  index.vue         → HomeHero, HomeSystem, HomeEquipment, HomeFaq …
  movilidad.vue     → UiPageHero, HomeFleet, HomeBundles, CalcSection …
  [slug].vue        → DirectionPage → ExtraSections

domain/
  calculators/
    residential.ts  → useCalcLink (composable)
    ev.ts           → useCalcLink, defaults.ts

composables/
  usePageSeo.ts     → useHead (nuxt)  — все страницы
  useModal.ts       → SiteModalHost   — global
  useShopUrl.ts     → tienda.vue, UiShopProductCard
  useSections.ts    → [slug].vue, DirectionPage

data/
  sections.ts       → useSections → [slug].vue
  seo.ts            → usePageSeo → all pages
  catalog.ts        → UiProductCard, HomeEquipment
  shop.ts           → useShopList → tienda.vue
```

---

## Скилы и инструменты для экономии контекста

| Скил / Команда | Когда использовать |
|---|---|
| `/compact` | Сессия стала длинной — сжать перед продолжением |
| `context-optimizer` skill | Длинная задача с многими файлами — читать summary |
| `documentation-lazy-load` skill | Нужна специфика API/библиотеки — не читать всё сразу |
| `incremental-coding` skill | Сфокусированное изменение — не делать рефактор вокруг |
| `session-handoff` skill | Смена сессии или модели — сохранить handoff |
| `token-auditor` skill | Анализ расхода токенов из ccusage |
| `targeted-testing` skill | Выбрать минимальный тест для изменения |

---

## Правила для AI-агентов в этом проекте

### Перед началом задачи
```
1. Прочитай ALL.md (правила)
2. Определи слой задачи по ARCHITECTURE.md
3. Прочитай только файлы в call chain
4. НЕ читать весь app/components/ или весь app/data/
```

### Во время итерации
```
5. После каждого изменения → один точечный тест (не suite)
6. Не запускать тесты в фоне
7. Используй --reporter=dot для минимального вывода
```

### Конец задачи / смена модели
```
8. Запустить полный suite один раз
9. Сохранить handoff через session-handoff skill
10. Коммит только документально подтверждённых изменений
```

---

## File-Level Summaries (стандарт DS7)

Каждый нетривиальный файл должен иметь 1-2 строки комментария вверху:

```typescript
// Residential solar savings calculator.
// Input: monthly kWh, panel kW, tariff €/kWh. Output: SavingsResult.
export function calcSavings(params: CalcParams): SavingsResult { … }
```

```vue
<!--
  UiProductCard — universal product card (Atomic: Molecule).
  Modifiers: -top (crown badge), -new (ribbon), -compact (slim layout).
-->
```

Это позволяет AI прочитать **1 строку** вместо всего файла при навигации.

---

## Контекстный бюджет — ориентиры

| Файл | Стратегия чтения |
|---|---|
| `ALL.md` | Читать полностью всегда |
| `docs/ARCHITECTURE.md` | Читать нужный раздел |
| `app/data/*.ts` | Только если задача про данные |
| `app/domain/calculators/*.ts` | Только если правим логику |
| `app/components/ui/UiX.vue` | Читать только изменяемый |
| `i18n/locales/es.ts` | Только если добавляем ключи |
| `ds7/**/*.md` | Lazy — читать только нужный раздел |

---

## Быстрые команды (копипаст для AI-диалога)

```bash
# Граф изменённого файла
grep -r "import.*residential" app/ --include="*.ts" --include="*.vue" -l

# Кто использует composable
grep -r "useModal" app/ --include="*.vue" -l

# Быстрый тест одного модуля (dot = 1 строка вывода)
npx vitest run app/domain/calculators/residential.test.ts --reporter=dot

# Статус только изменённых файлов
git diff --name-only HEAD
```
