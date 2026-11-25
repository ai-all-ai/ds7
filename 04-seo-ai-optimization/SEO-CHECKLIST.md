# 04 · SEO, accessibility and speed: the working checklist

How a DS7 site earns organic search traffic without paid ads: what each page must have, which command proves it, and the local plan that needs the owner's facts. Structured data samples are in `STRUCTURED-DATA.md`, answer blocks for AI search in `AEO-GEO-AI-SEARCH.md`, local search in `GOOGLE-LOCAL-EEAT.md`. This file is the order of work and the gate.

---

## 1. One registry of pages

Keep one typed list of the public pages (for example `app/data/seo-pages.ts`): path, whether it is indexable, the key of its title and description in the locale file. Everything else reads that list:

- `sitemap.xml` and `robots.txt` are generated from it (server routes, prerendered). A page is in the sitemap exactly when it is indexable. Sandbox pages (`/ui`, `/ds`) are `noindex` and blocked in `robots.txt`.
- One composable (for example `usePageSeo`) turns a registry entry into the title, description, canonical, Open Graph, Twitter tags and the JSON-LD graph. A page never writes its own meta tags.
- A new page is not finished until it has a registry entry. A page left out of the registry is a page that search engines will not find.
- A page served without JavaScript (`03-performance-web-vitals/DELIVERY-AND-CACHING.md`, section 5.1) is marked in its registry entry, so nobody adds an interactive block to it by accident.

---

## 2. What every indexable page has

`ds7 audit seo` checks this over the generated site (`nuxt generate` first):

- Title of 20 to 60 characters and description of 70 to 160, both unique on the site.
- The primary query of the page in the title and in the description or a heading. Keep the primary queries in `ds7.config.json` (`seo.targets`) and treat them as hypotheses until Search Console shows real queries.
- One canonical equal to the page URL (with a trailing slash only when `seo.trailingSlash` is true); Open Graph and Twitter tags with an absolute image that exists. The audit expects a PNG, JPEG or WebP at least 1200 px wide, landscape between 1.6:1 and 2.1:1 (1200 x 630 is the safe size; 16:9 passes) and at most 300 KB, because some chat apps drop larger previews (`seo.socialImage` changes the limits). SVG is not accepted by social networks.
- Exactly one `<h1>`, headings in order, enough real text, at least two links from other pages, every image with `alt` (empty only for decoration).
- One JSON-LD `@graph` with nodes linked by `@id` (see `STRUCTURED-DATA.md`).
- No placeholder text (`example.com`, `lorem ipsum`, dummy phone numbers) in a page that is indexable.
- Site files: `sitemap.xml` lists exactly the indexable pages; a `<lastmod>` is a real past date (set it only to the day the page really changed, or leave it out); `robots.txt` points at the sitemap. `llms.txt` is optional: when present it starts with a `# Title` and its links resolve; `seo.llms: true` makes it required.

One primary query per page. Related phrases go into its headings and text, not into more pages. Add a page only for a query that deserves its own answer (a service, a city served, a guide).

---

## 3. Structured data rules

- Publish only what is visible on the page and true today: price, availability, hours.
- Name, address and phone match the business profile exactly (`GOOGLE-LOCAL-EEAT.md`). A service-area business lists the cities it serves, not a street address, until the owner decides to publish one.
- No rating or review markup that is not a real, visible review.
- FAQ markup: `STRUCTURED-DATA.md`, section 3.

---

## 4. Accessibility (WCAG 2.2 A and AA)

`ds7 audit a11y` proves the parts a script can: page language and title, landmarks, names of links, buttons, form fields, dialogs and frames, `alt` and SVG names, ARIA references, `autocomplete` on personal fields, a visible focus style, no zoom lock in the viewport, text contrast computed from the tokens (4.5 to 1; 3 to 1 for large text), a reduced-motion rule. Each finding names its success criterion. A conscious exception goes to the `a11y.exceptions` list of `ds7.config.json` with a reason and the owner's decision.

By hand in a browser, at 390 and 1440 px, before a release (a static script cannot see these):

- Keyboard only: every control reachable, order follows the visual order, a visible focus ring, no trap, no focus hidden under a sticky header (2.4.11).
- Targets at least 24 x 24 CSS px or spaced (2.5.8); a drag always has a click alternative (2.5.7).
- 200 percent zoom and 320 px width without horizontal scroll or lost content (1.4.4, 1.4.10); text spacing overrides do not clip (1.4.12).
- Contrast of text over photos and gradients; motion stops under `prefers-reduced-motion`.
- A screen reader reads a page, a form with an error and a modal in a sensible order; help and contact links sit in the same place on every page (3.2.6); a form never asks twice for what it already has (3.3.7).

`ds7 lab --axe` runs axe-core in a real browser at three widths for what needs a rendered page.

---

## 5. Speed and Core Web Vitals

Good limits at the 75th percentile of real visits: LCP 2.5 s, INP 200 ms, CLS 0.1. DS7 aims higher (`SPEC.md` section 4).

- `ds7 audit perf` (static, from the build): gzip budgets per page (CSS 50 KB, JavaScript 170 KB, HTML 30 KB), at most 30 scripts and 4 blocking stylesheets; the LCP image and the other images follow the loading table in `03-performance-web-vitals/ASSETS-PIPELINE.md`, section 3 (the audit also needs a `srcset` with `sizes` on the LCP image and an 800 px file under 150 KB); fonts declare `font-display`, woff2 first; nothing loads from another origin. Budgets can be changed in `ds7.config.json` (`perf.budgets`); a change is a decision, written in `docs/DECISIONS.md`.
- `ds7 lab` (browser, needs Playwright): LCP element and time, CLS and blocking per page on a phone profile with a throttled CPU and network, median of several runs. It finds regressions and the LCP element; it is not proof.
- `ds7 psi <url>` (after launch): Lighthouse scores plus real-visitor data when the site has traffic. Record the result in `docs/METRICS.md` with the date and the build.
- Rules that keep a site fast: every image through the image component with real dimensions; no third-party script without the owner's decision; no layout change after load (reserve space); new JavaScript only for behaviour CSS cannot do.

---

## 6. Local SEO (for a business with a local audience)

NAP consistency, reviews, service areas and trust signals are in `GOOGLE-LOCAL-EEAT.md`. What needs facts from the owner, never invented and never written into `ds7/`:

1. A Google Business Profile with the same name, categories, service area, hours and phone as the site; link the site from it and it from the site.
2. One page per service and per city served, each with its own primary query, written for people, not a template with the city name swapped.
3. A few guides that answer what customers ask (cost, duration, what to do first), each one registry page with one primary query.
4. After launch: Search Console (submit the sitemap, read queries and pages) and Bing Webmaster Tools. Each month look at pages with many impressions and a low click-through rate: their title and description are rewritten first.

---

## 7. Order of work and commands

The order of work for a new or changed page is the project skill `seo-page` (template in `templates/skills/seo-page/SKILL.md`). Settings of the audits: `ds7.config.json`. What each command is and needs: `07-testing/VALIDATORS-AND-GUARDS.md`, section 1. Run `nuxt generate` before `ds7 audit`; record measured values in `docs/METRICS.md`.
