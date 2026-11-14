# 10 · Content model

Content has three kinds, and each has one home.

| Kind | Home | Changed by | Translated |
|---|---|---|---|
| UI text (buttons, labels, errors) | `i18n/locales/<code>.ts` | developers | yes, every locale |
| Business data (products, tariffs, regions, prices) | `app/data/` | owner or developers | no; values are the same everywhere, labels come from i18n |
| Editorial content (articles, guides, FAQs) | `content/<locale>/` as Markdown with frontmatter | editors | yes, one file per locale |

---

## 1. Schemas

- Every collection has one schema. Use Zod (or the content module's own schema) and type the data from it.
- The build validates every entry. An invalid entry fails the build and names the file and the field.
- A required field is never empty in any locale. An optional field is stated as optional in the schema.

## 2. Editorial content

- Frontmatter holds: `title`, `description` (the answer block, 40–50 words), `slug`, `locale`, `updated` (ISO date), and `owner`.
- The slug is the same in every locale. Each locale file links to the others with `alternates`.
- An article without a translation in a locale is not published in that locale. The build reports it; it does not show the default language silently.
- Dates are shown in the locale's format from i18n.

## 3. Business data

- Data is in typed files in `app/data/`. Numbers (prices, capacities, limits) have a unit in the field name, for example `priceEurPerKwh`.
- A change to a price or a tariff gets a line in the CHANGELOG and a date in its `validFrom` field. Old values are not overwritten silently.

## 4. Who edits what

- Editors change `content/` through a pull request, not on the host.
- Each pull request shows the rendered page in preview (see `DEPLOYMENT.md`).
- An editor's change never needs a developer change in a component. If it does, the content model is wrong; fix the model.

## 5. Checks

| Check | How | When |
|---|---|---|
| Schemas valid | Build fails on an invalid entry | Every build |
| Translations complete | Every article has a file for each locale, or is marked `draft` for that locale | Every build |
| No orphan slugs | Every `alternates` link points to an existing file | Every build |
| Dates present | `updated` is a valid ISO date | Every build |
