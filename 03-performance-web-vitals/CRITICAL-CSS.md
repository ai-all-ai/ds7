# 03 · Critical CSS and render-blocking

A stylesheet in `<head>` blocks rendering until it has downloaded and parsed. On a slow mobile network a 50–150 KB stylesheet delays the first paint noticeably.

---

## 1. Split

- **Above the fold:** header, page grid, typography and the first screen. Needed for the first paint.
- **Below the fold:** calculators, reviews, map, footer, modals. Needed later.

---

## 2. Nuxt configuration

Nuxt 4 controls inlining with `features.inlineStyles`. The older name `experimental.inlineSSRStyles` no longer exists: Nuxt ignores it without a warning, so a project that still has it runs on the default.

```ts
export default defineNuxtConfig({
  features: {
    // Nuxt 4 default, written out (templates/nuxt.config.ts): component styles are inlined, global CSS is linked.
    inlineStyles: (id?: string) => !!id && id.includes('.vue'),
  },
})
```

What this does during `nuxt generate`:
- the styles of the Vue components a page renders are inlined in `<style>` in the page `<head>`;
- global CSS (`main.css`: `theme.css`, `base.css`, and Tailwind when the project uses it) stays one linked stylesheet, cached across pages.

**Inlining global CSS as well** (`inlineStyles: true`) can remove the last render-blocking request, but it changes where the rules sit in the cascade, and utility classes can win or lose against component styles differently. It is opt-in:
1. Switch it on in a branch.
2. Compare the `/ui` visual references (`07-testing/TESTING-STRATEGY.md`, section 8) and the main pages at 390, 820 and 1440 px. Any difference means the switch stays off.
3. Measure First Contentful Paint before and after on a real phone (section 3). Keep it only if it helps.
4. Record the decision in `docs/DECISIONS.md`.

---

## 3. What to measure

Record First Contentful Paint and render-blocking requests on a real phone, with the build and date, in `docs/METRICS.md`. Lab numbers from a sandbox are not evidence for this.

---

## 4. Budget

Keep the entry stylesheet small enough to inline without delaying HTML. `ds7 audit perf` enforces the static budgets (`04-seo-ai-optimization/SEO-CHECKLIST.md`, section 5); a stricter budget goes to `perf.budgets` in `ds7.config.json`, with the reason in `docs/DECISIONS.md`.
