/**
 * ScrollytellingSection — Apple-style scrollytelling with a glowing red ball
 * traveling down an SVG path, hitting node targets, revealing content.
 *
 * Uses GSAP ScrollTrigger + MotionPathPlugin.
 */

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Layers, Cpu, ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

const RED = '#DC3545'

/* ────────────────────────────────────────────────────────────────
   STEP DATA
   ──────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    id: 'upload',
    num: '01',
    label: 'Upload',
    headline: 'Upload your floor plan',
    description:
      'Drop your house floor plan. Our AI vision agent extracts every wall, boundary, and measurement instantly.',
    Icon: Upload,
    align: 'center' as const,
  },
  {
    id: 'design',
    num: '02',
    label: 'Design',
    headline: 'Design your deck',
    description:
      'Drag zones, set elevations, pick materials. Shape stairs and pool surrounds — your deck, your rules.',
    Icon: Layers,
    align: 'left' as const,
  },
  {
    id: 'generate',
    num: '03',
    label: 'Generate',
    headline: 'Generate with AI',
    description:
      'Our multi-agent system builds a full 3D Revit model with construction-ready BIM specifications.',
    Icon: Cpu,
    align: 'right' as const,
  },
]

/* ────────────────────────────────────────────────────────────────
   SVG PATH — carefully designed to flow through content blocks
   viewBox="0 0 800 2400"
   Node positions (cx, cy): (400,300), (220,1000), (580,1700)
   ──────────────────────────────────────────────────────────────── */
const PATH_D =
  'M 400 100 C 400 200, 400 250, 400 300 C 400 450, 200 550, 220 700 C 220 800, 220 900, 220 1000 C 220 1150, 580 1250, 580 1400 C 580 1500, 580 1600, 580 1700 C 580 1850, 400 1950, 400 2100'

const NODE_POSITIONS = [
  { cx: 400, cy: 300 },
  { cx: 220, cy: 1000 },
  { cx: 580, cy: 1700 },
]

/* ────────────────────────────────────────────────────────────────
   COMPONENT
   ──────────────────────────────────────────────────────────────── */
