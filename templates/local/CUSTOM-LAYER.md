# Custom layer of this project

What this project does differently from DS7 (and from the UI kit), written as text. Nothing here lives inside a vendored file: `ds7/` stays exactly as the package ships it, so `ds7 update` replaces it cleanly. After every update, read this file and check that each item still holds. When a new version takes an item over, delete it here.

A patch carries a one-line edit well and a changed project badly: when upstream moves the same lines it stops applying. A description always survives. Use `ds7 patch <file>` only for a small, stable edit; describe everything else here.

## 1. Rules that are stricter or more specific than DS7

- (one line each: the rule, and where it is documented)

## 2. Settings of the packages

- (how the project connects the UI kit and which package defaults it turns off, and why)

## 3. `ds7.config.json`

- (the keys the project sets and what they stand for)

## 4. Local tools that stay

| Tool | Why it stays |
| --- | --- |
| (script) | (what it checks that the DS7 command does not) |

## 5. After every update

1. `npm i -D @ai.all/ds7@latest`, then `npx ds7 update` (`--no-patches` when old patches no longer apply).
2. Read the new section of `ds7/CHANGELOG.md`. For each item above, check it still holds and still differs from upstream.
3. Run the project's checks and build, and compare the main pages at 390, 820 and 1440 px with the previous build.
4. Record what changed in the project's `CHANGELOG.md`.
