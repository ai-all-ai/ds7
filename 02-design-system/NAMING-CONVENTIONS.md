# 02 · Naming conventions

Short, semantic class names keep HTML small and make CSS readable. The formula and the rules are the same for every project.

---

Full rules for names, nesting, modifiers, selectors and global styles: `02-design-system/CSS-CONVENTIONS.md`.

---

## 1. Examples

| Long name | DS7 name |
|---|---|
| `.catalog-product-card` | `.p-card` |
| `.catalog-product-card--featured` | `.p-card.-top` |
| `.catalog-product-card__description` | `.p-card > .desc` (inside the root) |
| `.section-heading-eyebrow` | `.s-head__eye` |
| `.overlap-panel` | `.panel.-overlap` |
| `.hook-bill-calculator` | `.hook.-bill` |
| `.button-variant-primary-large` | `.btn.-sun.-lg` |

---

## 2. Formula (guidance, not a rule)

```
.[component]         root name, short kebab-case: btn, modal, model-card
.-[modifier]         modifier on the same element: .btn.-sm, .model-card.-hor
.[part]              inner part, only when the tag is not clear: .body, .title, .desc
.is-[state]          state set by the app (not a visual variant)
```

Use the semantic tag before a class: `<h3>`, `<figure>`, `<footer>`. Give an inner part a class only when the tag is ambiguous or repeated.

Choose the shortest name that stays clear. Restyle a variant with a modifier on the element, or let the parent's modifier set it through inheritance and custom properties. Native CSS Nesting writes parts inside the root: `.model-card { > .body { ... } }`. Do not write the root name into the part name.

BEM (`block__element`, `block--modifier`) is not used: it makes names longer without adding meaning.

No method is mandatory. Tailwind, UnoCSS, Lightning CSS and similar tools are allowed where they fit the project, for speed or for an existing setup. The only firm rules: names are short and clear, and a change to one component does not break another.

## 3. Rules

1. **No word appended to a base name.** `.btn-lg`, `.card-big`, `.hero-active` are wrong. Write `.btn.-lg`, `.card.-big`, `.hero.is-active`.
2. **Size and colour words are modifiers.** `-sm`, `-lg`, `-sun`, `-dark`. Not `-big`, `-red`, `-orange`.
3. **Inner part names describe the part.** `.title`, `.price`, `.art`, not `.text2` or `.left`. Scope them under the root so the same name can repeat in other components.
4. **Only tokens in values.** Naming does not replace the token rule in `TOKENS-SPEC.md`.

---

## 4. Build-time minification

- Unused styles are removed when the site is generated. Only classes that appear in the output ship.
- The CSS minifier removes comments and shortens values (`#ffffff` → `#fff`).
- Critical CSS is inlined; the rest is a cached file with a content hash in its name.
