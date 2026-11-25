# 03 · Delivery and caching

How the generated site leaves the server: compression, cache headers, the web server and the build checks that keep a broken build from being deployed. Rules for agents are in `ALL.md` section 5; this file explains them and how to check them.

---

## 1. Pre-compressed files

Compressing on every request costs CPU and limits the level that can be used. A static build is compressed once, at the highest level, during `nuxt generate`:

```ts
// nuxt.config.ts (already in templates/nuxt.config.ts)
nitro: {
  compressPublicAssets: { brotli: true, gzip: true },
},
```

Nitro writes `page.html.br` and `page.html.gz` next to each compressible file (HTML, JS, CSS, SVG, JSON, XML) that is large enough to gain from it. The web server sends the variant the browser accepts.

- Brotli at its highest level is usually around a fifth smaller than gzip for HTML, CSS and JS. The exact gain depends on the files; measure it on the build, do not quote a number as a fact.
- gzip stays as the fallback for clients without Brotli.
- `ds7 audit perf` reports, as advice, how many compressible files have no pre-compressed variant (section 6).
- The gzip budgets of `ds7 audit perf` stay in gzip on purpose: they hold even on a host that serves no Brotli.

---

## 2. Cache headers

| Files | `Cache-Control` | Why |
|---|---|---|
| `/_nuxt/*` (hashed build files) | `public, max-age=31536000, immutable` | The name changes when the content changes. |
| HTML (`*.html`, paths ending in `/`) | `public, max-age=0, must-revalidate` | A new deploy is visible at once; the browser revalidates with `ETag`. |
| Images and fonts in `public/` | `public, max-age=604800, stale-while-revalidate=86400` | They have no hash in the name. |
| Anything else | `public, max-age=3600` | |

Rules:
- A file in `public/` whose content changes gets a new name (`hero-2.webp`), so caches never serve the old one. A file under `/_nuxt/` is renamed by the build.
- Never mark a file without a content hash as `immutable`.
- A change to a cache value is recorded in `docs/DECISIONS.md`.

---

## 3. The web server

Use one of the configurations shipped in `templates/`. Each one serves the pre-compressed files, the site's own `404.html` with status 404, the cache headers of section 2 and the security headers of `09-security-errors/SECURITY-AND-ERRORS.md`.

| Host | File | Notes |
|---|---|---|
| Docker / nginx | `templates/nginx.conf`, used by `templates/Dockerfile` | `nginx:alpine` has no Brotli module: it serves the `.gz` files. Put a CDN or Caddy in front for Brotli. |
| A server with Caddy 2.6 or later | `templates/Caddyfile` | HTTPS certificates, HTTP/2 and HTTP/3 are automatic. Serves `.br` and `.gz`. |
| A CDN or static host | the host's own settings | Check that it keeps the cache values of section 2 and returns 404 for unknown routes. |

- Serve one canonical host (with or without `www`) and redirect the other once, straight to the final URL.
- HTTP/2 or HTTP/3 is expected. A CDN in front of the server is the simplest way to get both, plus Brotli, close to the visitor.

---

## 4. A build that fails stops the deploy

- `nitro.prerender.failOnError: true` (in `templates/nuxt.config.ts`): a page that fails to render or a link to a missing page stops `nuxt generate`. Written out so the behaviour does not depend on the framework default.
- The container build accepts only `nuxt generate`. It never falls back to another build command: a fallback ships an image without pages and starts "successfully".
- **Existing projects:** switching on `failOnError` can reveal links that were broken for a long time. Run `nuxt generate` once with it in a branch, fix what it reports, then merge.

---

## 5. Opt-in recipes

Each recipe changes how pages behave, so none is on by default. Switch one on per page group, check it, and record it in `docs/DECISIONS.md`.

### 5.1 Pages without JavaScript

A page that is only text and links (legal pages, long articles) does not need the framework in the browser:

```ts
routeRules: {
  '/legal/**': { noScripts: true },
},
```

Nuxt then omits its scripts and script hints from those pages. Before switching it on, check that nothing on the page needs JavaScript: the language switcher, the cookie banner, menus, forms and analytics. Mark the pages in the page registry of `04-seo-ai-optimization/SEO-CHECKLIST.md`.

### 5.2 Faster next page: speculation rules

Browsers that support the Speculation Rules API can fetch the next page before the click. Use `prefetch` (download only), not `prerender`: a prerendered page runs its scripts in advance, which can count a visit in analytics before the click and run code before consent is given.

```ts
// app.vue
useHead({
  script: [{
    type: 'speculationrules',
    innerHTML: JSON.stringify({
      prefetch: [{
        where: { and: [{ href_matches: '/*' }, { not: { href_matches: ['/ui', '/ui/*', '/ds', '/ds/*'] } }] },
        eagerness: 'moderate',
      }],
    }),
  }],
})
```

Browsers without support ignore the script. A static HTML page is cheap to prefetch; keep pages that change state (forms, carts, sign-out) out of the rule.

### 5.3 Third-party embeds

Use facades: `03-performance-web-vitals/HYDRATION-STRATEGY.md`, section 3.

---

## 6. Checks

| Check | How | When |
|---|---|---|
| Pre-compressed files present | `ds7 audit perf` (advice line `precompressed`) | QA gate |
| `404.html` in the build | `ds7 audit perf` (advice line `404-page`) | QA gate |
| Cache and security headers | `curl -sI https://<site>/` and `curl -sI https://<site>/_nuxt/<file>.js`, compare with section 2 and the security table | After each deploy |
| Brotli served | `curl -sI -H 'Accept-Encoding: br' https://<site>/` shows `content-encoding: br` | After a server change |
| 404 status | `curl -s -o /dev/null -w "%{http_code}" https://<site>/no-such-page` returns `404` | After each deploy |

Advice lines do not fail the command in this version. They become failing rules in a later minor release, after projects have had one release to adopt them (`CONTRIBUTING.md`, "Safe changes").
