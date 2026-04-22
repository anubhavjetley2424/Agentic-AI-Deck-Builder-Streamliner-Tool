/**
 * Hero — 220vh sticky section with a deliberate reveal sequence.
 *
 *   t=0s       Only the 3D wireframe assembly is visible. Black backdrop
 *              with a faint blueprint grid. The deck builds itself on
 *              screen (structure → pool → stairs → pit) over ~6s.
 *
 *   t≈2.6s     The headline fades + rises into place via CSS animation
 *              (so it shows automatically, even if the user hasn't
 *              scrolled yet). No overlap with anything else — the logo
 *              is gated to a DIFFERENT scroll position.
 *
 *   scroll 25–45 %   The emerging blueprint logo band reveals on its
 *              OWN centered line, well below the title. It was hidden
 *              by an opacity transform until the user scrolls into
 *              this window — giving the "one more scroll and logo
 *              shows" beat.
 *
 *   scroll 72–95 %   Exit parallax — title + logo lift away as we
 *              transition into the Manifesto.
 *
 * The 3D scene animation and the camera intro are owned by HeroScene;
 * this file handles layout, reveals, and ambience only.
 */

import { useEffect, useRef, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const RED = '#DC3545'

const Hero = forwardRef<HTMLElement>(function Hero(_props, fwdRef) {
  const internalRef = useRef<HTMLElement>(null)
  const rootRef = (node: HTMLElement | null) => {
    (internalRef as any).current = node
    if (typeof fwdRef === 'function') fwdRef(node)
    else if (fwdRef) (fwdRef as any).current = node
  }
  const titleRef  = useRef<HTMLHeadingElement>(null)
  const ctaRef    = useRef<HTMLDivElement>(null)
  const hintRef   = useRef<HTMLDivElement>(null)
  const metaLRef  = useRef<HTMLDivElement>(null)
  const metaRRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!internalRef.current) return
    const ctx = gsap.context(() => {
      /* Scroll hint + side meta fade out as user starts scrolling */
      gsap.to([hintRef.current, metaLRef.current, metaRRef.current], {
        opacity: 0,
        scrollTrigger: {
          trigger: internalRef.current,
          start: 'top top',
          end: '+=240',
          scrub: true,
        },
      })

      /* Exit parallax — lift title + CTA away as we transition out. */
      gsap.to([titleRef.current, ctaRef.current], {
        y: -110, opacity: 0.1, ease: 'none',
        scrollTrigger: {
          trigger: internalRef.current,
          start: '72% top',
          end: '95% top',
          scrub: 0.8,
        },
      })
    }, internalRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      className="relative w-full bg-black"
      style={{ height: '220vh' }}
    >
      {/* ── STICKY viewport — locks for the whole section ──
           Layout budget (100vh):
             · Navbar band:  0    → 9vh
             · Title:       14vh → 34vh   (CSS auto-reveal after 2.6s)
             · Scene:       34vh → 100vh
             · Logo:        82vh           (scroll-gated, own line)         */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        {/* ── Full-bleed blueprint grid ── same lattice as the Process
              section so the whole page shares one aesthetic.               */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            opacity: 0.6,
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0, transparent 79px, rgba(255,255,255,0.04) 79px, rgba(255,255,255,0.04) 80px),' +
              'repeating-linear-gradient(0deg, transparent 0, transparent 79px, rgba(255,255,255,0.04) 79px, rgba(255,255,255,0.04) 80px)',
          }}
        />
        {/* Faint radial vignette so edges darken slightly */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            background:
              'radial-gradient(ellipse 70% 60% at 50% 55%, transparent 0%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* 3D scene placeholder — actual scene is rendered as a floating
             parallax element in Home.tsx so it can animate across sections. */}
        <div
          className="absolute left-0 right-0"
          style={{ top: '41vh', bottom: 0, zIndex: 1 }}
        />

        {/* Subtle gradient fade between CTA band and 3D scene */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: '36vh',
            height: '10vh',
            background: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 55%, transparent 100%)',
            zIndex: 2,
          }}
        />

        {/* ── Headline — auto-reveals via CSS animation after 2.6s.
              The DeckForge blueprint logo sits inline beside "AI." as the
              final glyph of the title. ── */}
        <div
          className="absolute left-0 right-0 flex justify-center px-6 pointer-events-none"
          style={{ top: '13vh', zIndex: 10 }}
        >
          <h1
            ref={titleRef}
            className="hero-title-reveal font-sans font-semibold text-white text-center"
            style={{
              fontSize: 'clamp(1.9rem, 5vw, 5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              maxWidth: '22ch',
            }}
          >
            Streamline your deck dream with <span className="ai-flow">AI</span>
            <span style={{ color: RED, marginLeft: '0.02em' }}>.</span>
            <span
              className="hero-logo-inline"
              aria-label="DeckForge"
              style={{
                display: 'inline-block',
                verticalAlign: '-0.18em',
                marginLeft: '0.35em',
              }}
            >
              <svg
                width="0.95em"
                height="0.95em"
                viewBox="0 0 44 44"
                fill="none"
                style={{
                  filter: 'drop-shadow(0 0 14px rgba(220,53,69,0.55))',
                  display: 'block',
                }}
              >
                <rect x="3" y="3" width="38" height="38"
                  stroke="white" strokeOpacity="0.9" strokeWidth="1.6" />
                <line x1="3" y1="22" x2="41" y2="22" stroke={RED} strokeWidth="2" />
                <rect x="11" y="11" width="22" height="11"
                  stroke={RED} strokeWidth="1.3" opacity="0.95" fill="none" />
                <line x1="3"  y1="3"  x2="9"  y2="3"  stroke={RED} strokeWidth="1.4" />
                <line x1="3"  y1="3"  x2="3"  y2="9"  stroke={RED} strokeWidth="1.4" />
                <line x1="41" y1="41" x2="35" y2="41" stroke={RED} strokeWidth="1.4" />
                <line x1="41" y1="41" x2="41" y2="35" stroke={RED} strokeWidth="1.4" />
              </svg>
            </span>
          </h1>
        </div>

        {/* ── CTA — "Launch Workshop" red button sits in its own band,
              safely below the title and with plenty of breathing room
              before the 3D scene begins. Hover animates a spark-sweep
              and lifts the button with a brighter halo. ── */}
        <div
          ref={ctaRef}
          className="absolute left-0 right-0 flex justify-center px-6"
          style={{ top: '36vh', zIndex: 11 }}
        >
          <Link
            to="/workshop"
            className="hero-cta-reveal group relative inline-flex items-center gap-4 h-[58px] pl-8 pr-6 font-mono text-[12px] font-semibold uppercase tracking-[0.28em] text-white"
            style={{
              background: RED,
              clipPath:
                'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            }}
          >
            {/* Sheen sweep — diagonal bright band that passes across on hover */}
            <span className="hero-cta-sheen" aria-hidden />
            <span className="relative z-10">Launch Workshop</span>
            <span
              className="hero-cta-arrow relative z-10 inline-flex items-center justify-center w-7 h-7"
              aria-hidden
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              →
            </span>
          </Link>
        </div>

        {/* ── First-viewport-only: scroll hint ── */}
        <div
          ref={hintRef}
          className="absolute left-1/2 -translate-x-1/2 bottom-8 z-20 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">
            Scroll to reveal
          </span>
          <div className="w-[1px] h-10 overflow-hidden">
            <div
              className="w-full h-full"
              style={{
                background: 'rgba(255,255,255,0.5)',
                animation: 'scrollLine 1.8s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* ── Side meta strips ── */}
        <div
          ref={metaLRef}
          className="absolute top-1/2 -translate-y-1/2 left-6 z-20 font-mono text-[9px] uppercase tracking-[0.3em] text-white/25 pointer-events-none"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)' }}
        >
          01 · Blueprint · Rev 2026.04
        </div>
        <div
          ref={metaRRef}
          className="absolute top-1/2 -translate-y-1/2 right-6 z-20 font-mono text-[9px] uppercase tracking-[0.3em] pointer-events-none"
          style={{ writingMode: 'vertical-rl', color: RED }}
        >
          ● LIVE · Rendered in real time
        </div>
      </div>

      {/* ── CSS: title reveal timing + smoky AI gradient + scroll line ── */}
      <style>{`
        /* Title auto-reveal — starts hidden, fades + rises in AFTER the
           wireframe has had time to assemble for a beat. Delay 2.6s. */
        .hero-title-reveal {
          opacity: 0;
          transform: translateY(34px);
          filter: blur(8px);
          animation: heroTitleIn 1.6s cubic-bezier(.16,.84,.32,1) 2.6s forwards;
          will-change: opacity, transform, filter;
        }
        @keyframes heroTitleIn {
          0%   { opacity: 0;    transform: translateY(34px); filter: blur(8px); }
          60%  { opacity: 0.85; transform: translateY(4px);  filter: blur(1px); }
          100% { opacity: 1;    transform: translateY(0);    filter: blur(0); }
        }

        /* Inline logo — emerges subtly after the title settles. */
        .hero-logo-inline {
          opacity: 0;
          transform: scale(0.6) rotate(-8deg);
          animation: heroLogoIn 1.1s cubic-bezier(.22,.9,.3,1.05) 3.9s forwards;
          will-change: opacity, transform;
        }
        @keyframes heroLogoIn {
          0%   { opacity: 0; transform: scale(0.55) rotate(-10deg); }
          70%  { opacity: 1; transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1)    rotate(0deg); }
        }

        /* CTA — fades up a beat after the title + logo complete.
           Rest state: solid red with a soft halo.
           Hover state: arrow slides, halo intensifies, a bright sheen
           sweeps diagonally across the button face. */
        .hero-cta-reveal {
          opacity: 0;
          transform: translateY(20px);
          animation: heroCtaIn 0.9s cubic-bezier(.22,.9,.3,1) 4.4s forwards;
          box-shadow:
            0 0 24px rgba(220,53,69,0.45),
            0 0 60px rgba(220,53,69,0.22);
          transition:
            transform 0.35s cubic-bezier(.22,.9,.3,1),
            box-shadow 0.4s ease;
          overflow: hidden;
          will-change: opacity, transform, box-shadow;
        }
        @keyframes heroCtaIn {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hero-cta-reveal:hover {
          transform: translateY(-3px);
          box-shadow:
            0 0 36px rgba(220,53,69,0.75),
            0 0 96px rgba(220,53,69,0.45),
            0 12px 30px rgba(0,0,0,0.45);
        }
        /* Arrow tile — nudges right on hover */
        .hero-cta-arrow {
          transition: transform 0.35s cubic-bezier(.22,.9,.3,1), background 0.35s ease;
        }
        .hero-cta-reveal:hover .hero-cta-arrow {
          transform: translateX(6px);
          background: rgba(255,255,255,0.3);
        }
        /* Sheen sweep — diagonal bright band that flies across the face */
        .hero-cta-sheen {
          position: absolute;
          top: 0;
          left: -40%;
          width: 40%;
          height: 100%;
          background: linear-gradient(
            105deg,
            transparent 0%,
            rgba(255,255,255,0.0) 20%,
            rgba(255,255,255,0.55) 50%,
            rgba(255,255,255,0.0) 80%,
            transparent 100%
          );
          transform: skewX(-18deg);
          transition: left 0.7s cubic-bezier(.22,.9,.3,1);
          pointer-events: none;
          z-index: 1;
        }
        .hero-cta-reveal:hover .hero-cta-sheen {
          left: 110%;
        }

        /* ── "AI" animated gradient — clean linear gradient that slides
              across the letters. Inspired by P1N2O/pyBNzX (CodePen) but
              applied to the font glyphs via background-clip rather than
              the element background. No drop-shadow shine, no morphing
              blobs — just colour flowing through the letters. ── */
        .ai-flow {
          display: inline-block;
          font-weight: 800;
          letter-spacing: -0.015em;
          padding: 0 0.02em;
          background: linear-gradient(
            -45deg,
            ${RED} 0%,
            #ffffff 28%,
            #000000 52%,
            ${RED} 76%,
            #ffffff 100%
          );
          background-size: 400% 400%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: aiGradient 9s ease infinite;
          will-change: background-position;
        }
        @keyframes aiGradient {
          0%   { background-position:   0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position:   0% 50%; }
        }
        @keyframes scrollLine {
          0%   { transform: translateY(-100%); }
          50%  { transform: translateY(0%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </section>
  )
})

export default Hero
