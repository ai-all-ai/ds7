# 02 · CSS conventions (DS7)

The rules for writing class names, nesting and selectors in every DS7 project and in `@ai.all/ui`. Short, clear, and a change to one component must not break another. Nothing here is a method you have to adopt: the firm rules are at the end of section 1.

Sources: the naming and modifier rules of DS7 (`NAMING-CONVENTIONS.md`, `MODIFIER-SYSTEM.md`, `COMPONENT-ANATOMY.md`), the reasoning in `CSS-SOURCES.md` (CUBE CSS, RSCSS, Every Layout, WAI-ARIA, CSS Nesting Module), and the ui component set.

---

## 1. Names

| Kind | Form | Example |
|---|---|---|
| Root | short kebab-case, one or two words | `.btn`, `.p-card`, `.price-box` |
| Variant | dash modifier, separate class | `.btn.-lg`, `.p-card.-top` |
| Visual state | dash modifier | `.tab.-active`, `.menu.-open` |
| App state (set by JS, already used in a project) | `is-` prefix, kept as is | `.is-open` |
| Inner part | short name nested under its root | `.p-card .title`, `.tabs .tab` |
| Page context | class on `<body>` | `body.page-home` |
| JavaScript hook | attribute, never a class | `[aria-selected='true']`, `[data-ref]` |

Formula (guidance): `.[component]`, `.-[modifier]`, `.[part]`, `.is-[state]`.

Firm rules:
1. **No word appended to a root.** `.btn-lg`, `.card-big`, `.hero-active` are wrong. Write `.btn.-lg`, `.card.-big`, `.hero.-active`.
2. **Size and colour words are modifiers**: `-sm`, `-lg`, `-sun`, `-dark`. Not `-big`, `-red`, `-orange`.
3. **Inner part names describe the part**: `.title`, `.price`, `.art`, `.desc`. Not `.text2`, `.left`, `.box-inner`. A part is always written inside its root.
4. **No BEM.** No `block__element`, no `block--modifier`. They lengthen names without adding meaning.
5. **Only tokens in values.** Naming does not replace the token rule in `TOKENS-SPEC.md`.

Choose the shortest name that stays clear. Use the semantic tag first (`<h3>`, `<figure>`, `<footer>`) and add a class to an inner part only when the tag is ambiguous or repeated.

## 2. Roots and parts

- A root is the component's outer element. It has one class.
- A part is an element inside the root. It has a class only when the tag does not say what it is.
- A part name never contains the root name. `.p-card .title`, not `.p-card-title` and not `.p-card__title`.
- The same part name may repeat in other components, because it is always scoped under its root. This is why short names are safe.

## 3. Nesting

Native CSS nesting is the form. A part is written inside its root:

```css
.p-card {
  --card-bg: var(--color-white);
  --card-ink: var(--color-ink);

  container-type: inline-size;
  background: var(--card-bg);
  color: var(--card-ink);

  & .title {
    font-weight: 600;
  }

  > .desc {
    color: var(--color-ink-700);
  }

  &.-top {
    --card-bg: var(--color-sun-50);
  }

  &.-dark {
    --card-bg: var(--color-ink-950);
    --card-ink: var(--color-white);
  }
}
```

Rules:
- `&` is the root. `& .part` and `> .part` both point at the root's children.
- Two levels below the root at most. A third level needs its own part name.
- A nested block never repeats the root name (`.p-card .p-card` is wrong).
- A part with a state is nested the same way: `& .tab[aria-selected='true']`.
- A rule that must be outside the root (a container query on the root, a page context) stays at the top level.

Projects that do not use nesting write the same rules flat (`.p-card .title {}`). The selectors are equivalent; the choice is about readability.

## 4. Modifiers and inheritance

Two ways to vary a part. Both are allowed; choose the one that keeps the rule shorter. Never use both for the same change.

1. **Own modifier**: `<span class="chip -on">` and `.chip.-on {}`.
2. **Parent modifier** (inheritance): `.chips.-small .chip {}`. Use it when every part of a root changes together.

