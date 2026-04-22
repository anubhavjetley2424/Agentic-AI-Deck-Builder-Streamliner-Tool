/**
 * Home — black / white / red seamless parallax page.
 *
 *   1. Hero   — sticky-pinned 3D wireframe + parallax headline (upper band)
 *   2. Manifesto — scrub word reveal
 *   3. Process — 3 steps, centered card with HUGE red number behind it,
 *                each text line rises in on its own scrub window so the
 *                lag between lines is unmistakable
 *   4. MeetTheTeam — three cyberpunk agent cards (Geospatial / Designer /
 *                Construction); Geospatial is in HIRING state
 */

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from '../components/Hero'
import HeroScene from '../components/Hero/HeroScene'
import ManifestoZoom from '../components/ManifestoZoom'
import Gallery from '../components/Gallery'

gsap.registerPlugin(ScrollTrigger)

const RED = '#DC3545'

/* ══════════════════════════════════════════════════════════════
   PROCESS STEPS
══════════════════════════════════════════════════════════════ */
type Step = {
  num: string
  label: string
  title: string
  body: string
  pills: string[]
  visual: 'plan' | 'materials' | 'revit'
}

const STEPS: Step[] = [
  {
    num: '1',
    label: 'Upload',
    title: 'Drop your plan.',
    body: 'Floor plan, backyard photo, or raw sketch — our agents parse walls, boundaries, and elevations to centimetre precision.',
    pills: ['DWG · PDF · JPG', '33.5 m² area', 'Walls detected', 'Slope · 2.3°'],
    visual: 'plan',
  },
  {
    num: '2',
    label: 'Design',
    title: 'Place your vision.',
    body: 'Zones, materials, tiers. Collaborate live with AI that knows framing code, drainage, and how cedar ages in your climate.',
    pills: ['Cedar · Composite', 'Pool · Bar · Pit', '3 elevations', 'IRC 2024 compliant'],
    visual: 'materials',
  },
  {
    num: '3',
    label: 'Generate',
    title: 'Revit Model Ready.',
    body: 'A crew of agents builds the full BIM model — parametric, construction-ready, and exportable in a single click.',
    pills: ['.rvt · .ifc · .glb', 'BIM LOD 350', '1,284 families', 'Parametric'],
    visual: 'revit',
  },
]

/* ── Visual cards (SVG) per step ──────────────────────────────── */
function StepVisual({ kind }: { kind: Step['visual'] }) {
  if (kind === 'plan') {
    return (
      <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
        <rect x="30" y="30" width="260" height="260" stroke="white" strokeWidth="1" opacity="0.35" />
        <rect x="60" y="60" width="200" height="120" stroke="white" strokeWidth="0.8" opacity="0.6" />
        <rect x="60" y="190" width="90" height="80" stroke="white" strokeWidth="0.8" opacity="0.6" />
        <rect x="160" y="190" width="100" height="80" stroke={RED} strokeWidth="1.2" />
        <line x1="60" y1="40" x2="260" y2="40" stroke="white" strokeWidth="0.5" opacity="0.4" strokeDasharray="3 3" />
        <text x="160" y="28" fill="white" fillOpacity="0.55" fontFamily="monospace" fontSize="8" textAnchor="middle">8.40 m</text>
        <line x1="40" y1="60" x2="40" y2="270" stroke="white" strokeWidth="0.5" opacity="0.4" strokeDasharray="3 3" />
        <text x="22" y="170" fill="white" fillOpacity="0.55" fontFamily="monospace" fontSize="8" textAnchor="middle" transform="rotate(-90 22 170)">5.20 m</text>
        <circle cx="210" cy="230" r="3" fill={RED}>
          <animate attributeName="r" values="3;6;3" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
    )
  }
  if (kind === 'materials') {
    return (
      <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
        {[0, 1, 2, 3].map((col) =>
          [0, 1, 2, 3].map((row) => {
            const isRed = (col + row) % 5 === 2
            return (
              <rect
                key={`${col}-${row}`}
                x={30 + col * 68}
                y={30 + row * 68}
                width="58"
                height="58"
                stroke={isRed ? RED : 'white'}
                strokeWidth={isRed ? 1.4 : 0.8}
                opacity={isRed ? 1 : 0.4}
              />
            )
          })
        )}
        <g>
          <rect x="98" y="98" width="58" height="58" stroke={RED} strokeWidth="1.8" fill="none">
            <animate attributeName="x" values="98;166;98;30;98" dur="6s" repeatCount="indefinite" />
            <animate attributeName="y" values="98;30;166;98;98" dur="6s" repeatCount="indefinite" />
          </rect>
        </g>
        <text x="160" y="300" fill="white" fillOpacity="0.55" fontFamily="monospace" fontSize="8" textAnchor="middle">
          CEDAR · TIER 02
        </text>
      </svg>
    )
  }
  // revit
  return (
    <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
      <g strokeLinecap="round" strokeLinejoin="round">
        <polygon points="80,80 240,80 260,60 100,60" stroke="white" opacity="0.4" strokeWidth="0.8" />
        <polygon points="80,80 240,80 260,60 100,60" stroke="white" opacity="0.4" strokeWidth="0.8" />
        <polygon points="60,200 220,200 240,180 80,180" stroke="white" opacity="0.8" strokeWidth="1" />
        <polygon points="60,200 60,240 220,240 220,200" stroke="white" opacity="0.8" strokeWidth="1" />
        <polygon points="220,200 240,180 240,220 220,240" stroke="white" opacity="0.8" strokeWidth="1" />
        <line x1="60" y1="240" x2="60" y2="110" stroke="white" opacity="0.55" strokeWidth="0.8" />
        <line x1="220" y1="240" x2="220" y2="110" stroke="white" opacity="0.55" strokeWidth="0.8" />
        <line x1="240" y1="220" x2="240" y2="90" stroke="white" opacity="0.55" strokeWidth="0.8" />
        <polygon points="40,120 200,120 220,100 60,100" stroke="white" opacity="0.55" strokeWidth="0.8" />
        <polygon points="200,120 220,100 220,140 200,160" stroke="white" opacity="0.55" strokeWidth="0.8" />
        <rect x="140" y="210" width="50" height="20" stroke={RED} strokeWidth="1.4" />
        <line x1="30" y1="150" x2="280" y2="150" stroke={RED} strokeWidth="1" opacity="0.7">
          <animate attributeName="y1" values="60;240;60" dur="4s" repeatCount="indefinite" />
          <animate attributeName="y2" values="60;240;60" dur="4s" repeatCount="indefinite" />
        </line>
      </g>
      <text x="160" y="300" fill="white" fillOpacity="0.55" fontFamily="monospace" fontSize="8" textAnchor="middle">
        .RVT · LOD 350 · READY
      </text>
    </svg>
  )
}

