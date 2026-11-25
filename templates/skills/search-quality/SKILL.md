---
name: search-quality
description: Improve organic search, accessibility (WCAG 2.2 AA) and page speed of the generated site, proven on the build. Use for SEO, accessibility or Core Web Vitals work.
---

# Search quality

The requirements live in `ds7/04-seo-ai-optimization/SEO-CHECKLIST.md` and `ds7/03-performance-web-vitals/`; this skill is the order of work. For one new page, use the `seo-page` skill.

## 1. One registry

One list of pages (path, indexable or not) feeds the meta, canonical, `sitemap.xml`, `robots.txt` and the checks. A hand-kept sitemap drifts.

## 2. Prove it on the build

Build the static site, then run `npx ds7 audit` (html, seo, a11y, perf) and `npx ds7 console`. Fix the page or the component, not the exception list. An accepted accessibility exception has a reason, the owner's decision and the comment above its CSS rule (`a11y.exceptions` in `ds7.config.json`).

Say what a script cannot prove: focus order, zoom and reflow, contrast over photos, screen-reader order. `npx ds7 lab --axe` covers part of it in a browser.

## 3. Measure

Lab numbers (`npx ds7 lab`) find regressions and the LCP element. Field numbers come from `npx ds7 psi` and Search Console. Limits at the 75th percentile: LCP 2.5 s, INP 200 ms, CLS 0.1. Record dated numbers in `docs/METRICS.md`.

## 4. Local search (owner)

Business profile with real name, phone, hours and areas served; the same details everywhere; real reviews only; Search Console and Bing Webmaster Tools verified on launch day with the sitemap submitted. Never invent facts or reviews.
