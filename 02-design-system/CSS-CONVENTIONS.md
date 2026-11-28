# 02 · CSS conventions (DS7)

The one home of the DS Native Contextual CSS rules: names, nesting, modifiers, custom properties, themes, states, layers and reuse. The method is recommended for new work, not a required package or a global ban on another chosen CSS profile. Other documents link here and do not repeat these rules. Where each idea comes from, and which tools are optional: `CSS-SOURCES.md`.

The goal is the shortest CSS that stays readable, reusable and safe to change: a change to one component never breaks another.

---

## 0. The rules at a glance

The words follow [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): MUST is a rule, SHOULD is the default you leave only with a reason, MAY is a free choice.

**MUST**
1. Use semantic HTML first: the right element (`button`, `a`, `nav`, `h2`, `ul`, `figure`, `dialog`, `details`) before a class or ARIA.
2. Meet WCAG 2.2 AA: contrast, a visible focus style, keyboard access, a name for every control, `prefers-reduced-motion` respected, no horizontal scroll at 390 px.
3. Take colour, type, spacing, radius, border, shadow and motion values from tokens (`var(--…)`), not raw values in components.
4. Keep a component's styles inside its boundary: its selectors start at its root class.
5. Express a state once, with the mechanism made for it (section 7).

**SHOULD**
1. Short root names and dash modifiers (`.btn.-sm`), inner parts nested under the root (section 1).
2. Native CSS Nesting for parts, modifiers and states of one component, not nested deeply, with flat HTML (section 3).
3. Vary a component through custom properties with inline fallbacks, so a parent or a theme can set them (section 5).
4. Before writing new CSS, reuse what exists (section 9).
5. Solve priority with order, `@layer`, inheritance and modifiers instead of `!important` (section 8).

**MAY**
1. Flat selectors where they are simpler than nesting.
2. Tailwind, UnoCSS, SCSS, LESS, CSS Modules or Lightning CSS where a project has a reason (`CSS-SOURCES.md`).
3. Shared helpers and short utilities once there is a real, repeated need (section 9).
4. Parts without a class when the tag says what they are (`.card h3`).

**MUST NOT**
1. BEM names (`block__element`, `block--modifier`) in new DS Native Contextual code. A project on a selected BEM profile keeps its syntax; existing projects are not forced to migrate.
2. `!important` in component CSS. The only accepted uses are listed in section 8.
3. A copy of a component for one page. Use a modifier, a custom property or a parent context.
4. A second mechanism for the same state (`.is-open` next to `aria-expanded="true"`).
5. Styling by id, or JavaScript hooks on style classes (`.js-*`); hooks use `data-*` or ARIA.

There is no closed dictionary of names, no limit on nesting depth and no rule that forces a component to be split. Avoid deep nesting (section 3); the rest is left to judgment and review.

---

## 1. Names

| Kind | Form | Example |
|---|---|---|
| Root | short kebab-case, one or two words | `.btn`, `.hero`, `.model-card`, `.info-block` |
| Modifier | separate class with a leading dash; says only what differs from the base | `.-hor`, `.-sm`, `.-dark`, `.-compact` |
| Part | short name, written inside its root, only when the tag is not enough | `.model-card .body`, `.title`, `.desc`, `.img` |
| State | native, ARIA or `data-state` (section 7) | `:disabled`, `[aria-expanded='true']`, `[data-state='loading']` |
| Theme | `data-theme` on any element | `[data-theme='dark']` |
| Page context | class on `<body>` | `body.page-home` |

- **The base class is complete.** `<button class="btn">` renders the ordinary look and size; add a modifier only for a real difference.
- **A modifier is a separate class.** `.btn.-sm`, never `.btn-sm`: a word appended to a root makes a new name instead of a variant (`ds7 guard` reports the common ones, `guard.suffixes` in `CONFIG.md`).
- **A modifier names the difference**, by meaning or role rather than by raw value: `-dark`, `-accent`, `-hor`, not `-red` or `-padding-8`. Choose one size scale per project (`-sm`/`-lg` or `-small`/`-big`) and keep it.
- **A part name describes the part** and never repeats the root: `.model-card .title`, not `.model-card-title` or `.model-card__title`. The same part name may appear in other components, because it is always scoped under its root.
- **Avoid part names that are also a root** elsewhere in the project or a utility of a tool the project uses (`icon`, `grid`, `block`, `step`): a nested rule would also hit that component.

