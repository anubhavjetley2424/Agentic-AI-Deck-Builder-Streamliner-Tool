import { useState, useRef, useCallback } from 'react'
import type { AppState } from '../../types'

const M_TO_FT = 3.28084

interface Props { state: AppState; update: (p: Partial<AppState>) => void; next: () => void }

// Normalised rect: all values 0–1 relative to container
interface NRect { x: number; y: number; w: number; h: number }
type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move'
type DrawPhase = 'idle' | 'drawing' | 'placed'

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
const MIN = 0.05

export default function AddressStep({ state, update, next }: Props) {
  const [address,     setAddress]     = useState(state.address || '')
  const [widthMStr,   setWidthMStr]   = useState(String(state.propWidthM || 23.7))
  const [depthMStr,   setDepthMStr]   = useState(String(state.propDepthM || 38.6))
  const [imperial,    setImperial]    = useState(false)
  const [phase,       setPhase]       = useState<DrawPhase>('idle')
  const [rect,        setRect]        = useState<NRect | null>(null)
  const [imgAspect,   setImgAspect]   = useState<number>(0.75)   // h/w ratio for container

  const canvasRef  = useRef<HTMLDivElement>(null)
  const dragRef    = useRef<{
    startX: number; startY: number
    origRect: NRect | null; handle: Handle | null
  } | null>(null)

  const propW = parseFloat(widthMStr) || 23.7
  const propD = parseFloat(depthMStr) || 38.6

  // Deck dimensions from rect
  const deckWM  = rect ? rect.w * propW : 0
  const deckDM  = rect ? rect.h * propD : 0
  const deckWFt = deckWM * M_TO_FT
  const deckDFt = deckDM * M_TO_FT
  const areaM2  = deckWM * deckDM

  const canProceed = !!rect && rect.w >= MIN && rect.h >= MIN && !!state.sitePlanUrl

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      const img = new Image()
      img.onload = () => { setImgAspect(img.height / img.width) }
      img.src = url
      update({ sitePlanUrl: url })
      setRect(null); setPhase('idle')
    }
    reader.readAsDataURL(file)
  }

  // ── Relative position helper ──────────────────────────────────────────────
  const relPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const el = canvasRef.current
    if (!el) return { x: 0, y: 0 }
    const b = el.getBoundingClientRect()
    return {
      x: clamp((e.clientX - b.left) / b.width, 0, 1),
      y: clamp((e.clientY - b.top)  / b.height, 0, 1),
    }
  }, [])

  // ── Mouse down on canvas (start new rect) ─────────────────────────────────
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (phase === 'placed') return   // clicks on handles handle it
    e.preventDefault()
    const p = relPos(e)
    dragRef.current = { startX: p.x, startY: p.y, origRect: null, handle: null }
    setPhase('drawing')
    setRect({ x: p.x, y: p.y, w: 0, h: 0 })
  }

  // ── Mouse down on a resize/move handle ────────────────────────────────────
  const onHandleMouseDown = (e: React.MouseEvent, handle: Handle) => {
    e.stopPropagation(); e.preventDefault()
    if (!rect) return
    const p = relPos(e)
    dragRef.current = { startX: p.x, startY: p.y, origRect: { ...rect }, handle }
  }

  // ── Global mouse move ─────────────────────────────────────────────────────
  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current
    if (!d) return
    const p = relPos(e)
    const dx = p.x - d.startX, dy = p.y - d.startY

    if (!d.handle) {
      // Drawing new rect
      const x = Math.min(p.x, d.startX), y = Math.min(p.y, d.startY)
      const w = Math.abs(p.x - d.startX), h = Math.abs(p.y - d.startY)
      setRect({ x, y, w, h })
    } else {
      // Resizing / moving existing rect
      const r = d.origRect!
      let { x, y, w, h } = r
      switch (d.handle) {
        case 'move': x = clamp(r.x + dx, 0, 1 - r.w); y = clamp(r.y + dy, 0, 1 - r.h); break
        case 'nw': { const nx = clamp(r.x + dx, 0, r.x + r.w - MIN); const ny = clamp(r.y + dy, 0, r.y + r.h - MIN); w = r.x + r.w - nx; h = r.y + r.h - ny; x = nx; y = ny; break }
        case 'ne': { const ny = clamp(r.y + dy, 0, r.y + r.h - MIN); w = clamp(r.w + dx, MIN, 1 - r.x); h = r.y + r.h - ny; y = ny; break }
        case 'sw': { const nx = clamp(r.x + dx, 0, r.x + r.w - MIN); w = r.x + r.w - nx; h = clamp(r.h + dy, MIN, 1 - r.y); x = nx; break }
        case 'se': w = clamp(r.w + dx, MIN, 1 - r.x); h = clamp(r.h + dy, MIN, 1 - r.y); break
        case 'n':  { const ny = clamp(r.y + dy, 0, r.y + r.h - MIN); h = r.y + r.h - ny; y = ny; break }
        case 's':  h = clamp(r.h + dy, MIN, 1 - r.y); break
        case 'w':  { const nx = clamp(r.x + dx, 0, r.x + r.w - MIN); w = r.x + r.w - nx; x = nx; break }
        case 'e':  w = clamp(r.w + dx, MIN, 1 - r.x); break
      }
      setRect({ x, y, w, h })
    }
  }

  const onMouseUp = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    setRect(prev => {
      if (!prev || prev.w < MIN || prev.h < MIN) { setPhase('idle'); return null }
      setPhase('placed')
      return prev
    })
  }

  // ── Confirm boundary ──────────────────────────────────────────────────────
  const confirmBoundary = () => {
    if (!rect) return
    const widthFt = Math.round(deckWFt * 10) / 10
    const depthFt = Math.round(deckDFt * 10) / 10
    update({
      address,
      propWidthM: propW,
      propDepthM: propD,
      bbox: {
        nw: { lat: 0, lng: 0 }, se: { lat: 0, lng: 0 },
        widthFt, depthFt,
      },
    })
  }

  // dimension display helper
  const fmt = (m: number) => imperial ? `${(m * M_TO_FT).toFixed(1)}ft` : `${m.toFixed(1)}m`

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 fade-in px-4">
      {/* Title */}
      <div className="text-center mb-5">
        <h1 className="font-serif text-3xl text-parchment mb-1.5">Define your deck area</h1>
        <p className="text-wood-400 text-sm">Upload your property site plan, enter its dimensions, then drag to mark the deck area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Address */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-4">
            <label className="text-xs text-wood-400 block mb-1.5">Property address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="123 Oak St, Tampa FL"
              className="w-full px-3 py-2 rounded-lg border border-surface-600 bg-surface-700 text-parchment placeholder-wood-700 text-sm focus:outline-none focus:ring-1 focus:ring-wood-500" />
          </div>

          {/* Site plan upload */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-4">
            <label className="text-xs text-wood-400 block mb-2">Site plan / floor plan</label>
            {state.sitePlanUrl ? (
              <div className="space-y-2">
                <div className="w-full h-24 rounded-lg overflow-hidden border border-surface-600">
                  <img src={state.sitePlanUrl} alt="Site plan" className="w-full h-full object-contain" />
                </div>
                <button onClick={() => { update({ sitePlanUrl: null, bbox: null }); setRect(null); setPhase('idle') }}
                  className="text-xs text-wood-500 hover:text-red-400 transition">Replace image</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-surface-500 bg-surface-700 hover:bg-surface-600 cursor-pointer transition">
                <svg className="w-6 h-6 text-wood-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-xs text-wood-500">Click to upload site plan</span>
                <input type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Property dimensions */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-wood-400">Property dimensions</label>
              <button onClick={() => setImperial(i => !i)}
                className="text-[10px] text-wood-500 border border-surface-500 px-1.5 py-0.5 rounded hover:border-wood-500 transition">
                {imperial ? 'ft → m' : 'm → ft'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-wood-600 block mb-1">Width ({imperial ? 'ft' : 'm'})</label>
                <input type="number" step="0.1" min="1"
                  value={imperial ? (propW * M_TO_FT).toFixed(1) : widthMStr}
                  onChange={e => setWidthMStr(imperial ? String(parseFloat(e.target.value) / M_TO_FT) : e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-surface-600 bg-surface-700 text-parchment focus:outline-none focus:ring-1 focus:ring-wood-500" />
              </div>
              <div>
                <label className="text-[10px] text-wood-600 block mb-1">Depth ({imperial ? 'ft' : 'm'})</label>
                <input type="number" step="0.1" min="1"
                  value={imperial ? (propD * M_TO_FT).toFixed(1) : depthMStr}
                  onChange={e => setDepthMStr(imperial ? String(parseFloat(e.target.value) / M_TO_FT) : e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-surface-600 bg-surface-700 text-parchment focus:outline-none focus:ring-1 focus:ring-wood-500" />
              </div>
            </div>
            <p className="text-[10px] text-wood-700 mt-2">Match the dimensions shown on your site plan</p>
          </div>

          {/* Instructions */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-4 space-y-2">
            <p className="text-xs font-medium text-wood-400">How to draw</p>
            {[
              ['①', 'Upload your site plan above'],
              ['②', 'Enter its real-world dimensions'],
              ['③', 'Click + drag on the plan to draw the deck boundary'],
              ['④', 'Drag the corner & edge handles to fine-tune'],
              ['⑤', 'Confirm and continue'],
            ].map(([n, t]) => (
              <div key={n} className="flex gap-2 text-[11px] text-wood-500">
                <span className="text-wood-400 shrink-0">{n}</span><span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL: Drawing canvas ──────────────────────────────────── */}
        <div className="space-y-3">
          {!state.sitePlanUrl ? (
            /* Empty state — upload prompt */
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-600 bg-surface-800"
              style={{ minHeight: 400 }}>
              <svg className="w-12 h-12 text-wood-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              <p className="text-wood-600 text-sm mb-1">Upload your site plan to start</p>
              <p className="text-wood-700 text-xs">JPG, PNG, or PDF of your property plan</p>
              <label className="mt-4 px-5 py-2.5 bg-wood-600 text-white text-sm rounded-xl hover:bg-wood-500 cursor-pointer transition">
                Choose file
                <input type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
              </label>
            </div>
          ) : (
            /* Site plan with drawing overlay */
            <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700">
                <span className="text-xs text-wood-400">
                  {phase === 'idle' ? 'Click and drag to draw the deck boundary' :
                   phase === 'drawing' ? 'Release to place the boundary' :
                   'Drag handles to adjust · drag inside to move'}
                </span>
                {phase === 'placed' && (
                  <button onClick={() => { setRect(null); setPhase('idle') }}
                    className="ml-auto text-xs text-wood-500 border border-surface-600 px-2.5 py-1 rounded-lg hover:border-wood-500 transition">
                    Redraw
                  </button>
                )}
              </div>

              {/* Canvas */}
              <div
                ref={canvasRef}
                className={['relative select-none overflow-hidden', phase === 'idle' || phase === 'drawing' ? 'cursor-crosshair' : ''].join(' ')}
                style={{ paddingBottom: `${imgAspect * 100}%`, maxHeight: '65vh' }}
                onMouseDown={phase !== 'placed' ? onCanvasMouseDown : undefined}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                {/* Site plan image */}
                <img
                  src={state.sitePlanUrl}
                  alt="Site plan"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Rect overlay */}
                {rect && rect.w > 0.005 && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left:   `${rect.x * 100}%`,
                      top:    `${rect.y * 100}%`,
                      width:  `${rect.w * 100}%`,
                      height: `${rect.h * 100}%`,
                      background: 'rgba(139,94,60,0.18)',
                      border: '2px solid #CFA882',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Dimension labels */}
                    {phase === 'placed' && rect.w > 0.1 && (
                      <>
                        <div className="absolute -top-5 left-0 right-0 flex justify-center">
                          <span className="text-[10px] text-wood-200 bg-black/60 px-1.5 rounded">
                            {fmt(deckWM)}
                          </span>
                        </div>
                        <div className="absolute top-0 bottom-0 -right-8 flex items-center">
                          <span className="text-[10px] text-wood-200 bg-black/60 px-1.5 rounded" style={{ writingMode: 'vertical-rl' }}>
                            {fmt(deckDM)}
                          </span>
                        </div>
                        {rect.w > 0.15 && rect.h > 0.1 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[11px] text-parchment bg-black/50 px-2 py-0.5 rounded font-mono">
                              {fmt(deckWM)} × {fmt(deckDM)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Resize / move handles — only in placed phase */}
                {phase === 'placed' && rect && (() => {
                  const handles: { handle: Handle; left: string; top: string; cursor: string }[] = [
                    { handle: 'nw', left: `${rect.x * 100}%`,               top: `${rect.y * 100}%`,               cursor: 'nw-resize' },
                    { handle: 'ne', left: `${(rect.x + rect.w) * 100}%`,    top: `${rect.y * 100}%`,               cursor: 'ne-resize' },
                    { handle: 'sw', left: `${rect.x * 100}%`,               top: `${(rect.y + rect.h) * 100}%`,    cursor: 'sw-resize' },
                    { handle: 'se', left: `${(rect.x + rect.w) * 100}%`,    top: `${(rect.y + rect.h) * 100}%`,    cursor: 'se-resize' },
                    { handle: 'n',  left: `${(rect.x + rect.w / 2) * 100}%`,top: `${rect.y * 100}%`,               cursor: 'n-resize'  },
                    { handle: 's',  left: `${(rect.x + rect.w / 2) * 100}%`,top: `${(rect.y + rect.h) * 100}%`,    cursor: 's-resize'  },
                    { handle: 'w',  left: `${rect.x * 100}%`,               top: `${(rect.y + rect.h / 2) * 100}%`,cursor: 'w-resize'  },
                    { handle: 'e',  left: `${(rect.x + rect.w) * 100}%`,    top: `${(rect.y + rect.h / 2) * 100}%`,cursor: 'e-resize'  },
                    { handle: 'move', left: `${(rect.x + rect.w / 2) * 100}%`, top: `${(rect.y + rect.h / 2) * 100}%`, cursor: 'move' },
                  ]
                  return handles.map(({ handle, left, top, cursor }) => (
                    <div key={handle}
                      className="absolute z-10"
                      style={{
                        left, top,
                        transform: 'translate(-50%, -50%)',
                        width: handle === 'move' ? 18 : 12,
                        height: handle === 'move' ? 18 : 12,
                        background: handle === 'move' ? 'rgba(207,168,130,0.3)' : '#CFA882',
                        border: '2px solid #fff',
                        borderRadius: handle === 'move' ? 4 : '50%',
                        cursor,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      }}
                      onMouseDown={e => onHandleMouseDown(e, handle)}
                    />
                  ))
                })()}
              </div>
            </div>
          )}

          {/* Deck area summary + confirm */}
          {phase === 'placed' && rect && (
            <div className="bg-surface-800 rounded-2xl border border-wood-600/40 p-4 fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base text-parchment">Deck boundary</h3>
                <span className="text-xs text-wood-400 bg-surface-700 px-2.5 py-1 rounded-lg border border-surface-600">
                  {areaM2.toFixed(1)} m²
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-700 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-wood-500 mb-0.5">Width</p>
                  <p className="text-parchment font-mono text-sm">{fmt(deckWM)}</p>
                  <p className="text-[9px] text-wood-700">{imperial ? `${deckWM.toFixed(1)}m` : `${deckWFt.toFixed(1)}ft`}</p>
                </div>
                <div className="bg-surface-700 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-wood-500 mb-0.5">Depth</p>
                  <p className="text-parchment font-mono text-sm">{fmt(deckDM)}</p>
                  <p className="text-[9px] text-wood-700">{imperial ? `${deckDM.toFixed(1)}m` : `${deckDFt.toFixed(1)}ft`}</p>
                </div>
              </div>
              <button onClick={confirmBoundary}
                className="w-full py-2.5 bg-wood-500 text-white rounded-xl text-sm font-medium hover:bg-wood-400 transition">
                Confirm boundary ✓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5">
        <div>
          {!state.sitePlanUrl && <p className="text-xs text-wood-700">Upload a site plan to begin drawing</p>}
          {state.sitePlanUrl && !rect && <p className="text-xs text-wood-600">Click and drag on the plan to mark your deck area</p>}
          {state.error && <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 px-3 py-2 rounded-lg">{state.error}</p>}
        </div>
        <button onClick={next} disabled={!canProceed || !state.bbox}
          className="px-8 py-3 bg-wood-500 text-white rounded-xl font-medium text-sm hover:bg-wood-400 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Continue →
        </button>
      </div>
    </div>
  )
}
