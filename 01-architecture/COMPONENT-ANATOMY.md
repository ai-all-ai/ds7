# 01 · Component anatomy and container queries

The reference shape of a Vue 3 single-file component in DS7. The template file is in `templates/component.vue`.

---

## 1. Shape

```vue
<script setup lang="ts">
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
  props.badge && `-${props.badge}`,
])
</script>

<template>
  <article :class="rootClasses" data-ref="CARD-01">
    <div class="p-card__art">
      <slot name="art" />
    </div>

    <div class="p-card__body">
      <h3 class="p-card__title">{{ title }}</h3>
      <p v-if="description" class="p-card__desc">{{ description }}</p>
      <dl v-if="specs.length" class="p-card__specs">
        <div v-for="s in specs" :key="s.label">
          <dt>{{ s.label }}</dt>
          <dd>{{ s.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="p-card__footer">
      <UiPrice v-if="price !== null" :amount="price" />
      <slot name="action" />
    </div>
  </article>
</template>

<style>
.p-card {
  --card-bg: var(--color-white);
  --card-ink: var(--color-ink);

  container-type: inline-size;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  color: var(--card-ink);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

@container (max-width: 320px) {
  .p-card {
    padding: var(--space-2);
  }
  .p-card__title {
    font-size: 0.9rem;
  }
}
</style>
```

---

## 2. Rules

1. **Typed props.** Booleans for modifiers keep templates readable; `rootClasses` turns them into classes.
2. **`container-type: inline-size`** on any component with responsive states. It reacts to its box, not to the screen.
3. **Component-level custom properties** (`--card-bg`, `--card-ink`). Modifiers change the variables, not ten child selectors.
4. **Stable ID** in `data-ref` (`CARD-01`). It links the live component to its entry in the brandbook.
5. **Slots with fallbacks** for media and actions. The component works with any content in those slots.
6. **A one-line summary** at the top of the file, as in the example.
