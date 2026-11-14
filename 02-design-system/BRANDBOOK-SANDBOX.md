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

1. **Modifier toggles** for each component: `-top`, `-new`, `-compact`, `-dark`.
2. **Background switch:** light, dark, inside a modal. Contrast is visible on each.
3. **Copy code** next to each example: the reference snippet for pasting into a project.

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
