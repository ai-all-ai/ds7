---
name: seo-page
description: Add or change a public page so it is indexable, accessible and fast: registry entry, texts, structured data, checks. Use for a new page, a title or description change, a new service or guide page, or an SEO, WCAG or PageSpeed task.
---

# SEO page

Purpose: every public page enters search the same way and one set of commands proves it. Requirements and reasons: `ds7/04-seo-ai-optimization/SEO-CHECKLIST.md`; this skill is the order of work.

Trigger: a new public page; a change to a page's title, description, headings, images or structured data; a task about organic search, WCAG or PageSpeed.

Prerequisites: the blocks the page needs exist on `/ui`; real facts (address, phone, prices, hours) come only from the owner, placeholder data stays out of structured data.

## Steps

1. One search intent per page. Pick its primary query; do not add a second page for the same intent.
2. Add the page to the project's single list of pages (the registry that feeds meta, canonical, sitemap and robots).
3. Texts: title (20 to 60 characters, unique, query first), description (70 to 160, unique, one concrete reason to click), breadcrumb label, all in the locale files.
4. Page: one `<h1>` carrying the query in natural words; headings in order; every image through the image component with a real `alt` (empty only for decoration); at least two links to the page from other pages.
5. Structured data: one `@graph` per page, nodes linked by `@id`; the rules are in section 3 of the checklist.
6. Images: the first photo above the fold is the LCP image; loading rules are in `ds7/03-performance-web-vitals/ASSETS-PIPELINE.md`, section 3.
7. Check on the build: `npx ds7 audit` (html, seo, a11y, perf) and `npx ds7 check --strict`; fix the page, not the exception list. An accessibility exception needs a reason and the owner's decision.
8. After launch (owner): Search Console and Bing Webmaster Tools, submit the sitemap, inspect the new URL, watch Core Web Vitals; record dated numbers in `docs/METRICS.md`.

## Fallback

If a command cannot run (no build, no browser), say which check was not run and why; never report a page as done by reading its code.

## Verification

`npx ds7 audit` reports 0 problems for the page; the page is in the sitemap exactly when it is indexable.