/* ── Red "liquid-through-a-pipe" border ───────────────────────── */
function PipeBorder() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect
        x="0.5"
        y="0.5"
        width="calc(100% - 1px)"
        height="calc(100% - 1px)"
        fill="none"
        stroke="rgba(220,53,69,0.12)"
        strokeWidth="1"
      />
      <rect
        x="0.5"
        y="0.5"
        width="calc(100% - 1px)"
        height="calc(100% - 1px)"
        fill="none"
        stroke={RED}
        strokeWidth="2"
        pathLength={100}
        strokeDasharray="14 86"
        strokeLinecap="butt"
        className="pipe-pulse"
        style={{ filter: 'drop-shadow(0 0 6px rgba(220,53,69,0.8))' }}
      />
    </svg>
  )
}

/* ── Single step — CENTERED with giant number backdrop ────────── */
function ProcessStep({ step, idx }: { step: Step; idx: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const el = ref.current!
      const grid    = el.querySelector<HTMLDivElement>('.step-grid')
      const num     = el.querySelector<HTMLDivElement>('.step-num')
      const card    = el.querySelector<HTMLDivElement>('.step-card')
      const pills   = el.querySelectorAll<HTMLDivElement>('.step-pill')
      const reveals = el.querySelectorAll<HTMLElement>('.step-reveal')
      const ruleLn  = el.querySelector<HTMLElement>('.rule-line')

      /* Depth background grid — slowest parallax layer */
      gsap.fromTo(
        grid,
        { y: '22%', opacity: 0 },
        {
          y: '-18%', opacity: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      )

      /* Giant number — counter-scrolls behind the card, clearly visible */
      gsap.fromTo(
        num,
        { y: 180, opacity: 0, scale: 0.92 },
        {
          y: -140, opacity: 1, scale: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
        }
      )

      /* Visual card — floats up with rotate */
      gsap.fromTo(
        card,
        { y: 120, opacity: 0, rotate: -2 },
        {
          y: 0, opacity: 1, rotate: 0, ease: 'power3.out',
          duration: 1.1, delay: 0.2,
          scrollTrigger: { trigger: el, start: 'top 68%', once: true },
        }
      )

      /* Floating pills — stagger in, then parallax drift */
      gsap.fromTo(
        pills,
        { y: 80, opacity: 0, scale: 0.9 },
        {
          y: 0, opacity: 1, scale: 1, ease: 'power3.out',
          duration: 0.7, stagger: 0.14,
          scrollTrigger: { trigger: el, start: 'top 62%', once: true },
        }
      )
      pills.forEach((p, i) => {
        gsap.to(p, {
          y: i % 2 === 0 ? -30 : 25,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 + i * 0.15 },
        })
      })

      /* ── STRONG lagged reveals —
         each text line gets its OWN scrub window, offset by ~4% per index,
         with a big 180px travel so the rise is unmistakable. */
      reveals.forEach((line, i) => {
        gsap.fromTo(
          line,
          { y: 180, opacity: 0 },
          {
            y: 0, opacity: 1, ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: `top ${78 - i * 4}%`,
              end: `top ${38 - i * 4}%`,
              scrub: 0.8,
            },
          }
        )
      })

      /* Rule line wipe */
      gsap.fromTo(
        ruleLn,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1, ease: 'power2.out', duration: 1.2, delay: 0.4,
          scrollTrigger: { trigger: el, start: 'top 72%', once: true },
        }
      )
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Depth grid */}
      <div
        className="step-grid absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0, transparent 79px, rgba(255,255,255,0.035) 79px, rgba(255,255,255,0.035) 80px),' +
            'repeating-linear-gradient(0deg, transparent 0, transparent 79px, rgba(255,255,255,0.035) 79px, rgba(255,255,255,0.035) 80px)',
        }}
      />

      {/* HUGE centered step number — sits BEHIND the card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="step-num font-sans font-bold select-none will-change-transform"
          style={{
            fontSize: 'clamp(22rem, 56vw, 52rem)',
            lineHeight: 0.82,
            letterSpacing: '-0.08em',
            color: 'rgba(220,53,69,0.11)',
            textShadow: '0 0 120px rgba(220,53,69,0.08)',
          }}
        >
          {step.num}
        </div>
      </div>

      {/* Centered content container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-10">
        <div
          className="step-glass relative grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 p-10 md:p-12"
        >
          <PipeBorder />

          {/* Left: copy */}
          <div className="relative">
            <div className="flex items-center gap-4 mb-6 font-mono text-[10px] uppercase tracking-[0.35em]">
              <span className="step-reveal will-change-transform" style={{ color: RED }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="rule-line flex-1 h-[1px]" style={{ background: 'rgba(255,255,255,0.18)' }} />
              <span className="step-reveal text-white/60 will-change-transform">{step.label}</span>
            </div>
            <h3
              className="step-reveal font-sans font-semibold text-white mb-6 will-change-transform"
              style={{
                fontSize: 'clamp(2rem, 4.2vw, 3.6rem)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {step.title}
            </h3>
            <p
              className="step-reveal text-white/60 text-[16px] font-light will-change-transform"
              style={{ lineHeight: 1.7 }}
            >
              {step.body}
            </p>

            {/* Data pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {step.pills.map((p, i) => (
                <div
                  key={i}
                  className="step-pill font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border will-change-transform"
                  style={{
                    color: i === 0 ? RED : 'rgba(255,255,255,0.7)',
                    borderColor: i === 0 ? 'rgba(220,53,69,0.4)' : 'rgba(255,255,255,0.14)',
                    background: i === 0 ? 'rgba(220,53,69,0.08)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {p}
                </div>
              ))}
            </div>

            <div className="step-reveal mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 will-change-transform">
              Step · {String(idx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </div>
          </div>

          {/* Right: visual card — pure black, no gradient */}
          <div
            className="step-card relative aspect-square will-change-transform"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#000',
            }}
          >
            <StepVisual kind={step.visual} />
            {/* Corner tick marks */}
            <span className="absolute top-0 left-0 w-3 h-[1px]" style={{ background: RED }} />
            <span className="absolute top-0 left-0 w-[1px] h-3" style={{ background: RED }} />
            <span className="absolute top-0 right-0 w-3 h-[1px]" style={{ background: RED }} />
            <span className="absolute top-0 right-0 w-[1px] h-3" style={{ background: RED }} />
            <span className="absolute bottom-0 left-0 w-3 h-[1px]" style={{ background: RED }} />
            <span className="absolute bottom-0 left-0 w-[1px] h-3" style={{ background: RED }} />
            <span className="absolute bottom-0 right-0 w-3 h-[1px]" style={{ background: RED }} />
            <span className="absolute bottom-0 right-0 w-[1px] h-3" style={{ background: RED }} />
          </div>
        </div>
      </div>

      <style>{`
        .pipe-pulse { animation: pipeFlow 4.5s linear infinite; }
        @keyframes pipeFlow {
          from { stroke-dashoffset: 0;    }
          to   { stroke-dashoffset: -100; }
        }
        /* Glass card — pure black, subtle frost. No blue gradient. */
        .step-glass {
          background: #000;
          backdrop-filter: blur(10px) saturate(120%);
          -webkit-backdrop-filter: blur(10px) saturate(120%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.04),
            0 30px 60px -20px rgba(0,0,0,0.9);
        }
        /* On top of the solid black, lay a 1px hairline overlay that just
           adds a tiny glossy sheen along the top edge (no blue). */
        .step-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 18%);
          mix-blend-mode: screen;
        }
      `}</style>
    </div>
  )
}

