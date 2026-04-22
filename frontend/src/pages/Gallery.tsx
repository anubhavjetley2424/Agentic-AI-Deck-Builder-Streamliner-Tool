import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { cn } from '../lib/utils'

const FILTERS = ['All', 'Modern', 'Coastal', 'Rustic', 'Resort']
const FEATURE_FILTERS = ['Pool', 'Pergola', 'Multi-Level', 'Bar', 'Fire Pit']

const PROJECTS = [
  { title: 'Sunset Resort Deck', style: 'Resort', features: ['Pool', 'Pergola', 'Bar'], img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', zones: 'BBQ, Bar, Pool Deck, Pergola' },
  { title: 'Coastal Retreat', style: 'Coastal', features: ['Pool', 'Multi-Level'], img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', zones: 'Dining, Pool Deck, Lounge' },
  { title: 'Modern Entertainer', style: 'Modern', features: ['Bar', 'Fire Pit'], img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80', zones: 'BBQ, Bar, Fire Pit' },
  { title: 'Rustic Farmhouse', style: 'Rustic', features: ['Pergola'], img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80', zones: 'Dining, Pergola' },
  { title: 'Miami Pool Villa', style: 'Resort', features: ['Pool', 'Bar', 'Multi-Level'], img: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&q=80', zones: 'Pool, Bar, Lounge, Entry' },
  { title: 'Hillside Terrace', style: 'Modern', features: ['Multi-Level', 'Pergola'], img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80', zones: 'Dining, Pergola, Stairs' },
]

export default function Gallery() {
  const [activeStyle, setActiveStyle] = useState('All')
  const [activeFeatures, setActiveFeatures] = useState<string[]>([])

  const toggleFeature = (f: string) => {
    setActiveFeatures(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])
  }

  const filtered = PROJECTS.filter(p => {
    if (activeStyle !== 'All' && p.style !== activeStyle) return false
    if (activeFeatures.length && !activeFeatures.some(f => p.features.includes(f))) return false
    return true
  })

  return (
    <div className="min-h-screen bg-bg py-12 md:py-20 pt-[100px]">
      <Container>
        <div className="max-w-2xl mb-12">
          <span className="text-gold-400 text-[11px] font-medium uppercase tracking-[0.25em] block mb-3">Inspiration</span>
          <h1 className="font-display text-display-md mb-4">Design Gallery</h1>
          <p className="text-muted leading-relaxed">Browse pre-built deck designs. Use any as a starting template for your own project.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveStyle(f)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeStyle === f ? 'bg-charcoal text-white' : 'bg-white text-charcoal border border-border hover:border-gold-300',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-10">
          {FEATURE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => toggleFeature(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                activeFeatures.includes(f) ? 'bg-gold-100 border-gold-400 text-gold-700' : 'bg-white border-border text-muted hover:border-gold-200',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((p, i) => (
            <div key={i} className="group rounded-card overflow-hidden border border-border/60 bg-white shadow-card hover:shadow-lift transition-all duration-300">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {p.features.slice(0, 2).map(f => (
                    <span key={f} className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-md text-charcoal">{f}</span>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl mb-1">{p.title}</h3>
                <p className="text-xs text-muted mb-4">Zones: {p.zones}</p>
                <Link to="/workshop">
                  <Button size="sm" variant="secondary" className="w-full">
                    Use as Template <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted">
            <p className="text-lg mb-2">No designs match your filters.</p>
            <button onClick={() => { setActiveStyle('All'); setActiveFeatures([]) }} className="text-gold-500 font-medium underline">
              Clear filters
            </button>
          </div>
        )}
      </Container>
    </div>
  )
}
