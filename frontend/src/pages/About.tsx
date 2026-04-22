import { Monitor, Cpu, Box, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'

const AGENTS = [
  { icon: Monitor, name: 'Plan Analyzer', desc: 'Extracts wall lines, boundaries, and measurements from uploaded house plans using computer vision.' },
  { icon: Cpu, name: 'Design Architect', desc: 'Generates zone layouts, elevation calculations, stair connections, and structural specifications.' },
  { icon: Box, name: 'Revit Builder', desc: 'Translates the design spec into a parametric Revit 3D model via MCP with construction-ready families.' },
]

const TECH = [
  { label: 'Frontend', items: 'React, TypeScript, Tailwind CSS, GSAP, React Three Fiber' },
  { label: 'AI Agents', items: 'CrewAI Multi-Agent System, LangChain' },
  { label: '3D Pipeline', items: 'Blender MCP (visualization), Revit MCP (construction model)' },
  { label: 'Families', items: '76 Revit families — decking, railings, pergolas, ceilings, stairs' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="bg-surface-warm py-20 md:py-28 border-b border-border pt-[72px]">
        <Container className="max-w-3xl text-center">
          <span className="text-gold-400 text-[11px] font-medium uppercase tracking-[0.25em] block mb-3">About DeckForge</span>
          <h1 className="font-display text-display-lg mb-6">AI Meets Architecture</h1>
          <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            DeckForge is an AI-powered design platform that lets homeowners build their dream outdoor deck
            using nothing more than a house plan and a few clicks. Our multi-agent system handles the engineering
            so you can focus on the vision.
          </p>
        </Container>
      </section>

      {/* Agent Pipeline */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="text-center mb-16">
            <span className="text-gold-400 text-[11px] font-medium uppercase tracking-[0.25em] block mb-3">The Pipeline</span>
            <h2 className="font-display text-display-md">Three Agents, One Blueprint</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {AGENTS.map((a, i) => (
              <Card key={i} className="relative">
                <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center text-sm font-bold shadow-card">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center mb-4 mt-2">
                  <a.icon size={24} className="text-gold-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{a.name}</h3>
                <p className="text-sm text-muted leading-relaxed">{a.desc}</p>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <div className="hidden md:flex items-center gap-4 text-muted text-sm">
              <span className="w-24 h-px bg-border" />
              <span>Plan Upload</span>
              <ArrowRight size={14} />
              <span>Agent Analysis</span>
              <ArrowRight size={14} />
              <span>Revit Model</span>
              <span className="w-24 h-px bg-border" />
            </div>
          </div>
        </Container>
      </section>

      {/* Tech Stack */}
      <section className="py-20 md:py-28 bg-surface-warm border-t border-border">
        <Container className="max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-gold-400 text-[11px] font-medium uppercase tracking-[0.25em] block mb-3">Technology</span>
            <h2 className="font-display text-display-md">Built With</h2>
          </div>
          <div className="space-y-4">
            {TECH.map((t, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 py-4 border-b border-border last:border-0">
                <span className="text-sm font-semibold text-gold-500 uppercase tracking-wider w-28 flex-shrink-0">{t.label}</span>
                <span className="text-sm text-body leading-relaxed">{t.items}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-24 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(196,162,101,0.3), transparent 60%)' }} />
        <Container className="relative text-center">
          <h2 className="font-display text-display-lg text-white mb-4">Try It Yourself</h2>
          <p className="text-white/40 max-w-md mx-auto mb-8">
            Upload your house plan and start designing in minutes.
          </p>
          <Link to="/workshop">
            <Button variant="dark" size="lg">
              Open Workshop <ArrowRight size={18} />
            </Button>
          </Link>
        </Container>
      </section>
    </div>
  )
}
