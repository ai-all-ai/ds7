---
name: code-audit
description: Clean up and optimise the code without changing how the site looks or works: baseline, measure, small proven steps. Use for clean-up, deduplication, dead code or splitting large files.
---

# Code audit

Goal: fewer repeats, small files with one job, and a site that looks and behaves exactly as before.

## Order of work

1. **Baseline.** A clean `git status`, then `npx ds7 check --strict`, the build and `npx ds7 audit`. Screenshots of the key pages at 390, 820 and 1440 px.
2. **Measure before changing.** `npx ds7 css` (dead classes, orphan stylesheets, repeated selectors and blocks, `!important`), `npx ds7 unused` (components, exports, data, assets), `npx ds7 images dupes`, file sizes. Report the numbers first.
3. **Plan by concern,** smallest and safest first. One concern per change and per commit.
4. **Change with proof.**
   - The same declarations in three or more rules become one shared rule or a token.
   - One file, one job: split by block, keep the import order of the entry file.
   - Remove code only when the build passes and `npx ds7 graph --uses <Name>` finds no user.
   - A helper copied for the third time moves to a shared folder.
5. **Prove.** Run the checks again; `npx ds7 css diff <rev>` shows only the rules you meant to lose or gain; compare the screenshots.
6. **Report.** What changed, how it was proven, what was not run, and what is left with the next step for each.

## Pitfalls

- A key written twice in one object silently drops the first (Gate 3 of `ds7 check` reports it in locale files).
- Renaming a class without comparing specificity can change which rule wins.
- Reordering imports while splitting a stylesheet changes the cascade.
