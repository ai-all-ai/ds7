# 03 · Fonts and zero layout shift

Text that jumps when a web font arrives moves the whole page and raises CLS. This document describes how DS7 avoids that.

---

## 1. The problem

1. The browser draws text with a system font first (Arial or Helvetica).
2. The system font has different glyph widths and line heights from the brand font.
3. When the brand font arrives, lines re-wrap and content moves, often 20–40 px.

---

## 2. The approach

### Step 1: preload one weight
Preload the weight used on the first screen, as `woff2`, from the document `<head>`:

```ts
// nuxt.config.ts → app.head.link
{
  rel: 'preload',
  href: '/fonts/brand-latin-var.woff2',
  as: 'font',
  type: 'font/woff2',
  crossorigin: 'anonymous',
}
```

### Step 2: matched fallback
A fallback `@font-face` built from a system font, with metrics adjusted to the brand font:

```css
@font-face {
  font-family: 'Brand Fallback';
  src: local('Arial');
  ascent-override: 95.8%;
  descent-override: 28.2%;
  line-gap-override: 0%;
  size-adjust: 101.4%;
}
```

The values come from the brand font's metrics (the `@nuxtjs/fontaine` module computes them). When the brand font loads, glyphs have the same advance widths and line boxes, so text does not move.

### Step 3: `font-display: swap`
Text appears at once with the fallback and swaps when the brand font is ready. No invisible text.

---

## 3. Checklist

- [ ] One preloaded weight for the first screen.
- [ ] Fallback with `size-adjust` and the override metrics.
- [ ] Every logo and inline SVG has `width` and `height`.
- [ ] Every card and media box has a fixed `aspect-ratio`.
- [ ] Fixed-position panels (cookie banner, intro) do not push content.
- [ ] Measured CLS recorded in `docs/METRICS.md` on a real device.
