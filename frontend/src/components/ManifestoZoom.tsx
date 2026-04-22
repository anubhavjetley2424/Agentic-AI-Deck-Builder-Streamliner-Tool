/**
 * ManifestoZoom — statement cascade + DeckForge logo construction.
 *
 * A 400vh sticky section. The viewport is split into two acts that share
 * the same scroll:
 *
 *   Act I — Statement (0.00 → 0.40)
 *     Per-word cascade into place, brief hold. The two-line manifesto
 *     lives at full presence through the first 40% of the scroll.
 *
 *   Act II — Logo Construction (0.40 → 0.90)
 *     The text eases upward and dims as the DeckForge mark assembles
 *     beneath it in three architectural phases:
 *       Phase 1  (0.42 → 0.54)  white outer square draws (SVG stroke wipe)
 *       Phase 2  (0.54 → 0.68)  interior white features fade in
 *                                (plank divider, construction hatches)
 *       Phase 3  (0.68 → 0.84)  red accents assemble — midline,
 *                                inner rect, four corner ticks
 *     A "DeckForge" wordmark fades in at the close (0.82 → 0.90).
 *
 *   Hand-off (0.92 → 1.0)
 *     Section fades out into the next block.
 *
 * Depth is provided by:
 *   ‣ a slow-drifting blueprint grid (parallax)
 *   ‣ a red ambient haze that peaks during the statement hold
 *   ‣ a center vignette that keeps focus tight
 */

