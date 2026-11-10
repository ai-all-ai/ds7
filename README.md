# DS7 · AI-Ready Web Architecture Standard

[![npm](https://img.shields.io/npm/v/@ai.all/ds7)](https://www.npmjs.com/package/@ai.all/ds7)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![repo](https://img.shields.io/badge/github-ai--all--ai%2Fds7-blue)](https://github.com/ai-all-ai/ds7)

> **One command. Full architecture standard. All AI agents in sync.**

```bash
npx @ai-all-ai/ds7
```

Это единственная команда, которая нужна для старта нового проекта:  
копирует стандарт DS7, создаёт `ALL.md` и синхронизирует все AI-агенты через `@ai.all/aiall`.

---

> *Универсальная портативная методология для создания сверхбыстрых, масштабируемых веб-приложений на Vue 3 / Nuxt 4 с полной поддержкой AI-агентов, Atomic Design и Core Web Vitals 100/100.*

Код и структура выстроены так, чтобы любой разработчик или ИИ-агент, заглянув внутрь, увидел безупречный порядок и захотел взять эту методологию за основу в своих проектах.

---

## 🎯 Главные принципы системы

1. **Atomic Design & Полная автономность компонентов:**
   Каждый UI-блок — самостоятельный кирпичик. Он ничего не знает о конкретной странице и одинаково идеально работает на главной, в узком сайдбаре, модалке или будучи вложенным «внутрь чего-то ещё и ещё глубже».
2. **Единая точка входа для всех ИИ-агентов через `@ai.all/aiall`:**
   Централизованный файл `ALL.md` объединяет правила для Claude, Gemini, Cursor, Windsurf, Copilot и Codex. Синхронизация и валидация всех entrypoint-файлов автоматизирована через официальный npm-пакет [`@ai.all/aiall`](https://www.npmjs.com/package/@ai.all/aiall) (`npx @ai.all/aiall`).
3. **Короткие семантические модификаторы:**
   Никаких дублирующих компонентов под разные страницы. Все варианты оформляются отдельными короткими классами-модификаторами (`-top`, `-new`, `-compact`, `-dark`), а контекст страниц задается от предка (`body.page-*`).
4. **Единое место переводов (i18n Single Hub):**
   Все локали собраны в единой структуре. Добавление нового языка (`de`, `fr`, `it`, `pl`) занимает 2 минуты через добавление двухбуквенного кода и файла переводов.
5. **Бескомпромиссная скорость (Lighthouse 100/100):**
   Critical CSS inlining, предварительная загрузка LCP-графики, нулевой сдвиг макета (CLS = 0.000) через локальные fallback-шрифты (Fontaine) и жесткие aspect-ratio.
6. **Умный конвейер графики (Smart Assets Pipeline):**
   Исходные картинки не вставляются с запасом. Избыточные прозрачные поля обрезаются по контуру (tight-trim), формируются оптимизированные WebP/AVIF форматы для мобильных (1x) и ретина-экранов (2x).
7. **Оптимизация под ИИ-поисковики (AEO / GEO):**
   Прямые ответы на вопросы (Direct Answer Blocks), плотные таблицы данных, микроразметка Schema.org Graph — готовая база знаний для SearchGPT, Perplexity и Google Gemini Overviews.
8. **Брендбук и библиотека материалов как язык общения:**
   Страница `/ui` — интерактивная песочница (Storybook) со стабильными идентификаторами компонентов (`CARD-01`, `CTL-01`, `PRICE-01`). В диалогах и задачах используются короткие метки без длинных описаний.

---

## 📁 Структура каталога `ds7/`

```
ds7/
├── README.md                  # Главный манифест и руководство (вы здесь)
├── SPEC.md                    # Полная техническая спецификация
├── ALL.md                     # Универсальная инструкция для AI-агентов (Single Source of Truth)
│
├── 01-architecture/           # Архитектура и компонентная модель
│   ├── ATOMIC-DESIGN.md       # Иерархия: Атомы → Молекулы → Организмы → Шаблоны → Страницы
│   ├── MODIFIER-SYSTEM.md     # Синтаксис коротких классов (-top, -dark) и управление от предка
│   └── COMPONENT-ANATOMY.md   # Эталонная структура Vue 3 SFC (props, slots, container queries)
│
├── 02-design-system/          # Дизайн-система и токены
│   ├── TOKENS-SPEC.md         # Цвета, отступы, тени, типографика (CSS Variables)
│   ├── BRANDBOOK-SANDBOX.md   # Интерактивная песочница /ui и стабильные ID (CARD-01, CTL-01)
│   └── NAMING-CONVENTIONS.md  # Ультра-короткие, понятные имена классов и минификация
│
├── 03-performance-web-vitals/ # Скорость загрузки и Core Web Vitals
│   ├── CRITICAL-CSS.md        # Настройка Critical CSS inlining (FCP < 0.4s)
│   ├── FONTS-ZERO-CLS.md      # Fontaine, preload шрифтов и нулевой сдвиг (CLS = 0)
│   ├── ASSETS-PIPELINE.md     # Оптимизация картинок, обрезка полей, srcset, WebP/AVIF
│   └── HYDRATION-STRATEGY.md  # Ленивая гидратация некритичных виджетов (requestIdleCallback)
│
├── 04-seo-ai-optimization/    # Продвижение без покупки ссылок и подготовка под ИИ
│   ├── AEO-GEO-AI-SEARCH.md   # Answer Engine Optimization (SearchGPT, Perplexity, Gemini)
│   ├── STRUCTURED-DATA.md     # Schema.org JSON-LD (Product, LocalBusiness, FAQPage)
│   └── GOOGLE-LOCAL-EEAT.md   # Google Local Pack (Карты), E-E-A-T и поведенческие факторы
│
├── 05-internationalization/   # Умная локализация
│   ├── I18N-ARCHITECTURE.md   # Архитектура единого хранилища и быстрое добавление языков
│   └── LOCALE-TEMPLATE.json   # Эталонный шаблон структуры словаря
│
├── 06-business-conversion/   # Коммерческие механики и лидогенерация
│   ├── EV-SOLAR-ECOSYSTEM.md  # V2C Trydan, V2H (машина как батарея), Plan MOVES III (скидки 70-80%)
│   ├── B2C-B2B-MODELS.md      # Виртуальная батарея (счет 0€), PPA (0€ инвестиций), навесы
│   └── CONTEXTUAL-LEADS.md    # Умный WhatsApp Deep-Link, PDF-сметы, оффлайн-очередь заявок
│
├── 07-testing/                # Стратегия тестирования
│   └── TESTING-STRATEGY.md    # Точечные тесты, Vitest, Playwright, экономия токенов
│
├── 08-token-optimization/     # Оптимизация использования AI-контекста
│   └── TOKEN-STRATEGY.md      # Граф проекта, lazy-loading, session handoff
│
└── templates/                 # Готовые эталонные файлы для копирования в проект
    ├── component.vue          # Эталонный Vue 3 SFC компонент со всеми стандартами
    ├── theme.css              # Базовый файл токенов (CSS Custom Properties)
    └── nuxt.config.ts         # Эталонный конфигурационный файл Nuxt 4
```

---

## 🚀 Быстрый старт

### Вариант А — npm (рекомендуется)

```bash
# В корне нового проекта:
npx @ai-all-ai/ds7
```

Команда сделает всё:
- скопирует папку `ds7/` со всем стандартом
- создаст `ALL.md` (если его нет)
- запустит `npx @ai.all/aiall` для синхронизации всех AI-агентов

### Вариант Б — вручную

1. Скопируйте папку `ds7/` в корень нового проекта
2. Скопируйте файлы из `ds7/templates/` → `components/`, `assets/css/`, `nuxt.config.ts`
3. Запустите `npx @ai.all/aiall` для синхронизации AI-агентов
4. Откройте `/ui` в браузере — интерактивная дизайн-система

### Дополнительные команды

```bash
npx @ai-all-ai/ds7 sync    # синхронизировать только агентов
npx @ai-all-ai/ds7 update  # обновить ds7/ до последней версии пакета
npx @ai-all-ai/ds7 --version
```
