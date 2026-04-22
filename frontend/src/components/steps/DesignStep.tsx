import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, DesignBrief, Zone, StairConnection, ColumnConfig, Template, FamilyCatalog } from '../../types'
import { api } from '../../api'
import MaterialSelector from '../MaterialSelector'

interface Props {
  state: AppState
  update: (p: Partial<AppState>) => void
  updateBrief: (p: Partial<DesignBrief>) => void
  next: () => void
  back: () => void
}

// ── Zone palette ───────────────────────────────────────────────────────────
const ZONE_PALETTE = [
  { type: 'main',    label: 'Main Deck',   bg: 'rgba(109,74,46,0.80)',  color: '#6D4A2E', icon: '⬛' },
  { type: 'dining',  label: 'Dining',      bg: 'rgba(139,105,20,0.80)', color: '#8B6914', icon: '🍽' },
  { type: 'bbq',     label: 'BBQ / Grill', bg: 'rgba(154,48,16,0.80)',  color: '#9A3010', icon: '🔥' },
  { type: 'firepit', label: 'Fire Pit',    bg: 'rgba(122,26,8,0.80)',   color: '#7A1A08', icon: '♨' },
  { type: 'lounge',  label: 'Lounge',      bg: 'rgba(58,80,112,0.80)',  color: '#3A5070', icon: '🛋' },
  { type: 'pergola', label: 'Pergola',     bg: 'rgba(46,96,64,0.80)',   color: '#2E6040', icon: '⛺' },
  { type: 'entry',   label: 'Entry',       bg: 'rgba(90,74,58,0.80)',   color: '#5A4A3A', icon: '🚪' },
]

const STAIR_STYLES = [
  { id: 'wide'   as const, label: 'Wide',   widthFt: 6.0, desc: '6 ft — grand entrance' },
  { id: 'modern' as const, label: 'Modern', widthFt: 4.5, desc: '4.5 ft — contemporary' },
  { id: 'narrow' as const, label: 'Narrow', widthFt: 3.5, desc: '3.5 ft — compact' },
]

const COLUMN_MATERIALS = [
  { id: 'timber'    as const, label: 'Timber',    desc: 'Warm natural look' },
  { id: 'steel'     as const, label: 'Steel',     desc: 'Slim modern profile' },
  { id: 'composite' as const, label: 'Composite', desc: 'Low-maintenance' },
]
const COLUMN_PROFILES = [
  { id: '90x90'  as const, label: '90×90 Square',  desc: 'Standard post' },
  { id: '140x140'as const, label: '140×140 Square', desc: 'Chunky post' },
  { id: '90r'    as const, label: '90mm Round',    desc: 'Slender column' },
  { id: '140r'   as const, label: '140mm Round',   desc: 'Bold column' },
]

const SUB_STEPS = [
  { id: 0, label: 'Zone Layout',  icon: '🗺' },
  { id: 1, label: 'Materials',    icon: '🪵' },
  { id: 2, label: 'Stairs',       icon: '🪜' },
  { id: 3, label: 'Columns',      icon: '🏛' },
]

const EMPTY_CATALOG: FamilyCatalog = { decking: [], railings: [], pergolas: [], ceiling: [] }
const MAX_ZONES = 5

type DragState = { id: string; kind: 'move' | 'resize'; startX: number; startY: number; origZone: Zone }

