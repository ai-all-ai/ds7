# 03 · Critical CSS and render-blocking

A stylesheet in `<head>` blocks rendering until it has downloaded and parsed. On a slow mobile network a 50–150 KB stylesheet delays the first paint noticeably.

---

## 1. Split

- **Above the fold:** header, page grid, typography and the first screen. Needed for the first paint.
- **Below the fold:** calculators, reviews, map, footer, modals. Needed later.

---

## 2. Nuxt configuration

```ts
export default defineNuxtConfig({
  experimental: {
    inlineSSRStyles: true,   // inline the CSS each page uses during generation
  },
})
```

During `nuxt generate`:
- each page is rendered and the classes it uses are collected;
- those rules are inlined in `<style>` in the page `<head>`;
- the full stylesheet is loaded afterwards with `rel="preload"`.

---

## 3. What to measure

Record First Contentful Paint and render-blocking requests on a real phone, with the build and date, in `docs/METRICS.md`. Lab numbers from a sandbox are not evidence for this.

---

## 4. Budget

Keep the entry stylesheet small enough to inline without delaying HTML. Set a budget in `docs/METRICS.md` and check it when the stylesheet changes.
