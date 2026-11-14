# 02 · Design tokens

Tokens are the foundations: the named values every component uses. They live as CSS custom properties in `app/assets/css/theme.css`. Components read tokens only; they never contain raw values.

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

  /* semantic */
  --color-success: #2e7d32;
  --color-warning: #ed6c02;
  --color-error: #d32f2f;
}
```

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

## 3. Elevation

```css
:root {
  --shadow-lift: 0 4px 16px -2px rgba(31, 27, 22, 0.06);   /* resting cards */
  --shadow-hover: 0 12px 32px -4px rgba(31, 27, 22, 0.12); /* hover, open items */
  --shadow-modal: 0 24px 64px -8px rgba(18, 16, 13, 0.24); /* modal dialogs */
}
```

Use these three. Do not write ad-hoc `box-shadow` values in components.

---

## 4. Radius

```css
:root {
  --radius-sm: 0.375rem;  /* 6 px — badges, chips */
  --radius-md: 0.75rem;   /* 12 px — cards, inputs */
  --radius-lg: 1.25rem;   /* 20 px — large section panels */
  --radius-full: 9999px;  /* pills, round buttons */
}
```

---

## 5. Breakpoints

```css
:root {
  --bp-sm: 480px;   /* one column below this */
  --bp-md: 800px;   /* tablet-portrait boundary */
  --bp-lg: 900px;   /* two-column grids collapse here */
  --bp-xl: 1200px;  /* desktop layout */
}
```

Media queries use these values. Components prefer container queries.
