# 03 · Assets pipeline: tight trim and responsive images

Images are prepared before they reach the code. Raw exports make pages heavy and products small.

---

## 1. Tight trim

Typical problem: a product PNG exported on a 1000 × 1000 canvas where most pixels are empty transparent margin.

Costs: extra bytes, off-centre objects in grids, and tiny products on phones.

Rules:
1. **Crop to the object** along its outline, keeping a real soft shadow if the design has one.
2. **Keep transparency** for product cut-outs so they sit on light, dark and coloured backgrounds.
3. **Fix the box.** The container has a stable `aspect-ratio` (`4/3` or `1/1`); the image is centred with `object-fit: contain`.

---

## 2. Responsive images

Every raster image ships in several sizes. The reference component is `UiImg`: it takes a `src` string, builds a `srcset` from the generated variants, and writes `width`, `height` and lazy-loading attributes.

Generated sizes (default): **400, 800 and 1200 px wide**, WebP, quality 82. Images smaller than 900 px are not resized up.

```html
<img
  src="/images/p/hero-1200.webp"
  srcset="/images/p/hero-400.webp 400w, /images/p/hero-800.webp 800w, /images/p/hero-1200.webp 1200w"
  sizes="(max-width: 800px) 100vw, 60vw"
  width="1200" height="900"
  alt="Solar installation on a rooftop"
  fetchpriority="high" loading="eager" decoding="async"
>
```

Use `UiImg` rather than writing this by hand in every page.

---

## 3. Loading priorities

| Position | `loading` | `fetchpriority` | `decoding` |
|---|---|---|---|
| The LCP image above the fold | `eager` | `high` | `async` |
| Cards below the fold | `lazy` | `auto` | `async` |
| Footer and late sections | `lazy` | `low` | `async` |

Only one image is the LCP image on a page. Mark it, do not mark several.

---

## 4. Asset script

Keep a small script in `tools/` (Sharp or Python) that:
- takes new images from a source folder;
- trims transparent margins;
- writes WebP (and AVIF where useful) at 400, 800 and 1200 px;
- writes `app/data/image-variants.json`, the manifest `UiImg` reads;
- has a `--check` mode that fails when a referenced image has no manifest entry.

Commit the manifest with the images it describes.