Before and after:

```html
<!-- before: BEM -->
<article class="model-card model-card--horizontal">
  <img class="model-card__image" src="…" alt="…">
  <div class="model-card__body">
    <h3 class="model-card__title">E-Trail 7</h3>
    <p class="model-card__description">…</p>
  </div>
</article>

<!-- after: short root, one modifier, tags first -->
<article class="model-card -hor">
  <img src="…" alt="…">
  <div class="body">
    <h3>E-Trail 7</h3>
    <p>…</p>
  </div>
</article>
```

Why: the HTML is half the size, the class list reads like the design ("model card, horizontal"), and the tags keep their meaning for search engines and screen readers. Add `.title` or `.desc` only when there are two `h3` or two `p` that need different styles.

---

## 2. Roots and boundaries

- A root is the component's outer element and carries the component's one root class.
- Every selector of a component starts at its root, so the component cannot leak into a neighbour.
- When a component can contain other components (a card in a list, a form in a modal), reach its parts with the child selector (`> .title`), so a rule cannot reach into the nested component (RSCSS).
- A component does not style the inside of another component. It sets that component's custom properties or a modifier on it (section 5).
- Margins between components belong to the parent layout (a stack, a grid), not to the component itself, so it fits in any slot.

---

## 3. Nesting

Native CSS Nesting is the recommended syntax: parts, modifiers, states and container queries of one component sit inside its root.

```css
.model-card {
  display: grid;
  gap: var(--card-gap, var(--space-3));
  padding: var(--card-p, var(--space-4));
  background: var(--card-bg, var(--color-surface));

  img {
    inline-size: 100%;
    border-radius: var(--radius-md);
  }

  .title {
    font: var(--text-lead) / 1.2 var(--font-display);
  }

  &.-hor {
    grid-template-columns: minmax(8rem, 1fr) 2fr;
  }

  &:focus-within {
    outline: 2px solid var(--color-accent);
  }
}
```

- **No depth limit.** Judge source nesting, DOM depth, selector complexity and specificity separately. A meaningful chain such as `.gallery { > figure { > picture { > img {} } } }` is valid; when intermediate levels have no declarations, `.gallery { > figure > picture > img {} }` can be clearer. Add a local part class when the DOM contract may change. Do not fail a correct selector solely for its number of levels.
- **Flatten the HTML first.** Fewer wrappers mean shorter selectors, smaller pages and a simpler accessibility tree. Remove a `div` that exists only for spacing or alignment: use `gap`, grid or flex on the parent, or a helper (section 9).

```html
<!-- before: four levels of wrappers, so the CSS needs .card .inner .content .text p -->
<div class="card"><div class="inner"><div class="content"><div class="text"><p>…</p></div></div></div></div>

<!-- after: one element per meaning; the CSS needs .card p -->
<article class="card"><p>…</p></article>
```
- **Flat is fine.** `.model-card .title {}` is the same selector as the nested form. Use it where it is simpler, for example a single rule or a project without nesting.
- **`&` is the root.** `&.-hor` is a modifier on the root; `& .title` and `.title` are both descendants; `.page-home &` puts a context before the root.

### How the browser reads nesting

