# 01 · Atomic Design and component levels

Components are organised in five levels, after [Brad Frost's Atomic Design](https://atomicdesign.bradfrost.com/chapter-2/). Each level depends only on the levels below it. The goal is that a block works anywhere: on a page, in a sidebar, in a modal, or nested inside another block.

---

## 1. Levels

```
[1. Atoms]       indivisible parts: button, icon, badge, field, price
      │
[2. Molecules]   small groups of atoms: product card, plan card, slider controls
      │
[3. Organisms]   self-contained widgets: card slider, feature grid, FAQ, calculator
      │
[4. Templates]   section layouts that compose organisms
      │
[5. Pages]       routes: fetch data, set SEO, pass props
```

---

## 2. Rules per level

### Atoms — `app/components/ui/`
- Examples: `UiButton`, `UiIcon`, `UiPrice`, `UiBadge`, `UiField`, `UiLink`.
- Know nothing about pages, products or application state.
- Styled with a base class and short modifiers: `.btn.-sun`, `.btn.-sm`, `.btn.-outline`.

### Molecules — `app/components/ui/`
- Examples: `UiProductCard`, `UiSectionHeading`, `UiFeatureCard`, `UiPlanCard`, `UiSliderNav`.
- Built only from atoms and plain markup. Typed props and slots. No side effects.
- Must look right in a four-column grid and in a narrow sidebar. Use container queries.

### Organisms — `app/components/ui/`, `sections/`, `site/`
- Examples: `UiCardSlider`, `UiFeatureGrid`, `UiFaq`, `CalcPanel`, `SiteHeader`, `SiteFooter`.
- Own their local state: scroll position, active tab, open accordion item.
- Work through slots. A slider does not know that it shows products; it shows whatever molecules it receives.

### Templates and sections — `app/components/sections/`
- Compose organisms into a complete block of a page.
- No URL-specific logic and no hard-coded page content.

### Pages — `app/pages/`
Pages do three things only:
1. Call composables that read data from `app/data/`.
2. Set page metadata (`usePageSeo`).
3. Pass data to sections as props.

Pages do not contain inline card markup, custom sliders or bespoke grids.

---

## 3. Embedding rule

Every component must be placeable:
1. in normal page flow;
2. inside a modal;
3. inside a tab or a calculator panel;
4. inside a narrow sidebar or a drawer.

Size comes from the parent box (`@container`), not from the screen (`@media`).

---

## 4. Brand first

Levels are built top-down from the brandbook. Atoms come from tokens and the sandbox entries in `02-design-system/BRANDBOOK-SANDBOX.md`. A component that exists only in a page is not finished until it is in the sandbox.
