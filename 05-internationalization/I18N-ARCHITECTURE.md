# 05 · Internationalisation: one hub

All interface text lives in one place. Adding a language is one file and one configuration entry.

---

## 1. Principle

Do not keep text in several places: partly in `i18n/`, partly in inline `{ es, en }` objects inside components, partly typed into templates.

Structure:

```
i18n/
└── locales/
    ├── es.ts      # base language
    ├── en.ts
    ├── uk.ts
    └── [code].ts  # any new language
```

---

## 2. Adding a language

1. Copy the base locale file to `[code].ts` and translate every value. Keys stay the same.
2. Register the language:

```ts
// nuxt.config.ts
i18n: {
  strategy: 'prefix_except_default',
  defaultLocale: 'es',
  locales: [
    { code: 'es', language: 'es-ES', name: 'Español', file: 'es.ts' },
    { code: 'en', language: 'en-GB', name: 'English', file: 'en.ts' },
    { code: 'uk', language: 'uk-UA', name: 'Українська', file: 'uk.ts' },
    { code: '[code]', language: '[bcp47]', name: '[name]', file: '[code].ts' },
  ],
  langDir: '../i18n/locales',
}
```

Routes, language switcher, `hreflang` and sitemap entries for the new language are generated from this list.

---

## 3. Keys

- Grouped by component or section: `businessScreens.night.title`.
- Named by meaning, never by appearance (`hero.title`, not `big.red.title`).
- The same key set in every locale. The parity check fails the build when a key is missing.

---

## 4. UI strings versus business data

- `i18n/locales/*.ts`: interface text only. Button labels, form labels, navigation, error messages.
- `app/data/*.ts`: business data. Products, specifications, service areas, articles. Typed. Text fields that differ by language use an object keyed by locale, validated by the schema, so a missing translation breaks the build.
