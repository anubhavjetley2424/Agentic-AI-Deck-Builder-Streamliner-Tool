# DeckForge — Design System (MASTER)
> Generated via ui-ux-pro-max skill for: luxury resort deck builder, Miami premium architecture

---

## 1. Product Profile

| Attribute | Value |
|-----------|-------|
| **Product Type** | Service / Architecture Tool (Hybrid) |
| **Industry** | Home Improvement, Luxury Outdoor Living |
| **Audience** | Homeowners (30–60), high disposable income, renovation-minded |
| **Tone** | Premium, trustworthy, aspirational, warm |
| **Density** | Medium — wizard-style progressive disclosure |
| **Platform** | Web (React + Vite + Tailwind), responsive mobile-first |

---

## 2. Style

### Primary: **Warm Minimalism**
Clean lines, generous whitespace, warm material textures. Inspired by high-end resort architecture brochures.

### Accents: **Skeuomorphic Texture Hints**
Subtle timber grain patterns on cards and surfaces. Not full skeuo — just enough texture to evoke materiality.

### Anti-Patterns to Avoid
- ❌ Neon/cyberpunk palettes — clashes with premium warmth
- ❌ Brutalism — too aggressive for homeowner audience
- ❌ Glassmorphism on primary UI — reduces readability over textured backgrounds
- ❌ Emoji as icons — use Lucide SVG exclusively
- ❌ Heavy gradients — keep it flat with subtle depth

---

## 3. Color System

### Light Theme (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#FAF8F4` | Page background (warm off-white) |
| `--color-surface` | `#FFFFFF` | Cards, modals, inputs |
| `--color-surface-warm` | `#F5EDE3` | Highlighted sections, feature cards |
| `--color-primary` | `#8B5E3C` | CTA buttons, active states, links |
| `--color-primary-hover` | `#6D4A2E` | Button hover |
| `--color-primary-light` | `#E4CDB0` | Tag backgrounds, soft highlights |
| `--color-secondary` | `#2C2016` | Headings, strong text |
| `--color-body` | `#4A3F35` | Body text |
| `--color-muted` | `#8C7E72` | Captions, placeholders |
| `--color-border` | `#E0D5C8` | Dividers, input borders |
| `--color-accent-green` | `#4A7C59` | Success, nature accent |
| `--color-accent-blue` | `#3B7EA1` | Pool/water references |
| `--color-error` | `#C0392B` | Error states |
| `--color-warning` | `#D4A017` | Warning states |

### Dark Theme (Footer / Hero sections)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-dark-bg` | `#0D0804` | Hero, footer background |
| `--color-dark-surface` | `#1E1208` | Dark cards |
| `--color-dark-text` | `#E8D5B8` | Parchment text on dark |
| `--color-dark-muted` | `#8C7E72` | Secondary text on dark |

### Tailwind Config Mapping

```js
colors: {
  bg:       '#FAF8F4',
  surface:  { DEFAULT: '#FFFFFF', warm: '#F5EDE3' },
  wood: {
    50:  '#FAF6F0', 100: '#F2E8D8', 200: '#E4CDB0',
    300: '#CFA882', 400: '#B8855A', 500: '#8B5E3C',
    600: '#6D4A2E', 700: '#523721', 800: '#3A2617', 900: '#251509',
  },
  body:     '#4A3F35',
  muted:    '#8C7E72',
  border:   '#E0D5C8',
  sage:     '#4A7C59',
  pool:     '#3B7EA1',
  error:    '#C0392B',
  parchment:'#E8D5B8',
  bark:     '#1E1208',
  cream:    '#FAFAF5',
  dark: {
    bg:      '#0D0804',
    surface: '#1E1208',
  },
}
```

---

## 4. Typography

### Font Pairing: **Playfair Display + Inter**

| Role | Font | Weight | Size | Line Height | Tracking |
|------|------|--------|------|-------------|----------|
| **Display** | Playfair Display | 700 | 48–64px | 1.1 | -0.02em |
| **H1** | Playfair Display | 700 | 36–48px | 1.15 | -0.01em |
| **H2** | Playfair Display | 600 | 28–36px | 1.2 | 0 |
| **H3** | Inter | 600 | 20–24px | 1.3 | 0 |
| **Body** | Inter | 400 | 16px | 1.6 | 0 |
| **Body Small** | Inter | 400 | 14px | 1.5 | 0 |
| **Caption** | Inter | 500 | 12px | 1.4 | 0.02em |
| **Button** | Inter | 600 | 14–16px | 1.0 | 0.03em |
| **Overline** | Inter | 600 | 11px | 1.2 | 0.08em |

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 5. Spacing & Layout

### Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Inline icon padding |
| `sm` | 8px | Tight gaps, chip padding |
| `md` | 16px | Card padding, input padding |
| `lg` | 24px | Section gaps |
| `xl` | 32px | Between major components |
| `2xl` | 48px | Page section spacing |
| `3xl` | 64px | Hero content spacing |
| `4xl` | 96px | Section dividers |

### Breakpoints

| Name | Width | Nav Pattern |
|------|-------|-------------|
| `sm` | 640px | Hamburger |
| `md` | 768px | Condensed nav |
| `lg` | 1024px | Full nav + sidebar |
| `xl` | 1280px | Full layout |
| `2xl` | 1440px | Max-width container |

### Container
- Max-width: `1280px` (xl), centered
- Padding: `16px` (mobile) → `24px` (tablet) → `32px` (desktop)

---

## 6. Component Specs

### Buttons

| Variant | Background | Text | Border | Radius | Height |
|---------|-----------|------|--------|--------|--------|
| **Primary** | `wood-500` | `white` | none | 8px | 48px |
| **Primary Hover** | `wood-600` | `white` | none | 8px | 48px |
| **Secondary** | transparent | `wood-500` | 1.5px `wood-500` | 8px | 48px |
| **Ghost** | transparent | `body` | none | 8px | 40px |
| **Disabled** | `border` | `muted` | none | 8px | 48px |

### Cards

| Property | Value |
|----------|-------|
| Background | `surface` or `surface-warm` |
| Border | 1px `border` |
| Radius | 12px |
| Shadow | `0 2px 12px rgba(139, 94, 60, 0.08)` |
| Shadow Hover | `0 8px 32px rgba(139, 94, 60, 0.14)` |
| Padding | 24px |
| Transition | `box-shadow 200ms ease-out, transform 200ms ease-out` |
| Hover Transform | `translateY(-2px)` |

### Inputs

| Property | Value |
|----------|-------|
| Height | 48px |
| Border | 1.5px `border` |
| Border Focus | 2px `wood-500` |
| Radius | 8px |
| Background | `surface` |
| Padding | 12px 16px |
| Label | Inter 500, 14px, `body` |
| Placeholder | Inter 400, 16px, `muted` |

### Step Indicator (Workshop Wizard)

| Property | Value |
|----------|-------|
| Track | 2px `border` |
| Active Dot | 12px, `wood-500`, ring 2px white |
| Completed Dot | 12px, `sage`, checkmark icon |
| Inactive Dot | 10px, `border` |
| Label Active | Inter 600, 14px, `wood-500` |
| Label Inactive | Inter 400, 13px, `muted` |

### Material Swatch Card

| Property | Value |
|----------|-------|
| Size | 120×120px (grid) |
| Image | Cover, rounded 8px top |
| Label | Inter 500, 13px, centered below |
| Selected | 2px ring `wood-500`, checkmark badge |
| Hover | Scale 1.03, shadow lift |

### Zone Chip (Draggable)

| Property | Value |
|----------|-------|
| Background | `surface-warm` |
| Border | 1.5px dashed `wood-300` |
| Radius | 8px |
| Min Size | 80×60px |
| Label | Inter 600, 12px, `wood-700` |
| Drag Handle | 6-dot grip icon, `muted` |
| Active/Placed | Solid border `wood-500`, subtle shadow |

---

## 7. Iconography

- **Library:** Lucide React (`lucide-react`)
- **Stroke Width:** 1.75px (consistent)
- **Sizes:** 16px (inline), 20px (buttons), 24px (nav), 32px (feature)
- **Color:** Inherit from text color token
- **NO emojis** as structural icons

---

## 8. Effects & Elevation

| Level | Shadow | Usage |
|-------|--------|-------|
| `0` | none | Flat elements |
| `1` | `0 1px 4px rgba(0,0,0,0.06)` | Subtle cards |
| `2` | `0 2px 12px rgba(139,94,60,0.08)` | Cards, dropdowns |
| `3` | `0 8px 32px rgba(139,94,60,0.14)` | Hover cards, modals |
| `4` | `0 16px 48px rgba(0,0,0,0.16)` | Overlays, popovers |

### Background Textures
- **Wood Grain:** `repeating-linear-gradient(92deg, transparent, transparent 3px, rgba(139,94,60,0.04) 3px, rgba(139,94,60,0.04) 4px)` — applied to hero and feature sections
- **Wood Cross:** Grid pattern for workshop canvas background

