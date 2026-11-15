# 03 · Developer Media Library (DS5 Architecture)

The developer media library provides an isolated environment to inspect, measure, convert, and manage media assets before they enter production routes.

---

## 1. Core Principle: Zero Repo Bloat

Raw creative assets (multi-megabyte camera originals, uncompressed PNGs, layered PSDs, Figma slice exports) must **never** be committed into the project's production Git repository.

### Gitignore Policy
When using a media intake directory (`ds5/` or `.ds5/`), it must be registered in `.gitignore`:

```gitignore
# DS5 developer media intake and unprocessed raw files
ds5/
.ds5/
public/images/*-tmp.*
```

Only optimized, production-ready assets written to `public/` (or `dist/assets/`) belong in version control.

---

## 2. Directory Structure

A standardized media intake folder contains dedicated buckets:

```text
ds5/
├── _originals/     # Untouched source files (never served directly)
├── _processed/     # Intermediate outputs (e.g. background-removed cutouts)
├── backgrounds/    # Section background textures (16:9 ratio)
├── images/         # General editorial and article imagery
├── logos/          # Partner and brand vector/raster marks
├── pages-full/     # Full-page design mockups and references (3:4 ratio)
├── sliders/        # Carousel slide visuals (16:9 ratio)
├── svg/            # Isolated vector icons and illustrations
└── transparent/    # Transparent product and object cutouts
```

---

## 3. Neutral Visual Theme for Tooling

Developer inspection tools (such as `/ds` or `/ui`) must operate with neutral, high-contrast monochrome styles so they remain functional before brand identity tokens are finalized.

Standard token fallbacks for dev tooling:
- `--color-paper`: `#f8f8f8` (light) / `#121212` (dark)
- `--color-ink`: `#111111` (light) / `#f0f0f0` (dark)
- `--color-white`: `#ffffff`
- `--color-sun`: `#ffd700` (accent marker for active tabs and selections)
- `--color-line`: `rgba(0, 0, 0, 0.12)`

Neutral styling prevents brand-specific color bias when reviewing photographic assets.

---

## 4. Processing Capabilities

When configured with `sharp`, the media library server pipeline provides:

1. **Asset Metadata & Aspect Ratio:** Reads natural dimensions (`naturalWidth` × `naturalHeight`) and file size to calculate layout ratios for zero CLS.
2. **Boundary Flood-Fill Transparency:** Automatically removes solid-color background borders using Euclidean color tolerance without requiring third-party cloud APIs.
3. **Responsive WebP/AVIF Generation:** Generates multi-resolution variants (`-400.webp`, `-800.webp`, `-1200.webp`) with quality 72.

---

## 5. Modular Evolution

While DS5 conventions are defined within DS7 as an architectural pattern, the dev-server endpoints and UI viewer are designed for future extraction into a standalone package (`@ai.all/ds5`). Projects opt in during initialization or run it locally without affecting production dependencies.
