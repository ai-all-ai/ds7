# Brand Specification & Design System Intake

> **Single source of truth for visual identity, typography, and page requirements.**
> AI agents and developers must consult this document before creating or modifying UI components.

---

## 1. Brand Identity

- **Project / Brand Name:** My Brand
- **Tagline / Offer:** Short summary of the main value proposition
- **Primary Audience:** B2C homeowners / luxury bike enthusiasts / corporate B2B
- **Geographic Focus:** Seville, Andalusia, Spain (or global)
- **Languages:** Primary: `es` · Secondary: `en`
- **Dev Server Port:** `3000` (default) or dedicated port (e.g. `4500` for `velo.es` to avoid collision)
- **Local Dev URL:** `http://localhost:<port>` (e.g. `http://localhost:4500`)
- **Quick Commands:** `make dev` (start dev server), `make guard` (verify modifiers & atomic layers)

---

## 2. Color Palette (Semantic Tokens)

Map brand colors to CSS custom properties in `theme.css`:

| Semantic Token | Hex / Value | Role / Usage |
|---|---|---|
| `--color-brand` | `#e5a93c` | Primary brand accent / signature highlight |
| `--color-paper` | `#ffffff` / `#0f0f10` | Canvas and page background |
| `--color-ink` | `#111111` / `#f3f3f3` | Main headings, body text, high contrast |
| `--color-ink-muted` | `#6b7280` | Subtitles, captions, metadata |
| `--color-line` | `rgba(0,0,0,0.1)` | Subtle structural borders |
| `--color-accent` | `#ffd700` | CTA button fills, tags, markers |

---

## 3. Typography

- **Display / Headings Font:** e.g. `Noto Serif Display` (serif, elegant) or `Montserrat` (bold, modern)
- **Body / Prose Font:** e.g. `Noto Sans` or system font stack
- **Loading Method:** `@fontsource/*` packages or self-hosted `.woff2` in `public/fonts/`

---

## 4. Tone of Voice & Editorial Style

- **Tone:** Professional, reliable, elegant, direct.
- **Rules:** Clear numbers, no fake marketing claims, transparent pricing, localized Spanish terminology.

---

## 5. Scope & Pages

- **Home Page (`/`):** Hero, value propositions, service cards, proof of quality, CTA footer.
- **Brandbook / Sandbox (`/ui`):** Component library sandbox (required, unindexed).
- **Secondary Pages:** Portfolio/Gallery (`/galeria`), About, Contact/Booking modal.
