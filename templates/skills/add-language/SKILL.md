---
name: add-language
description: Add a site language, or decide whether to. Finish and approve one source language first, write out every text in it, then add one locale file at a time. Use when the owner asks for a translation, a second language or hreflang.
---

# Add a site language

Purpose: keep i18n cheap; the reason for one language first is in `ds7/05-internationalization/I18N-ARCHITECTURE.md`, section 2b.

Trigger: the owner asks for another language, a translation, a language switch or `hreflang`; or someone starts a second locale while the source text still changes.

Prerequisites (stop and tell the owner if one is missing): the source locale is approved by the owner and no text change is pending; `npx ds7 check --strict` is green on a clean tree.

## Steps

1. Freeze the source and say so. While the new locale is written, text changes go to the source first and are carried over in one pass afterwards.
2. Check the access layer: components read texts through one reader (a composable returning the messages of the active locale) and the locale is part of the URL (default language without prefix). If not, that is a task of its own, decided with the owner and recorded in the backlog.
3. Write the locale in one pass: copy the source file, keep every key, translate values section by section. Do not reread finished sections; do not translate keys, ids, class names or image paths.
4. Register the locale in the locale list (one entry) and the language switcher.
5. Search: `lang` on `<html>`, a canonical URL per language, `hreflang` alternates that point at each other and at `x-default`, `og:locale`, alternates in the sitemap, titles and descriptions per language.
6. Verify: `npx ds7 check --strict` (key parity), the build, `npx ds7 audit`, and each page in the new language at 390 and 1400 px (longer words break layouts first).

## Fallback

If the owner wants the second language before the source is final, say once that it costs a second pass over every later text change, build the access layer first, and translate only after the source text is approved.

## Verification

Every locale has the same keys; every page has `hreflang` pairs that reciprocate; no text is hard-coded outside the locale files.
