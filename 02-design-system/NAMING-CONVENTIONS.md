# 02 · Naming conventions

Short, semantic class names keep HTML small and CSS readable. The rules are in `CSS-CONVENTIONS.md`, section 1; this page shows them on examples.

---

## 1. Examples

| Long name | DS7 name | Why |
|---|---|---|
| `.catalog-product-card` | `.p-card` or `.model-card` | The root says what it is, nothing more |
| `.catalog-product-card--featured` | `.p-card.-top` | A modifier is a separate class |
| `.catalog-product-card__description` | `.p-card p`, or `.p-card .desc` when there are several | The tag first, a part class only when needed |
| `.section-heading-eyebrow` | `.s-head .kicker` | A part is named inside its root |
| `.overlap-panel` | `.panel.-overlap` | The difference is a modifier |
| `.hook-bill-calculator` | `.hook.-bill` | One component, one variant |
| `.button-variant-primary-large` | `.btn.-primary.-big` | Modifiers combine |
| `.menu.is-open` | `.menu-btn[aria-expanded='true']` | The state lives in the attribute the user needs |

---

## 2. Formula (guidance, not a rule)

```
.[component]         root: btn, hero, model-card, info-block
.-[modifier]         what differs from the base: -hor, -sm, -dark, -compact
.[part]              only when the tag is not enough: body, title, desc, img
```

There is no closed list of names. Choose the shortest name that stays clear, and check that a new part name is not already a root or a utility in the project.

---

## 3. Build-time minification

- Unused styles are removed when the site is generated. Only classes that appear in the output ship.
- The CSS minifier removes comments and shortens values (`#ffffff` → `#fff`).
- Component styles are inlined per page; global CSS is one cached file with a content hash in its name (`03-performance-web-vitals/CRITICAL-CSS.md`).
