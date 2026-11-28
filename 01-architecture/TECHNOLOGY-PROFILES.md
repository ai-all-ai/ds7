# 01 · Technology profiles

DS7 owns the standards; a project chooses its implementation. The CSS, rendering and build choices are independent. Record the choices, browser targets and exceptions in the project's `docs/DECISIONS.md` before changing its architecture. Existing projects keep their working conventions until a measured, reviewed migration is worthwhile.

## Status and force

These are separate axes. **AS-IS** describes observed code; **TARGET** an intended architecture; **PLANNED** scheduled work; **IMPLEMENTED** code that exists; **VERIFIED** code checked by a named, reproducible test or build; **EXPERIMENTAL** a hypothesis; **LEGACY** a supported older solution; **DEPRECATED** a solution scheduled for removal. A document alone cannot make a feature IMPLEMENTED or VERIFIED.

**MUST** and **MUST NOT** express requirements of the selected profile. **SHOULD** is the recommended choice with a documented reason to diverge. **MAY** is an allowed choice. Do not turn a preference for DS Native Contextual into a global ban on BEM, Tailwind, Sass or Vue scoped CSS.

## Choose three axes

| Axis | Choices | Default decision |
| --- | --- | --- |
| CSS | DS Native Contextual, plain CSS, BEM, RSCSS, CUBE, Tailwind, UnoCSS, Sass/Less, CSS Modules, Vue scoped CSS, existing/custom | Prefer DS Native Contextual for new work; respect an existing method. |
| Rendering | static HTML, HTML + vanilla JS, Astro SSG/islands, Eleventy, Vue SPA, Nuxt SSG/SSR/hybrid, Magento/Hyvä, existing/custom | Choose the least client runtime that meets the content and interaction requirements. |
| Build | native modern, compatibility, modular, optimized, experimental mangling | Start with the project's current build; change only after measuring its output. |

These names describe decisions, not a new unified CLI configuration API. `ds7.config.json` still configures the existing DS7 commands; `css.profile: "ds-native"` opts into its native CSS syntax checks, while framework-specific settings stay in their own tools. DS7's `init`, layout rules and most CLI defaults currently target Nuxt 4. Other profiles may use the documentation and applicable audits now, but must configure their own build and pass the relevant gates. Do not claim the Nuxt-specific gates validate an Astro or plain HTML project.

## Shared architecture

Semantic HTML → inheritance → reuse → compact source → minimal production → optimized delivery. Prefer CSS for layout and responsive behavior, native controls where their behavior meets the task, and progressive enhancement for optional interactions. Use JavaScript for behavior that HTML and CSS cannot provide well. Pure business logic has no Vue or DOM imports. A DOM adapter has a local root, supports multiple instances and returns cleanup; a Vue adapter owns its own state and lifecycle. They must not control the same DOM node at once.

A component contract documents only what consumers need: semantic structure, root and local CSS classes, modifiers, public tokens, state and accessibility, props/slots/events when present, SSR behavior, and import paths that actually exist. A simple static component needs no adapter or formal contract file. If several renderers share markup, compare them with fixtures or contract tests.

## Rendering guidance

- **Static HTML:** use local CSS and build-time templates for repeated site chrome. Core content remains in the generated HTML; browser delivery needs no Node, npm or Vue.
- **HTML + vanilla JS:** add a module only for required interaction. Importing it has no DOM or `window` side effect; initialize against a root after the DOM exists and remove listeners, timers and observers on cleanup.
- **Astro:** static components render HTML without a `client:*` directive. Hydrate only an interactive island, at a time that preserves usability. `client:only` has no server-rendered component HTML. Verify actual generated HTML and JavaScript before claiming zero hydration.
- **Nuxt:** SSG, SSR and hybrid are supported profiles. Server-rendered HTML may still hydrate Vue on the client. `noScripts`, islands and route rules require checks against the installed Nuxt version and the generated output. Static hosting does not supply server functions.
- **Vue SPA / Magento / Hyvä / legacy:** retain the working stack, its accessibility and SEO requirements, and its established CSS method unless the project chooses a scoped migration.

## Build and evidence

An npm dependency is not proof of browser payload. Inspect emitted HTML, routes, manifest, CSS and JS chunks, then network requests. Dev-only routes, gallery handlers and overlays must be excluded by the build, not just hidden by a runtime `v-if`. Compare raw, minified, gzip and Brotli sizes of equivalent HTML + CSS + JS, with the same content and assets. Record tool versions, browser targets, commands and results in `docs/METRICS.md`. Class mangling, adaptive CSS and a custom compiler remain EXPERIMENTAL and disabled by default.

## Package ownership (AS-IS and TARGET)

- **DS7 — AS-IS:** canonical rules, templates, agent pack and CLI checks. Its current installer also depends on AIALL and UI and scaffolds a Nuxt project. That installer behavior is not a requirement to use Nuxt or Vue in every project.
- **AIALL — AS-IS:** synchronizes entrypoints and delivers the DS7 pack. DS7 is the source of the rules; AIALL does not maintain another CSS standard.
- **UI — AS-IS:** the package contains Vue components, CSS foundation, a development Brandbook, overlay and asset gallery. Their existence is verified from source; production isolation and consumer output need separate build verification. The gallery is a development tool, not a public photo gallery.
- **DS Core — TARGET:** a separate, framework-independent CSS implementation of DS7 standards. No standalone DS Core dependency or the proposed subpath exports are part of the current DS7 contract.

Official references: [CSS Nesting](https://www.w3.org/TR/css-nesting-1/), [Media Queries 4](https://www.w3.org/TR/mediaqueries-4/), [Astro islands](https://docs.astro.build/en/concepts/islands/), [Nuxt rendering](https://nuxt.com/docs/4.x/guide/concepts/rendering), [Vue SSR](https://vuejs.org/guide/scaling-up/ssr.html).
