# 02 · Naming conventions

Short, semantic class names keep HTML small and make CSS readable. The formula and the rules are the same for every project.

---

## 1. Examples

| Long name | DS7 name |
|---|---|
| `.catalog-product-card` | `.p-card` |
| `.catalog-product-card--featured` | `.p-card.-top` |
| `.catalog-product-card__description` | `.p-card__desc` |
| `.section-heading-eyebrow` | `.s-head__eye` |
| `.overlap-panel` | `.panel.-overlap` |
| `.hook-bill-calculator` | `.hook.-bill` |
| `.button-variant-primary-large` | `.btn.-sun.-lg` |

---

## 2. Formula

```
.[component]          base name, short kebab-case
.[component]__[part]  element, double underscore
.-[modifier]          modifier, separate class with a leading dash
.is-[state]           state
```

---

## 3. Rules

1. **No word appended to a base name.** `.btn-lg`, `.card-big`, `.hero-active` are wrong. Write `.btn.-lg`, `.card.-big`, `.hero.is-active`.
2. **Size and colour words are modifiers.** `-sm`, `-lg`, `-sun`, `-dark`. Not `-big`, `-red`, `-orange`.
3. **Element names describe the part.** `__title`, `__price`, `__art`, not `__text2` or `__left`.
4. **Only tokens in values.** Naming does not replace the token rule in `TOKENS-SPEC.md`.

---

## 4. Build-time minification

- Unused styles are removed when the site is generated. Only classes that appear in the output ship.
- The CSS minifier removes comments and shortens values (`#ffffff` → `#fff`).
- Critical CSS is inlined; the rest is a cached file with a content hash in its name.
