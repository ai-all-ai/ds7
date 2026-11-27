# 02 · Brandbook and sandbox (`/ui`)

The `/ui` page of a project is a live sandbox: every foundation token and every base component, shown in its real code. It is the shared vocabulary between people and agents.

---

## 1. Stable component IDs

Every reusable pattern has one short ID:

| ID | Name | Use |
|---|---|---|
| `BTN-01` | Default button | `.btn`; theme color and shared control height |
| `BTN-07` | Primary button | `.btn -primary`; emphasized action |
| `BTN-08` | Bright button | `.btn -bright`; theme-defined high emphasis |
| `BTN-09` | Light button | `.btn -light`; theme-defined light surface |
| `BTN-02` | Outline button | secondary action |
| `CTL-01` | Segmented switch | tabs or periods |
| `COUNTER-01` | Bounded numeric counter | number input with − / + buttons; variant `-inner` |
| `PRICE-01` | Formatted price | amount with currency suffix and optional "from" label |
| `CARD-01` | Base product card | catalogue item with modifiers |
| `CARD-02` | Plan / tariff card | package with a list of options |
| `SLD-01` | Card slider | scroll-snap slider with navigation |
| `HOOK-01` | Overlap hook | panel that overlaps a cover image |

**How it is used.** Instead of describing a card in full, say:

> "Put `CARD-01 -top` in this block, with `BTN-01` as the action."

Both a person and an agent understand that without a second description.

---

## 2. What the sandbox shows

The sandbox comes from [`@ai.all/ui`](https://github.com/ai-all-ai/ui), a dependency of DS7. Run `npx ds7 init` after installing DS7. It registers the UI module and pack, and creates the Brandbook page and project CSS entry when missing. Put brand overrides in `app/assets/css/theme.css` and follow the cascade rules in [Tokens](TOKENS-SPEC.md). The optimized UI package excludes the managed sandbox from production by default. Enable `aiallUi.brandbook: true` when it is needed in a deployed review environment. The package supplies these tabs:

1. **Foundations:** colours, typography, spacing, radii and shadows.
2. **Tokens:** the base declarations, project assignments and browser-resolved values.
3. **Tags:** plain HTML examples with tag names and descriptions.
4. **Components:** the default class and its explicit role, size and context variants, with examples and copyable code.
5. **Component list:** IDs in a filterable table, exportable as Markdown.
6. **Component theme:** compare base UI and the project theme on the same controls. Changing the base height in the preview updates the default button, field and select together.
7. **Tools:** layout grid, rhythm, outlines, viewport size and the dev-only source gallery when enabled.

Keep the base brandbook in the package. Existing sites can register their
own top-level tabs for project brand, components or organisms using the
package's sections and named slots. Keep those examples in the project and
supply theme values through CSS variables so package updates continue to
update the standard tabs.

Components are added to the project one by one with `npx @ai.all/ui add <Name>`; project components go next to them in `app/components/ui/`.

---

## 3. Update rule

Every new atom, molecule or token must appear in the sandbox before it is used on a page. A component that is missing from `/ui` is not finished. The sandbox is excluded from search indexing (`noindex, nofollow`) and from `sitemap.xml`.

---

## 4. Brand-first workflow

1. Add or change foundations in `theme.css`.
2. Add or change the entry in the sandbox.
3. Build or change the component.
4. Use the component on a page.

Changing a token changes the sandbox first; the sandbox is the visual reference for review.
