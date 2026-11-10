# DS7 Technical Specification & Standards

## 1. Стек технологий
- **Framework:** Nuxt 4 (Vue 3.5+, Composition API `<script setup lang="ts">`).
- **Styling:** Tailwind CSS v4 + Semantic CSS Custom Properties (Design Tokens in `theme.css`).
- **Rendering:** Full Static Generation (`npx nuxt generate`), Nitro prerendering for all routes, sitemap.xml, robots.txt.
- **i18n:** `@nuxtjs/i18n` (prefix-except-default strategy, single hub in `i18n/locales/`).
- **Typing:** Strict TypeScript (`typescript: { strict: true }`).
- **Testing:** Vitest (unit tests) + Playwright (end-to-end and visual regression).

---

## 2. Иерархия директорий эталонного проекта

```
project-root/
├── app/
│   ├── app.vue                # Корневой шаблон приложения
│   ├── assets/css/
│   │   ├── main.css           # Точка сборки стилей
│   │   ├── theme.css          # Дизайн-токены (цвета, шрифты, отступы, тени)
│   │   ├── base.css           # Глобальный ресет и теги
│   │   └── components.css     # Базовые классы и модификаторы компонентов
│   ├── components/
│   │   ├── ui/                # Атомы и Молекулы (UiButton, UiProductCard, UiPrice...)
│   │   ├── sections/          # Автономные секции и Организмы (UiCardSlider, CalcSection...)
│   │   └── site/              # Каркас сайта (SiteHeader, SiteFooter, SiteModalHost...)
│   ├── composables/           # Переиспользуемая логика (usePageSeo, useModal, useCalc...)
│   ├── data/                  # Бизнес-данные и схемы (каталог, статьи, FAQ, маршруты)
│   ├── domain/                # Чистая бизнес-математика (калькуляторы без привязки к Vue)
│   └── pages/                 # Маршруты Nuxt (только связка данных с секциями)
├── i18n/
│   └── locales/               # Единый хаб локализации ({es,en,uk,de}.ts)
├── public/                    # Статические ассеты (картинки, шрифты, favicon, лого)
├── docs/                      # Документация проекта для человека и команды
└── nuxt.config.ts             # Конфигурация Nuxt 4
```

---

## 3. Матрица соглашений по именованию классов (CSS Naming)

| Роль | Формат имени | Пример |
|---|---|---|
| **Базовый компонент** | Короткий семантический кебаб-кейс | `.p-card`, `.btn`, `.slider`, `.field` |
| **Элемент компонента** | Двойное подчеркивание (BEM-light) | `.p-card__title`, `.p-card__price`, `.btn__icon` |
| **Модификатор** | Отдельный класс с дефисом | `.-top`, `.-new`, `.-dark`, `.-compact`, `.-outline` |
| **Состояние** | Префикс `is-` | `.is-active`, `.is-open`, `.is-loading` |
| **Контекст страницы** | Класс на теге `body` | `body.page-home`, `body.page-hogares`, `body.page-empresas` |

---

## 4. Контрольные показатели качества (Quality Gates)

1. **Lighthouse:** Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.
2. **Core Web Vitals:** FCP ≤ 0.4s, LCP ≤ 1.2s, CLS = 0.000, TBT ≤ 50ms, INP ≤ 50ms.
3. **A11y (Доступность):** 0 ошибок axe-core, строгий контраст текста (WCAG AA), уникальные `useId()` для SVG/фильтров.
4. **Bundle Size:** Нулевой избыточный JS/CSS на первом экране, 100% покрытие шрифтов прелоадом.