import { forwardRef, useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'

const RED = '#DC3545'

const LINE1_WORDS = ['We', 'are', 'replacing', 'weeks', 'of', 'drafting']
const LINE2_WORDS = ['with', 'minutes', 'of', 'intent.']
const TOTAL_WORDS = LINE1_WORDS.length + LINE2_WORDS.length
const TARGET_IDX = 4 // 'of' in line 1

/* ══════════════════════════════════════════════════════════════
   WORD WINDOWS — entry cascade + text-upward exit into Act II.
   Entry lives in 0.02 → 0.18, exit is pushed to 0.40 → 0.55 so the
   statement reads clean through the hold before the logo build begins.
══════════════════════════════════════════════════════════════ */
function useWordWindows(globalIndex: number) {
  // Delayed entry so the 3D model settles first from the hero transition
  const entryEnd = 0.10 + (globalIndex / TOTAL_WORDS) * 0.18
  const entryStart = Math.max(0.02, entryEnd - 0.10)
  const exitStart = 0.52 + (globalIndex / TOTAL_WORDS) * 0.06
  const exitEnd = Math.min(0.72, exitStart + 0.14)
  return { entryStart, entryEnd, exitStart, exitEnd }
}

function AnimatedWord({
  word, globalIndex, scrollYProgress, isRedLine,
}: {
  word: string
  globalIndex: number
  scrollYProgress: MotionValue<number>
  isRedLine: boolean
}) {
  const { entryStart, entryEnd, exitStart, exitEnd } = useWordWindows(globalIndex)

  const enterY = useTransform(scrollYProgress, [entryStart, entryEnd], [60, 0])
  const exitY = useTransform(scrollYProgress, [exitStart, exitEnd], [0, -80])
  const y = useTransform([enterY, exitY] as any, ([a, b]: number[]) => a + b)

  const enterOp = useTransform(scrollYProgress, [entryStart, entryEnd], [0, 1])
  const exitOp = useTransform(scrollYProgress, [exitStart, exitEnd], [1, 0])
  const opacity = useTransform(
    [enterOp, exitOp] as any,
    ([a, b]: number[]) => Math.min(a, b),
  )

  return (
    <motion.span
      className="inline-block font-sans font-semibold will-change-transform"
      style={{
        fontSize: 'clamp(1.6rem, 4.2vw, 3.8rem)',
        lineHeight: 1.08,
        letterSpacing: '-0.03em',
        color: isRedLine ? RED : 'white',
        y,
        opacity,
        marginRight: '0.3em',
      }}
    >{word}</motion.span>
  )
}

/* Target word — same parallax, kept as a forwardRef for future accents.
   No halo, no portal — the user explicitly asked for it clean. */
const TargetWord = forwardRef<HTMLSpanElement, {
  globalIndex: number
  scrollYProgress: MotionValue<number>
}>(function TargetWord({ globalIndex, scrollYProgress }, ref) {
  const { entryStart, entryEnd, exitStart, exitEnd } = useWordWindows(globalIndex)

  const enterY = useTransform(scrollYProgress, [entryStart, entryEnd], [60, 0])
  const exitY = useTransform(scrollYProgress, [exitStart, exitEnd], [0, -80])
  const y = useTransform([enterY, exitY] as any, ([a, b]: number[]) => a + b)

  const enterOp = useTransform(scrollYProgress, [entryStart, entryEnd], [0, 1])
  const exitOp = useTransform(scrollYProgress, [exitStart, exitEnd], [1, 0])
  const opacity = useTransform([enterOp, exitOp] as any, ([a, b]: number[]) => Math.min(a, b))

  return (
    <motion.span
      className="inline-block font-sans font-semibold text-white will-change-transform"
      style={{
        fontSize: 'clamp(1.6rem, 4.2vw, 3.8rem)',
        lineHeight: 1.08,
        letterSpacing: '-0.03em',
        y,
        opacity,
        marginRight: '0.3em',
      }}
    >
      <span ref={ref} className="relative inline-block" style={{ color: 'white' }}>o</span>
      <span className="inline-block">f</span>
    </motion.span>
  )
})

/* ══════════════════════════════════════════════════════════════
   LOGO CONSTRUCTOR
   Three phases, scroll-driven. SVG viewBox 0 0 100 100 so the stroke
   math is readable:
     • Outer square:       x=8..92, y=8..92  → perimeter = 4 * 84 = 336
     • Midline (red):      y = 50  → length = 84
     • Inner rect (red):   x=26..74, y=38..62  → perimeter = 2*(48+24) = 144
     • Corner ticks (red): 4 tiny L-shapes in each outer corner
     • Interior hatches:   three faint white construction lines
 ══════════════════════════════════════════════════════════════ */
function LogoConstructor({
  scrollYProgress,
}: { scrollYProgress: MotionValue<number> }) {
  // Stage opacity — whole assembly eases in from nothing at Act II start
  const stageOp = useTransform(scrollYProgress, [0.38, 0.46, 0.90, 0.98], [0, 1, 1, 0])
  const stageY = useTransform(scrollYProgress, [0.38, 0.50], [40, 0])

  /* ── Phase 1 — outer square border draws ──────────── */
  const outerOffset = useTransform(
    scrollYProgress,
    [0.42, 0.54],
    [336, 0],
  )
  const outerOp = useTransform(scrollYProgress, [0.42, 0.46], [0, 1])

  /* ── Phase 2 — interior white features fade in ────── */
  // Plank dividers (vertical construction lines inside the square)
  const hatchOp = useTransform(scrollYProgress, [0.54, 0.66], [0, 0.55])
  // Dimension tick marks along the top edge
  const dimOp = useTransform(scrollYProgress, [0.56, 0.68], [0, 0.7])

  /* ── Phase 3 — red elements assemble ──────────────── */
  // Midline red strike-through (draws left → right)
  const midOffset = useTransform(scrollYProgress, [0.68, 0.76], [84, 0])
  const midOp = useTransform(scrollYProgress, [0.68, 0.72], [0, 1])

  // Inner red rectangle (draws around)
  const innerOffset = useTransform(scrollYProgress, [0.72, 0.80], [144, 0])
  const innerOp = useTransform(scrollYProgress, [0.72, 0.76], [0, 1])

  // Four red corner ticks — staggered pop-in
  const tickOp1 = useTransform(scrollYProgress, [0.780, 0.810], [0, 1])
  const tickOp2 = useTransform(scrollYProgress, [0.795, 0.825], [0, 1])
  const tickOp3 = useTransform(scrollYProgress, [0.810, 0.840], [0, 1])
  const tickOp4 = useTransform(scrollYProgress, [0.825, 0.855], [0, 1])

  // Wordmark beneath
  const labelOp = useTransform(scrollYProgress, [0.82, 0.90], [0, 1])
  const labelY = useTransform(scrollYProgress, [0.82, 0.90], [12, 0])

  // Soft red aura that blooms when the red phase hits
  const auraOp = useTransform(scrollYProgress, [0.66, 0.78, 0.90], [0, 0.6, 0.4])

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center will-change-transform"
      style={{
        opacity: stageOp,
        y: stageY,
      }}
    >
      {/* Red aura behind the mark */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 'clamp(240px, 22vw, 360px)',
          height: 'clamp(240px, 22vw, 360px)',
          background:
            'radial-gradient(circle, rgba(220,53,69,0.38) 0%, rgba(220,53,69,0.12) 45%, transparent 72%)',
          opacity: auraOp,
          filter: 'blur(18px)',
          zIndex: 0,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        style={{
          width: 'clamp(180px, 18vw, 240px)',
          height: 'clamp(180px, 18vw, 240px)',
          position: 'relative',
          zIndex: 1,
          overflow: 'visible',
        }}
      >
        {/* ── PHASE 1 — outer white square border ─────────── */}
        <motion.rect
          x="8" y="8" width="84" height="84"
          fill="none"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="square"
          pathLength={336}
          strokeDasharray={336}
          style={{
            strokeDashoffset: outerOffset,
            opacity: outerOp,
          }}
        />

        {/* ── PHASE 2 — interior white construction features ── */}
        {/* Vertical plank divider lines */}
        <motion.g style={{ opacity: hatchOp }}>
          <line x1="30" y1="8" x2="30" y2="92" stroke="white" strokeWidth="0.5" strokeDasharray="2 3" />
          <line x1="50" y1="8" x2="50" y2="92" stroke="white" strokeWidth="0.5" strokeDasharray="2 3" />
          <line x1="70" y1="8" x2="70" y2="92" stroke="white" strokeWidth="0.5" strokeDasharray="2 3" />
        </motion.g>

        {/* Dimension ticks along the top edge */}
        <motion.g style={{ opacity: dimOp }}>
          <line x1="8" y1="4" x2="8" y2="7" stroke="white" strokeWidth="0.8" />
          <line x1="30" y1="4" x2="30" y2="7" stroke="white" strokeWidth="0.6" />
          <line x1="50" y1="4" x2="50" y2="7" stroke="white" strokeWidth="0.8" />
          <line x1="70" y1="4" x2="70" y2="7" stroke="white" strokeWidth="0.6" />
          <line x1="92" y1="4" x2="92" y2="7" stroke="white" strokeWidth="0.8" />
          <line x1="8" y1="5.5" x2="92" y2="5.5" stroke="white" strokeWidth="0.3" />
        </motion.g>

        {/* ── PHASE 3a — red horizontal midline ─────────────── */}
        <motion.line
          x1="8" y1="50" x2="92" y2="50"
          stroke={RED}
          strokeWidth="2"
          strokeLinecap="square"
          pathLength={84}
          strokeDasharray={84}
          style={{
            strokeDashoffset: midOffset,
            opacity: midOp,
          }}
        />

        {/* ── PHASE 3b — red inner rectangle ────────────────── */}
        <motion.rect
          x="26" y="38" width="48" height="24"
          fill="none"
          stroke={RED}
          strokeWidth="1.4"
          strokeLinecap="square"
          pathLength={144}
          strokeDasharray={144}
          style={{
            strokeDashoffset: innerOffset,
            opacity: innerOp,
          }}
        />

        {/* ── PHASE 3c — red corner ticks, staggered ──────── */}
        <motion.g style={{ opacity: tickOp1 }} stroke={RED} strokeWidth="1.4">
          <line x1="8" y1="8" x2="14" y2="8" />
          <line x1="8" y1="8" x2="8" y2="14" />
        </motion.g>
        <motion.g style={{ opacity: tickOp2 }} stroke={RED} strokeWidth="1.4">
          <line x1="92" y1="8" x2="86" y2="8" />
          <line x1="92" y1="8" x2="92" y2="14" />
        </motion.g>
        <motion.g style={{ opacity: tickOp3 }} stroke={RED} strokeWidth="1.4">
          <line x1="8" y1="92" x2="14" y2="92" />
          <line x1="8" y1="92" x2="8" y2="86" />
        </motion.g>
        <motion.g style={{ opacity: tickOp4 }} stroke={RED} strokeWidth="1.4">
          <line x1="92" y1="92" x2="86" y2="92" />
          <line x1="92" y1="92" x2="92" y2="86" />
        </motion.g>
      </svg>

      {/* Wordmark — fades in once the mark is complete */}
      <motion.div
        className="mt-5 flex items-baseline gap-[0.18em] font-sans font-semibold tracking-[-0.02em]"
        style={{
          fontSize: 'clamp(1.1rem, 1.6vw, 1.7rem)',
          opacity: labelOp,
          y: labelY,
        }}
      >
        <span className="text-white">Deck</span>
        <span style={{ color: RED }}>Forge</span>
      </motion.div>

      {/* Tiny technical caption underneath the wordmark */}
      <motion.div
        className="mt-2 font-mono text-[9px] uppercase tracking-[0.35em] text-white/40"
        style={{ opacity: labelOp }}
      >
        Mark · Rev 2026.04
      </motion.div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function ManifestoZoom() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const oRef = useRef<HTMLSpanElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  /* ── Background parallax layers ── */
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '-28%'])
  const gridOp = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0, 0.55, 0.55, 0])

  // Red haze — upper viewport area only, breathes through the statement hold
  const hazeOp = useTransform(scrollYProgress, [0.12, 0.28, 0.48, 0.58], [0, 0.85, 0.85, 0])
  const hazeScale = useTransform(scrollYProgress, [0, 0.35, 0.7], [0.9, 1.1, 1.3])

  // Meta ticker — delayed to match text entry
  const metaOp = useTransform(scrollYProgress, [0.06, 0.14, 0.50, 0.58], [0, 1, 1, 0])
  const metaY = useTransform(scrollYProgress, [0.06, 0.14], [28, 0])

  // Floating drift during the statement hold
  const textBobY = useTransform(scrollYProgress, [0.24, 0.36, 0.50], [0, -6, 0])

  // Rule line — wipes in under the statement, out before Act II
  const ruleScale = useTransform(scrollYProgress, [0.20, 0.30, 0.50, 0.58], [0, 1, 1, 0])

  // Section fade at the very end so we hand off cleanly
  const sectionOp = useTransform(scrollYProgress, [0.94, 1.0], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative bg-black"
      style={{ height: '400vh' }}
    >
      <motion.div
        className="sticky top-0 w-full h-screen overflow-hidden"
        style={{ opacity: sectionOp }}
      >
        {/* ── Layer 0: parallax grid ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            y: gridY,
            opacity: gridOp,
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0, transparent 119px, rgba(255,255,255,0.045) 119px, rgba(255,255,255,0.045) 120px),' +
              'repeating-linear-gradient(0deg, transparent 0, transparent 119px, rgba(255,255,255,0.045) 119px, rgba(255,255,255,0.045) 120px)',
            zIndex: 0,
          }}
        />

        {/* ── Layer 1: red ambient haze — top viewport area only ── */}
        <motion.div
          className="absolute pointer-events-none left-0 right-0 top-0"
          style={{
            width: '90vw',
            height: '38vh',
            margin: '0 auto',
            opacity: hazeOp,
            scale: hazeScale,
            background:
              'radial-gradient(ellipse 60% 70% at 50% 60%, rgba(220,53,69,0.28) 0%, rgba(220,53,69,0.12) 35%, transparent 75%)',
            zIndex: 1,
            filter: 'blur(14px)',
          }}
        />

        {/* ── Layer 2: side meta strips ── */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-6 z-10 font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 pointer-events-none"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)' }}
        >
          02 · Manifesto · Rev 2026.04
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 right-6 z-10 font-mono text-[9px] uppercase tracking-[0.3em] pointer-events-none"
          style={{ writingMode: 'vertical-rl', color: RED, opacity: 0.55 }}
        >
          ● STATEMENT · One intent
        </div>

        {/* ── Layer 3a: statement — top 38vh, ABOVE the 3D scene ── */}
        <div
          className="absolute left-0 right-0 top-0 flex items-center justify-center px-6 pointer-events-none"
          style={{ zIndex: 5, height: '38vh' }}
        >
          <motion.div
            className="relative will-change-transform"
            style={{ y: textBobY }}
          >
            {/* Meta ticker */}
            <motion.div
              className="text-center mb-5 font-mono text-[10px] uppercase tracking-[0.35em] text-white/45"
              style={{ opacity: metaOp, y: metaY }}
            >
              <span style={{ color: RED }}>◆</span>&nbsp;&nbsp;Manifesto · Rev 2026.04
            </motion.div>

            {/* Line 1 */}
            <div
              className="flex items-baseline justify-center"
              style={{ whiteSpace: 'nowrap', marginBottom: '0.25em' }}
            >
              {LINE1_WORDS.map((word, wi) =>
                wi === TARGET_IDX ? (
                  <TargetWord
                    key="target-of"
                    ref={oRef}
                    globalIndex={wi}
                    scrollYProgress={scrollYProgress}
                  />
                ) : (
                  <AnimatedWord
                    key={`l1-${wi}`}
                    word={word}
                    globalIndex={wi}
                    scrollYProgress={scrollYProgress}
                    isRedLine={false}
                  />
                ),
              )}
            </div>

            {/* Line 2 — red */}
            <div
              className="flex items-baseline justify-center"
              style={{ whiteSpace: 'nowrap' }}
            >
              {LINE2_WORDS.map((word, wi) => (
                <AnimatedWord
                  key={`l2-${wi}`}
                  word={word}
                  globalIndex={LINE1_WORDS.length + wi}
                  scrollYProgress={scrollYProgress}
                  isRedLine
                />
              ))}
            </div>

            {/* Rule line under the statement */}
            <motion.div
              className="mx-auto mt-12"
              style={{
                width: 'min(640px, 80%)',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${RED} 50%, transparent)`,
                transformOrigin: 'center center',
                scaleX: ruleScale,
                opacity: 0.85,
              }}
            />
          </motion.div>
        </div>

        {/* ── Layer 3b: logo construction — top 38vh, above 3D ── */}
        <div
          className="absolute left-0 right-0 top-0 flex items-center justify-center px-6 pointer-events-none"
          style={{ zIndex: 4, height: '38vh' }}
        >
          <LogoConstructor scrollYProgress={scrollYProgress} />
        </div>

        {/* ── Layer 4: soft vignette — top area ── */}
        <div
          className="absolute left-0 right-0 top-0 pointer-events-none"
          style={{
            height: '40vh',
            background:
              'radial-gradient(ellipse 60% 65% at 50% 55%, transparent 0%, rgba(0,0,0,0.55) 100%)',
            zIndex: 6,
          }}
        />
      </motion.div>
    </section>
  )
}