Modifiers on the root change custom properties where possible, so the number of selectors stays small:

```css
.p-card { --card-bg: var(--color-white); }
.p-card.-dark { --card-bg: var(--color-ink-950); }   /* parts read var(--card-bg) */
```

Restyle a variant with a modifier, not with a new class name.

## 5. Custom properties

- A component declares its variables on its root: `--card-bg`, `--card-ink`, `--tabs-line`. Parts read them and never set them.
- Colour, spacing, radius and type come from the tokens: `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--text-*)`.
- A fallback is given only when a token may be missing in a project: `var(--color-ink, currentColor)`.

## 6. Selectors

Allowed:
- class selectors, nested under the root
- pseudo-classes: `:hover`, `:focus-visible`, `:disabled`, `:checked`, `:first-child`, `:last-child`, `:not()`, `:is()`
- ARIA attributes for state: `[aria-selected='true']`, `[aria-expanded='true']`
- `@media`, `@container`, `@supports`, `@layer`

Avoid:
- tag selectors next to a class (`a.tag`, `button.btn`). Put the class on the element.
- id selectors in styles
- `!important` in components
- `html`, `body`, `:root` rules outside the global block (section 7)

Attribute selectors for data (`[data-x]`) are for JavaScript hooks, not for styling a visual state. A visual state is a dash modifier.

## 7. Global styles

Scoped styles are the default. A component that needs global styles keeps them in a separate, commented block. A global rule states why it must reach the whole page, and it is prefixed with the root name: `html.dev-outlines .dev-issue`, not `html .dev-issue`.

## 8. Layers and specificity

- The foundation is one layer, `aiall-ui-foundation`, declared before project layers. A project overrides it without `!important`.
- A component's styles are not layered; they are scoped.
- A project changes a part through the root's custom properties, a modifier, or a rule later in the cascade with the same specificity.

## 9. Context from an ancestor

A shared component that must look different on one page does not get a second component. The page sets a context class on `<body>` (`page-home`, `page-business`), and one rule scopes the difference:

```css
body.page-business .hero-hook { background: var(--color-ink-950); }
```

Set by `usePageSeo` in DS7. Wrong: `HookHome.vue` and `HookBusiness.vue`. Right: one `HookHero` with context rules.

## 10. Container queries

A component with responsive states sets `container-type: inline-size` on its root and reacts to its box, not the screen:

```css
.p-card { container-type: inline-size; }
@container (max-width: 320px) {
  .p-card { padding: var(--space-2); }
  .p-card .title { font-size: 0.9rem; }
}
```

## 11. Methods

No method is mandatory. Tailwind, UnoCSS and Lightning CSS are allowed where a project already uses them or for speed. A project that uses Tailwind keeps its utilities and follows section 1 for its own components. The rules above are the same for every project.

## 12. Checks

`ds7 check` and `ds7 guard` enforce the parts that can be read statically: class names in the project's `components/`, colours in component CSS, and the state-class setting in `ds7.config.json` (`guard.stateClasses`). The rest is review.

`@ai.all/ui` reports BEM names (`__`), compound modifiers (`.btn-big`) and `!important` in its own components with `npx @ai.all/ui check`.

## 13. Example: one component

```vue
<template>
  <div class="tabs" :class="{ '-pill': pill }" role="tablist">
    <button
      v-for="t in tabs"
      :key="t.id"
      class="tab"
      role="tab"
      :aria-selected="t.id === modelValue"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<style scoped>
.tabs {
  --tabs-line: var(--color-line);
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--tabs-line);

  & .tab {
    padding: var(--space-2) var(--space-3);
    color: var(--color-muted);
  }

  & .tab[aria-selected='true'] {
    color: var(--color-ink);
    box-shadow: inset 0 -2px 0 currentColor;
  }

  &.-pill {
    border-bottom: 0;

    & .tab {
      border-radius: var(--radius-pill);
    }
  }
}
</style>
```
