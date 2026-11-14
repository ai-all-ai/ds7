# 01 · Modifier system and ancestry scoping

One base component, many variants, no duplicate components.

---

## 1. Syntax

Use a base class plus separate modifier classes. Each modifier starts with a dash:

```html
<article class="p-card -top -new -compact">
  <div class="p-card__art">…</div>
  <h3 class="p-card__title">Panel 450 W</h3>
  <div class="p-card__price">…</div>
</article>
```

Why:
- **Short class names** keep HTML and CSS small.
- **Modifiers combine** freely: `-top -compact`, `-dark -lg`.
- **Modifiers cascade:** a modifier on the root can change every child.

Avoid long compound names such as `catalog-product-card--featured-large-dark`.

---

## 2. Cascade from a modifier

```css
.p-card {
  --card-bg: var(--color-white);
  --card-text: var(--color-ink);
  --card-border: var(--color-ink-100);

  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.p-card.-top {
  --card-border: var(--color-sun);
  box-shadow: var(--shadow-lift);
}
.p-card.-top .p-card__title {
  font-weight: 700;
}

.p-card.-compact {
  padding: var(--space-2);
}

.p-card.-dark {
  --card-bg: var(--color-ink-950);
  --card-text: var(--color-white);
  --card-border: rgba(255, 255, 255, 0.12);
}
```

Modifiers change custom properties where possible. That keeps the number of selectors small.

---

## 3. Context from an ancestor

Sometimes a shared component must look different on one page. Do not create a second component. Scope the difference by an ancestor:

```css
/* the hook everywhere */
.hero-hook {
  background: var(--color-paper);
  color: var(--color-ink);
}

/* the same hook on a dark page */
body.page-business .hero-hook {
  background: var(--color-ink-950);
  color: var(--color-white);
}

/* the same hook inside a modal */
.site-modal-box .hero-hook {
  background: transparent;
  padding: 0;
}
```

The page class on `<body>` is set by `usePageSeo` (`page-home`, `page-residential`, `page-business`, …). Wrong: `HookHome.vue` and `HookBusiness.vue`. Right: one `UiHeroHook` with context rules.
