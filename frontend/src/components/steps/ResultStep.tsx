import { useState } from 'react'
import type { AppState } from '../../types'
import { api } from '../../api'

interface Props {
  state: AppState
  update: (p: Partial<AppState>) => void
  back: () => void
}

export default function ResultStep({ state, update, back }: Props) {
  const [feedback, setFeedback] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const result = state.result

  const handleRefine = async () => {
    if (!result || !feedback.trim()) return
    update({ loading: true, error: null })
    try {
      const refined = await api.refine(result.sessionId, feedback)
      update({ result: refined, loading: false })
      setFeedback('')
      setActiveImg(0)
    } catch (e: unknown) {
      update({ loading: false, error: (e as Error).message })
    }
  }

  if (!result) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-16 text-center fade-in">
        <p className="text-wood-500 text-sm">No result yet — go back and generate a design.</p>
        <button onClick={back} className="mt-4 px-6 py-3 text-wood-500 text-sm hover:text-wood-300 transition">← Back</button>
      </div>
    )
  }

  const hasScreenshots = result.screenshotUrls.length > 0

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-block text-xs bg-surface-700 text-wood-400 px-3 py-1 rounded-full mb-3 border border-surface-600">
          Iteration {result.iteration}
        </span>
        <h1 className="font-serif text-3xl text-parchment mb-2">Your deck design</h1>
        <p className="text-sm text-wood-400">{result.summary}</p>
      </div>

      {/* Screenshot viewer */}
      {hasScreenshots ? (
        <div className="bg-surface-950 rounded-2xl overflow-hidden border border-surface-600 mb-6 relative">
          <div className="aspect-video relative">
            <img
              src={result.screenshotUrls[activeImg]}
              alt={`Deck render ${activeImg + 1}`}
              className="w-full h-full object-contain"
            />
            {result.screenshotUrls.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {result.screenshotUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View render ${i + 1}`}
                    aria-current={i === activeImg ? 'true' : undefined}
                    className="w-7 h-7 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-300 rounded cursor-pointer"
                  >
                    <span className={[
                      'w-2 h-2 rounded-full transition-colors',
                      i === activeImg ? 'bg-wood-300' : 'bg-wood-600 hover:bg-wood-400',
                    ].join(' ')} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {result.screenshotUrls.length > 1 && (
            <>
              <button
                onClick={() => setActiveImg(i => (i - 1 + result.screenshotUrls.length) % result.screenshotUrls.length)}
                aria-label="Previous render"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 rounded-full flex items-center justify-center text-parchment hover:bg-black/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-300 cursor-pointer text-lg"
              >‹</button>
              <button
                onClick={() => setActiveImg(i => (i + 1) % result.screenshotUrls.length)}
                aria-label="Next render"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 rounded-full flex items-center justify-center text-parchment hover:bg-black/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-300 cursor-pointer text-lg"
              >›</button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-10 mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-wood-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M5.25 7.5A2.25 2.25 0 017.5 5.25h.008A2.25 2.25 0 019.758 7.5v.008a2.25 2.25 0 01-2.25 2.25H7.5a2.25 2.25 0 01-2.25-2.25V7.5z" />
            </svg>
          </div>
          <p className="text-sm text-wood-300 font-medium mb-1">Design built in Revit</p>
          <p className="text-xs text-wood-500">Screenshot capture requires a 3D view — open Revit to see your model</p>
          <p className="text-xs text-wood-600 mt-1">{result.summary}</p>
        </div>
      )}

      {/* Feedback */}
      <div className="bg-surface-800 rounded-2xl border border-surface-600 p-6">
        <h2 className="font-serif text-lg text-parchment mb-1">Not quite right?</h2>
        <p className="text-xs text-wood-500 mb-4">Describe what you'd like changed and the agent will redesign</p>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              'Make the fire pit larger',
              'Add a pergola',
              'Wider stairs to the garden',
              'Remove the fire pit',
              'Lower the pit elevation',
              'Make the upper deck bigger',
            ].map(s => (
              <button
                key={s}
                onClick={() => setFeedback(s)}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-700 border border-surface-600 text-wood-400 hover:border-wood-500 hover:text-wood-300 transition"
              >
                {s}
              </button>
            ))}
          </div>

          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="E.g. 'Make the upper deck wider and add a pergola over it, I want wider garden steps'"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-surface-600 bg-surface-700 text-parchment placeholder-wood-600 resize-none focus:outline-none focus:ring-2 focus:ring-wood-500 text-sm transition"
          />

          <div className="flex justify-between items-center">
            <button onClick={back} className="text-sm text-wood-500 hover:text-wood-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 rounded px-1 cursor-pointer">← Change design settings</button>
            <button
              onClick={handleRefine}
              disabled={!feedback.trim() || state.loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-wood-500 text-white rounded-xl text-sm font-medium hover:bg-wood-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-300 cursor-pointer"
            >
              {state.loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rebuilding…
                </>
              ) : (
                'Rebuild →'
              )}
            </button>
          </div>
        </div>

        {state.error && (
          <div className="mt-3 text-sm text-red-400 bg-red-950/40 border border-red-900 px-4 py-2 rounded-lg">
            {state.error}
          </div>
        )}
      </div>

      <div className="mt-6 mb-2 flex flex-col items-center gap-2">
        <p className="text-xs text-wood-500">Happy with the design?</p>
        <button
          className="group flex items-center gap-2.5 px-9 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #8B5E3C 0%, #A87040 100%)',
            color: '#fff',
            boxShadow: '0 4px 24px rgba(139,94,60,0.4)',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(139,94,60,0.5)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(139,94,60,0.4)' }}
        >
          Request full drawings & quote
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