export default function DesignStep({ state, update, updateBrief, next, back }: Props) {
  const [subStep,    setSubStep]    = useState(0)
  const [templates,  setTemplates]  = useState<Template[]>([])
  const [catalog,    setCatalog]    = useState<FamilyCatalog>(EMPTY_CATALOG)
  const [stairTypes, setStairTypes] = useState<string[]>([])
  const [deckMode,   setDeckMode]   = useState<'single' | 'multi'>((state.brief.deckMode as 'single' | 'multi') || 'single')
  const [zones,      setZones]      = useState<Zone[]>(state.brief.zones || [])
  const [conns,      setConns]      = useState<StairConnection[]>(state.brief.stairConnections || [])
  const [cols,       setCols]       = useState<ColumnConfig>(state.brief.columns || { material: 'timber', profile: '90x90', spacingFt: 6 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drag,       setDrag]       = useState<DragState | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const brief = state.brief

  useEffect(() => {
    api.getTemplates().then(r => setTemplates(r.templates)).catch(() => {})
    api.getCatalog().then(r => setCatalog(r.catalog)).catch(() => {})
    api.getStairTypes().then(r => setStairTypes(r.types)).catch(() => {})
  }, [])

  const canH = state.bbox ? Math.round(500 * (state.bbox.depthFt / Math.max(state.bbox.widthFt, 1))) : 300
  const clampedH = Math.min(Math.max(canH, 180), 520)

  // ── Zone helpers ───────────────────────────────────────────────────────────
  const addZone = (p: typeof ZONE_PALETTE[0]) => {
    if (zones.length >= MAX_ZONES) return
    const isFirepit = p.type === 'firepit'
    const z: Zone = {
      id: uuidv4(), label: p.label, zoneType: p.type,
      x: 0.05 + Math.random() * 0.2, y: 0.05 + Math.random() * 0.2,
      width: 0.38, height: 0.34,
      elevation: deckMode === 'single' ? 1.5 : isFirepit ? -4.0 : 1.5 + zones.filter(z => !z.hasFirepit).length * 1.5,
      hasCover: p.type === 'pergola', hasFirepit: isFirepit,
    }
    const nxt = [...zones, z]
    setZones(nxt); setSelectedId(z.id); updateBrief({ zones: nxt })
  }

  const removeZone = (id: string) => {
    const nxt = zones.filter(z => z.id !== id)
    setZones(nxt); if (selectedId === id) setSelectedId(null); updateBrief({ zones: nxt })
  }

  const patchZone = (id: string, p: Partial<Zone>) => {
    const nxt = zones.map(z => z.id === id ? { ...z, ...p } : z)
    setZones(nxt); updateBrief({ zones: nxt })
  }

  // ── Canvas drag ────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent, id: string, kind: 'move' | 'resize') => {
    e.stopPropagation()
    const zone = zones.find(z => z.id === id)!
    setDrag({ id, kind, startX: e.clientX, startY: e.clientY, origZone: { ...zone } })
    setSelectedId(id)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const dx = (e.clientX - drag.startX) / rect.width
    const dy = (e.clientY - drag.startY) / rect.height
    const oz = drag.origZone
    if (drag.kind === 'move') {
      patchZone(drag.id, {
        x: Math.max(0, Math.min(1 - oz.width,  oz.x + dx)),
        y: Math.max(0, Math.min(1 - oz.height, oz.y + dy)),
      })
    } else {
      patchZone(drag.id, {
        width:  Math.max(0.1, Math.min(1 - oz.x, oz.width  + dx)),
        height: Math.max(0.1, Math.min(1 - oz.y, oz.height + dy)),
      })
    }
  }

  const onMouseUp = () => setDrag(null)

  // ── Stair connections ──────────────────────────────────────────────────────
  const addConn = () => {
    const c: StairConnection = { id: uuidv4(), fromId: zones[0]?.id || 'ground', toId: 'ground', style: 'modern' }
    const nxt = [...conns, c]; setConns(nxt); updateBrief({ stairConnections: nxt })
  }
  const patchConn = (id: string, p: Partial<StairConnection>) => {
    const nxt = conns.map(c => c.id === id ? { ...c, ...p } : c)
    setConns(nxt); updateBrief({ stairConnections: nxt })
  }
  const removeConn = (id: string) => { const nxt = conns.filter(c => c.id !== id); setConns(nxt); updateBrief({ stairConnections: nxt }) }

  const patchCols = (p: Partial<ColumnConfig>) => { const nxt = { ...cols, ...p }; setCols(nxt); updateBrief({ columns: nxt }) }

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!state.bbox) return
    const fullBrief: DesignBrief = {
      address: state.address, bboxWidthFt: state.bbox.widthFt, bboxDepthFt: state.bbox.depthFt,
      deckMode, template: brief.template || 'single', style: brief.style || 'modern',
      floorMaterial: '', railingType: brief.railingType || 'Guardrail - Pipe',
      columnType: `${cols.material}-${cols.profile}`, stairType: brief.stairType || 'cascading',
      hasPergola: zones.some(z => z.hasCover), hasFirepit: zones.some(z => z.hasFirepit),
      zones, stairConnections: conns, columns: cols, photoIds: state.photoIds,
      deckingId: brief.deckingId || 'ipe_hardwood', railingId: brief.railingId || 'newtechwood_composite',
      pergolaId: brief.pergolaId || 'no_pergola', ceilingId: brief.ceilingId || 'open_ceiling',
    }
    update({ loading: true, error: null })
    try { const result = await api.generate(fullBrief); update({ result, loading: false }); next() }
    catch (e: unknown) { update({ loading: false, error: (e as Error).message }) }
  }

  const selectedZ = zones.find(z => z.id === selectedId)
  const zoneOpts = [{ id: 'ground', label: 'Garden / Ground' }, ...zones.map(z => ({ id: z.id, label: z.label }))]

  // ── Sub-step navigation ────────────────────────────────────────────────────
  const goNext = () => { if (subStep < 3) setSubStep(s => s + 1); else handleGenerate() }
  const goPrev = () => { if (subStep > 0) setSubStep(s => s - 1); else back() }

  const nextLabel = subStep < 3 ? `Next: ${SUB_STEPS[subStep + 1]?.label} →` : 'Build in Revit →'
  const nextDisabled = (subStep === 0 && zones.length === 0) || (subStep === 3 && (!state.bbox || state.loading))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto mt-6 px-4 fade-in">

      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="font-serif text-3xl text-parchment mb-1">Design your deck</h1>
        <p className="text-wood-400 text-sm">
          {state.bbox ? `${state.bbox.widthFt.toFixed(0)}′ × ${state.bbox.depthFt.toFixed(0)}′ · ${deckMode === 'single' ? 'Single level' : 'Multi-level'}` : 'Configure your deck'}
        </p>
      </div>

      {/* Deck mode toggle */}
      <div className="flex gap-2 mb-5 p-1 bg-surface-800 rounded-xl border border-surface-600 w-fit mx-auto">
        {(['single', 'multi'] as const).map(m => (
          <button key={m} onClick={() => { setDeckMode(m); updateBrief({ deckMode: m }) }}
            className={['px-6 py-2 rounded-lg text-sm font-medium transition',
              deckMode === m ? 'bg-wood-500 text-white' : 'text-wood-400 hover:text-wood-300'].join(' ')}>
            {m === 'single' ? '▪ Single Level' : '▪▪ Multi-Level'}
          </button>
        ))}
      </div>

      {/* Sub-step progress indicator */}
      <div className="flex items-center mb-6 bg-surface-800 rounded-2xl border border-surface-600 p-4">
        {SUB_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button onClick={() => setSubStep(s.id)}
              className={['flex flex-col items-center gap-1 flex-1 py-1 rounded-lg transition',
                subStep === s.id ? 'opacity-100' : i < subStep ? 'opacity-70 hover:opacity-100' : 'opacity-35 hover:opacity-50',
              ].join(' ')}>
              <div className={['w-8 h-8 rounded-full flex items-center justify-center text-sm transition',
                subStep === s.id ? 'bg-wood-500 text-white' :
                i < subStep ? 'bg-wood-600 text-white' : 'bg-surface-600 text-wood-500'].join(' ')}>
                {i < subStep ? '✓' : s.id + 1}
              </div>
              <span className={['text-xs hidden sm:block font-medium', subStep === s.id ? 'text-parchment' : 'text-wood-500'].join(' ')}>
                {s.icon} {s.label}
              </span>
            </button>
            {i < SUB_STEPS.length - 1 && (
              <div className={['h-px flex-shrink-0 w-4 mx-1 transition-colors', i < subStep ? 'bg-wood-600' : 'bg-surface-600'].join(' ')} />
            )}
          </div>
        ))}
      </div>

      {/* ════════════════ SUB-STEP 0: ZONE LAYOUT ═══════════════════════════ */}
      {subStep === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-base text-parchment">Deck layout canvas</h2>
              <span className="text-xs text-wood-500">Drag zones to move · corner to resize</span>
            </div>

            {/* Zone type buttons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ZONE_PALETTE.map(p => (
                <button key={p.type} onClick={() => addZone(p)} disabled={zones.length >= MAX_ZONES}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-surface-500 bg-surface-700 text-wood-300 hover:border-wood-400 hover:text-parchment disabled:opacity-30 transition">
                  {p.icon} {p.label}
                </button>
              ))}
              {zones.length >= MAX_ZONES && <span className="text-[11px] text-wood-700 self-center ml-1">Max {MAX_ZONES}</span>}
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              className="zone-canvas rounded-xl relative select-none overflow-hidden"
              style={{ width: '100%', height: clampedH }}
              onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            >
              {/* Site plan background (faded) */}
              {state.sitePlanUrl && (
                <img src={state.sitePlanUrl} alt="" className="absolute inset-0 w-full h-full object-contain opacity-15 pointer-events-none" />
              )}

              {zones.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                  <p className="text-wood-600 text-xs">Add zones above to design the deck layout</p>
                  <p className="text-wood-700 text-[10px]">Each zone is an area on the deck (dining, BBQ, fire pit…)</p>
                </div>
              )}

              {zones.map(z => {
                const pal = ZONE_PALETTE.find(p => p.type === z.zoneType) || ZONE_PALETTE[0]
                const isSel = z.id === selectedId
                return (
                  <div key={z.id}
                    style={{
                      position: 'absolute', left: `${z.x * 100}%`, top: `${z.y * 100}%`,
                      width: `${z.width * 100}%`, height: `${z.height * 100}%`,
                      backgroundColor: pal.bg, borderRadius: 6,
                      border: `2px solid ${isSel ? '#E8D5B8' : 'rgba(232,213,184,0.2)'}`,
                      cursor: drag?.id === z.id ? 'grabbing' : 'grab',
                      boxShadow: isSel ? '0 0 0 2px rgba(207,168,130,0.4)' : 'none',
                    }}
                    onMouseDown={e => onMouseDown(e, z.id, 'move')}
                  >
                    {z.hasCover && <div className="absolute top-1 left-1 text-[9px] bg-black/40 px-1 rounded text-white/80">roof</div>}
                    <span className="absolute pointer-events-none text-white text-[10px] font-semibold drop-shadow leading-tight"
                      style={{ top: z.hasCover ? 14 : 5, left: 5 }}>
                      {z.label}<br />
                      {deckMode === 'multi' && <span className="opacity-70">{z.elevation > 0 ? '+' : ''}{z.elevation}ft</span>}
                    </span>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, cursor: 'se-resize' }}
                      onMouseDown={e => onMouseDown(e, z.id, 'resize')}>
                      <svg viewBox="0 0 10 10" className="w-4 h-4 fill-white opacity-40"><path d="M8 0L10 0L10 10L0 10L0 8L8 8Z" /></svg>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Zone legend */}
            {zones.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {zones.map(z => {
                  const pal = ZONE_PALETTE.find(p => p.type === z.zoneType) || ZONE_PALETTE[0]
                  return (
                    <button key={z.id} onClick={() => setSelectedId(z.id)}
                      className={['flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition',
                        z.id === selectedId ? 'border-wood-400 text-parchment' : 'border-surface-600 text-wood-500 hover:border-wood-500'].join(' ')}>
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: pal.color }} />
                      {z.label}{deckMode === 'multi' && <span className="opacity-50 ml-0.5">{z.elevation > 0 ? '+' : ''}{z.elevation}ft</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Zone detail panel */}
          <div className="space-y-3">
            {selectedZ ? (
              <div className="bg-surface-800 rounded-2xl border border-surface-600 p-4 fade-in space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-base text-parchment">{ZONE_PALETTE.find(p => p.type === selectedZ.zoneType)?.icon} {selectedZ.label}</h3>
                  <button onClick={() => removeZone(selectedZ.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-900/40 px-2 py-0.5 rounded transition">Remove</button>
                </div>

                {/* Zone type */}
                <div>
                  <label className="text-[11px] text-wood-500 block mb-1.5">Zone type</label>
                  <div className="grid grid-cols-2 gap-1">
                    {ZONE_PALETTE.map(p => (
                      <button key={p.type} onClick={() => patchZone(selectedZ.id, { zoneType: p.type, label: p.label })}
                        className={['text-[11px] flex items-center gap-1 px-2 py-1.5 rounded-lg border transition',
                          selectedZ.zoneType === p.type ? 'border-wood-500 bg-surface-600 text-parchment' : 'border-surface-600 text-wood-500 hover:border-wood-500'].join(' ')}>
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Elevation (multi only) */}
                {deckMode === 'multi' && (
                  <div>
                    <label className="text-[11px] text-wood-500 block mb-1">
                      Elevation: <span className="text-parchment font-mono">{selectedZ.elevation > 0 ? '+' : ''}{selectedZ.elevation}ft</span>
                      {selectedZ.elevation < 0 ? ' (sunken)' : selectedZ.elevation === 0 ? ' (ground)' : ' (raised)'}
                    </label>
                    <input type="range" min={-6} max={9} step={0.5} value={selectedZ.elevation}
                      onChange={e => patchZone(selectedZ.id, { elevation: parseFloat(e.target.value) })}
                      className="w-full accent-wood-400" />
                    <div className="flex justify-between text-[10px] text-wood-700 mt-0.5"><span>−6</span><span>0</span><span>+9ft</span></div>
                  </div>
                )}

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => patchZone(selectedZ.id, { hasCover: !selectedZ.hasCover })}
                    className={['text-xs px-2.5 py-2 rounded-xl border transition flex items-center gap-1.5',
                      selectedZ.hasCover ? 'bg-wood-600 text-white border-wood-600' : 'bg-surface-700 text-wood-400 border-surface-600 hover:border-wood-500'].join(' ')}>
                    ⛺ {selectedZ.hasCover ? 'Roof On' : 'Add Roof'}
                  </button>
                  <button onClick={() => patchZone(selectedZ.id, { hasFirepit: !selectedZ.hasFirepit })}
                    className={['text-xs px-2.5 py-2 rounded-xl border transition flex items-center gap-1.5',
                      selectedZ.hasFirepit ? 'bg-red-900 text-white border-red-800' : 'bg-surface-700 text-wood-400 border-surface-600 hover:border-wood-500'].join(' ')}>
                    ♨ {selectedZ.hasFirepit ? 'Fire Pit On' : 'Fire Pit'}
                  </button>
                </div>

                {/* Label */}
                <div>
                  <label className="text-[11px] text-wood-500 block mb-1">Custom label</label>
                  <input type="text" value={selectedZ.label} onChange={e => patchZone(selectedZ.id, { label: e.target.value })}
                    className="w-full px-2.5 py-2 text-sm rounded-lg border border-surface-600 bg-surface-700 text-parchment focus:outline-none focus:ring-1 focus:ring-wood-500" />
                </div>
              </div>
            ) : (
              <div className="bg-surface-800 rounded-2xl border border-surface-600 p-6 text-center">
                <p className="text-wood-600 text-xs">Click a zone to edit its type, elevation, and features</p>
              </div>
            )}

            {zones.length > 0 && (
              <div className="bg-surface-800 rounded-2xl border border-surface-600 p-3">
                <p className="text-[10px] text-wood-500 mb-2 font-medium">SUMMARY</p>
                {zones.map(z => {
                  const pal = ZONE_PALETTE.find(p => p.type === z.zoneType) || ZONE_PALETTE[0]
                  return (
                    <div key={z.id} className="flex items-center justify-between text-[11px] py-0.5">
                      <span className="flex items-center gap-1.5 text-wood-300">
                        <span className="w-2 h-2 rounded-sm" style={{ background: pal.color }} />{z.label}
                        {z.hasCover && <span className="text-[9px] text-wood-600">roof</span>}
                        {z.hasFirepit && <span className="text-[9px] text-red-800">pit</span>}
                      </span>
                      {deckMode === 'multi' && <span className="text-wood-600 font-mono">{z.elevation > 0 ? '+' : ''}{z.elevation}ft</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ SUB-STEP 1: MATERIALS ═════════════════════════════ */}
      {subStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5 space-y-5">
              <h2 className="font-serif text-lg text-parchment">Materials & finishes</h2>
              <MaterialSelector label="Deck flooring" items={catalog.decking} selected={brief.deckingId || 'ipe_hardwood'} onChange={id => updateBrief({ deckingId: id })} />
              <MaterialSelector label="Railing system" items={catalog.railings} selected={brief.railingId || 'newtechwood_composite'} onChange={id => updateBrief({ railingId: id })} showComponentCount />
              <MaterialSelector label="Pergola / canopy" items={catalog.pergolas} selected={brief.pergolaId || 'no_pergola'} onChange={id => updateBrief({ pergolaId: id, hasPergola: id !== 'no_pergola' })} />
              <MaterialSelector label="Ceiling finish" items={catalog.ceiling} selected={brief.ceilingId || 'open_ceiling'} onChange={id => updateBrief({ ceilingId: id })} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5">
              <h2 className="font-serif text-base text-parchment mb-3">Layout style</h2>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(t => (
                  <button key={t.id} onClick={() => updateBrief({ template: t.id })}
                    className={['text-left px-3 py-3 rounded-xl border text-xs transition',
                      brief.template === t.id ? 'bg-wood-500 text-white border-wood-500' : 'bg-surface-700 text-wood-300 border-surface-600 hover:border-wood-500'].join(' ')}>
                    <span className="font-semibold block">{t.name}</span>
                    <span className="opacity-70 text-[11px]">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5">
              <h2 className="font-serif text-base text-parchment mb-3">Design style</h2>
              <div className="grid grid-cols-3 gap-2">
                {['modern', 'traditional', 'coastal', 'rustic', 'industrial', 'minimalist'].map(s => (
                  <button key={s} onClick={() => updateBrief({ style: s })}
                    className={['text-xs px-2.5 py-2 rounded-lg border capitalize transition',
                      brief.style === s ? 'bg-wood-500 text-white border-wood-500' : 'bg-surface-700 text-wood-400 border-surface-600 hover:border-wood-500'].join(' ')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SUB-STEP 2: STAIRS ════════════════════════════════ */}
      {subStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5 space-y-4">
            <h2 className="font-serif text-lg text-parchment">Stair style</h2>
            <div className="space-y-2">
              {STAIR_STYLES.map(s => (
                <button key={s.id} onClick={() => updateBrief({ stairType: s.id })}
                  className={['w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition',
                    brief.stairType === s.id ? 'bg-wood-500 text-white border-wood-500' : 'bg-surface-700 text-wood-300 border-surface-600 hover:border-wood-500'].join(' ')}>
                  <div className="text-left">
                    <span className="font-semibold text-sm block">{s.label}</span>
                    <span className="text-xs opacity-70">{s.desc}</span>
                  </div>
                  <span className="font-mono text-xs opacity-60">{s.widthFt}ft</span>
                </button>
              ))}
            </div>
            <div>
              <label className="font-serif text-sm text-parchment block mb-2">Construction type</label>
              <select value={brief.stairType || 'cascading'} onChange={e => updateBrief({ stairType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-600 bg-surface-700 text-parchment text-sm focus:outline-none focus:ring-1 focus:ring-wood-500">
                <option value="cascading">Cascading box steps</option>
                <option value="standard">Standard stair</option>
                {stairTypes.filter(t => t !== 'cascading' && t !== 'standard').map(t =>
                  <option key={t} value={t}>{t}</option>
                )}
              </select>
            </div>
          </div>

          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-parchment">Connections</h2>
              <button onClick={addConn} className="px-3 py-1.5 text-xs rounded-lg bg-wood-600 text-white hover:bg-wood-500 transition">+ Add</button>
            </div>
            {conns.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-wood-600 text-xs">No connections yet</p>
                <p className="text-wood-700 text-[10px] mt-1">Add a connection to define where stairs go</p>
                {zones.length === 0 && <p className="text-wood-800 text-[10px] mt-1">Add zones in step 1 first</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {conns.map(c => (
                  <div key={c.id} className="bg-surface-700 rounded-xl p-3 border border-surface-600">
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-wood-600 block mb-1">From</label>
                        <select value={c.fromId} onChange={e => patchConn(c.id, { fromId: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-surface-600 bg-surface-800 text-parchment focus:outline-none">
                          {zoneOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="text-wood-600 text-xs self-end pb-1.5">→</div>
                      <div className="flex-1">
                        <label className="text-[10px] text-wood-600 block mb-1">To</label>
                        <select value={c.toId} onChange={e => patchConn(c.id, { toId: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-surface-600 bg-surface-800 text-parchment focus:outline-none">
                          {zoneOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {STAIR_STYLES.map(s => (
                        <button key={s.id} onClick={() => patchConn(c.id, { style: s.id })}
                          className={['flex-1 py-1 text-[11px] rounded border transition',
                            c.style === s.id ? 'bg-wood-500 text-white border-wood-500' : 'bg-surface-800 text-wood-500 border-surface-600 hover:border-wood-400'].join(' ')}>
                          {s.label}
                        </button>
                      ))}
                      <button onClick={() => removeConn(c.id)} className="text-red-400 hover:text-red-300 text-xs px-1.5 py-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ SUB-STEP 3: COLUMNS ═══════════════════════════════ */}
      {subStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5 space-y-5">
            <h2 className="font-serif text-lg text-parchment">Column material</h2>
            <div className="space-y-2">
              {COLUMN_MATERIALS.map(m => (
                <button key={m.id} onClick={() => patchCols({ material: m.id })}
                  className={['w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition',
                    cols.material === m.id ? 'bg-wood-500 text-white border-wood-500' : 'bg-surface-700 text-wood-300 border-surface-600 hover:border-wood-500'].join(' ')}>
                  <div className="text-left">
                    <span className="font-semibold text-sm block">{m.label}</span>
                    <span className="text-xs opacity-70">{m.desc}</span>
                  </div>
                  {cols.material === m.id && <span className="text-white text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5">
              <h2 className="font-serif text-base text-parchment mb-3">Column profile</h2>
              <div className="space-y-2">
                {COLUMN_PROFILES.map(p => (
                  <button key={p.id} onClick={() => patchCols({ profile: p.id })}
                    className={['w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-sm transition',
                      cols.profile === p.id ? 'bg-wood-500 text-white border-wood-500' : 'bg-surface-700 text-wood-300 border-surface-600 hover:border-wood-500'].join(' ')}>
                    <div className="text-left">
                      <span className="font-medium text-sm block">{p.label}</span>
                      <span className="text-xs opacity-70">{p.desc}</span>
                    </div>
                    {cols.profile === p.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5">
              <h2 className="font-serif text-base text-parchment mb-3">Column spacing</h2>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[6, 8, 10].map(ft => (
                  <button key={ft} onClick={() => patchCols({ spacingFt: ft })}
                    className={['py-3 rounded-xl border text-sm font-mono transition',
                      cols.spacingFt === ft ? 'bg-wood-500 text-white border-wood-500' : 'bg-surface-700 text-wood-400 border-surface-600 hover:border-wood-500'].join(' ')}>
                    {ft}ft
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[11px] text-wood-500 block mb-1.5">Custom spacing (ft)</label>
                <input type="number" min={4} max={16} step={0.5} value={cols.spacingFt}
                  onChange={e => patchCols({ spacingFt: parseFloat(e.target.value) || 6 })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-surface-600 bg-surface-700 text-parchment focus:outline-none focus:ring-1 focus:ring-wood-500" />
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-surface-800 rounded-2xl border border-wood-600/30 p-4">
              <p className="text-xs text-wood-400 mb-2 font-medium">Configuration summary</p>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-wood-300"><span>Deck</span><span className="text-parchment capitalize">{deckMode}</span></div>
                <div className="flex justify-between text-wood-300"><span>Zones</span><span className="text-parchment">{zones.length} area{zones.length !== 1 ? 's' : ''}</span></div>
                <div className="flex justify-between text-wood-300"><span>Stair style</span><span className="text-parchment capitalize">{brief.stairType || 'cascading'}</span></div>
                <div className="flex justify-between text-wood-300"><span>Connections</span><span className="text-parchment">{conns.length}</span></div>
                <div className="flex justify-between text-wood-300"><span>Columns</span><span className="text-parchment capitalize">{cols.material} {cols.profile} @ {cols.spacingFt}ft</span></div>
                {state.bbox && <div className="flex justify-between text-wood-300"><span>Deck size</span><span className="text-parchment">{state.bbox.widthFt.toFixed(0)}′ × {state.bbox.depthFt.toFixed(0)}′</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div className="mt-4 bg-red-950/40 border border-red-900 text-red-400 text-sm px-4 py-3 rounded-xl">{state.error}</div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-700">
        <button onClick={goPrev} className="px-5 py-2.5 text-wood-400 text-sm font-medium hover:text-wood-200 transition flex items-center gap-1.5">
          ← {subStep === 0 ? 'Back' : `Back: ${SUB_STEPS[subStep - 1]?.label}`}
        </button>
        <div className="flex items-center gap-3">
          {subStep === 0 && zones.length === 0 && (
            <span className="text-xs text-wood-700">Add at least one zone to continue</span>
          )}
          <button onClick={goNext} disabled={nextDisabled}
            className="flex items-center gap-2 px-7 py-2.5 bg-wood-500 text-white rounded-xl font-medium text-sm hover:bg-wood-400 disabled:opacity-40 transition">
            {state.loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Building in Revit…</>
              : nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