/* ── Vertical glowing connector between steps ──────────────── */
function StepConnector({ idx, isFinal = false }: { idx: number; isFinal?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const el = ref.current!
      const line = el.querySelector<HTMLDivElement>('.conn-line')
      const glow = el.querySelector<HTMLDivElement>('.conn-glow')
      const spark = el.querySelector<HTMLDivElement>('.conn-spark')
      const dotEnd = el.querySelector<HTMLDivElement>('.conn-dot-end')

      // Line + glow grow downward on scroll
      gsap.fromTo(
        [line, glow],
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: 1, ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'bottom 30%',
            scrub: 0.5,
          },
        }
      )
      // Spark bead travels down the line
      gsap.fromTo(
        spark,
        { top: '0%', opacity: 1 },
        {
          top: '100%', opacity: 0.4, ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'bottom 30%',
            scrub: 0.5,
          },
        }
      )
      // End dot pops in when line reaches it
      gsap.fromTo(
        dotEnd,
        { scale: 0, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(3)',
          scrollTrigger: { trigger: el, start: 'bottom 40%', once: true },
        }
      )
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      className="relative w-full flex justify-center"
      style={{ height: isFinal ? 'clamp(120px, 18vh, 220px)' : 'clamp(100px, 16vh, 200px)' }}
    >
      {/* Start node — small dot at top */}
      <div
        className="absolute top-0 translate-y-[-50%] w-2 h-2 rounded-full z-10"
        style={{
          background: RED,
          boxShadow: `0 0 6px ${RED}, 0 0 14px rgba(220,53,69,0.4)`,
        }}
      />

      {/* Dim track line — always visible */}
      <div
        className="absolute top-0 w-[1px] h-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />

      {/* Glowing fill line */}
      <div
        className="conn-line absolute top-0 w-[2px] h-full"
        style={{
          background: `linear-gradient(180deg, ${RED} 0%, rgba(220,53,69,0.6) 70%, rgba(220,53,69,0.2) 100%)`,
        }}
      />

      {/* Outer glow */}
      <div
        className="conn-glow absolute top-0 w-[6px] h-full"
        style={{
          background: `linear-gradient(180deg, rgba(220,53,69,0.5) 0%, rgba(220,53,69,0.15) 100%)`,
          filter: 'blur(4px)',
        }}
      />

      {/* Travelling spark bead */}
      <div
        className="conn-spark absolute w-[8px] h-[8px] rounded-full z-10"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff',
          boxShadow: `0 0 8px #fff, 0 0 16px ${RED}, 0 0 32px rgba(220,53,69,0.5)`,
        }}
      />

      {/* End node dot */}
      <div
        className="conn-dot-end absolute bottom-0 translate-y-[50%] w-3 h-3 rounded-full z-10"
        style={{
          background: RED,
          boxShadow: `0 0 8px ${RED}, 0 0 18px rgba(220,53,69,0.5), 0 0 36px rgba(220,53,69,0.2)`,
        }}
      />

      {/* Step number label */}
      <div
        className="absolute bottom-0 translate-y-[50%] font-mono text-[9px] uppercase tracking-[0.3em] text-white/25"
        style={{ left: 'calc(50% + 18px)' }}
      >
        {isFinal ? '●' : String(idx + 2).padStart(2, '0')}
      </div>

      <style>{`
        @keyframes connPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .conn-glow { animation: connPulse 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

function Process() {
  return (
    <section className="relative w-full bg-black">
      <div
        className="sticky top-0 flex items-center justify-between px-8 md:px-16 py-8 z-20 border-b border-t"
        style={{ background: '#000', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/55">
          <span style={{ color: RED }}>◆</span>&nbsp;&nbsp;The Process
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          Three steps · Zero drafts
        </div>
      </div>

      {STEPS.map((s, i) => (
        <div key={s.num}>
          <ProcessStep step={s} idx={i} />
          <StepConnector idx={i} isFinal={i === STEPS.length - 1} />
        </div>
      ))}
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════
   MEET THE TEAM — restrained architectural title-block cards.
   Each card is modelled on a real drawing sheet: a header strip with
   discipline + drawing number, a technical line-art illustration, and a
   footer with role, one-sentence tagline, and status. No LEDs, no
   CODENAMES_00, no cyberpunk clutter.
══════════════════════════════════════════════════════════════ */
type Agent = {
  drawingNo: string           // e.g. "A-00"
  discipline: string          // e.g. "SITE · SURVEY"
  role: string                // e.g. "Geospatial Surveyor"
  status: 'ACTIVE' | 'IN BUILD' | 'VACANT'
  illustration: 'survey' | 'design' | 'build'
}

const AGENTS: Agent[] = [
  { drawingNo: 'A-00', discipline: 'Site · Survey',    role: 'Geospatial Surveyor', status: 'VACANT',   illustration: 'survey' },
  { drawingNo: 'A-01', discipline: 'Design · Spatial', role: 'Designer Agent',      status: 'ACTIVE',   illustration: 'design' },
  { drawingNo: 'A-02', discipline: 'Build · BIM',      role: 'Construction Agent',  status: 'IN BUILD', illustration: 'build'  },
]

/* ── Technical line-art illustrations (4:3) ─────────────────── */
function AgentIllustration({ kind }: { kind: Agent['illustration'] }) {
  if (kind === 'survey') {
    return (
      <svg viewBox="0 0 200 150" className="w-full h-full" fill="none">
        {/* Grid reference ticks along top */}
        {[20, 60, 100, 140, 180].map((x) => (
          <line key={x} x1={x} y1="10" x2={x} y2="14" stroke="white" strokeOpacity="0.25" strokeWidth="0.5" />
        ))}
        {/* Topographic contour lines — clean concentric ellipses tilted
            around the survey point. Each ring steps 8px outward and fades
            by ~0.1 so the hill reads as a proper topo map. */}
        <g transform="rotate(-14 110 84)">
          <ellipse cx="110" cy="84" rx="62" ry="30" stroke="white" strokeOpacity="0.18" strokeWidth="0.55" />
          <ellipse cx="110" cy="84" rx="52" ry="25" stroke="white" strokeOpacity="0.28" strokeWidth="0.55" />
          <ellipse cx="110" cy="84" rx="42" ry="20" stroke="white" strokeOpacity="0.4"  strokeWidth="0.55" />
          <ellipse cx="110" cy="84" rx="32" ry="15" stroke="white" strokeOpacity="0.55" strokeWidth="0.55" />
          <ellipse cx="110" cy="84" rx="22" ry="11" stroke="white" strokeOpacity="0.7"  strokeWidth="0.55" />
        </g>
        {/* Survey point crosshair (red) */}
        <g>
          <circle cx="110" cy="84" r="10" stroke={RED} strokeWidth="0.9" />
          <line x1="110" y1="72" x2="110" y2="96" stroke={RED} strokeWidth="0.9" />
          <line x1="98" y1="84" x2="122" y2="84" stroke={RED} strokeWidth="0.9" />
          <circle cx="110" cy="84" r="1.4" fill={RED} />
        </g>
        {/* Bearing / elevation callouts */}
        <g fontFamily="monospace" fontSize="6" fill="white" fillOpacity="0.4">
          <text x="20" y="24">N 45° 12′ E</text>
          <text x="20" y="140">GRID · 01</text>
          <text x="180" y="140" textAnchor="end">ELEV +2.3m</text>
        </g>
        {/* Scale bar */}
        <g transform="translate(126,132)">
          <line x1="0" y1="0" x2="50" y2="0" stroke="white" strokeOpacity="0.5" strokeWidth="0.6" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="white" strokeOpacity="0.5" strokeWidth="0.6" />
          <line x1="25" y1="-2" x2="25" y2="2" stroke="white" strokeOpacity="0.5" strokeWidth="0.6" />
          <line x1="50" y1="-3" x2="50" y2="3" stroke="white" strokeOpacity="0.5" strokeWidth="0.6" />
          <text x="25" y="10" textAnchor="middle" fontFamily="monospace" fontSize="5" fill="white" fillOpacity="0.4">5m</text>
        </g>
      </svg>
    )
  }
  if (kind === 'design') {
    return (
      <svg viewBox="0 0 200 150" className="w-full h-full" fill="none">
        {/* Isometric plan view of a multi-zone deck */}
        <g transform="translate(100,80)">
          {/* Base deck — isometric rhombus */}
          <polygon points="-70,0 0,-35 70,0 0,35" stroke="white" strokeOpacity="0.55" strokeWidth="0.9" />
          {/* Interior divisions — zones */}
          <line x1="-35" y1="-17.5" x2="35" y2="17.5" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
          <line x1="-35" y1="17.5" x2="35" y2="-17.5" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
          {/* Plank grain — subtle horizontal lines */}
          <g stroke="white" strokeOpacity="0.12" strokeWidth="0.4">
            {[-25, -15, -5, 5, 15, 25].map((o) => (
              <line key={o} x1={-56 + Math.abs(o)*0.4} y1={o*0.5} x2={56 - Math.abs(o)*0.4} y2={o*0.5} />
            ))}
          </g>
          {/* Red feature — pool/pit zone */}
          <polygon points="10,-12 40,-27 58,-18 28,-3" stroke={RED} strokeWidth="1" />
          {/* Dimension line along front edge */}
          <g stroke="white" strokeOpacity="0.35" strokeWidth="0.4">
            <line x1="-70" y1="12" x2="-66" y2="16" />
            <line x1="0" y1="47" x2="0" y2="52" />
            <line x1="-70" y1="12" x2="0" y2="47" strokeDasharray="2 2" />
          </g>
        </g>
        {/* Drafting marks */}
        <g fontFamily="monospace" fontSize="6" fill="white" fillOpacity="0.4">
          <text x="20" y="24">PLAN · 1:50</text>
          <text x="180" y="24" textAnchor="end">A-01</text>
          <text x="20" y="140">CEDAR · TIER 02</text>
          <text x="180" y="140" textAnchor="end">IRC 2024</text>
        </g>
        {/* T-square hint top-left */}
        <g stroke="white" strokeOpacity="0.25" strokeWidth="0.5">
          <line x1="12" y1="34" x2="12" y2="118" />
          <line x1="6" y1="34" x2="18" y2="34" />
        </g>
      </svg>
    )
  }
  // build — cross-section / axonometric of deck structure
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" fill="none">
      {/* Cross-section of two-level deck with posts, joists, and stair */}
      <g transform="translate(28,22)">
        {/* Upper deck slab */}
        <line x1="0" y1="28" x2="90" y2="28" stroke="white" strokeOpacity="0.75" strokeWidth="0.9" />
        <line x1="0" y1="34" x2="90" y2="34" stroke="white" strokeOpacity="0.75" strokeWidth="0.9" />
        {/* Upper deck joists (verticals in section) */}
        <g stroke="white" strokeOpacity="0.32" strokeWidth="0.5">
          {[6, 18, 30, 42, 54, 66, 78].map((x) => (
            <line key={x} x1={x} y1="28" x2={x} y2="34" />
          ))}
        </g>
        {/* Upper guardrail */}
        <line x1="0" y1="28" x2="0" y2="14" stroke="white" strokeOpacity="0.55" strokeWidth="0.7" />
        <line x1="0" y1="14" x2="90" y2="14" stroke="white" strokeOpacity="0.55" strokeWidth="0.7" />
        <g stroke="white" strokeOpacity="0.35" strokeWidth="0.45">
          {[12, 24, 36, 48, 60, 72, 84].map((x) => (
            <line key={x} x1={x} y1="14" x2={x} y2="28" />
          ))}
        </g>
        {/* Upper posts down to lower deck */}
        <line x1="4" y1="34" x2="4" y2="70" stroke="white" strokeOpacity="0.6" strokeWidth="0.8" />
        <line x1="86" y1="34" x2="86" y2="70" stroke="white" strokeOpacity="0.6" strokeWidth="0.8" />
        {/* Lower deck slab */}
        <line x1="-10" y1="70" x2="140" y2="70" stroke="white" strokeOpacity="0.85" strokeWidth="1" />
        <line x1="-10" y1="76" x2="140" y2="76" stroke="white" strokeOpacity="0.85" strokeWidth="1" />
        {/* Lower deck joists */}
        <g stroke="white" strokeOpacity="0.3" strokeWidth="0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={-6 + i * 12} y1="70" x2={-6 + i * 12} y2="76" />
          ))}
        </g>
        {/* Ground-level posts (red — load-bearing accent) */}
        <line x1="-6" y1="76" x2="-6" y2="112" stroke={RED} strokeWidth="0.9" />
        <line x1="66" y1="76" x2="66" y2="112" stroke={RED} strokeWidth="0.9" />
        <line x1="138" y1="76" x2="138" y2="112" stroke={RED} strokeWidth="0.9" />
        {/* Ground line */}
        <line x1="-18" y1="112" x2="148" y2="112" stroke="white" strokeOpacity="0.5" strokeWidth="0.7" />
        <g stroke="white" strokeOpacity="0.3" strokeWidth="0.4">
          {[-14, -2, 10, 22, 34, 46, 58, 70, 82, 94, 106, 118, 130, 142].map((x) => (
            <line key={x} x1={x} y1="112" x2={x + 4} y2="118" />
          ))}
        </g>
        {/* Stair from upper to lower */}
        <g stroke={RED} strokeWidth="0.8">
          <polyline points="90,34 96,40 96,46 102,46 102,52 108,52 108,58 114,58 114,64 120,64 120,70" />
        </g>
        {/* Dim lines */}
        <g stroke="white" strokeOpacity="0.3" strokeWidth="0.35">
          <line x1="-16" y1="14" x2="-16" y2="70" />
          <line x1="-18" y1="14" x2="-14" y2="14" />
          <line x1="-18" y1="70" x2="-14" y2="70" />
        </g>
      </g>
      {/* Drafting marks */}
      <g fontFamily="monospace" fontSize="6" fill="white" fillOpacity="0.4">
        <text x="20" y="18">SECTION A-A · 1:25</text>
        <text x="180" y="18" textAnchor="end">A-02</text>
        <text x="20" y="144">LOD 350 · .RVT</text>
        <text x="180" y="144" textAnchor="end">BOM READY</text>
      </g>
    </svg>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const isVacant = agent.status === 'VACANT'
  const statusColor = isVacant ? '#f5a524' : agent.status === 'IN BUILD' ? RED : 'rgba(255,255,255,0.75)'
  const ref = useRef<HTMLDivElement>(null)

  /* Scroll-in reveal only — no pointer parallax */
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, ease: 'power3.out',
          duration: 1.0,
          scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
        }
      )
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <article
      ref={ref}
      className="agent-card group relative flex flex-col"
      style={{
        background: '#000',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* ── Lava red border — two overlapping animated strokes that
           travel around the card perimeter on hover. The outer stroke
           is a long dim dash, the inner is a short bright "head" with a
           heavy drop-shadow glow — gives a molten-lava feel. ── */}
      <svg
        className="lava-border absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Long dim trail */}
        <rect
          x="0.5" y="0.5"
          width="calc(100% - 1px)" height="calc(100% - 1px)"
          fill="none"
          stroke={RED}
          strokeWidth="1.5"
          pathLength={100}
          strokeDasharray="55 45"
          strokeLinecap="round"
          className="lava-trail"
          style={{
            opacity: 0.35,
            filter: 'drop-shadow(0 0 3px rgba(220,53,69,0.6))',
          }}
        />
        {/* Bright molten head */}
        <rect
          x="0.5" y="0.5"
          width="calc(100% - 1px)" height="calc(100% - 1px)"
          fill="none"
          stroke={RED}
          strokeWidth="2.5"
          pathLength={100}
          strokeDasharray="14 86"
          strokeLinecap="round"
          className="lava-head"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(220,53,69,0.9)) drop-shadow(0 0 14px rgba(220,53,69,0.55))',
          }}
        />
      </svg>

      {/* ── Header strip ── */}
      <header
        className="flex items-center justify-between px-6 py-3.5 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">
          {agent.discipline}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: isVacant ? '#f5a524' : RED }}
        >
          {agent.drawingNo}
        </span>
      </header>

      {/* ── Illustration panel ── */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '1 / 1', background: '#000' }}
      >
        {/* Faint technical grid — static, no parallax */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 23px, rgba(255,255,255,0.04) 23px 24px),' +
              'repeating-linear-gradient(0deg, transparent 0 23px, rgba(255,255,255,0.04) 23px 24px)',
          }}
        />
        <div className="absolute inset-0 p-6">
          <AgentIllustration kind={agent.illustration} />
        </div>
      </div>

      {/* ── Minimal content ── */}
      <div
        className="flex flex-col gap-3 p-6 relative"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h3
          className="font-sans text-white font-medium"
          style={{
            fontSize: '1.5rem',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          {agent.role}
        </h3>
        <div className="h-[1px] w-10" style={{ background: RED }} />
        <div className="flex items-center justify-between pt-2 mt-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
            {agent.drawingNo} · Rev 2026.04
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: statusColor }}
          >
            {agent.status}
          </span>
        </div>
      </div>

      <style>{`
        /* Lava border — hidden at rest, flows around the perimeter on hover. */
        .agent-card .lava-border {
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 5;
        }
        .agent-card:hover .lava-border { opacity: 1; }

        .agent-card .lava-head,
        .agent-card .lava-trail {
          animation-play-state: paused;
          stroke-dashoffset: 0;
        }
        .agent-card:hover .lava-head {
          animation: lavaFlowFast 3s linear infinite;
          animation-play-state: running;
        }
        .agent-card:hover .lava-trail {
          animation: lavaFlowSlow 6s linear infinite;
          animation-play-state: running;
        }
        @keyframes lavaFlowFast {
          from { stroke-dashoffset: 0;    }
          to   { stroke-dashoffset: -100; }
        }
        @keyframes lavaFlowSlow {
          from { stroke-dashoffset: 0;   }
          to   { stroke-dashoffset: 100; }
        }
      `}</style>
    </article>
  )
}

function MeetTheTeam() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const heading = ref.current!.querySelectorAll<HTMLElement>('.team-reveal')
      heading.forEach((line, i) => {
        gsap.fromTo(
          line,
          { y: 60, opacity: 0 },
          {
            y: 0, opacity: 1, ease: 'power3.out',
            duration: 0.9, delay: i * 0.1,
            scrollTrigger: { trigger: line, start: 'top 85%', once: true },
          }
        )
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      className="relative w-full bg-black py-32 px-6 md:px-12 overflow-hidden"
    >
      {/* Ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0, transparent 119px, rgba(255,255,255,0.03) 119px, rgba(255,255,255,0.03) 120px),' +
            'repeating-linear-gradient(0deg, transparent 0, transparent 119px, rgba(255,255,255,0.03) 119px, rgba(255,255,255,0.03) 120px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div className="max-w-2xl">
            <div className="team-reveal font-mono text-[10px] uppercase tracking-[0.35em] text-white/40 mb-8">
              <span style={{ color: RED }}>◆</span>&nbsp;&nbsp;Team · Issue 2026.04
            </div>
            <h2
              className="team-reveal font-sans font-semibold text-white"
              style={{
                fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                maxWidth: '16ch',
              }}
            >
              The crew behind every deck<span style={{ color: RED }}>.</span>
            </h2>
          </div>
          <p
            className="team-reveal max-w-md text-white/55 text-[15px] font-light"
            style={{ lineHeight: 1.7 }}
          >
            Three specialist agents, each owning a discipline from site survey
            through to BIM delivery. One seat currently open.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AGENTS.map((a) => (
            <AgentCard key={a.drawingNo} agent={a} />
          ))}
        </div>

        {/* Footer meta — subtle drawing-register strip */}
        <div
          className="mt-16 pt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Sheet Set · A-00 / A-01 / A-02</span>
          <span>Orchestrated via CrewAI · Revit MCP</span>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════
   FINAL CTA — a grey "Enter Workshop" button sits dormant until
   a stream of red light flows up a vertical conduit on scroll and
   strikes the button, igniting it. The button has its own stage,
   centered in a tall section so it feels like a destination.
══════════════════════════════════════════════════════════════ */
function FinalCTA() {
  const rootRef = useRef<HTMLElement>(null)
  const pipeFillRef = useRef<SVGPathElement>(null)
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const sparkRef = useRef<SVGCircleElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current || !pipeFillRef.current || !buttonRef.current) return
    const ctx = gsap.context(() => {
      const el = rootRef.current!
      const pipe = pipeFillRef.current!
      const btn = buttonRef.current!
      const spark = sparkRef.current!
      const halo = haloRef.current!

      // Heading reveal
      gsap.fromTo(
        headingRef.current!.querySelectorAll('.cta-reveal'),
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, ease: 'power3.out',
          duration: 0.9, stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 70%', once: true },
        }
      )

      // Prep pipe as a stroke-dash progress meter
      const len = pipe.getTotalLength()
      pipe.style.strokeDasharray = `${len}`
      pipe.style.strokeDashoffset = `${len}`

      // Drive the red-light fill + button ignition on scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'bottom 70%',
          scrub: 0.8,
        },
      })
      tl.to(pipe, { strokeDashoffset: 0, ease: 'none' }, 0)
      // Spark bead travels straight down the conduit (pipe is a vertical line)
      tl.fromTo(spark, { attr: { cy: 0 } }, { attr: { cy: 400 }, ease: 'none' }, 0)

      // Ignition — once pipe is ~90% full, switch button from grey to red
      ScrollTrigger.create({
        trigger: el,
        start: 'top 35%',
        onEnter: () => {
          btn.classList.add('ignited')
          halo.classList.add('ignited')
        },
        onLeaveBack: () => {
          btn.classList.remove('ignited')
          halo.classList.remove('ignited')
        },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      className="relative w-full bg-black overflow-hidden"
      style={{ minHeight: '120vh' }}
    >
      {/* Ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0, transparent 119px, rgba(255,255,255,0.03) 119px, rgba(255,255,255,0.03) 120px),' +
            'repeating-linear-gradient(0deg, transparent 0, transparent 119px, rgba(255,255,255,0.03) 119px, rgba(255,255,255,0.03) 120px)',
        }}
      />

      {/* Top sheet strip */}
      <div
        className="relative flex items-center justify-between px-8 md:px-16 py-8 z-20 border-t border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/55">
          <span style={{ color: RED }}>◆</span>&nbsp;&nbsp;Enter · A-FIN
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          Sheet 04 · Destination
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-40 flex flex-col items-center">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-16">
          <div className="cta-reveal font-mono text-[10px] uppercase tracking-[0.35em] text-white/40 mb-8">
            <span style={{ color: RED }}>●</span>&nbsp;&nbsp;Ready · Rev 2026.04
          </div>
          <h2
            className="cta-reveal font-sans font-semibold text-white"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4.2rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: '18ch',
              margin: '0 auto',
            }}
          >
            Step into the workshop<span style={{ color: RED }}>.</span>
          </h2>
          <p
            className="cta-reveal mt-6 text-white/55 text-[15px] font-light"
            style={{ lineHeight: 1.7, maxWidth: '48ch', margin: '1.25rem auto 0' }}
          >
            Upload, design, generate. Your crew of agents is already on the floor —
            drop your first plan and watch the deck build itself.
          </p>
        </div>

        {/* ── Red light conduit + button ── */}
        <div className="relative w-full flex flex-col items-center" style={{ height: '500px' }}>
          {/* SVG conduit — vertical pipe with a flowing red fill that
              scrubs from 0 → 1 as the user scrolls into the section. */}
          <svg
            width="60"
            height="400"
            viewBox="0 0 60 400"
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
            aria-hidden
          >
            {/* Outer conduit — dim track */}
            <line
              x1="30" y1="0" x2="30" y2="400"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Tick marks along the conduit — makes it feel engineered */}
            {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((y) => (
              <line
                key={y}
                x1="22" y1={y} x2="38" y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.8"
              />
            ))}
            {/* Red flowing fill — stroke-dashoffset driven by ScrollTrigger */}
            <path
              ref={pipeFillRef}
              d="M 30 0 L 30 400"
              fill="none"
              stroke={RED}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(220,53,69,0.9)) drop-shadow(0 0 14px rgba(220,53,69,0.55))',
              }}
            />
            {/* Leading spark — bright bead travelling down the pipe */}
            <circle
              ref={sparkRef}
              cx="30" cy="0" r="4"
              fill="#ffe6ea"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.95)) drop-shadow(0 0 16px rgba(220,53,69,0.9))',
              }}
            />
          </svg>

          {/* Landing pad glow — lights up when ignited */}
          <div
            ref={haloRef}
            className="cta-halo absolute left-1/2 -translate-x-1/2"
            style={{
              top: '360px',
              width: '360px',
              height: '180px',
              transform: 'translate(-50%, 0)',
              background:
                'radial-gradient(ellipse 50% 50% at 50% 20%, rgba(220,53,69,0.45) 0%, rgba(220,53,69,0.15) 40%, transparent 75%)',
              opacity: 0,
              transition: 'opacity 0.7s ease',
              pointerEvents: 'none',
              filter: 'blur(8px)',
            }}
          />

          {/* The button itself — sits at the end of the conduit */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: '400px' }}
          >
            <Link
              ref={buttonRef}
              to="/workshop"
              className="cta-button inline-flex items-center gap-4 px-10 py-5 font-mono text-[12px] font-semibold uppercase tracking-[0.25em] transition-all duration-700"
              style={{
                clipPath:
                  'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              }}
            >
              <span className="cta-arrow inline-block" aria-hidden>▸</span>
              Enter Workshop
              <span className="cta-arrow inline-block" aria-hidden>▸</span>
            </Link>
          </div>
        </div>

        {/* Footer meta — drawing register style */}
        <div
          className="mt-24 pt-6 w-full flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>A-FIN · Terminus</span>
          <span>Signed · Issue 2026.04</span>
        </div>
      </div>

      <style>{`
        /* Grey dormant state */
        .cta-button {
          color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: none;
        }
        .cta-button .cta-arrow { color: rgba(255,255,255,0.25); transition: color 0.7s ease; }

        /* Ignited — struck by the red flow */
        .cta-button.ignited {
          color: #fff;
          background: ${RED};
          border-color: ${RED};
          box-shadow:
            0 0 24px rgba(220,53,69,0.6),
            0 0 56px rgba(220,53,69,0.35),
            inset 0 0 20px rgba(255,255,255,0.08);
          animation: ctaPulse 2.4s ease-in-out infinite;
        }
        .cta-button.ignited .cta-arrow { color: #fff; }
        .cta-button.ignited:hover {
          box-shadow:
            0 0 32px rgba(220,53,69,0.8),
            0 0 72px rgba(220,53,69,0.5),
            inset 0 0 24px rgba(255,255,255,0.12);
          transform: translateY(-2px);
        }
        @keyframes ctaPulse {
          0%, 100% {
            box-shadow:
              0 0 24px rgba(220,53,69,0.55),
              0 0 56px rgba(220,53,69,0.3),
              inset 0 0 20px rgba(255,255,255,0.06);
          }
          50% {
            box-shadow:
              0 0 34px rgba(220,53,69,0.8),
              0 0 78px rgba(220,53,69,0.45),
              inset 0 0 24px rgba(255,255,255,0.12);
          }
        }

        .cta-halo.ignited { opacity: 1; }
      `}</style>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const manifestoRef = useRef<HTMLDivElement>(null)
  const floatingSceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!manifestoRef.current || !floatingSceneRef.current) return

    const scene = floatingSceneRef.current
    const manifesto = manifestoRef.current

    const ctx = gsap.context(() => {
      /* The 3D scene lives ONLY between hero and manifesto.
         No resize, no rotate, no translate. It naturally "drops" into
         the manifesto as the hero scrolls away because both sections
         share a black background and the scene just persists.

         Fade + hide once we leave manifesto — hard lock so it
         cannot bleed into any section below. */
      /* Fade the 3D scene out well before the manifesto section ends.
         The manifesto is 400vh; its text exits ~60% through. We start
         fading at 62% and finish by 74% so the scene is fully gone
         long before the sticky viewport releases into Process. */
      ScrollTrigger.create({
        trigger: manifesto,
        start: '62% top',
        end: '74% top',
        scrub: 0.3,
        onUpdate: (self) => {
          scene.style.opacity = String(1 - self.progress)
        },
        onLeave: () => {
          scene.style.opacity = '0'
          scene.style.visibility = 'hidden'
          scene.style.pointerEvents = 'none'
        },
        onEnterBack: () => {
          scene.style.visibility = 'visible'
          scene.style.pointerEvents = 'none'
          scene.style.opacity = '1'
        },
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="bg-black text-white">
      {/* Floating 3D scene — position:fixed at its hero location.
           Stays untransformed so the full 3D model is preserved as-is.
           Fades out at the end of the manifesto section. */}
      <div
        ref={floatingSceneRef}
        className="pointer-events-none"
        style={{
          position: 'fixed',
          top: '34vh',
          left: 0,
          width: '100vw',
          height: '66vh',
          zIndex: 2,
        }}
      >
        <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
          <HeroScene />
        </div>
      </div>

      <Hero ref={heroRef} />
      <div ref={manifestoRef}>
        <ManifestoZoom />
      </div>
      <Process />
      <MeetTheTeam />
      <Gallery />
      <FinalCTA />
    </div>
  )
}
