# 01 · Project Onboarding & Brand Intake

How to set up a new web project with DS7 so developers and AI agents can build components and pages without repetitive briefings or circular questions.

---

## 1. The 4-Step Onboarding Flow

```text
Step 1: Install standard & Brand Intake
  └─► npx @ai.all/ds7 init (answers 4 interactive questions or accepts defaults)

Step 2: Review Brand Specification
  └─► docs/BRAND.md (the single source of truth for visual identity & scope)

Step 3: Verify Foundations in Brandbook
  └─► Start dev server (make dev), open /ui, verify tokens & base buttons

Step 4: Build Components-First & Quality Gate
  └─► Add atoms/molecules to /ui with IDs (CARD-01, BTN-01), run "make check" (ds7 check)
```

---

## 2. Brand Specification (`docs/BRAND.md`)

The file `docs/BRAND.md` is created during `init` and replaces endless prompt explanations. Once filled, any AI agent reads it on the first turn to understand the design system context.

### What it covers:
1. **Brand Identity:** Name, tagline, target audience, local geography (e.g. Seville, Spain).
2. **Color Palette:** Semantic role mapping (primary brand color, neutral paper/canvas, dark ink, accent highlights).
3. **Typography:** Font families for display/headings and body prose, font weights, and loading strategy (e.g. `@fontsource/*` or local woff2).
4. **Tone of Voice:** Editorial register (luxurious, authoritative, technical, warm).
5. **Key Screens & Conversion Funnels:** Target pages, primary CTA actions, and contact/lead points.

---

## 3. Technology Independence

DS7 rules are designed to work across any web platform:
- **Design Tokens:** Standard CSS custom properties (`var(--color-primary)`), usable in vanilla CSS, and in Tailwind CSS, UnoCSS, Sass or CSS-in-JS when a project uses them.
- **Modifier System:** short inner part names under the root (`.p-card .title`) and dash-prefixed modifier classes (`.-top`, `.-compact`), compatible with HTML, Vue, React, Svelte, and Astro.
- **Guard Validation:** The built-in validator inspects class patterns in any template markup, enforcing consistent styling regardless of build tooling.
