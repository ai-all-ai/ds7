# Icons and error pages

Every DS7 site has the same icon set and the same error pages, in the style of the site. `ds7 icons` checks both on the generated site (`.output/public`) and on `app/error.vue`. The templates are `templates/error.vue` and `templates/site.webmanifest`; the init command copies them into a new project and keeps existing files.

## The icon set

| File | Used by | Size |
| --- | --- | --- |
| `public/favicon.ico` | browsers, bookmarks, old tabs | multi-size ICO |
| `public/apple-touch-icon.png` | iPhone and iPad home screen | 180 × 180 PNG, no transparency |
| `public/android-chrome-192x192.png` | Android, installed app | 192 × 192 PNG |
| `public/android-chrome-512x512.png` | Android, installed app, splash | 512 × 512 PNG |
| `public/maskable-icon-512x512.png` | Android adaptive icon | 512 × 512 PNG, the logo inside the central 80 % circle |
| `public/site.webmanifest` | install prompt, home screen name and colours | JSON, see the template |

Every page needs these head tags. Put them once in `nuxt.config.ts` under `app.head` so each page inherits them:

```ts
app: {
  head: {
    link: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
    meta: [
      { name: 'theme-color', content: '#ffffff' },
      { property: 'og:image', content: 'https://example.com/og-image.jpg' },
    ],
  },
},
```

Use the real domain in `og:image`, and an image of 1200 × 630 px for link previews. The colour in `theme-color` is the site's brand colour. The same values go into `site.webmanifest` (`theme_color`, `background_color`). Pages that set their own `og:image` (articles, products) keep it; the check only needs the tag to exist.

Generate the PNG and ICO files from one master logo (SVG or a square PNG of at least 512 px). Keep the logo's transparent background for the Android and favicon files, and fill the apple-touch icon with the background colour, because iOS draws transparency as black.

## What `ds7 icons` checks

- `favicon.ico` exists.
- `apple-touch-icon.png` exists and is 180 × 180.
- `site.webmanifest` parses, lists a 192 × 192 and a 512 × 512 icon and one icon with `"purpose": "maskable"`. Every icon file it names exists and has the size it declares.
- Every `*.html` page in the build has an icon link, an `apple-touch-icon` link, a manifest link, a `theme-color` meta and an `og:image` meta.
- The error page: `app/error.vue` exists, shows `statusCode`, and links to at least three sections. The build contains `404.html`.

Findings name the file or page and what is missing. The command follows the shared rules: new problems fail, accepted ones go to `ds7-baseline.json` with `--update-baseline`.

## The error pages

The 404 and 500 pages are required for every site. Nuxt renders `app/error.vue` for every status, and the static build writes it as `404.html`, so the same file serves all errors.

The template (`templates/error.vue`):

- shows the status code and a short title for 404 and for other errors;
- links to the main sections of the site (the `sections` list at the top of the file), so a visitor who lands on a dead link can continue;
- offers a button back to the home page, which calls `clearError`;
- uses the site's own tokens and classes. Change the colours and fonts there, not in the page.

Replace the three sample sections (`/`, `/contact`, `/sitemap`) with the site's real main sections, and write the texts in the site's language. Do not add a new visual style: the error page is part of the site and is reviewed at the same widths as the other pages (390, 820 and 1440 px).

## Settings

In `ds7.config.json`:

```json
{ "icons": { "errorPages": true } }
```

`"icons": false` turns the command off. `"errorPages": false` skips the error page checks, for example in a site without Nuxt error pages. Both are listed in `CONFIG.md`.

## Limits

The command checks that the files and tags exist and have the declared sizes. It does not judge the design of the icons, whether the maskable icon keeps the logo inside its safe area, or whether the texts on the error page are right. Those are checked by the owner on a phone and a desktop.
