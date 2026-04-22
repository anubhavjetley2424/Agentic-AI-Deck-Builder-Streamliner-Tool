# DeckForge — Site Map & Page Definitions

## Brand Identity
- **Name:** DeckForge
- **Tagline:** "Design Your Dream Deck — AI Builds the Blueprint"
- **Vibe:** Miami luxury resort. Off-white + strong brown timber. Classy, premium, architectural.
- **Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + GSAP + React Three Fiber
- **Backend Agents:** Multi-Agent System (CrewAI) → Revit MCP for parametric 3D model generation

---

## Pages

### 1. HOME (`/`)
The hero landing experience. Full-viewport scroll-driven reveal.

**Sections:**
- **Hero Banner** — Full-bleed background (warm sunset timber deck render or looping 3D scene). Overlaid: brand logo, tagline, and a single CTA button "Start Your Design".
- **Value Proposition Strip** — 3 icon cards: "Upload Your Plan" / "Design Your Zones" / "AI Builds Your Model"
- **Showcase Carousel** — 3–4 rendered deck projects (Pergola resort, multi-level BBQ deck, poolside bar deck) with hover parallax.
- **How It Works** — 4-step vertical timeline: Upload → Draw → Configure → Generate.
- **Testimonials / Trust Bar** — Social proof strip.
- **Footer** — Links, copyright, "Powered by Revit MCP + CrewAI"

### 2. WORKSHOP (`/workshop`)
The core multi-step deck design tool. Wizard-style, step-by-step.

**Step 1 — Property Upload**
- Upload house plan image (PNG/JPG/PDF) or enter address for satellite view
- Draw bounding rectangle on the plan to define deck area
- Input property dimensions (metric/imperial toggle)
- AI agent extracts wall lines + yard boundaries

**Step 2 — Deck Configuration**
- Choose deck mode: **Single Level** or **Multi-Level**
- If multi-level: define 2–4 elevation tiers with drag handles
- Select deck shape template (L-shape, rectangular, wraparound, freeform)
- Set overall dimensions (auto-scaled from property plan)

**Step 3 — Zone Placement**
- Drag-and-drop zone tiles onto the deck canvas:
  - **BBQ / Outdoor Kitchen**
  - **Dining / Patio**
  - **Bar / Lounge**
  - **Pool Deck** (with sunken void)
  - **Fire Pit** (sunken or flush)
  - **Pergola / Covered Area**
  - **Entry / Stairs**
- Resize zones, set individual elevations
- Define stair connections between zones (wide, modern, cascading, L-wrap)

**Step 4 — Material Selection**
- Category panels: Decking, Pergola Columns, Feature Wall, Railing, Ceiling
- Each category shows a visual grid of material swatches (timber species, composite, stone, metal)
- Preview thumbnails from Revit family catalog
- Selected materials map to Revit material names for the agent pipeline

**Step 5 — Review & Generate**
- Summary card showing all selections
- 3D wireframe preview (React Three Fiber) of the zone layout
- "Generate Design" button → triggers CrewAI agent pipeline
- Loading state: animated construction sequence
- Result: rendered screenshots from Revit, downloadable .rvt file link

### 3. GALLERY (`/gallery`)
Inspiration gallery of pre-built deck designs.

- Filter by style (Modern, Coastal, Rustic, Resort)
- Filter by features (Pool, Pergola, Multi-level, Bar)
- Each card: hero render, zone breakdown, material list
- "Use as Template" button → pre-fills Workshop with that design

### 4. ABOUT (`/about`)
- What is DeckForge — the AI-powered deck design platform
- How the Multi-Agent System works (diagram)
- Revit MCP integration explanation
- Team / technology credits

---

## Shared Components
- **Navbar** — Sticky, transparent on hero → solid on scroll. Logo left, nav links center, CTA right.
- **Footer** — Dark timber background, off-white text, 3-column links.
- **StepIndicator** — Horizontal progress bar for Workshop wizard.
- **MaterialCard** — Thumbnail + label + checkmark for material selection.
- **ZoneChip** — Draggable labeled rectangle for zone placement canvas.
- **DeckPreview3D** — React Three Fiber component for live 3D zone preview.

---

## Color Palette (Tailwind tokens)
- `cream` (#FAFAF5) — primary background, off-white
- `wood-500` (#8B5E3C) — primary brown, CTA buttons, accents
- `wood-700` (#523721) — dark timber, headings
- `wood-200` (#E4CDB0) — light timber, card backgrounds
- `parchment` (#E8D5B8) — warm neutral for text on dark
- `surface-900` (#0D0804) — deep dark for footer / dark sections
- `sage` (#4A7C59) — success / nature accent

## Typography
- **Headings:** Playfair Display (serif) — elegant, resort feel
- **Body:** Inter (sans-serif) — clean, modern readability
