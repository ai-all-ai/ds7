# 02 · Brandbook and sandbox (`/ui`)

The `/ui` page of a project is a live sandbox: every foundation token and every base component, shown in its real code. It is the shared vocabulary between people and agents.

---

## 1. Stable component IDs

Every reusable pattern has one short ID:

| ID | Name | Use |
|---|---|---|
| `BTN-01` | Primary button | main action; sun fill with an arrow |
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

The sandbox comes from [`@ai.all/ui`](https://github.com/ai-all-ai/ui), a dependency of DS7. Run `npx ds7 init` after installing DS7. It registers the UI module and pack, and creates the Brandbook page and project CSS entry when missing. Put brand overrides in `app/assets/css/theme.css` and follow the cascade rules in [Tokens](TOKENS-SPEC.md). The optimized UI package excludes the managed sandbox from production by default. Enable `aiallUi.brandbook: true` when it is needed in a deployed review environment. The page has five tabs:

1. **Foundations:** every colour token in groups with its live value and contrast, type, space, radius, shadow.
2. **Base elements:** a sample page in plain HTML with each tag and its purpose in the margin.
3. **Components:** every pattern ID with its variants in labelled rows of sizes, states (hover, active, focus, disabled) and dark, each with its class, HTML and Vue code to copy.
4. **Catalog:** all IDs in one filterable table, exportable as Markdown.
5. **Dev tools:** layout grid, baseline rhythm, outlines, viewport size and a visual check of alt, labels, headings and SEO basics.

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