Native nesting is parsed by the browser, not compiled like Sass. These rules follow the specification ([CSS Nesting Module Level 1](https://drafts.csswg.org/css-nesting-1/)) and its guide ([MDN: Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Nesting/Using)):

- **`&` joins, a missing `&` adds a space.** `&.-hor` is `.model-card.-hor`; `.-hor` without `&` is `.model-card .-hor`, a descendant. Modifiers and states always start with `&` (`&.-hor`, `&:hover`, `&[aria-current]`).
- **No string joining.** `&__title` or `&-title` do not build a class name as in Sass: the browser reads them as an invalid selector and drops that rule. Name the part and nest it (`.title`). A tag goes first in a compound: `button&`, never `&button`.
- **`&` never stands for a pseudo-element.** Under `.card::before` a nested `&:hover` matches nothing. Nest the pseudo-element under the root instead: `.card { &::before {} &:hover::before {} }`.
- **Conditional at-rules can nest.** `@media`, `@container` and `@supports` can go inside a style rule and their declarations apply to its selector. `@layer`, `@scope` and `@starting-style` have their own grammar and cascade effects; check the at-rule's specification and browser targets before nesting it. An arbitrary at-rule is not automatically valid in every position.

```css
.model-list {
  display: grid;
  gap: var(--space-3);

  @media (width <= 1024px) {
    grid-template-columns: minmax(0, 1fr);
  }
}
```
- **Preserve cascade order.** Declarations written after nested rules can be represented by `CSSNestedDeclarations` and keep their position in current engines. Older engines and transformers may differ. Put base declarations first for readability when their order is immaterial; do not reorder a mixed block automatically without comparing computed styles.
- **An invalid nested selector drops only itself.** The parent and the other nested rules still apply, so a typo fails silently: check the rule in the browser.

### Specificity

- Count the selectors that actually contribute specificity, not the indentation: `.model-card .body .title` is (0,3,0), while `.model-card :where(.body .title)` is (0,1,0). `:where()` contributes zero; `:is()` takes its most specific argument. An id in a parent list can raise the weight of every nested branch.
- A nested rule under a selector list takes the highest specificity of the list, like `:is()`: `.card, #promo { > h2 {} }` has (1,0,1) for the nested rule even on `.card`. Do not flatten or split it without checking the cascade.
- Use `:where()` for defaults that should be easy to override (its own specificity is 0) and `:is()` when the argument's weight should stay. `&.-lg` targets the same root; `.-lg` without `&` targets a descendant. `& + &` and `& ~ &` target adjacent/following sibling roots, but parent `gap` is usually simpler for layout spacing.

### Browser support

Nesting with the relaxed syntax (a nested selector may start with a tag, no `&` needed) works in Chrome and Edge 120, Safari 17.2 and Firefox 117 and later (Baseline since December 2023). `@layer`, `:is()`, `:where()` and container queries are older than that. A project that must support older browsers keeps the native syntax in the source and lets the build lower it (Lightning CSS, `postcss-nesting`); it does not switch to a preprocessor for this.

---

## 4. Modifiers and context

A modifier changes custom properties where it can, so one selector changes every part at once:

```css
.model-card {
  &.-compact { --card-p: var(--space-2); --card-gap: var(--space-2); }
  &.-dark    { --card-bg: var(--color-ink-950); color: var(--color-white); }
}
```

Two ways to vary a part; choose the shorter one and never both for the same change:

1. **Own modifier:** `<span class="chip -on">`, `.chip.-on {}`.
2. **Parent setting:** the parent sets a variable or a modifier, the children read it.

```css
/* the list decides how dense its cards are; the card stays generic */
.model-list.-compact { --card-p: var(--space-2); }
```

A shared component that must look different in one place gets context from an ancestor, not a copy:

```css
body.page-business .hero { --hero-bg: var(--color-ink-950); }
.modal .hero { --hero-p: 0; }
```

Wrong: `HeroHome.vue` and `HeroBusiness.vue`. Right: one `Hero` read from variables, set by the context.

---

## 5. Custom properties and inheritance

Custom properties inherit. A component that reads its variables with an inline fallback can be tuned by any ancestor, a theme or a modifier, without a new selector into its parts.

**Read with a fallback; do not set a local default on the root.**

```css
/* before: the root sets its own defaults, so a parent's --card-p never arrives */
.model-card {
  --card-p: var(--space-4);
  padding: var(--card-p);
}
.model-list.-compact { --card-p: var(--space-2); }   /* has no effect */

/* after: the default sits in the fallback, the parent wins when it sets a value */
.model-card {
  padding: var(--card-p, var(--space-4));
}
.model-list.-compact { --card-p: var(--space-2); }   /* works */
```

- Name component variables after the component: `--card-p`, `--card-bg`, `--hero-bg`, `--tabs-line`.
- A modifier on the root MAY set the component's variables (it is the component's own decision).
- When the same fallback is read in several places, declare the default once with `@property --card-p { syntax: '<length>'; inherits: true; initial-value: 1rem; }` (with `inherits: true` a parent's value still arrives), or keep the repetition; both are fine.
- Prefer inheritance over repetition: set `color`, `font` and `line-height` on the root or a section and let the parts inherit. Use `currentColor` for icons and borders that follow the text.

---

## 6. Tokens and themes

Tokens are defined in the project's `theme.css` (`TOKENS-SPEC.md`). Components read semantic tokens (`--color-surface`, `--color-ink`, `--color-line`, `--color-accent`), which the theme maps to brand values.

Themes switch by changing token values under `data-theme`, on `<html>` or on any element:

```css
:root,
[data-theme] {
  /* aliases are declared here, so a nested theme recomputes them */
  --color-surface: var(--color-paper);
  color: var(--color-ink);
  background-color: var(--color-surface);
}

[data-theme='dark'] {
  --color-paper: #12100d;
  --color-ink: #f7f5ef;
  color-scheme: dark;
}

[data-theme='accent'] {
  --color-paper: var(--color-sun);
}
```

```html
<html data-theme="light">
  …
  <section data-theme="dark">     <!-- a dark band inside a light page -->
    <article class="model-card">…</article>   <!-- unchanged component, dark values -->
  </section>
</html>
```

- A custom property that refers to another (`--color-surface: var(--color-paper)`) is resolved where it is declared. Declare such aliases on `:root, [data-theme]`, as above, or a nested theme will inherit the old value.
- Respect the system choice when the visitor has not picked a theme: `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }`.
- Check contrast for every theme, not only the default.

---

## 7. States

One state, one mechanism, in this order:

1. **Native state** when the element has one: `:disabled`, `:checked`, `:invalid`, `:focus-visible`, `[open]` on `details` and `dialog`, `:popover-open`.
2. **ARIA** when the state is part of the accessible meaning: `[aria-expanded='true']`, `[aria-selected='true']`, `[aria-current='page']`, `[aria-pressed='true']`, `[aria-invalid='true']`, `[aria-busy='true']`. Set the attribute for the user first; the style follows it.
3. **`data-state`** for an application state with no native or ARIA equivalent: `[data-state='loading']`, `[data-state='error']`.

`data-theme` switches tokens (section 6) and `data-variant` MAY choose a variant set from data (a CMS value) where a class cannot be written. A visual variant in a template stays a dash modifier.

```html
<!-- before: two mechanisms that can disagree -->
<button class="menu-btn is-open" aria-expanded="true">Menu</button>

<!-- after: one source of truth, read by CSS and by assistive technology -->
<button class="menu-btn" aria-expanded="true">Menu</button>
```

```css
.menu-btn[aria-expanded='true'] .icon { rotate: 180deg; }
```

Projects that already use `is-*` or dash modifiers for state keep them; `guard.stateClasses` decides whether `ds7 guard` stays silent, advises or fails (`CONFIG.md`).

---

## 8. Cascade, layers and `!important`

The order of priority, from low to high: the UI foundation layer, the project's layers in their declared order, unlayered styles. Source order and specificity decide inside each.

- **Default (works with every DS7 project):** `@ai.all/ui` ships its foundation in the layer `aiall-ui-foundation`; the project theme and components are unlayered and win without `!important`.
- **With utilities or helpers that must win:** declare the full order once at the top of the entry stylesheet and put components into their layer too:

```css
@layer aiall-ui-foundation, base, helpers, components, utilities;
```

Utilities then override components by layer, not by `!important` or extra specificity.

Common causes of `!important` and their fix:

| Cause | Fix |
|---|---|
| A third-party or base rule is more specific | Put it in an earlier layer, or lower its weight with `:where()` |
| A utility must beat a component | `utilities` layer after `components` |
| A page fights a component | A modifier or a custom property on the component |
| Two rules for one state | One state mechanism (section 7) |
| An inline style from JavaScript | Set a custom property from JavaScript, not the property itself |

Accepted uses of `!important`: a utility whose whole purpose is to win (`.sr-only`, `[hidden]`), and user-preference overrides in a reset. `ds7 css` lists every `!important` it finds as advice.

---

## 9. Reuse

**Before writing new CSS, check in this order:** an existing component or modifier, base element styles, inheritance from the parent, a token or a component variable, a parent setting, a grouped selector, a helper, a utility. Write a new rule only when none of these fits, and choose the shortest one that does.

### Grouped selectors

One rule for elements that share a role, instead of the same declaration in many components:

```css
/* before: the same line in five components */
.hero h1 { font-family: var(--font-display); }
.price { font-family: var(--font-display); }
.quote { font-family: var(--font-display); }

/* after: one rule, zero specificity, easy to override */
:where(h1, h2, h3, h4, h5, h6, .price, .quote, .ffh) {
  font-family: var(--font-display);
}
```

### Layout primitives and utilities

Two kinds of shared rules, kept apart (CUBE CSS: composition and utility). A project adds one when a need repeats, not in advance.

**Layout primitives** from Every Layout, applied to the parent, settings as custom properties:

```css
@layer helpers {
  .stack { display: flex; flex-direction: column; justify-content: flex-start; }
  .stack > * { margin-block: 0; }
  .stack > * + * { margin-block-start: var(--stack-gap, var(--space-4)); }

  .center { box-sizing: content-box; max-inline-size: var(--center-max, var(--measure));
            margin-inline: auto; padding-inline: var(--center-gutter, var(--page-gutter)); }

  .cluster { display: flex; flex-wrap: wrap; align-items: center;
             justify-content: var(--cluster-justify, flex-start); gap: var(--cluster-gap, var(--space-2)); }

  .grid { display: grid; gap: var(--grid-gap, var(--space-4));
          grid-template-columns: repeat(auto-fit, minmax(min(var(--grid-min, 16rem), 100%), 1fr)); }

  .cover { display: flex; flex-direction: column; min-block-size: var(--cover-min, 100svh); }
  .cover > * { margin-block: var(--space-4); }
  .cover > .principal { margin-block: auto; }
}
```

Sidebar, Switcher, Frame, Reel and Imposter follow the same source when a project needs them.

**Utilities** do one job each and are not Every Layout:

```css
@layer utilities {
  .row      { display: flex; align-items: center; gap: var(--row-gap, var(--space-2)); }
  .between  { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
  .absfill  { position: absolute; inset: 0; }
  .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
```

- Use a primitive on the parent; the children stay generic.
- Do not merge styles that only look alike today but change for different reasons (a card's padding and a form's padding). Shared code is for shared meaning.
- A project that uses Tailwind or UnoCSS uses their utilities instead of writing these.

---

## 10. Layout and responsive

- A component that changes with its width sets `container-type: inline-size` on its root and uses `@container` for its parts, so it works in a page, a sidebar and a modal. A container query never styles the container itself: the root reacts to its parent's container, its parts react to the root.

```css
.model-card {
  container-type: inline-size;

  @container (width < 20rem) {
    .body { padding: var(--space-2); }
    .title { font-size: var(--text-base); }
  }
}
```
- For viewport queries in this profile, use the base scale and syntax in `TOKENS-SPEC.md` section 9. Container thresholds can differ. Run responsive checks around each threshold actually used, including fractional widths for exclusive bands; also check zoom and enlarged text.
- Prefer intrinsic layout (`auto-fit`, `minmax()`, `clamp()`, `flex-wrap`) over a breakpoint per component.
- Motion reads duration tokens, which `prefers-reduced-motion: reduce` sets to `0s` in the theme (`TOKENS-SPEC.md`), so no component needs its own media query.

---

## 11. Global and scoped styles

Scoped (or root-prefixed) styles are the default. A rule that must reach the whole page lives in the global entry (`base.css`, `theme.css`) or in a commented global block of the component, and starts with a meaningful prefix: `html.dev-outlines .dev-issue`, not `html .dev-issue`.

---

## 12. Existing projects

Nothing here forces a project to migrate. A project on BEM, Tailwind or another method keeps working and keeps its names; new components follow this document. A rename is a refactor with proof: `ds7 css diff` for the rules, screenshots at 390, 820 and 1440 px for the look.

---

## 13. Checks

- `ds7 guard` and `ds7 check`: appended modifier words (`card-big`), `is-*` state classes as set in `guard.stateClasses`, atoms that use upper layers, page style budgets, raw colours.
- `ds7 css`: dead classes and orphan stylesheets; as advice, repeated selectors, identical declaration blocks and `!important`.
- `npx @ai.all/ui check`: BEM names, appended modifiers and `!important` in ui components.
- The rest (semantics, inheritance, reuse) is review.

---

## 14. Example: one component

```vue
<template>
  <div class="tabs" :class="{ '-pill': pill }" role="tablist">
    <button
      v-for="t in tabs"
      :key="t.id"
      role="tab"
      :aria-selected="t.id === modelValue"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--space-2);
  border-bottom: var(--border-w, 1px) solid var(--tabs-line, var(--color-line));

  button {
    padding: var(--space-2) var(--space-3);
    color: var(--color-ink-600);
  }

  [aria-selected='true'] {
    color: var(--color-ink);
    box-shadow: inset 0 -2px 0 currentColor;
  }

  &.-pill {
    border-bottom: 0;

    button {
      border-radius: var(--radius-full);
    }
  }
}
</style>
```

No part class is needed: the tag and the ARIA role say what each element is, and the selected state lives in one attribute that both the browser and the style read.