export default function ScrollytellingSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    const ball = ballRef.current
    const trail = trailRef.current
    if (!section || !ball || !trail) return

    // Get trail path length for draw-on effect
    const pathLength = trail.getTotalLength()
    gsap.set(trail, { strokeDasharray: pathLength, strokeDashoffset: pathLength })

    const ctx = gsap.context(() => {
      // Master timeline pinned to scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
        },
      })

      // 1) Animate ball along the SVG path
      tl.to(ball, {
        motionPath: {
          path: '#motionPath',
          align: '#motionPath',
          alignOrigin: [0.5, 0.5],
          autoRotate: false,
        },
        duration: 1,
        ease: 'none',
      }, 0)

      // 2) Draw the trail path as ball moves
      tl.to(trail, {
        strokeDashoffset: 0,
        duration: 1,
        ease: 'none',
      }, 0)

      // 3) Animate each card with staggered timing
      STEPS.forEach((_, i) => {
        const card = cardsRef.current[i]
        if (!card) return

        const startProgress = (i * 0.3) + 0.05
        const endProgress = startProgress + 0.2

        // Card fade-in and slide-up
        tl.fromTo(card,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: endProgress - startProgress, ease: 'power2.out' },
          startProgress,
        )

        // Fade out (except last card stays)
        if (i < STEPS.length - 1) {
          tl.to(card,
            { opacity: 0.15, duration: 0.1, ease: 'power1.in' },
            endProgress + 0.05,
          )
        }
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0a0a0a]"
      style={{ height: '300vh' }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* SVG layer — path + nodes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 2400"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.15 }}
        >
          {/* Ghost path (static, faint) */}
          <path
            d={PATH_D}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />
        </svg>

        {/* SVG for the animated trail (drawn on as ball moves) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 2400"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Visible motion path for GSAP (invisible itself) */}
          <path
            id="motionPath"
            d={PATH_D}
            fill="none"
            stroke="none"
          />
          {/* Trail drawn behind ball */}
          <path
            ref={trailRef}
            d={PATH_D}
            fill="none"
            stroke={RED}
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Static node rings */}
          {NODE_POSITIONS.map((pos, i) => (
            <g key={i}>
              {/* Outer ring */}
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="18"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              {/* Inner ring */}
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="8"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>

        {/* Glowing ball */}
        <div
          ref={ballRef}
          className="absolute z-20 pointer-events-none"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: RED,
            boxShadow: `0 0 12px ${RED}, 0 0 30px ${RED}80, 0 0 60px ${RED}40`,
            transform: 'translate(-50%, -50%)',
            left: 0,
            top: 0,
          }}
        />

        {/* Content cards */}
        {STEPS.map((step, i) => {
          const alignClass =
            step.align === 'left'
              ? 'items-start pl-8 md:pl-[10%]'
              : step.align === 'right'
              ? 'items-end pr-8 md:pr-[10%]'
              : 'items-center'

          const textAlign =
            step.align === 'left'
              ? 'text-left'
              : step.align === 'right'
              ? 'text-right'
              : 'text-center'

          // Vertical positioning for each card
          const topPercent = 15 + i * 25

          return (
            <div
              key={step.id}
              ref={(el) => { cardsRef.current[i] = el }}
              className={`absolute left-0 right-0 flex flex-col ${alignClass} z-10 pointer-events-none`}
              style={{ top: `${topPercent}%`, opacity: 0 }}
            >
              <div className={`max-w-md ${textAlign}`}>
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 ${
                    step.align === 'right' ? 'ml-auto' : step.align === 'left' ? '' : 'mx-auto'
                  }`}
                  style={{
                    border: `1px solid rgba(220,53,69,0.2)`,
                    background: 'rgba(220,53,69,0.06)',
                  }}
                >
                  <step.Icon size={24} color={RED} strokeWidth={1.5} />
                </div>

                {/* Step label */}
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: RED }}>
                  Step {step.num} — {step.label}
                </div>

                {/* Headline */}
                <h2
                  className="font-sans font-bold text-white mb-4"
                  style={{
                    fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {step.headline}
                </h2>

                {/* Description */}
                <p className="font-sans text-sm text-white/30 leading-relaxed max-w-sm">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0a)' }}
        />
      </div>

      {/* ── Final CTA — after scrollytelling ── */}
      <div className="relative z-10 -mt-[100vh] pt-[100vh]">
        <div className="flex flex-col items-center justify-center py-32 px-8 bg-[#0a0a0a]">
          {/* Mini timeline recap */}
          <div className="flex items-center gap-4 mb-12">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{ border: '1px solid rgba(220,53,69,0.2)', background: 'rgba(220,53,69,0.05)' }}
                  >
                    <step.Icon size={18} color={RED} strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-12 h-[1px]" style={{ background: `linear-gradient(to right, ${RED}40, ${RED}10)` }} />
                )}
              </div>
            ))}
          </div>

          {/* Heading */}
          <h3
            className="font-sans font-bold text-white text-center mb-8"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', letterSpacing: '-0.02em' }}
          >
            Ready to build your dream deck?
          </h3>

          {/* Glowing CTA */}
          <Link
            to="/workshop"
            className="cta-glow group relative inline-flex items-center gap-3 px-10 py-4 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-white transition-all duration-500 hover:scale-[1.03]"
            style={{ background: RED }}
          >
            <span className="relative z-10">Enter Workshop</span>
            <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <style>{`
        .cta-glow {
          box-shadow: 0 0 20px rgba(220, 53, 69, 0.25);
          animation: ctaPulse 2.5s ease-in-out infinite;
        }
        .cta-glow:hover {
          box-shadow: 0 0 40px rgba(220, 53, 69, 0.5), 0 0 80px rgba(220, 53, 69, 0.2);
        }
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(220, 53, 69, 0.2); }
          50%      { box-shadow: 0 0 35px rgba(220, 53, 69, 0.4), 0 0 70px rgba(220, 53, 69, 0.12); }
        }
      `}</style>
    </section>
  )
}
