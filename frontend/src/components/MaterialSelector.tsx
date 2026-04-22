import { useRef } from 'react'
import type { CatalogEntry } from '../types'

interface Props {
  label: string
  items: CatalogEntry[]
  selected: string
  onChange: (id: string) => void
  showComponentCount?: boolean
}

export default function MaterialSelector({ label, items, selected, onChange, showComponentCount }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: -1 | 1) => {
    rowRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <div>
      <h3 className="font-serif text-sm text-parchment mb-2.5 flex items-center gap-2">
        {label}
        <span className="text-xs font-sans text-wood-600 font-normal">{items.length} options</span>
      </h3>

      <div className="relative group">
        {/* Scroll left */}
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-surface-700 border border-surface-500 rounded-full shadow flex items-center justify-center text-wood-400 hover:text-parchment hover:bg-surface-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 cursor-pointer"
          aria-label="Scroll left"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Card row */}
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map(item => {
            const isSelected = item.id === selected
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                aria-label={`${item.name}${item.brand ? ` by ${item.brand}` : ''}${isSelected ? ' (selected)' : ''}`}
                aria-pressed={isSelected}
                className={[
                  'relative shrink-0 rounded-xl overflow-hidden transition-all duration-200',
                  'w-[118px] h-[88px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-800',
                  isSelected
                    ? 'ring-2 ring-wood-300 ring-offset-2 ring-offset-surface-800 scale-[1.03]'
                    : 'hover:scale-[1.02] opacity-75 hover:opacity-100',
                ].join(' ')}
                title={item.description}
              >
                {/* Background */}
                {item.texturePreview ? (
                  <img
                    src={item.texturePreview}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className={[
                    'absolute inset-0',
                    item.category === 'railing'  ? 'bg-gradient-to-br from-slate-700 to-slate-900' :
                    item.category === 'pergola'  ? 'bg-gradient-to-br from-stone-600 to-stone-800' :
                    item.category === 'ceiling'  ? 'bg-gradient-to-br from-zinc-600 to-zinc-800' :
                                                   'bg-gradient-to-br from-amber-800 to-amber-950',
                  ].join(' ')} />
                )}

                {/* Bottom scrim */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/85 to-transparent" />

                {/* Text */}
                <div className="absolute inset-x-0 bottom-0 px-2 pb-2">
                  <p className="text-white text-[11px] font-semibold leading-tight truncate">{item.name}</p>
                  {item.brand && (
                    <p className="text-white/55 text-[9px] truncate">{item.brand}</p>
                  )}
                </div>

                {/* Component count badge */}
                {showComponentCount && item.componentCount && item.componentCount > 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    {item.componentCount} parts
                  </div>
                )}

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-wood-300 rounded-full flex items-center justify-center shadow">
                    <svg className="w-3 h-3 text-surface-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Hover description overlay */}
                {item.description && (
                  <div className="absolute inset-0 bg-surface-900/92 flex items-center justify-center p-2 opacity-0 hover:opacity-100 transition-opacity duration-150">
                    <p className="text-parchment text-[10px] text-center leading-snug">{item.description}</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Scroll right */}
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-surface-700 border border-surface-500 rounded-full shadow flex items-center justify-center text-wood-400 hover:text-parchment hover:bg-surface-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 cursor-pointer"
          aria-label="Scroll right"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
