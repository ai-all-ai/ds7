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

## 2. Adding a language & Translation Workflow

1. **Base Locale:** `i18n/locales/es.ts` is the single source of truth for key structure.
2. **Translation:** When translating to a new language (`en.ts`, `uk.ts`), copy `es.ts` and translate the values while keeping all key paths identical.
3. **Parity Enforcement:** The parity check ensures every key in the base locale exists in target locales without missing placeholders or trailing commas.
4. **Registration:** Register the language in `nuxt.config.ts`:

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

## 2b. Order of work: one language first

Build the site in one source language and write every string in its locale file. Settle that text. Then add one language at a time with the steps of section 2.

Translating while the source text changes means translating twice, and several languages written in parallel multiply the tokens spent and the review work for the same result. The project skill `add-language` (template in `templates/skills/`) carries the procedure for agents, including the access layer and the search markup (`hreflang`).

---

## 3. Keys

- Grouped by component or section: `businessScreens.night.title`.
- Named by meaning, never by appearance (`hero.title`, not `big.red.title`).
- The same key set in every locale. Automated parity verification: run `npx @ai.all/ds7 check` (or `make check`) to cross-validate all locale files and ensure zero missing keys or empty strings. Missing translations fail in `--strict` mode.

---

## 4. UI strings versus business data

- `i18n/locales/*.ts`: interface text only. Button labels, form labels, navigation, error messages.
- `app/data/*.ts`: business data. Products, specifications, service areas, articles. Typed. Text fields that differ by language use an object keyed by locale, validated by the schema, so a missing translation breaks the build.
