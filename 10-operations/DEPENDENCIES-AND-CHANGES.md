# 10 · Dependencies and change records

---

## 1. Dependency policy

- **Add a dependency only when it removes real work.** Write the reason in the pull request: what it does, why the platform or existing code cannot do it.
- **Licence:** MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause and ISC are accepted. Any other licence needs the owner's written approval.
- **Maintenance:** the package has a release in the last 12 months and a named maintainer. A package with no release for two years is replaced when a replacement exists.
- **Lockfile:** commit `package-lock.json` (or the lockfile of the package manager in use). Install with `npm ci` in CI.
- **Versions:** pin the major version of framework modules (for example `@nuxtjs/i18n`). Updates to them are reviewed as their own pull request.
- **Age:** do not adopt a version published less than seven days ago, unless it fixes a security advisory.
- **Audit:** `npm audit --omit=dev` runs before each release. High and critical advisories are fixed before release. An advisory that cannot be fixed is recorded in `docs/DECISIONS.md` with the reason, the affected path and a review date.
- **Updates:** a bot (Dependabot or Renovate) opens update pull requests weekly. Patch and minor updates are grouped. Major updates are separate.

## 2. Changesets

Use a changeset for every change that a user or the owner can see. Changesets write the CHANGELOG from short notes instead of from memory.

- Tool: `@changesets/cli`, or a plain `.changeset/` folder with one Markdown file per change.
- A change file has a type (`patch`, `minor`, `major`) and one line that says what changed for the reader.
- A pull request without a change file is not merged, unless it changes nothing visible (tests, docs for developers, formatting).
- At release, the change files are combined into the CHANGELOG section for the version and then deleted.
- A `major` change needs a migration note: what the reader must do.

Example change file:

```md
---
'my-site': minor
---

Added the Spanish locale for the tariff pages.
```

## 3. Change record

- `docs/DECISIONS.md` holds one dated entry for each decision that is hard to reverse: a new dependency, a header value, a flag policy, a retention period.
- An entry has: date, decision, reason, who decided, and what would change it.

## 4. Checks

| Check | How | When |
|---|---|---|
| Lockfile in sync | `npm ci` succeeds | Every CI run |
| No high or critical advisory | `npm audit --omit=dev` | Each release |
| Change files present | Review or a script that compares the diff with `.changeset/` | Every pull request |
| Decisions recorded | `docs/DECISIONS.md` has an entry for each new dependency and header change | Each release |
