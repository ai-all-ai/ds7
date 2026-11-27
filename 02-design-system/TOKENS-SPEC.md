# 02 · Design tokens

Tokens are the foundations: the named values every component uses. They live as CSS custom properties in `app/assets/css/theme.css`. Components read tokens only; they never contain raw values.

## Cascade and package defaults

The project owns its theme. Import `app/assets/css/theme.css` from
`app/assets/css/main.css` and define the project's semantic tokens and HTML
styles there. The UI kit supplies fallback values for tokens the project leaves
undefined and fallback styles for plain HTML elements. Its compiled foundation
uses the `aiall-ui-foundation` cascade layer. Keep the project theme unlayered
or in a layer ordered after the foundation. When using explicit layer ordering,
declare `aiall-ui-foundation` before project layers.

Use DS7's installed Nuxt UI module to load the foundation once. Keep old
`theme-base.css` or `base.css` files only when the project still owns overrides
in them, then move those overrides into the project theme when appropriate.
Import package defaults only once. Choose modular component styles for typical
routes or the combined sheet when one shared stylesheet matches the app's needs.

Format for tools that need it: the [W3C Design Tokens Format Module (2025.10)](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), with `$value` and `$type`.

---

## 1. Colour

```css
:root {
  /* surfaces and text */
  --color-paper: #f7f5ef;             /* page background */
  --color-white: #ffffff;             /* cards, panels */
  --color-ink: #1f1b16;               /* main text */
  --color-ink-500: #6b6459;           /* secondary text */
  --color-ink-100: rgba(31, 27, 22, 0.08); /* borders, dividers */
  --color-ink-950: #12100d;           /* dark inversions */

  /* brand accent */
  --color-sun: #ffd84d;
  --color-sun-hover: #ffcf2e;

  /* roles: what components read; the theme maps them to the palette above */
  --color-surface: var(--color-paper);   /* page and section background */
  --color-line: var(--color-ink-100);    /* borders, dividers */
  --color-ink-600: #57514a;              /* muted text, AA on paper */
  --color-accent: var(--color-sun);      /* fills, markers, focus */

  /* status */
  --color-success: #2e7d32;
  --color-warning: #ed6c02;
  --color-error: #d32f2f;
}
```

Components read the role tokens (`--color-surface`, `--color-ink`, `--color-line`, `--color-accent`) where a role exists, and palette tokens only for brand surfaces. A role that refers to another token is declared on `:root, [data-theme]` in the theme, so that a nested theme recomputes it (section 7).

**Contrast rule.** `--color-sun` is never used for text. It is a fill (buttons), a badge background, or a marker (`box-shadow: inset 0 -0.3em 0 var(--color-sun)`).

**Measure, do not estimate.** When a palette changes, check the contrast of every text and border pair with a tool, and record the result in the brandbook.

---

