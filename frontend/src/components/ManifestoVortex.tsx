/**
 * ManifestoVortex — "We replace weeks of drafting with minutes of intent."
 *
 * Entry: Staggered parallax fade-in per word as the section enters the viewport.
 * Exit:  As the user scrolls past, the camera is "sucked into" the 'o' in 'of'.
 *        The entire text scales up MASSIVELY (1→150) with transformOrigin
 *        locked to the 'o', so the inside of the letter swallows the viewport
 *        acting as a cinematic transition to the next (black) section.
 *
 * Uses Framer Motion (useScroll, useTransform) for smooth GPU-accelerated animation.
 */

import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion'

const RED = '#DC3545'

/* ── Word-level animation config ─────────────────────────────── */
interface WordData {
  text: string
  isTarget: boolean   // the 'o' in 'of' that we zoom into
  isTargetWord: boolean // the full word 'of'
}

function splitLine(text: string, targetWord: string, targetChar: string): WordData[] {
  return text.split(' ').map((w) => ({
    text: w,
    isTargetWord: w.toLowerCase() === targetWord.toLowerCase(),
    isTarget: false,
  }))
}

/* ── Entry shimmer for the overline line ──────────────────────── */
function OverlineBadge() {
  return (
    <motion.div
      className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/40 mb-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: '-10%' }}
    >
      <span style={{ color: RED }}>◆</span>&nbsp;&nbsp;Manifesto · Rev 2026.04
    </motion.div>
  )
}

