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
    <SiteCookieBanner v-if="ready" />
  </ClientOnly>
}
</template>
```

Note for the banner: it must not hide content while it waits. Reserve its space with a fixed position.

---

## 3. Visibility

Heavy sections use lazy components that hydrate when they approach the viewport:

```vue
<LazyHomeProjectMap hydrate-on-visible />
```

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
