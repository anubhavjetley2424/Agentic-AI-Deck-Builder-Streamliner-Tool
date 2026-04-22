import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Upload, Layers, Cpu } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const RED = '#DC3545'

interface Panel {
  id: string
  num: string
  label: string
  heading: string
  description: string
  icon: React.ReactNode
}

const PANELS: Panel[] = [
  {
    id: 'upload',
    num: '01',
    label: 'Upload',
    heading: 'Upload.',
    description: 'Drop your house floor plan. Our AI vision agent extracts every wall, boundary, and measurement instantly.',
    icon: <Upload size={20} />,
  },
  {
    id: 'design',
    num: '02',
    label: 'Design',
    heading: 'Design.',
    description: 'Drag zones, set elevations, pick materials. Shape stairs and pool surrounds — your deck, your rules.',
    icon: <Layers size={20} />,
  },
  {
    id: 'generate',
    num: '03',
    label: 'Generate',
    heading: 'Generate.',
    description: 'Our multi-agent system builds a full 3D Revit model with construction-ready BIM specifications.',
    icon: <Cpu size={20} />,
  },
]

export default function ParallaxShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const panelsRef = useRef<(HTMLDivElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const totalPanels = PANELS.length
    const ctx = gsap.context(() => {
      const scrollTween = gsap.to(track, {
        xPercent: -100 * (totalPanels - 1) / totalPanels,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerWidth * totalPanels}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            const idx = Math.min(Math.floor(self.progress * totalPanels), totalPanels - 1)
            setActiveIndex(idx)
          },
        },
      })

      // Per-panel entrance animations
      panelsRef.current.forEach((panel, i) => {
        if (!panel) return
        const heading = panel.querySelector<HTMLElement>('.tl-heading')
        const desc = panel.querySelector<HTMLElement>('.tl-desc')
        const num = panel.querySelector<HTMLElement>('.tl-num')

        if (num) {
          gsap.fromTo(num,
            { x: -40, opacity: 0 },
            { x: 0, opacity: 1, ease: 'power2.out',
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'left 80%', end: 'left 40%', scrub: true } }
          )
        }
        if (heading) {
          gsap.fromTo(heading,
            { y: 80, opacity: 0 },
            { y: 0, opacity: 1, ease: 'power3.out',
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'left 75%', end: 'left 30%', scrub: true } }
          )
          if (i < totalPanels - 1) {
            gsap.to(heading, { y: -60, opacity: 0,
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'right 40%', end: 'right 0%', scrub: true } })
          }
        }
        if (desc) {
          gsap.fromTo(desc,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, ease: 'power2.out',
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'left 60%', end: 'left 20%', scrub: true } }
          )
          if (i < totalPanels - 1) {
            gsap.to(desc, { y: -30, opacity: 0,
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'right 35%', end: 'right 0%', scrub: true } })
          }
        }
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden bg-black">

      {/* Top-right label */}
      <div className="absolute top-6 right-8 z-50 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-white/20">
        Scroll &rarr;
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex h-full will-change-transform"
        style={{ width: `${PANELS.length * 100}vw` }}
      >
        {PANELS.map((panel, i) => (
          <div
            key={panel.id}
            ref={(el) => { panelsRef.current[i] = el }}
            className="relative flex-shrink-0 w-screen h-full overflow-hidden"
          >
            {/* Pure black bg */}
            <div className="absolute inset-0 bg-black" />

            {/* Giant faded step number */}
            <div
              className="tl-num absolute top-1/2 right-[6%] -translate-y-1/2 font-display select-none pointer-events-none"
              style={{
                fontSize: 'clamp(18rem, 45vw, 40rem)',
                lineHeight: 0.8,
                fontWeight: 300,
                color: RED,
                opacity: 0.04,
              }}
            >
              {panel.num}
            </div>

            {/* Red vertical accent line */}
            <div className="absolute left-[8%] top-[20%] bottom-[20%] w-[1px]" style={{ background: `linear-gradient(to bottom, transparent, ${RED}40, transparent)` }} />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center pl-[10%] pr-[40%] max-w-5xl">
              {/* Step label */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-8 h-8" style={{ color: RED }}>
                  {panel.icon}
                </div>
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.25em]" style={{ color: RED }}>
                  Step {panel.num} — {panel.label}
                </span>
              </div>

              {/* Heading */}
              <h2
                className="tl-heading font-sans text-white uppercase"
                style={{
                  fontSize: 'clamp(3rem, 10vw, 8rem)',
                  lineHeight: 0.95,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {panel.heading}
              </h2>

              {/* Description */}
              <div className="tl-desc mt-8 max-w-md">
                <p className="font-sans text-sm md:text-base text-white/30 leading-relaxed" style={{ letterSpacing: '0.01em' }}>
                  {panel.description}
                </p>

                {/* CTA on last panel */}
                {i === PANELS.length - 1 && (
                  <div className="mt-10">
                    <Link
                      to="/workshop"
                      className="inline-flex items-center gap-2 px-7 py-3 font-mono text-xs font-medium uppercase tracking-[0.15em] text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(220,53,69,0.4)]"
                      style={{
                        background: RED,
                        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                      }}
                    >
                      Launch Workshop <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right edge fade */}
            {i < PANELS.length - 1 && (
              <div className="absolute right-0 top-0 bottom-0 w-32 z-20 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom timeline progress */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center">
        {PANELS.map((panel, i) => {
          const isActive = activeIndex >= i
          const isCurrent = activeIndex === i
          return (
            <div key={panel.id} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center justify-center transition-all duration-500"
                  style={{
                    width: isCurrent ? 40 : 32,
                    height: isCurrent ? 40 : 32,
                    border: `1px solid ${isActive ? RED : 'rgba(255,255,255,0.1)'}`,
                    background: isActive ? 'rgba(220,53,69,0.1)' : 'transparent',
                    boxShadow: isCurrent ? `0 0 16px rgba(220,53,69,0.3)` : 'none',
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  }}
                >
                  <span className="font-mono text-[10px] font-semibold" style={{ color: isActive ? RED : 'rgba(255,255,255,0.25)' }}>
                    {panel.num}
                  </span>
                </div>
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.2em] mt-1.5 transition-all duration-500"
                  style={{ color: isActive ? 'rgba(220,53,69,0.8)' : 'rgba(255,255,255,0.15)', fontWeight: isCurrent ? 600 : 400 }}
                >
                  {panel.label}
                </span>
              </div>

              {/* Connecting line */}
              {i < PANELS.length - 1 && (
                <div className="relative mx-4 mb-4" style={{ width: 50 }}>
                  <div className="h-[1px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div
                    className="absolute top-0 left-0 h-[1px] transition-all duration-500"
                    style={{
                      width: activeIndex > i ? '100%' : '0%',
                      background: RED,
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
