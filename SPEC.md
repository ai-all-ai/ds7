# DS7 Technical Specification

> **How it fits with AI-ALL.** [AI-ALL](https://github.com/ai-all-ai/aiall) (`@ai.all/aiall`) creates the agent entrypoints and the routing file, and keeps them in sync. This document is delivered to agents as the `ds7` pack of AI-ALL. AI-ALL works without DS7; for web projects, install both.


Version 1.1.0. This document is the technical baseline. Rules for agents are in `ALL.md`; this file describes the stack, the layout and the quality gates.

---

## 1. Stack

- **Framework:** Nuxt 4, Vue 3.5+, Composition API with `<script setup lang="ts">`.
- **Styling:** Tailwind CSS v4 and CSS custom properties defined in `theme.css`.
- **Rendering:** static generation (`nuxt generate`), prerendered routes, `sitemap.xml`, `robots.txt`.
- **i18n:** `@nuxtjs/i18n`, prefix-except-default strategy, one locale hub in `i18n/locales/`.
- **Types:** strict TypeScript.
- **Tests:** Vitest for unit and composable tests; Playwright for flows and browser checks; axe for accessibility.
- **Quality tooling:** a single `qa` script runs the gates listed in section 5.

---

## 2. Directory layout

```
project-root/
├── app/
│   ├── app.vue
│   ├── assets/css/
│   │   ├── main.css           # entry point for styles
│   │   ├── theme.css          # foundations: tokens
│   │   ├── base.css           # reset and element defaults
│   │   └── components.css     # base classes and modifiers
│   ├── components/
│   │   ├── ui/                # atoms and molecules
│   │   ├── sections/          # sections and organisms
│   │   └── site/              # site shell: header, footer, modal host
│   ├── composables/           # reusable logic
│   ├── data/                  # business data and schemas
│   ├── domain/                # pure business maths, no Vue imports
│   └── pages/                 # routes: data in, sections out
├── i18n/
│   └── locales/               # one file per language, same keys
├── public/                    # static assets: images, fonts, favicon
├── docs/                      # project documentation
│   ├── ARCHITECTURE.md        # layer map and browser storage keys
│   ├── DECISIONS.md           # dated decisions and reasons
│   └── METRICS.md             # dated measurements, with machine and build
└── nuxt.config.ts
```

---

## 3. Class naming

| Role | Format | Example |
|---|---|---|
| Base component | short kebab-case | `.p-card`, `.btn`, `.field` |
| Element | double underscore | `.p-card__title` |
| Modifier | separate class with a leading dash | `.-top`, `.-compact`, `.-lg` |
| State | `is-` prefix | `.is-open`, `.is-active` |
| Page context | class on `<body>` | `body.page-home` |

---

## 4. Targets

These are design targets for a finished page on a mid-range phone over a 4G connection. They are not measured results. Measure them on the target device and record the results in `docs/METRICS.md`.

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse Best Practices | ≥ 95 |
| Lighthouse SEO | 100 |
| First Contentful Paint | ≤ 1.0 s |
| Largest Contentful Paint | ≤ 2.5 s |
| Cumulative Layout Shift | ≤ 0.01 (CLS 0 is the aim) |
| Total Blocking Time | ≤ 200 ms |
| Interaction to Next Paint | ≤ 200 ms |

Lab tools in CI or in a sandbox do not produce reliable LCP or INP values. Use them for regressions only, not as proof.

---

## 5. Quality gates

A change is done when these pass:

1. Unit and composable tests.
2. Type check.
3. Locale parity: every key exists in every locale.
4. Asset references: every `/images/…` and `/fonts/…` path exists in `public/`.
5. HTML check: valid markup on every generated page.
6. Console check: no errors or warnings on load.
7. Accessibility: axe reports 0 violations at 390, 820 and 1440 px.
8. Build: `nuxt generate` completes.

---

## 6. Versioning and release

See `ALL.md` section 11 and `README.md`. Summary: semantic versions, one changelog entry per user-visible change, tag `vX.Y.Z` on release, publish by the maintainer.
