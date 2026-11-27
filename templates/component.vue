<script setup lang="ts">
/**
 * DS7 component template: product card molecule (CARD-01).
 * Atomic level: molecule. Modifiers: -top, -new, -compact, -dark.
 */

interface SpecItem {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    price?: number | null;
    badge?: 'top' | 'new' | 'sale';
    specs?: SpecItem[];
    top?: boolean;
    compact?: boolean;
    dark?: boolean;
  }>(),
  {
    description: '',
    price: null,
    specs: () => [],
    top: false,
    compact: false,
    dark: false,
  },
);

const classes = computed(() => [
  'p-card',
  props.top && '-top',
  props.compact && '-compact',
  props.dark && '-dark',
  props.badge && `-${props.badge}`,
]);
</script>

<template>
  <article :class="classes" data-ref="CARD-01">
    <!-- Artwork or logo slot -->
    <div class="art">
      <slot name="art" />
    </div>

    <!-- Text body -->
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

    <!-- Footer: price and action. The price is formatted by the project's price atom. -->
    <div class="footer">
      <div v-if="price !== null" class="price">
        <span class="val">{{ price }} €</span>
      </div>
      <slot name="action" />
    </div>
  </article>
</template>

<style>
/*
 * Component styles. Not scoped: every selector starts at the root class, and parents,
 * themes and modifiers tune the card through its variables (--card-*), which are read
 * with a fallback and never declared on the root. Values come from the tokens in theme.css.
 * See 02-design-system/CSS-CONVENTIONS.md.
 */
.p-card {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--card-gap, var(--space-3, 12px));
  padding: var(--card-p, var(--space-4, 16px));
  background: var(--card-bg, var(--color-white, #fff));
  border: var(--border-w, 1px) solid var(--card-line, var(--color-line, rgba(31, 27, 22, 0.08)));
  border-radius: var(--radius-md, 12px);
  transition:
    transform var(--dur-1, 0.15s) var(--ease, ease),
    box-shadow var(--dur-1, 0.15s) var(--ease, ease);

  &.-top {
    --card-line: var(--color-accent, #ffd84d);
    box-shadow: var(--shadow-lift);

    .title {
      font-weight: 700;
    }
  }

  &.-dark {
    --card-bg: var(--color-ink-950, #12100d);
    --card-line: transparent;
    color: var(--color-white, #fff);
  }

  &.-compact {
    --card-p: var(--space-2, 8px);
  }

  @container (width < 20rem) {
    .title {
      font-size: var(--text-base, 1rem);
    }
  }
}
</style>
