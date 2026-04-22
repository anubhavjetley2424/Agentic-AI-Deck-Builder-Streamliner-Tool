/**
 * TimelineSection — final section showing the full 3-step process
 * with a glowing Enter Workshop CTA
 */

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Upload, Layers, Cpu } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const RED = '#DC3545'

const STEPS = [
  { num: '01', label: 'Upload', Icon: Upload, text: 'Drop your floor plan' },
  { num: '02', label: 'Design', Icon: Layers, text: 'Customize your deck' },
  { num: '03', label: 'Generate', Icon: Cpu, text: 'AI builds your model' },
]

export default function TimelineSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger each step
      stepsRef.current.forEach((step, i) => {
        if (!step) return
        gsap.fromTo(step,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.6, delay: i * 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      })

      // CTA entrance
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, delay: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-black py-32 px-8">
      {/* Section heading */}
      <div className="text-center mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20">
          The Process
        </span>
        <h2
          className="mt-4 font-sans font-bold text-white"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}
        >
          Three steps to your dream deck
        </h2>
      </div>

      {/* Timeline row */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-0">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center flex-1">
            <div
              ref={(el) => { stepsRef.current[i] = el }}
              className="flex-1 flex flex-col items-center text-center px-6"
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-14 h-14 rounded-xl mb-4"
                style={{
                  border: '1px solid rgba(220,53,69,0.2)',
                  background: 'rgba(220,53,69,0.05)',
                }}
              >
                <step.Icon size={24} color={RED} strokeWidth={1.5} />
              </div>

              {/* Number */}
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: RED }}>
                {step.num}
              </span>

              {/* Label */}
              <h3 className="font-sans font-semibold text-white text-base mb-1">
                {step.label}
              </h3>

              {/* Description */}
              <p className="font-sans text-xs text-white/25">{step.text}</p>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="hidden md:block w-16 h-[1px] flex-shrink-0" style={{ background: 'linear-gradient(to right, rgba(220,53,69,0.3), rgba(220,53,69,0.05))' }} />
            )}
          </div>
        ))}
      </div>

      {/* Glowing CTA */}
      <div ref={ctaRef} className="mt-20 flex justify-center">
        <Link
          to="/workshop"
          className="group relative inline-flex items-center gap-3 px-10 py-4 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-white transition-all duration-500 hover:scale-[1.03]"
          style={{ background: RED }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ boxShadow: `0 0 40px ${RED}, 0 0 80px rgba(220,53,69,0.3)` }}
          />
          <span className="relative z-10">Enter Workshop</span>
          <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />

          {/* Pulsing glow animation */}
          <div
            className="absolute -inset-1 pointer-events-none"
            style={{
              background: 'transparent',
              boxShadow: `0 0 20px rgba(220,53,69,0.25)`,
              animation: 'ctaPulse 2s ease-in-out infinite',
            }}
          />
        </Link>
      </div>

      <style>{`
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(220,53,69,0.2); }
          50%      { box-shadow: 0 0 40px rgba(220,53,69,0.4), 0 0 80px rgba(220,53,69,0.15); }
        }
      `}</style>
    </section>
  )
}