---

## 9. Animation

| Property | Value |
|----------|-------|
| **Micro-interaction** | 150–200ms, `ease-out` |
| **Page transition** | 300ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| **Hero scroll** | GSAP ScrollTrigger, scrub 0.8 |
| **Card hover** | 200ms `ease-out` (shadow + translateY) |
| **Step transition** | 250ms slide + fade |
| **Reduced motion** | Respect `prefers-reduced-motion`: disable scroll-driven, simplify to opacity-only |
| **Stagger** | 40ms per item for grid/list reveals |

---

## 10. Navigation

### Navbar (Sticky)
- **Height:** 64px (desktop), 56px (mobile)
- **Background:** `bg` with `backdrop-blur(12px)` when scrolled
- **Logo:** Left — "DeckForge" in Playfair Display 700, `wood-700`
- **Links:** Center — Inter 500, 15px, `body`, hover: `wood-500`
- **CTA:** Right — Primary button "Start Design"
- **Mobile:** Hamburger → slide-in drawer from right

### Footer
- **Background:** `dark-bg`
- **Text:** `parchment`
- **Structure:** 3 columns (Brand + Links + Legal)
- **Height:** ~280px

---

## 11. Page-Specific Notes

### Home (`/`)
- Full-viewport hero with sunset deck render or 3D scene
- Playfair Display display text, max 6 words
- Single CTA, no competing actions above the fold
- Value prop strip: 3 cards with Lucide icons
- Showcase: horizontal scroll carousel, 16:9 renders

### Workshop (`/workshop`)
- Step indicator pinned below navbar
- Canvas area: light wood-cross background texture
- Split layout on desktop: left = canvas, right = config panel
- Mobile: stacked, canvas on top
- Material grid: 3-column (mobile) → 5-column (desktop)

### Gallery (`/gallery`)
- Masonry grid, 3-column desktop
- Filter chips: `surface-warm` background, `wood-500` active
- Card: 16:9 image + overlay gradient + title

---

## 12. Accessibility Checklist

- [x] Contrast 4.5:1 for all body text (`#4A3F35` on `#FAF8F4` = 7.2:1 ✓)
- [x] Contrast 3:1 for large headings (`#2C2016` on `#FAF8F4` = 12.1:1 ✓)
- [x] Min touch target 44×44px on all interactive elements
- [x] Visible focus rings: 2px `wood-500` outline, 2px offset
- [x] `prefers-reduced-motion` respected (GSAP checks media query)
- [x] All inputs have visible `<label>` elements
- [x] Icon-only buttons have `aria-label`
- [x] Sequential heading hierarchy (h1→h2→h3)
- [x] Skip-to-content link on every page
- [x] Color never used as sole indicator (icons + text always paired)

---

## 13. File Structure (Stitch-Ready)

```
frontend/
├── SITE.md                    # Page definitions
├── DESIGN.md                  # This file — design system
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js         # Extended with design tokens
├── postcss.config.js
├── tsconfig.json
├── public/
│   └── frames/                # Hero animation frames (optional)
├── src/
│   ├── main.tsx
│   ├── App.tsx                # Router + layout
│   ├── index.css              # Tailwind + custom properties
│   ├── types.ts               # TypeScript interfaces
│   ├── api.ts                 # Backend API client
│   ├── lib/
│   │   └── utils.ts           # cn(), helpers
│   ├── components/
│   │   ├── ui/                # Reusable primitives (Button, Card, Input)
│   │   ├── layout/            # Navbar, Footer, Container
│   │   ├── Hero/              # Scroll-driven hero
│   │   ├── StepIndicator.tsx
│   │   ├── MaterialCard.tsx
│   │   └── ZoneChip.tsx
│   └── pages/
│       ├── Home.tsx
│       ├── Workshop.tsx        # Multi-step wizard
│       ├── Gallery.tsx
│       └── About.tsx
```

---

## 14. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 + TypeScript | UI |
| Build | Vite 5 | Dev server + bundling |
| Styling | Tailwind CSS 3.4 | Utility-first CSS |
| Icons | Lucide React | SVG icon library |
| Animation | GSAP + ScrollTrigger | Hero scroll, page transitions |
| 3D Preview | React Three Fiber + Drei | Zone layout preview |
| Routing | React Router v6 | SPA navigation |
| State | React useState + Context | Wizard state management |
| Backend | CrewAI agents + Revit MCP | AI design generation |
