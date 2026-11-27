# 01 · Modifier system and ancestry scoping

One base component, many variants, no duplicate components. The CSS rules behind this page: `02-design-system/CSS-CONVENTIONS.md`, sections 4 and 5.

---

## 1. Syntax

A base class plus separate modifier classes. Each modifier starts with a dash and names only what differs from the base:

```html
<article class="model-card -hor -compact">
  <img src="…" alt="…">
  <div class="body">
    <h3>E-Trail 7</h3>
    <p class="price">…</p>
  </div>
</article>
```

The base class is a complete component. Ordinary size and colour take no modifier:

```html
<button class="btn">Continue</button>
<a class="btn" href="/booking">Book online</a>
<button class="btn -link" type="button">Show details</button>
<button class="btn -transparent" type="button">More options</button>
<button class="btn -primary -big">Book a visit</button>
```

Role, size and context are separate choices. An explicit `-primary` or
`-secondary` sets a role. `-bright` and `-light` select named treatments from the theme.
The same `.btn` styling applies to native buttons and links after browser-native
appearance, spacing and text alignment are reset. `-link` changes a native
button into a compact text-link appearance; `-transparent` preserves its full
button size and touch area but removes its resting fill.
An explicit `-small` or `-big` changes size.
For buttons, single-line fields and selects, the default height comes from
`--control-height` (44 px). The optional sizes use
`--control-height-small` (36 px) and `--control-height-big` (52 px).
The project theme assigns values to the same tokens. A larger legacy control
that must retain its height uses an explicit size modifier.

Why:
- **Short class names** keep HTML and CSS small.
- **Modifiers combine** freely: `-hor -compact`, `-dark -big`.
- **Modifiers cascade:** a modifier on the root changes every part through custom properties.

---

## 2. Cascade from a modifier

The component reads its variables with fallbacks; a modifier sets them:

```css
.model-card {
  padding: var(--card-p, var(--space-4));
  background: var(--card-bg, var(--color-white));
  border: var(--border-w) solid var(--card-line, var(--color-line));
  border-radius: var(--radius-md);

  &.-compact { --card-p: var(--space-2); }
  &.-top     { --card-line: var(--color-accent); box-shadow: var(--shadow-lift); }
  &.-dark    { --card-bg: var(--color-ink-950); color: var(--color-white); }
}
```

One selector per modifier, however many parts read the variable.

---

## 3. Context from a parent or an ancestor

A parent can tune every card it holds without touching the card:

```css
.model-list.-compact { --card-p: var(--space-2); }
```

A shared component that must look different on one page gets context, not a copy:

```css
body.page-business .hero { --hero-bg: var(--color-ink-950); }
.modal .hero { --hero-p: 0; }
```

The page class on `<body>` is set by `usePageSeo` (`page-home`, `page-business`, …). Wrong: `HeroHome.vue` and `HeroBusiness.vue`. Right: one `Hero` read from variables, set by the context.