## 2. Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4 px */
  --space-2: 0.5rem;    /* 8 px */
  --space-3: 0.75rem;   /* 12 px */
  --space-4: 1rem;      /* 16 px */
  --space-6: 1.5rem;    /* 24 px */
  --space-8: 2rem;      /* 32 px */
  --space-12: 3rem;     /* 48 px */
  --space-16: 4rem;     /* 64 px */

  /* responsive section rhythm */
  --space-single: clamp(1.2rem, 3vw, 2.2rem);
  --space-double: clamp(2.4rem, 6vw, 4.5rem);
  --space-triple: clamp(3.6rem, 9vw, 6.5rem);

  /* page grid */
  --content-width: 78rem;               /* 1248 px */
  --page-gutter: clamp(1rem, 3.5vw, 2rem);
}
```

---

## 3. Type

```css
:root {
  --font-sans: system-ui, sans-serif;        /* body text; the brand font goes first */
  --font-display: var(--font-sans);          /* headings, prices, quotes */
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lead: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
  --text-2xl: clamp(1.75rem, 1.2rem + 2.4vw, 3rem);
  --leading: 1.5;
  --measure: 65ch;                           /* comfortable line length */
}
```

Set `font` and `line-height` once on `body` and on headings with a grouped selector (`CSS-CONVENTIONS.md`, section 9); components inherit them.

---

## 4. Elevation

```css
:root {
  --shadow-lift: 0 4px 16px -2px rgba(31, 27, 22, 0.06);   /* resting cards */
  --shadow-hover: 0 12px 32px -4px rgba(31, 27, 22, 0.12); /* hover, open items */
  --shadow-modal: 0 24px 64px -8px rgba(18, 16, 13, 0.24); /* modal dialogs */
}
```

Use these three. Do not write ad-hoc `box-shadow` values in components.

---

## 5. Radius and border

```css
:root {
  --radius-sm: 0.375rem;  /* 6 px — badges, chips */
  --radius-md: 0.75rem;   /* 12 px — cards, inputs */
  --radius-lg: 1.25rem;   /* 20 px — large section panels */
  --radius-full: 9999px;  /* pills, round buttons */
  --border-w: 1px;        /* default border width */
}
```

---

## 6. Motion and stacking

```css
:root {
  --dur-1: 150ms;                         /* hover, focus */
  --dur-2: 300ms;                         /* open, slide */
  --ease: cubic-bezier(0.2, 0, 0, 1);
  --z-sticky: 10;
  --z-modal: 100;
  --z-toast: 200;
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-1: 0s; --dur-2: 0s; }
}
```

Transitions and animations read `--dur-*`, so reduced motion is handled once in the theme, without `!important` and without a media query per component.

---

## 7. Themes

A theme changes token values, never component CSS. Write the alternative values under `[data-theme='…']`; the attribute works on `<html>` and on any element, so themes nest (a dark band in a light page). Full rules and the alias pitfall: `CSS-CONVENTIONS.md`, section 6.

```css
[data-theme='dark'] {
  --color-paper: #12100d;
  --color-white: #1f1b16;
  --color-ink: #f7f5ef;
  --color-ink-600: #b9b1a5;
  --color-line: rgba(247, 245, 239, 0.14);
  color-scheme: dark;
}
```

---

## 8. Component tokens

A component reads its own variables with a fallback to a foundation token: `padding: var(--card-p, var(--space-4))`. It does not declare them on its root, so a parent (`.model-list.-compact { --card-p: var(--space-2) }`), a theme or a modifier can set them. See `CSS-CONVENTIONS.md`, section 5.

---

## 9. Breakpoints

```css
:root {
  --bp-sm: 480px;   /* one column below this */
  --bp-md: 800px;   /* tablet-portrait boundary */
  --bp-lg: 900px;   /* two-column grids collapse here */
  --bp-xl: 1200px;  /* desktop layout */
}
```

Media queries use these values. Components prefer container queries.


---

## 10. Shared control sizes

Use `--control-height` for the minimum height of a default button, single-line
field and select. Standard defaults are 44 px for the base, 36 px for
`--control-height-small` and 52 px for `--control-height-big`.
The base component needs only its root class. Size modifiers select one of the
other tokens. Define the spacing scale from `--space-1` and use semantic
component tokens for role-specific color or decoration. A project's theme
changes token values without changing the base class or the modifier names.


---

## 11. Map the brand palette to component roles

Keep brand colors in the project palette under meaningful brand names. Assign
those values to semantic UI tokens in the project theme. For example,
`--ui-button-light-background: var(--color-porcelain)` gives the light treatment
the project's porcelain surface. Another project can assign a different
surface to that same token. Primary, secondary, bright and light modifiers
use role tokens and do not encode palette names. The base class consumes its
own base tokens and needs no modifier.
Transparent buttons keep the control height and padding. Their colors come
from `--ui-button-transparent-color`, `--ui-button-transparent-hover-background`
and `--ui-button-transparent-hover-color` so each project can map them to its
palette. A button rendered as an anchor uses the same tokens and reset.
