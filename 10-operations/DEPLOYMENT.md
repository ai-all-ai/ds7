# 10 · Deployment, preview, rollback and feature flags

---

## 1. Environments

| Environment | Source | Purpose | Who can deploy |
|---|---|---|---|
| Preview | every pull request | review the change on a real URL | anyone with write access |
| Staging | `main` | final check with real content and forms (forms go to a test inbox) | automatic |
| Production | a release tag | the public site | the owner, after the checklist |

Preview and staging use the same build as production. Only the environment variables differ.

## 2. Build

- The build is static (`nuxt generate`). Every route is prerendered, including `404.html`.
- The build fails when a referenced asset, a locale key or a structured-data value is missing (see `ALL.md` sections 5 and 7).
- The build output is not committed. The host builds it from the commit.

## 3. Release checklist

1. The CI checks are green: tests, format, axe, i18n parity, asset references.
2. The staging URL works at 390, 820 and 1440 px. The 404 page and the three main flows are checked.
3. Security headers are present on staging (see `09-security-errors/SECURITY-AND-ERRORS.md`).
4. The CHANGELOG has a section for the release. Breaking content changes are listed.
5. The owner approves the tag. Then the production deploy runs.

## 4. After deploy

- Check the headers and the 404 status on the production URL.
- Check the home page and one flow in each locale.
- Watch the error rate and the Web Vitals for 30 minutes (see `OBSERVABILITY.md`).

## 5. Rollback

- Keep the last three production builds available on the host. Each build is named by its commit.
- Rollback means: point production to the previous build. No code change is needed.
- Target: rollback in under 10 minutes. Rehearse it once per quarter on staging.
- A rollback is recorded in `docs/DECISIONS.md` with the reason and the commit that was removed.
- Do not roll back database or form data. Fix the content or the code forward.

## 6. Feature flags

- A flag is a typed value in one file, for example `app/data/flags.ts`. Default is `false`.
- Flags exist for a launch, an experiment or a risky change. Each flag has an owner and a removal date in its comment.
- Flags are read in one composable. Components do not read raw environment variables.
- Flags are evaluated at build time for pages that are prerendered. A flag change needs a new build.
- Remove a flag after the feature is live for two releases. Record the removal in the CHANGELOG.
- Never hide a security or consent behaviour behind a flag.

## 7. Checks

| Check | How | When |
|---|---|---|
| Production build is reproducible | Build twice from the same commit; output hashes for routes match | Monthly |
| Rollback works | Deploy build N-1 on staging, run the checklist, restore | Quarterly |
| Flags have owners and dates | Lint or review: each flag has `owner:` and `remove-by:` in its comment | Each release |
