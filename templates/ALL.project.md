## 1. Project identity & brand intake

- **Brand Specification:** Read [docs/BRAND.md](docs/BRAND.md) for official brand tokens, typography, colors, tone of voice, and screen requirements before creating or modifying UI elements.
- **Languages:** Code, commits, comments, and instructions in English. User chat in Russian. Website localized via `i18n/`.

## 2. Core workflow: Brandbook first & strict modifiers

1. **Brandbook is source of truth:** Check `/ui` (`app/pages/ui.vue`) before writing markup. Reuse existing atoms (`BTN-01`, `CARD-01`). New elements must be registered in `/ui` first.
2. **Modifier architecture:** Use base class plus separate dash-prefixed modifier (e.g. `class="p-card -top -compact"`). Compounded class names (`card-big`, `btn-active`, `*-orange`) are strictly forbidden.
3. **Guard enforcement:** Run `make guard` (or `npx @ai.all/ds7 guard`) before finishing any UI task.
4. **Convenient shortcuts:** Use `Makefile` (`make dev`, `make guard`, `make images`, `make build`).
5. **Style budget:** Pages (`pages/*.vue`) must not exceed 40 lines of scoped CSS. Shared styles belong in component files or design system tokens.
6. **Code quality:** Vue 3 `<script setup lang="ts">`, typed props/emits, no dead code. Log unresolved issues in `docs/BACKLOG.md`.

## 3. Project-specific documentation

| Trigger | Document | Purpose |
| --- | --- | --- |
| Brand tokens, colors, typography, tone | docs/BRAND.md | Project brand specification & intake |
| Running project locally, dev server, ports | docs/DEV-SERVER.md | Local dev server requirements & commands |
| Task debt, unresolved items | docs/BACKLOG.md | Project issue tracker & completed work |
