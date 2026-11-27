# 02 · CSS sources and optional tools

What the DS7 recommended profile takes from each method and tool, as reference points: DS7 builds on the experience of others and writes everything by its own rules. The rules themselves are in `CSS-CONVENTIONS.md`. No tool on this page is mandatory: plain CSS with custom properties and native nesting is enough for a DS7 project.

---

## 1. The recommended profile

Each method below is described the way its authors define it, then what DS7 takes and where DS7 deliberately differs. Where DS7 takes a part, the rule in `CSS-CONVENTIONS.md` works the way the method intends.

### Atomic Design (Brad Frost)

- **How it works:** a mental model for building interfaces in five levels: atoms, molecules, organisms, templates, pages. It is not a CSS naming method.
- **DS7 takes:** the five levels as component folders (`01-architecture/ATOMIC-DESIGN.md`) and the pattern library as the `/ui` brandbook.
- **DS7 differs:** nothing.

### RSCSS (Rico Sta. Cruz), inspired

- **How it works:** a component name has at least two words (`.search-form`); its elements are one word (`.title`) and are reached with the child selector (`.search-form > .title`); variants start with a dash (`.-wide`) on components and elements; a parent never styles the inside of a nested component, it uses a variant; position, margin and width of a component are set by its parent; nesting stays at one level; helpers start with an underscore (`._unmargin`).
- **DS7 takes:** one-word parts, dash variants, the child selector where a component may contain other components, no styling of nested components from outside, layout from the parent, shallow nesting.
- **DS7 differs:** a root may be one word (`btn`, `hero`) when it is clear, because short names were asked for; the collision check in `CSS-CONVENTIONS.md`, section 1, replaces the protection the second word gave. Semantic tags come before classes (RSCSS prefers classes over tags). Helpers carry no underscore.

### CUBE CSS (Andy Bell)

- **How it works:** CSS first: global styles, the cascade and inheritance do most of the work. Then four kinds of rules: **Composition** (layout of the parent, such as flow and grid), **Utility** (one job, often generated from tokens), **Block** (a component, small because the layers above did most of the work) and **Exception** (a variation of a block, written as a `data-*` attribute, for example `data-state="reversed"`). Optional brackets group classes in the markup: `class="[ card ] [ section box ] [ bg-base ]"`.
- **DS7 takes:** global and inherited styles first, the composition, utility and block split (layout primitives, utilities, components) and the use of `data-*` for exceptions that come from state or data (`data-state`, `data-variant`).
- **DS7 differs:** a variant written in a template is a dash modifier (from RSCSS), not a `data-*` attribute. No bracket grouping.

### Every Layout (Heydon Pickering, Andy Bell)

- **How it works:** layout primitives that adapt to their content without breakpoints: Stack (vertical rhythm with `> * + *` margins), Box, Center (`max-inline-size` with `margin-inline: auto`, `box-sizing: content-box`), Cluster (wrapping row with `gap`), Sidebar, Switcher, Cover (full-height area with a centred principal element), Grid (`auto-fit` with `minmax(min(…, 100%), 1fr)`), Frame, Reel, Imposter, Icon. Each takes its settings as custom properties and is applied to the parent.
- **DS7 takes:** the primitives as written there (`stack`, `center`, `cluster`, `grid`, `cover`, and the others when a project needs them), settings as custom properties, intrinsic layout before media queries.
- **DS7 differs:** nothing in the primitives. The small utilities DS7 lists next to them (`row`, `between`, `absfill`, `ellipsis`) are not Every Layout; they are CUBE-style utilities.

### Semantic HTML and WAI-ARIA

- **How it works:** the right element carries meaning and behaviour by itself. The first rule of ARIA: do not use ARIA when a native element or attribute does the job.
- **DS7 takes:** tags before classes; states in the order native, then ARIA, then `data-state`.

### Native CSS Nesting (CSS Nesting Module Level 1, W3C)

- **How it works:** rules nested in a parent rule, `&` for the parent, the relaxed syntax lets a nested selector start with a tag; a nested selector is resolved like `:is(parent) child`.
- **DS7 takes:** the main syntax, no preprocessor; the specificity notes follow from the `:is()` behaviour.

### Design tokens and custom properties (W3C Design Tokens Community Group, CSS Custom Properties)

- **How it works:** named design decisions; the token format uses `$value` and `$type`; custom properties inherit and resolve `var()` where they are declared.
- **DS7 takes:** tokens as custom properties, themes through `data-theme`, component variables read with fallbacks.

### Cascade layers (CSS Cascade Level 5) and WCAG 2.2

- **Cascade layers:** priority by declared layer order, before specificity. DS7 orders foundation, base, helpers, components and utilities this way instead of using `!important`.
- **WCAG 2.2 AA:** contrast, focus, keyboard, reduced motion. DS7 makes it a MUST in every profile.

**Not in the profile: BEM** (`block__element`, `block--modifier`). In the nesting model its names are longer and add no meaning. A project that already uses BEM keeps it; DS7 does not ask for a migration.

---

## 2. Tools: what DS7 takes from each

The table names only the parts DS7 uses, as reference points. Each tool has much more in its own documentation, with longer examples; read it there when needed. DS7 does not copy a tool: it takes the idea, writes it in plain CSS by its own rules (tokens, short names, nesting, layers) and keeps the code small.

| Tool | What DS7 takes | What DS7 leaves | Use in a project |
|---|---|---|---|
| **Tailwind CSS** | Short single-purpose utilities for the few cases that repeat (`.ellipsis`, `.sr-only`); a fixed scale of spacing and type, which DS7 keeps as tokens | Utility classes for whole components; long class lists in templates; its config as a second source of tokens | Recommended only where it adds little code: on-demand generation, theme mapped to the DS7 tokens, components still written by DS7 rules |
| **UnoCSS** | The same utility idea with a small engine and rules you define yourself | Presets that bring in a second naming system | Same as Tailwind; a good fit when the project wants a few utilities of its own and nothing else |
| **Lightning CSS** | Build-time minification, vendor prefixes and lowering of native nesting for older browsers | Nothing: it changes the output, not how the source is written | Recommended in the build; the source stays plain CSS |
| **SCSS / Sass** | The habit of nesting parts inside the root, now native CSS; loops for generated sets where really needed | `$variables` for anything a theme or a parent must change (they are fixed at build time); mixins that duplicate rules | Only for existing code or generated rule sets |
| **LESS** | Nothing new beyond Sass | All of it for new code | Only to keep an existing LESS code base working |
| **CSS Modules** | The rule that a component's names never leak, which DS7 gets from the root-class boundary and `<style scoped>` | Hashed names and imports of class names in scripts | Only where a stack has no scoped styles (some React setups) |

Short example of the approach, a Tailwind idea written the DS7 way:

```html
<!-- Tailwind -->
<p class="overflow-hidden text-ellipsis whitespace-nowrap">…</p>

<!-- DS7: one helper, made when the need repeats (CSS-CONVENTIONS.md, section 9) -->
<p class="ellipsis">…</p>
```

Any tool a project adds is written down with its reason in `docs/DECISIONS.md`. The DS7 rules (tokens, semantics, accessibility, component boundaries) stay the same with any of them.

---

## 3. Not in this release

Class-name manglers, a CSS compiler of its own, automatic factorisation of rules, complex bundling and a critical CSS engine are on the roadmap (`ROADMAP.md` in the DS7 repository). The production optimisation in use today stays: unused rules removed at build, minification, component styles inlined per page (`03-performance-web-vitals/CRITICAL-CSS.md`).
