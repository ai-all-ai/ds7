# Security and error pages

> Applies to every DS7 site. Rules for agents are in `ALL.md` sections 6 and 12; this file explains the baseline and how to check it.

## 1. Security headers

Set them where the site is served (host configuration, a `_headers` file, or a server middleware). Start from this baseline:

| Header | Baseline value | Note |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | Add a third-party origin only when a consented feature needs it. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enable only after HTTPS works on every subdomain. |
| `X-Content-Type-Options` | `nosniff` | |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Open a permission only for a feature that needs it. |
| `X-Frame-Options` | `DENY` | Legacy fallback for `frame-ancestors`. |

Rules:

- Introduce a Content Security Policy first as `Content-Security-Policy-Report-Only`. Read the violations for one release, fix them, then enforce.
- Nuxt generates inline scripts for hydration. Allow them with hashes or nonces, or with a header module (for example `nuxt-security`). Check the module's options against the Nuxt version in use.
- A change to any header is recorded in `docs/DECISIONS.md` with the date and the reason.

## 2. Secrets

- Secrets (API keys, tokens, passwords) live in the host's environment or in a git-ignored `.env`. They never appear in code, docs, fixtures or screenshots.
- Keep secrets in the server-only runtime configuration. Values in the public runtime configuration reach the browser.
- `.env.example` lists variable **names** with empty values.
- Before each push, search the diff for values, for example `git grep -nE "(api[_-]?key|secret|token|password)[[:space:]]*[:=]"`, and review every hit.

## 3. Dependencies

- Commit the lockfile.
- Before each release, run `npm audit --omit=dev`. Fix high and critical advisories. If a fix is not possible, record the advisory, the reason and the review date in `docs/DECISIONS.md`.
- A new dependency needs a reason, an active maintainer and a licence. MIT, Apache-2.0, BSD and ISC are accepted; any other licence needs the owner's approval.
- Pin major versions of framework modules (see `ALL.md` section 12).
- The full dependency policy, with licences, maintenance and update rules, is in `10-operations/DEPENDENCIES-AND-CHANGES.md`.

## 4. Input

- Every input from a user, a query string or an API response is validated against one schema per endpoint. Client-side validation improves the experience but does not replace the server check.
- Validation errors are shown in the visitor's language through the i18n layer.

## 5. Error pages

- **404:** the response status is `404`, not `200`. The page uses the site layout, has one `<h1>`, links to the home page and to the main sections, is translated for every locale and is marked `noindex`. It does not repeat the requested path as HTML.
- **500 and build failures:** a short, translated message and a way back to the home page. No stack traces, file paths or environment values are shown.
- **Offline or failed request:** a visible message with a retry action. Typed form data is kept in the page where that is safe.
- **Empty states:** say what is missing and what the visitor can do next. Text comes from the i18n layer.
- In Nuxt 4, `app/error.vue` renders the error pages (check the behaviour for the Nuxt version in use). The static build must output a `404.html`.

## 6. Checks

| Check | How | When |
|---|---|---|
| Headers | `curl -sI https://<site>/` and compare with the table | After each deploy |
| 404 status | `curl -s -o /dev/null -w "%{http_code}" https://<site>/no-such-page` returns `404` | After each deploy |
| 404 layout | Playwright loads an unknown route and checks the `<h1>` and the home link | QA gate |
| Dependencies | `npm audit --omit=dev` | Each release |
| Secrets | the search in section 2 | Before each push |
