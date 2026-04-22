/**
 * Gallery — "Previous Projects" centered mosaic with scroll-driven expansion.
 *
 * A sticky section whose viewport hosts a 3×3 grid of edge-to-edge,
 * rectangular tiles. The center tile is the featured project. As the
 * user scrolls, the center card expands to fill the entire viewport
 * while surrounding tiles slide out of view. Once expanded, horizontal
 * navigation (arrows / swipe) lets the user browse all projects at
 * full size.
 *
 * Layout (3 cols × 3 rows, no gaps, no border-radius):
 *   ┌─────────┬──────────┬─────────┐
 *   │ proj[1] │ proj[2]  │ proj[3] │   row 1 (28%)
 *   ├─────────┼──────────┼─────────┤
 *   │ proj[4] │ proj[0]  │ proj[5] │   row 2 (47%)  ← center focus
 *   ├─────────┴──────────┴─────────┤
 *   │         proj[6]              │   row 3 (25%)
 *   └─────────────────────────────-┘
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const RED = '#DC3545'

/* ── Project data ──────────────────────────────────────────── */
type Project = {
  name: string
  city: string
  spec: string
  material: string
  area: string
  img: string
}

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`

const PROJECTS: Project[] = [
  {
    name: 'Rainier Ridge',
    city: 'Seattle, WA',
    spec: 'Two-tier · Firepit',
    material: 'Western Cedar · 78 m²',
    area: '78 m²',
    img: U('1600607687939-ce8a6c25118c'),
  },
  {
    name: 'Harbor Light',
    city: 'Boston, MA',
    spec: 'Wrap-around · Bench',
    material: 'Mahogany · 54 m²',
    area: '54 m²',
    img: U('1600585154340-be6161a56a0c'),
  },
  {
    name: 'Bayside',
    city: 'Miami, FL',
    spec: 'Pool + cabana',
    material: 'Composite White · 96 m²',
    area: '96 m²',
    img: U('1613490493576-7fde63acd811'),
  },
  {
    name: 'Aspen Veranda',
    city: 'Aspen, CO',
    spec: 'Stairs · Bench seat',
    material: 'Reclaimed Oak · 68 m²',
    area: '68 m²',
    img: U('1512917774080-9991f1c4c750'),
  },
  {
    name: 'Sunset Lanai',
    city: 'Austin, TX',
    spec: 'Pool surround',
    material: 'Ipe Hardwood · 112 m²',
    area: '112 m²',
    img: U('1600566753190-17f0baa2a6c3'),
  },
  {
    name: 'Sonoma Terrace',
    city: 'Sonoma, CA',
    spec: 'Firepit · Pergola',
    material: 'Douglas Fir · 88 m²',
    area: '88 m²',
    img: U('1600210491892-03d54c0aaf87'),
  },
  {
    name: 'Loft 17',
    city: 'Brooklyn, NY',
    spec: 'Rooftop · Planters',
    material: 'Composite Grey · 36 m²',
    area: '36 m²',
    img: U('1600585154526-990dced4db0d'),
  },
]

/* ── Tile initial positions (% of viewport) ─────────────────
   7 tiles in a 3-col layout: top row (3), middle row (3), bottom row (1 spanning).
   Center tile (index 0) is in middle-center and is slightly larger. */
type TileRect = { left: number; top: number; width: number; height: number }

const TILE_LAYOUT: TileRect[] = [
  // [0] CENTER — middle-center, wider/taller than others
  { left: 31, top: 28, width: 38, height: 47 },
  // [1] top-left
  { left: 0, top: 0, width: 31, height: 28 },
  // [2] top-center
  { left: 31, top: 0, width: 38, height: 28 },
  // [3] top-right
  { left: 69, top: 0, width: 31, height: 28 },
  // [4] middle-left
  { left: 0, top: 28, width: 31, height: 47 },
  // [5] middle-right
  { left: 69, top: 28, width: 31, height: 47 },
  // [6] bottom — full width
  { left: 0, top: 75, width: 100, height: 25 },
]

/* Direction each tile slides out when center expands */
const SLIDE_OUT: { x: string; y: string }[] = [
  { x: '0%', y: '0%' },        // [0] center — doesn't slide
  { x: '-120%', y: '-120%' },   // [1] top-left
  { x: '0%', y: '-120%' },      // [2] top-center
  { x: '120%', y: '-120%' },    // [3] top-right
  { x: '-120%', y: '0%' },      // [4] mid-left
  { x: '120%', y: '0%' },       // [5] mid-right
  { x: '0%', y: '120%' },       // [6] bottom
]

/* ── Tile component ────────────────────────────────────────── */
function Tile({
  project,
  isCenter,
  isFullscreen,
}: {
  project: Project
  isCenter: boolean
  isFullscreen: boolean
}) {
  return (
    <div className="gallery-tile group absolute inset-0 overflow-hidden" style={{ background: '#000' }}>
      <img
        src={project.img}
        alt={`${project.name} — ${project.spec}`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transition: 'transform 0.8s ease, filter 0.4s ease' }}
      />
      {/* Scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.9) 100%)',
        }}
      />
      {/* Corner ticks */}
      <span className="gallery-tick absolute top-3 left-3 w-3 h-[1px]" />
      <span className="gallery-tick absolute top-3 left-3 w-[1px] h-3" />
      <span className="gallery-tick absolute top-3 right-3 w-3 h-[1px]" />
      <span className="gallery-tick absolute top-3 right-3 w-[1px] h-3" />
      <span className="gallery-tick absolute bottom-3 left-3 w-3 h-[1px]" />
      <span className="gallery-tick absolute bottom-3 left-3 w-[1px] h-3" />
      <span className="gallery-tick absolute bottom-3 right-3 w-3 h-[1px]" />
      <span className="gallery-tick absolute bottom-3 right-3 w-[1px] h-3" />

      {/* Top meta */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4">
        <span
          className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-white"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
        >
          {project.city}
        </span>
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: RED, textShadow: '0 1px 10px rgba(0,0,0,0.9), 0 0 14px rgba(220,53,69,0.5)' }}
        >
          ◆ {project.area}
        </span>
      </div>

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <h3
          className="font-sans font-semibold text-white mb-2"
          style={{
            fontSize: isCenter || isFullscreen ? 'clamp(1.5rem, 2.4vw, 2.4rem)' : 'clamp(1rem, 1.4vw, 1.4rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.015em',
            textShadow: '0 2px 18px rgba(0,0,0,0.85)',
          }}
        >
          {project.name}
        </h3>
        <div
          className="h-[2px] w-10 mb-3 gallery-rule"
          style={{ background: RED, boxShadow: `0 0 8px ${RED}` }}
        />
        <div
          className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-white truncate"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
        >
          {project.spec}
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.22em] mt-1 truncate"
          style={{ color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
        >
          {project.material}
        </div>
      </div>

      {/* Center indicator ring — only on the center tile before expansion */}
      {isCenter && !isFullscreen && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ border: `2px solid ${RED}`, opacity: 0.5 }}
        />
      )}
    </div>
  )
}

/* ── Main section ─────────────────────────────────────────── */
export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<(HTMLDivElement | null)[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const setTileRef = useCallback((el: HTMLDivElement | null, i: number) => {
    tileRefs.current[i] = el
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const grid = gridRef.current
    if (!section || !grid) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: '35% top',
          end: '65% top',
          scrub: 0.5,
          onUpdate: (self) => {
            if (self.progress > 0.95) setIsExpanded(true)
            else setIsExpanded(false)
          },
        },
      })

      // Animate surrounding tiles out (indices 1..6)
      tileRefs.current.forEach((tile, i) => {
        if (!tile || i === 0) return
        tl.to(tile, {
          x: SLIDE_OUT[i].x,
          y: SLIDE_OUT[i].y,
          opacity: 0,
          duration: 1,
          ease: 'power2.in',
        }, 0)
      })

      // Center tile expands to fill viewport
      const center = tileRefs.current[0]
      if (center) {
        tl.to(center, {
          left: '0%',
          top: '0%',
          width: '100%',
          height: '100%',
          duration: 1,
          ease: 'power2.inOut',
        }, 0)
      }
    })

    return () => ctx.revert()
  }, [])

  // Carousel navigation
  const goTo = useCallback((idx: number) => {
    setCarouselIndex(Math.max(0, Math.min(PROJECTS.length - 1, idx)))
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isExpanded) return
      if (e.key === 'ArrowRight') goTo(carouselIndex + 1)
      if (e.key === 'ArrowLeft') goTo(carouselIndex - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isExpanded, carouselIndex, goTo])

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-black"
      style={{ height: '300vh' }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col">
        {/* Ambient grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0, transparent 119px, rgba(255,255,255,0.04) 119px, rgba(255,255,255,0.04) 120px),' +
              'repeating-linear-gradient(0deg, transparent 0, transparent 119px, rgba(255,255,255,0.04) 119px, rgba(255,255,255,0.04) 120px)',
          }}
        />

        {/* Sheet strip */}
        <div
          className="relative flex items-center justify-between px-8 md:px-16 py-3 z-20 border-t border-b shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/55">
            <span style={{ color: RED }}>◆</span>&nbsp;&nbsp;Gallery · Project Register
          </div>
          <div className="hidden md:flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            {String(carouselIndex + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
          </div>
        </div>

        {/* Heading — fades out as expansion starts */}
        <div
          className="gallery-heading relative z-10 px-6 md:px-12 pt-4 pb-3 max-w-[1400px] mx-auto w-full"
          style={{ opacity: isExpanded ? 0 : 1, transition: 'opacity 0.4s ease' }}
        >
          <h2
            className="font-sans font-semibold text-white"
            style={{
              fontSize: 'clamp(1.6rem, 3.4vw, 2.8rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: '22ch',
            }}
          >
            {'Decks the crew have already built'.split(' ').map((word, i) => (
              <motion.span
                key={i}
                className="inline-block"
                style={{ marginRight: '0.28em' }}
                initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{
                  delay: 0.08 + i * 0.07,
                  duration: 0.95,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              style={{ color: RED, display: 'inline-block' }}
              initial={{ opacity: 0, scale: 0.3 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ delay: 0.62, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              .
            </motion.span>
          </h2>
          <motion.p
            className="mt-2 text-white/55 text-[13px] font-light"
            style={{ lineHeight: 1.65, maxWidth: '48ch' }}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            Scroll to explore — the featured project expands for a closer look.
          </motion.p>
        </div>

        {/* Mosaic grid — absolute-positioned tiles, no gaps, no border-radius */}
        <div
          ref={gridRef}
          className="relative z-10 flex-1 min-h-0 w-full"
        >
          {PROJECTS.map((p, i) => {
            const rect = TILE_LAYOUT[i]
            return (
              <div
                key={p.name}
                ref={(el) => setTileRef(el, i)}
                className="absolute"
                style={{
                  left: `${rect.left}%`,
                  top: `${rect.top}%`,
                  width: `${rect.width}%`,
                  height: `${rect.height}%`,
                  zIndex: i === 0 ? 5 : 1,
                }}
              >
                <Tile project={p} isCenter={i === 0} isFullscreen={isExpanded && carouselIndex === i} />
              </div>
            )
          })}
        </div>

        {/* ── Carousel overlay — visible after expansion ── */}
        {isExpanded && (
          <div className="absolute inset-0 z-30 flex items-stretch">
            {/* Current project — fullscreen */}
            <div className="relative w-full h-full">
              <Tile
                project={PROJECTS[carouselIndex]}
                isCenter={false}
                isFullscreen
              />
            </div>

            {/* Navigation arrows */}
            <button
              onClick={() => goTo(carouselIndex - 1)}
              disabled={carouselIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-all"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => goTo(carouselIndex + 1)}
              disabled={carouselIndex === PROJECTS.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-all"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
              {PROJECTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="w-2 h-2 transition-all duration-300"
                  style={{
                    background: i === carouselIndex ? RED : 'rgba(255,255,255,0.3)',
                    boxShadow: i === carouselIndex ? `0 0 8px ${RED}` : 'none',
                    transform: i === carouselIndex ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* Project counter */}
            <div className="absolute top-4 right-6 z-40 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
              {String(carouselIndex + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Side meta strip */}
        <div
          className="absolute top-1/2 -translate-y-1/2 right-6 z-20 font-mono text-[9px] uppercase tracking-[0.3em] pointer-events-none"
          style={{ writingMode: 'vertical-rl', color: RED, opacity: 0.55 }}
        >
          ● Sheet 03 · Gallery · 07 Projects
        </div>
      </div>

      <style>{`
        .gallery-tile {
          transition:
            border-color 0.35s ease,
            box-shadow 0.45s ease;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.04),
            0 14px 40px -14px rgba(0,0,0,0.85);
        }
        .gallery-tile:hover {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px ${RED},
            0 0 32px rgba(220,53,69,0.35),
            0 14px 40px -14px rgba(0,0,0,0.9);
        }
        .gallery-tile:hover img {
          transform: scale(1.04);
          filter: brightness(1.05) contrast(1.05);
        }
        .gallery-tile:hover .gallery-rule {
          width: 56px;
        }
        .gallery-tick {
          background: rgba(255,255,255,0.8);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .gallery-tile:hover .gallery-tick {
          background: ${RED};
          box-shadow: 0 0 6px ${RED};
        }
      `}</style>
    </section>
  )
}
