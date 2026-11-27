# 02 · CSS sources: what DS7 takes, from whom, and why

DS7 does not adopt one methodology in full. It takes the ideas below, and each one is optional where a project has a reason not to use it. The list says where each idea comes from and why it helps. Nothing here is a mandatory requirement, unless a rule elsewhere says so.

| Idea | From | What DS7 takes | Why it helps |
|---|---|---|---|
| Atomic Design | Brad Frost | Components built in layers: atoms, molecules, organisms | Reuse, one place to change a control |
| Short root names, dash modifiers | RSCSS (inspired) | `btn`, `model-card`, `.-sm` | Short names, small HTML |
| Cascade, composition, exceptions | CUBE CSS | Let the cascade and inheritance do the work; exceptions stay local | Less code, fewer overrides |
| Layout from the parent | Every Layout (Heydon Pickering, Andy Bell) | Stack, cluster, grid and sidebar composed by the container | Adapts to content and width without breakpoints for every component |
| Semantic HTML first | HTML and WAI-ARIA specifications | Native tags before classes; native states (`disabled`, `open`) | SEO, accessibility, less markup |
| Native CSS Nesting | CSS Nesting Module, W3C | Parts written inside the root, no preprocessor | Standard browser feature, readable, no build step |
| Design tokens as custom properties | W3C Design Tokens community, CSS Custom Properties | Themes and per-component settings through `--var` with fallbacks | Theming without rewriting components |
| Compact atomic utilities | Tailwind CSS, Tachyons-style utilities (optional) | Small single-purpose classes where they are faster | Fast prototyping, small bundles |
| Utility engine | UnoCSS (optional) | Same idea as above, configurable | Use when a project already needs it |
| Small, fast tools | Lightning CSS, cssnano (optional) | Minify and check browser support at build time | Smaller files without manual work |
| Accessibility checks | WCAG 2.2 (W3C) | Target AA: contrast, focus, reduced motion | Legal and user requirement |

## What DS7 does not take

- **BEM** (`block__element`, `block--modifier`). Its names are longer and add no meaning in the native nesting model.
- **Mandatory Tailwind.** It stays an optional tool, as the table says.
- **Experimental compilers and minifiers of class names.** Left for a later release (see the roadmap).

## How to choose

Use the simplest tool that keeps the project clear and does not break other components. A project may mix a few of these ideas, but each choice should have a reason written in its own docs.
