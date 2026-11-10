# 01-Architecture · Modifier System & Ancestry Scoping

> Система модификаторов обеспечивает максимальное переиспользование кода без создания дублирующих компонентов.

---

## 1. Синтаксис отдельных классов-модификаторов

Вместо длинных составных BEM-имен (`catalog-product-card--featured-large-dark`) используется компактная и легко читаемая схема: **базовый класс + отдельные короткие классы с дефисом**:

```html
<!-- Карточка товара: топовая, новинка, компактный размер -->
<article class="p-card -top -new -compact">
  <div class="p-card__art">...</div>
  <h3 class="p-card__title">Panel Solar 450W</h3>
  <div class="p-card__price">...</div>
</article>
```

### Преимущества:
1. **Экономия байтов в HTML/CSS:** Классы короткие, вес страницы уменьшается.
2. **Аддитивность:** Модификаторы можно комбинировать в любых сочетаниях (`-top -new`, `-dark -compact`).
3. **Каскадное влияние:** Модификатор на корневом элементе прозрачно меняет свойства всех вложенных элементов.

---

## 2. Каскад стилей от модификатора

```css
/* Базовый компонент */
.p-card {
  --card-bg: var(--color-white);
  --card-text: var(--color-ink);
  --card-border: var(--color-ink-100);

  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Модификатор: TOP товар */
.p-card.-top {
  --card-border: var(--color-sun);
  box-shadow: var(--shadow-lift);
}
.p-card.-top .p-card__title {
  font-weight: 700;
}

/* Модификатор: Компактный режим */
.p-card.-compact {
  padding: var(--space-2);
}
.p-card.-compact .p-card__title {
  font-size: 0.85rem;
}

/* Модификатор: Темная тема */
.p-card.-dark {
  --card-bg: var(--color-ink-950);
  --card-text: var(--color-white);
  --card-border: var(--color-ink-800);
}
```

---

## 3. Управление контекстом от предка (Ancestry Scoping)

Если один и тот же рабочий компонент (слайдер, форма, плашка хука) должен выглядеть иначе на определенной странице (например, на странице для бизнеса `/empresas` фон должен быть графитовым, а на главной — песочным):

❌ **Как делать НЕЛЬЗЯ:**
Создавать два разных файла: `HookHome.vue` и `HookEmpresas.vue`.

✅ **Как делать ПРАВИЛЬНО:**
Использовать единый компонент `UiHeroHook`, а различия задавать через родительский контекст — класс страницы на теге `<body>`:

```css
/* Базовый хук везде */
.hero-hook {
  background: var(--color-paper);
  color: var(--color-ink);
}

/* Тот же самый хук на странице для бизнеса (темная тема) */
body.page-empresas .hero-hook {
  background: var(--color-ink-950);
  color: var(--color-white);
}

/* Тот же компонент внутри модального окна */
.site-modal-box .hero-hook {
  background: transparent;
  padding: 0;
}
```

Благодаря настройке в `usePageSeo.ts` каждая страница Nuxt автоматически проставляет свой класс на `<body>` (`page-home`, `page-hogares`, `page-empresas`, `page-movilidad`, `page-equipamiento`).
