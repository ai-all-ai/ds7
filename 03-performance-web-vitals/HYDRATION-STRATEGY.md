# 03 · Hydration strategy

Static HTML appears first. Then the framework attaches event handlers to each component (hydration). On a phone with many interactive components this can block the main thread for hundreds of milliseconds, and taps are ignored during that time.

---

## 1. Principle

Hydrate only what the visitor needs now.

- **Critical:** navigation, the first interactive element, forms the visitor sees.
- **Idle:** chat widgets, cookie banner, sound controls, modals that are not open.
- **On visibility:** heavy sections below the fold (maps, charts, interactive calculators).

---

## 2. Idle widgets

Nuxt 4 delays hydration of lazy components natively. Prefer it to hand-written timers:

```vue
<template>
  <LazySiteChat hydrate-on-idle />
  <LazySiteCookieBanner hydrate-on-idle />
</template>
```

The HTML is rendered during generation; the component's JavaScript loads and runs when the browser is idle.

A widget that must not exist in the HTML at all (it reads browser storage, for example) renders on the client after idle:

```vue
<script setup lang="ts">
const ready = ref(false)

onMounted(() => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => { ready.value = true })
  } else {
    setTimeout(() => { ready.value = true }, 1500)
  }
})
</script>

<template>
  <ClientOnly>
    <SiteChat v-if="ready" />
  </ClientOnly>
</template>
```

Note for the banner: it must not hide content while it waits. Reserve its space with a fixed position.

---

## 3. Visibility

Heavy sections use lazy components that hydrate when they approach the viewport:

```vue
<LazySectionsProjectMap hydrate-on-visible />
```

Other strategies: `hydrate-on-interaction` (on the first click or focus), `hydrate-never` (static HTML only). Pick the latest one that still works for the visitor.

### Third-party embeds: facades

Video players, maps and chat widgets load a large amount of script from another origin. Show a facade instead: a component from the brandbook with a poster image, a title and a play or open button, sized like the real embed. The real embed loads only after the visitor activates the facade, and after consent where the embed sets cookies. `@nuxt/scripts` ships facades (`ScriptYouTubePlayer`, `ScriptGoogleMaps` and others) when the project uses it. `ds7 audit perf` reports every resource from another origin in the generated HTML (rule `third-party`).

---

## 4. Passive listeners

Scroll and touch listeners that never call `preventDefault` are registered as passive, so the browser can scroll without waiting for the script:

```ts
window.addEventListener('scroll', onScroll, { passive: true })
track.addEventListener('touchstart', onTouchStart, { passive: true })
```

---

## 5. Measuring

Total Blocking Time and Interaction to Next Paint are measured on a real device, not in a sandbox. Record the results in `docs/METRICS.md`.
