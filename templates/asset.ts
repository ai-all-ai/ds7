import { joinURL } from 'ufo';

// A site path (`/images/x.webp`, `/icons.svg#icon-pin`, `/about#team`) under app.baseURL.
// The base is `/` locally and on the own domain, `/<repository>/` on GitHub Pages (NUXT_APP_BASE_URL, set by the Pages workflow).
// External links, `#anchors`, `mailto:` and `tel:` are returned unchanged. Call it wherever a path leaves the app:
// <img :src="asset('/images/hero.webp')">, CSS url() in inline styles, links that are not <NuxtLink>.
export function asset(path: string): string;
export function asset(path: string | undefined): string | undefined;
export function asset(path?: string) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  return joinURL(useRuntimeConfig().app.baseURL, path);
}
