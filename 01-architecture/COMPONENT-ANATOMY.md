# 01 · Component anatomy and container queries

The Nuxt/Vue reference shape in DS7. Vue is one rendering profile, not a dependency of the CSS contract. The template file is in `templates/component.vue`; framework-independent contracts and other renderers are in `TECHNOLOGY-PROFILES.md`.

---

## 1. Shape

```vue
<script setup lang="ts">
import { computed } from 'vue'
/**
 * UiProductCard — product card molecule.
 * Container-aware. Modifiers are separate classes.
 */

const props = withDefaults(defineProps<{
  title: string
  description?: string
  price?: number | null
  badge?: 'top' | 'new' | 'sale'
  specs?: Array<{ label: string; value: string }>
  top?: boolean
  compact?: boolean
  dark?: boolean
}>(), {
  description: '',
  price: null,
  specs: () => [],
  top: false,
  compact: false,
  dark: false,
})

const rootClasses = computed(() => [
  'p-card',
  props.top && '-top',
  props.compact && '-compact',
  props.dark && '-dark',
  props.badge && { top: '-top', new: '-new', sale: '-sale' }[props.badge],
])
</script>

<template>
  <article :class="rootClasses" data-ref="CARD-01">
    <div class="art">
      <slot name="art" />
    </div>

    <div class="body">
      <h3 class="title">{{ title }}</h3>
      <p v-if="description" class="desc">{{ description }}</p>
      <dl v-if="specs.length" class="specs">
        <div v-for="s in specs" :key="s.label">
          <dt>{{ s.label }}</dt>
          <dd>{{ s.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="footer">
      <UiPrice v-if="price !== null" :amount="price" />
      <slot name="action" />
    </div>
  </article>
</template>

<style>
.p-card {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--card-gap, var(--space-3));
  padding: var(--card-p, var(--space-4));
  background: var(--card-bg, var(--color-white));
  border-radius: var(--radius-md);

  &.-compact { --card-p: var(--space-2); }
  &.-dark    { --card-bg: var(--color-ink-950); color: var(--color-white); }

  @container (width < 20rem) {
    .body { gap: var(--space-1); }
    .title { font-size: var(--text-base); }
  }
}
</style>
```

---

## 2. Rules

1. **Typed props.** Booleans for modifiers keep templates readable; `rootClasses` turns them into classes.
2. **`container-type: inline-size`** on any component with responsive states. Its parts react to its box, not to the screen; a container query never styles the container itself.
3. **Component variables read with a fallback** (`var(--card-p, var(--space-4))`) and not declared on the root, so a parent, a theme or a modifier can set them. Modifiers change the variables, not ten child selectors.
4. **Stable ID** in `data-ref` (`CARD-01`) when the project uses the UI Brandbook. It links the live component to its catalog entry; other projects need no catalog ID.
5. **Slots** for media and actions. Slotted DOM is controlled by the caller; selectors must not assume a fixed inner structure.
6. **A one-line summary** at the top of the file, as in the example.

## 3. Vue binding and public contract

| Role | Example |
| --- | --- |
| Vue component / template | `UiModelCard.vue` / `<UiModelCard>` |
| CSS root / file | `.model-card` / `model-card.css` |
| Prop / template prop | `imagePosition` / `image-position` |
| Pure function / composable | `calculateEnergy` / `useCalculator` |

Preserve an existing public component name. The Vue name and CSS root need not match. A discrete visual variant uses a class such as `-hor`; an individual dynamic value uses a validated CSS custom property. A parent can set public component tokens for a whole group. Do not create a prop for every CSS property or mutate props inside the component. Static class mappings are easier for CSS extractors and future mangling to see; a dynamic class factory needs an explicit allowlist.

For a single root, Vue's normal fallthrough forwards `class`, `style`, `id`, ARIA/data attributes and listeners. For a fragment or a wrapper that is not the interactive element, set `inheritAttrs: false` and forward `$attrs` deliberately to the correct node; test that focus, labels and events still work. Slots can add wrappers or other components, so direct-child selectors are a public DOM contract only for markup the component owns.

For form controls, use the installed Vue version's `defineModel` or the `modelValue` / `update:modelValue` pair consistently. Define one source of truth for the value, handle initial/default values explicitly and emit updates. Controlled and uncontrolled behavior must not be mixed accidentally.

The shared CSS contract must not require `scoped`, CSS Modules, `:deep()` or Vue CSS `v-bind()`. Those are allowed in a Vue-specific profile. A standalone Vue package explicitly imports the Vue APIs it uses rather than relying on Nuxt auto-imports. Universal imports do not access `window` or `document`; create browser listeners and observers after mount and remove them on unmount. Check stable IDs and hydration with more than one instance. Pure business logic remains outside the component and can be tested without Vue or DOM.

References: [Vue class/style](https://vuejs.org/guide/essentials/class-and-style.html), [fallthrough attributes](https://vuejs.org/guide/components/attrs.html), [component v-model](https://vuejs.org/guide/components/v-model.html), [SSR](https://vuejs.org/guide/scaling-up/ssr.html).