export default function ManifestoVortex() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const oRef = useRef<HTMLSpanElement>(null)

  // Track the computed transformOrigin based on where the 'o' is
  const [origin, setOrigin] = useState('50% 50%')

  // Measure the 'o' position relative to the text container
  const calculateOrigin = () => {
    if (!oRef.current || !textContainerRef.current) return
    const oRect = oRef.current.getBoundingClientRect()
    const containerRect = textContainerRef.current.getBoundingClientRect()

    const centerX = oRect.left + oRect.width / 2 - containerRect.left
    const centerY = oRect.top + oRect.height / 2 - containerRect.top

    const pctX = (centerX / containerRect.width) * 100
    const pctY = (centerY / containerRect.height) * 100

    setOrigin(`${pctX.toFixed(2)}% ${pctY.toFixed(2)}%`)
  }

  useLayoutEffect(() => {
    calculateOrigin()
  }, [])

  useEffect(() => {
    window.addEventListener('resize', calculateOrigin)
    // Recalculate after fonts load
    document.fonts.ready.then(calculateOrigin)
    return () => window.removeEventListener('resize', calculateOrigin)
  }, [])

  /* ── Scroll-driven transforms ──────────────────────────────── */
  // The section is tall (300vh) to give enough scroll runway:
  //   0%–40%   = entry + display
  //   40%–100% = zoom/suck into the 'o'
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Scale: hold at 1 for the first 40%, then ramp 1→200 from 40%→90%
  const scale = useTransform(scrollYProgress, [0.35, 0.85], [1, 200], {
    clamp: true,
  })

  // Opacity of non-target text: starts fading as zoom begins
  const textOpacity = useTransform(scrollYProgress, [0.35, 0.55], [1, 0], {
    clamp: true,
  })

  // Opacity of the 'o' ring: stays visible longer, then fades
  const oRingOpacity = useTransform(scrollYProgress, [0.55, 0.75], [1, 0], {
    clamp: true,
  })

  // Overall section opacity: fade to black at the very end
  const sectionOpacity = useTransform(scrollYProgress, [0.82, 0.95], [1, 0], {
    clamp: true,
  })

  // Background circle glow expanding from the 'o' position
  const glowScale = useTransform(scrollYProgress, [0.35, 0.7], [0, 5], {
    clamp: true,
  })
  const glowOpacity = useTransform(scrollYProgress, [0.35, 0.5, 0.75], [0, 0.15, 0], {
    clamp: true,
  })

  // Backdrop text parallax
  const backdropX = useTransform(scrollYProgress, [0, 1], ['8%', '-14%'])
  const backdropOpacity = useTransform(scrollYProgress, [0, 0.15, 0.4, 0.55], [0, 0.06, 0.06, 0])

  // Vertical tick-rule fill
  const tickScaleY = useTransform(scrollYProgress, [0.05, 0.35], [0, 1], { clamp: true })

  // Meter bar fill
  const meterScaleX = useTransform(scrollYProgress, [0.08, 0.35], [0, 1], { clamp: true })

  // Live counter values
  const [weeks, setWeeks] = useState(3)
  const [mins, setMins] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Map 0.08→0.35 to weeks: 3→0
    const wProg = Math.min(1, Math.max(0, (v - 0.08) / 0.27))
    setWeeks(Math.round(3 * (1 - wProg)))
    // Map 0.08→0.35 to mins: 0→12
    setMins(Math.round(12 * wProg))
  })

  /* ── Word arrays ───────────────────────────────────────────── */
  const line1 = 'We replace weeks of drafting'
  const line2 = 'with minutes of intent'
  const line1Words = line1.split(' ')
  const line2Words = line2.split(' ')

  // Find the target 'of' in line1 (index 3: "We replace weeks [of] drafting")
  const targetWordIndex = 3  // "of" in line1

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-black"
      style={{ height: '300vh' }}
    >
      {/* Sticky container — stays in viewport during scroll */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center">
        {/* Radial glow emanating from the 'o' position */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: origin.split(' ')[0],
            top: origin.split(' ')[1],
            width: '40vw',
            height: '40vw',
            x: '-50%',
            y: '-50%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${RED}40 0%, transparent 70%)`,
            scale: glowScale,
            opacity: glowOpacity,
          }}
        />

        {/* ── Huge ghost-text backdrop: "DRAFTING" ── */}
        <motion.div
          className="absolute inset-y-0 -left-[5%] flex items-center pointer-events-none select-none"
          style={{ x: backdropX, opacity: backdropOpacity }}
          aria-hidden
        >
          <div
            className="font-sans font-black text-white/[0.05]"
            style={{
              fontSize: 'clamp(14rem, 34vw, 34rem)',
              lineHeight: 0.82,
              letterSpacing: '-0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            DRAFTING
          </div>
        </motion.div>

        {/* ── Vertical tick-rule ── */}
        <div className="absolute left-6 top-[15%] bottom-[15%] w-[2px] pointer-events-none">
          <div className="absolute inset-0 bg-white/10" />
          <motion.div
            className="absolute inset-0"
            style={{
              background: RED,
              boxShadow: `0 0 12px ${RED}`,
              scaleY: tickScaleY,
              transformOrigin: 'top center',
            }}
          />
          {[0, 20, 40, 60, 80, 100].map((p) => (
            <div
              key={p}
              className="absolute left-0 w-3 h-[1px]"
              style={{ top: `${p}%`, background: 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>

        {/* ── Main content area ── */}
        <div className="relative max-w-6xl mx-auto px-8 md:px-16 z-10 w-full">
          <OverlineBadge />

          {/* Scalable text container — zooms into the 'o' */}
          <motion.div
            ref={textContainerRef}
            style={{
              scale,
              transformOrigin: origin,
              willChange: 'transform',
            }}
          >
            {/* ── Line 1: "We replace weeks of drafting" ── */}
            <div className="line1 flex flex-wrap">
              {line1Words.map((word, i) => {
                const isOfWord = i === targetWordIndex

                return (
                  <motion.span
                    key={`l1-${i}`}
                    className="inline-block mr-[0.25em] will-change-transform font-sans font-semibold text-white"
                    style={{
                      fontSize: 'clamp(2rem, 5.4vw, 5rem)',
                      lineHeight: 1.04,
                      letterSpacing: '-0.03em',
                      transformStyle: 'preserve-3d',
                      opacity: isOfWord ? 1 : textOpacity,
                    }}
                    initial={{ y: 50 + ((i * 7) % 13) * 4, rotateX: ((i % 3) - 1) * 6, opacity: 0, filter: 'blur(14px)' }}
                    whileInView={{ y: 0, rotateX: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.9,
                      delay: i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    viewport={{ once: true, margin: '-5%' }}
                  >
                    {isOfWord ? (
                      <>
                        {/* 'o' character — the vortex target */}
                        <motion.span
                          ref={oRef}
                          className="inline-block relative"
                          style={{ opacity: oRingOpacity }}
                        >
                          o
                          {/* Subtle ring glow around the 'o' during zoom */}
                          <motion.span
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                              boxShadow: `0 0 20px ${RED}, 0 0 40px ${RED}50`,
                              opacity: useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0, 0.8, 0]),
                              scale: useTransform(scrollYProgress, [0.35, 0.5], [1, 1.5]),
                            }}
                          />
                        </motion.span>
                        <motion.span style={{ opacity: textOpacity }}>f</motion.span>
                      </>
                    ) : (
                      word
                    )}
                  </motion.span>
                )
              })}
            </div>

            {/* ── Line 2: "with minutes of intent" ── */}
            <div
              className="line2 flex flex-wrap mt-2"
              style={{ color: RED, textShadow: `0 0 26px rgba(220,53,69,0.35)` }}
            >
              {line2Words.map((word, i) => (
                <motion.span
                  key={`l2-${i}`}
                  className="inline-block mr-[0.25em] will-change-transform font-sans font-semibold"
                  style={{
                    fontSize: 'clamp(2rem, 5.4vw, 5rem)',
                    lineHeight: 1.04,
                    letterSpacing: '-0.03em',
                    opacity: textOpacity,
                  }}
                  initial={{ x: -60, opacity: 0, scale: 0.88, filter: 'blur(6px)' }}
                  whileInView={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.7,
                    delay: 0.3 + i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  viewport={{ once: true, margin: '-5%' }}
                >
                  {word}
                </motion.span>
              ))}
              {/* Period */}
              <motion.span
                className="inline-block will-change-transform font-sans font-semibold"
                style={{
                  fontSize: 'clamp(2rem, 5.4vw, 5rem)',
                  color: RED,
                  opacity: textOpacity,
                }}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5, ease: 'backOut' }}
                viewport={{ once: true, margin: '-5%' }}
              >
                .
              </motion.span>
            </div>
          </motion.div>

          {/* ── Live scroll-driven counter + meter ── */}
          <motion.div className="mt-14 max-w-2xl" style={{ opacity: textOpacity }}>
            {/* Counter row */}
            <div className="flex items-end justify-between mb-3 font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1">
                  Weeks of drafting
                </span>
                <span className="flex items-baseline gap-3">
                  <span
                    className="text-white tabular-nums"
                    style={{
                      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      fontWeight: 700,
                    }}
                  >
                    {weeks}
                  </span>
                  <span className="text-white/30 text-sm">wks</span>
                </span>
              </div>

              <div className="font-mono text-2xl text-white/20 mx-4">→</div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1">
                  Minutes of intent
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="text-white/30 text-sm">mins</span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      fontWeight: 700,
                      color: RED,
                      textShadow: `0 0 24px rgba(220,53,69,0.5)`,
                    }}
                  >
                    {mins}
                  </span>
                </span>
              </div>
            </div>

            {/* Meter bar */}
            <div className="relative h-[3px] w-full bg-white/[0.08]">
              <motion.div
                className="absolute inset-0 origin-left"
                style={{
                  background: RED,
                  boxShadow: `0 0 10px ${RED}`,
                  scaleX: meterScaleX,
                }}
              />
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
              Time compression · Multi-agent pipeline · Revit-ready output
            </div>
          </motion.div>
        </div>

        {/* Section fade-to-black overlay at the very end of scroll */}
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: useTransform(scrollYProgress, [0.85, 0.98], [0, 1]) }}
        />
      </div>
    </section>
  )
}
