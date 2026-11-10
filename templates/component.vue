<script setup lang="ts">
/**
 * DS7 Component Template
 * Эталонная структура Vue 3 SFC (Composition API, Atomic Design, Container Queries)
 */

interface SpecItem {
  label: string
  value: string
}

// 1. Типизированные пропсы с модификаторами
const props = withDefaults(defineProps<{
  title: string
  description?: string
  price?: number | null
  badge?: 'top' | 'new' | 'sale'
  specs?: SpecItem[]
  // Булевые пропсы-модификаторы:
  top?: boolean
  compact?: boolean
  dark?: boolean
}>(), {
  description: '',
  price: null,
  specs: () => [],
  top: false,
  compact: false,
  dark: false
})

// 2. Вычисление минималистичных классов
const classes = computed(() => [
  'p-card',
  props.top && '-top',
  props.compact && '-compact',
  props.dark && '-dark',
  props.badge && `-${props.badge}`
])
</script>

<template>
  <article :class="classes" data-ref="CARD-01">
    <!-- Слот для графики или логотипа -->
    <div class="p-card__art">
      <slot name="art" />
    </div>

    <!-- Текстовое тело -->
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

    <!-- Футер с ценой и действием -->
    <div class="p-card__footer">
      <div v-if="price !== null" class="p-card__price">
        <span class="p-card__price-val">{{ price }} €</span>
      </div>
      <slot name="action" />
    </div>
  </article>
</template>

<style>
/* 
 * Стили компонента: изолируются через префикс и используют CSS Custom Properties
 */
.p-card {
  --card-bg: var(--color-white, #fff);
  --card-ink: var(--color-ink, #1f1b16);
  --card-border: var(--color-ink-100, rgba(31, 27, 22, 0.08));

  container-type: inline-size;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  color: var(--card-ink);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md, 12px);
  padding: var(--space-4, 16px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Модификатор TOP */
.p-card.-top {
  --card-border: var(--color-sun, #ffd84d);
  box-shadow: var(--shadow-lift);
}
.p-card.-top .p-card__title {
  font-weight: 700;
}

/* Модификатор Dark */
.p-card.-dark {
  --card-bg: var(--color-ink-950, #12100d);
  --card-ink: #ffffff;
  --card-border: rgba(255, 255, 255, 0.12);
}

/* Модификатор Compact */
.p-card.-compact {
  padding: var(--space-2, 8px);
}

/* Контейнерная адаптивность */
@container (max-width: 320px) {
  .p-card {
    padding: var(--space-2, 8px);
  }
  .p-card__title {
    font-size: 0.95rem;
  }
}
</style>
