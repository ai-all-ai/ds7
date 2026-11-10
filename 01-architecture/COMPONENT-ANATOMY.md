# 01-Architecture · Component Anatomy & Container Queries

> Эталонный анатомический разрез Vue 3 SFC (Single File Component). По этой структуре строятся все компоненты в системе.

---

## 1. Анатомический шаблон компонента

```vue
<script setup lang="ts">
/**
 * UiProductCard
 * Молекула карточки товара каталога.
 * Поддерживает адаптивность по контейнеру и каскадные модификаторы.
 */

// 1. Входные типизированные пропсы
const props = withDefaults(defineProps<{
  title: string
  description?: string
  price?: number | null
  badge?: 'top' | 'new' | 'sale'
  specs?: Array<{ label: string; value: string }>
  // Булевые пропсы-модификаторы для удобства в шаблонах:
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

// 2. Вычисляемые классы-модификаторы
const rootClasses = computed(() => [
  'p-card',
  props.top && '-top',
  props.compact && '-compact',
  props.dark && '-dark',
  props.badge && `-${props.badge}`
])
</script>

<template>
  <article :class="rootClasses" data-ref="CARD-01">
    <!-- Слот для изображения или графического арта -->
    <div class="p-card__art">
      <slot name="art" />
    </div>

    <!-- Информационная часть -->
    <div class="p-card__body">
      <h3 class="p-card__title">{{ title }}</h3>
      <p v-if="description" class="p-card__desc">{{ description }}</p>

      <!-- Список характеристик (одна колонка) -->
      <dl v-if="specs.length" class="p-card__specs">
        <div v-for="s in specs" :key="s.label">
          <dt>{{ s.label }}</dt>
          <dd>{{ s.value }}</dd>
        </div>
      </dl>
    </div>

    <!-- Футер с ценой и действием -->
    <div class="p-card__footer">
      <UiPrice v-if="price !== null" :amount="price" />
      <slot name="action" />
    </div>
  </article>
</template>

<style>
/* 
 * Стили объявляются без scoped, но строго изолируются через префикс компонента.
 * Это позволяет внешним родителям каскадно переопределять CSS-переменные.
 */
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

/* Контейнерный запрос: адаптация под размер родительского блока */
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

## 2. Ключевые архитектурные правила:

1. **`container-type: inline-size`:**
   Компонент всегда объявляет свой контейнер, если имеет адаптивные состояния. Он не зависит от ширины экрана (`@media`), а реагирует на ширину бокса, в который его поместили (`@container`).
2. **Локальные CSS-переменные (`--card-bg`, `--card-ink`):**
   Все цвета и параметры привязаны к переменным компонента. Модификатор меняет переменные, а не 10 дочерних селекторов.
3. **Стабильный идентификатор `data-ref="CARD-01"`:**
   Связывает живой компонент в коде с разделом в брендбуке на `/ui`.
4. **Слоты с фоллбэками:**
   Для медиа (`#art`) и кнопок (`#action`) используются слоты, позволяя переиспользовать разметку под любые типы контента.
