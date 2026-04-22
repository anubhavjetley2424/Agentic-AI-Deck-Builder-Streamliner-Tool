import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Upload, Layers, Paintbrush, Wrench, CheckCircle, ArrowLeft, ArrowRight, Plus, X, ChevronDown, ChevronRight, Loader2, Move, Eye, MessageSquare, Send, Link2, GripVertical, Home, RotateCw, Check, Building2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import ComponentPreview from '../components/ComponentPreview'
import ShapeOutline from '../components/ShapeOutline'
import { cn } from '../lib/utils'
import { api } from '../api'
import type { ComponentFinish, FloorPlanAnalysis, DeckArea, DeckVertex, DeckLevel, DeckZone, DesignResultV2, StairConnectionV2, FeatureWallConfig, LevelStyling } from '../types'

/* ─── Step metadata ───────────────────────────────────────────── */
const STEP_META = [
  { icon: Upload, label: 'Floor Plan' },
  { icon: Move, label: 'Deck Area' },
  { icon: Layers, label: 'Structure' },
  { icon: Paintbrush, label: 'Styles' },
  { icon: Wrench, label: 'Generate' },
]

/* ─── Style option data ───────────────────────────────────────── */
const STAIR_STYLES = [
  { id: 'cascading', label: 'Cascading', desc: 'Wide, gradual steps — dramatic flow' },
  { id: 'standard', label: 'Standard', desc: 'Compact straight-run stairs' },
  { id: 'floating', label: 'Floating', desc: 'Open-riser modern look' },
  { id: 'wrap', label: 'Wrap-Around', desc: 'Steps wrapping a corner' },
]
const STAIR_WIDTHS = [
  { id: 'standard', label: 'Standard' },
  { id: 'wide', label: 'Wide' },
  { id: 'extra-wide', label: 'Extra Wide' },
]
const COLUMN_STYLES = [
  { id: 'chamfered', label: 'Chamfered Column', desc: 'Square post with bevelled edges', swatch: '#7B5832' },
  { id: 'doric', label: 'Doric Column', desc: 'Classical fluted column with capital', swatch: '#C8C0B0' },
  { id: 'metal-clad', label: 'Metal Clad Column', desc: 'Cylindrical with cladding bands', swatch: '#5A5A5A' },
  { id: 'rectangular', label: 'Rectangular Column', desc: 'Clean minimal rectangular post', swatch: '#6B4A28' },
  { id: 'round', label: 'Round Column', desc: 'Smooth cylindrical post', swatch: '#2A2A2A' },
  { id: 'wood-timber', label: 'Wood Timber Column', desc: 'Solid timber post with grain', swatch: '#8B6B42' },
]
const RAILING_STYLES = [
  { id: 'pipe', label: 'ULTRALOX Pipe Rail', desc: 'Aluminium pipe system with drink rail' },
  { id: 'glass', label: 'Glass Balustrade', desc: 'Frameless glass panel system' },
  { id: 'wire', label: 'Wire Tension', desc: 'Stainless steel cable infill' },
  { id: 'timber', label: 'Falcon Vinyl Classic', desc: 'Baluster post with top rail' },
  { id: 'none', label: 'No Railing', desc: 'Open edge (low decks only)' },
]
const ROOF_STYLES = [
  { id: 'none', label: 'Open Sky', desc: 'No covering' },
  { id: 'pergola-flat', label: 'Serenity IRP Panel', desc: 'Insulated roof panel system' },
  { id: 'pergola-louvre', label: 'Signature Louvred', desc: 'Motorised adjustable louvres' },
  { id: 'slanted', label: 'Slanted Roof', desc: 'Single-pitch roof' },
  { id: 'gable', label: 'Gable', desc: 'Peaked A-frame' },
]
const CEILING_MATERIALS = [
  { id: 'timber-slat', label: 'Timber Slat', swatch: '#9B6B42' },
  { id: 'painted-white', label: 'Painted White', swatch: '#F5F5F0' },
  { id: 'cedar-lined', label: 'Cedar Lined', swatch: '#A0704A' },
  { id: 'composite-panel', label: 'Composite Panel', swatch: '#6A6A6A' },
  { id: 'corrugated-metal', label: 'Corrugated Metal', swatch: '#8A8A8A' },
]
const FEATURE_WALL_MATERIALS = [
  { id: 'timber-screen', label: 'Timber Screen', swatch: '#8B6B3A' },
  { id: 'stone-veneer', label: 'Stone Veneer', swatch: '#9A9080' },
  { id: 'rendered-concrete', label: 'Rendered Concrete', swatch: '#B0A898' },
  { id: 'brick', label: 'Brick', swatch: '#8B4A30' },
  { id: 'cladding', label: 'Cladding', swatch: '#5A5A5A' },
  { id: 'green-wall', label: 'Living Wall', swatch: '#5A5A4A' },
]
const DECKING_MATERIALS = [
  { id: 'spotted-gum', label: 'Spotted Gum', swatch: '#9B6B42' },
  { id: 'merbau', label: 'Merbau', swatch: '#6B3A2A' },
  { id: 'blackbutt', label: 'Blackbutt', swatch: '#C4A06A' },
  { id: 'ipe', label: 'IPE Hardwood', swatch: '#5C3A1E' },
  { id: 'composite-charcoal', label: 'Composite Charcoal', swatch: '#3A3A3A' },
  { id: 'composite-teak', label: 'Composite Teak', swatch: '#A07850' },
  { id: 'composite-silver', label: 'Composite Silver', swatch: '#8A8580' },
]
const RAILING_MATERIALS = [
  { id: 'steel-black', label: 'Steel Black', swatch: '#1A1A1A' },
  { id: 'steel-brushed', label: 'Brushed Steel', swatch: '#8A8A8A' },
  { id: 'aluminium-white', label: 'Aluminium White', swatch: '#E8E8E8' },
  { id: 'timber-natural', label: 'Timber Natural', swatch: '#9B6B42' },
  { id: 'glass-clear', label: 'Clear Glass', swatch: '#F0F0F0' },
]

type FinishOption = { id: ComponentFinish; label: string; desc: string }
type MaterialOption = { id: string; label: string; desc: string; swatch: string }
type PreviewOption = { id: string; label: string; desc: string }

const COLUMN_MATERIALS: MaterialOption[] = [
  { id: 'timber-natural', label: 'Thermowood', desc: 'Warm timber grain', swatch: '#9B6B42' },
  { id: 'steel-black', label: 'Powder Steel', desc: 'Dark structural metal', swatch: '#1A1A1A' },
  { id: 'rendered-concrete', label: 'Concrete', desc: 'Solid rendered finish', swatch: '#B0A898' },
  { id: 'composite-panel', label: 'Composite', desc: 'Low-maintenance wrap', swatch: '#6A6A6A' },
]
const COLUMN_MATERIALS_BY_STYLE: Record<string, MaterialOption[]> = {
  'wood-timber': [
    { id: 'timber-natural', label: 'Thermowood', desc: 'Thermally modified softwood', swatch: '#9B6B42' },
    { id: 'cedar-natural', label: 'Western Cedar', desc: 'Aromatic rot-resistant cedar', swatch: '#A0704A' },
    { id: 'spotted-gum', label: 'Spotted Gum', desc: 'Dense Australian hardwood', swatch: '#8B6B3A' },
    { id: 'merbau-timber', label: 'Merbau', desc: 'Rich reddish-brown hardwood', swatch: '#6B3A2A' },
    { id: 'oak-timber', label: 'European Oak', desc: 'Classic light grain timber', swatch: '#C4A06A' },
  ],
  'metal-clad': [
    { id: 'steel-black', label: 'Powder Black', desc: 'Matte black powder-coat', swatch: '#1A1A1A' },
    { id: 'steel-brushed', label: 'Brushed Steel', desc: 'Satin stainless finish', swatch: '#8A8A8A' },
    { id: 'aluminium-anodised', label: 'Anodised Alloy', desc: 'Bronze-anodised aluminium', swatch: '#7A6A5A' },
    { id: 'corten-steel', label: 'Corten Steel', desc: 'Weathered rust patina', swatch: '#8B4513' },
  ],
  'doric': [
    { id: 'rendered-concrete', label: 'Rendered Concrete', desc: 'Smooth plastered finish', swatch: '#B0A898' },
    { id: 'limestone', label: 'Limestone', desc: 'Natural stone classical', swatch: '#D4C8B0' },
    { id: 'marble-white', label: 'Carrara Marble', desc: 'White veined marble', swatch: '#E8E4DE' },
    { id: 'sandstone', label: 'Sandstone', desc: 'Warm quarried stone', swatch: '#C4AE8A' },
  ],
  'chamfered': [
    { id: 'timber-natural', label: 'Thermowood', desc: 'Warm timber grain', swatch: '#9B6B42' },
    { id: 'rendered-concrete', label: 'Concrete', desc: 'Solid rendered finish', swatch: '#B0A898' },
    { id: 'composite-panel', label: 'Composite', desc: 'Low-maintenance wrap', swatch: '#6A6A6A' },
    { id: 'cedar-natural', label: 'Western Cedar', desc: 'Rot-resistant cedar', swatch: '#A0704A' },
  ],
  'rectangular': [
    { id: 'timber-natural', label: 'Thermowood', desc: 'Warm timber grain', swatch: '#9B6B42' },
    { id: 'steel-black', label: 'Powder Steel', desc: 'Dark structural metal', swatch: '#1A1A1A' },
    { id: 'rendered-concrete', label: 'Concrete', desc: 'Solid rendered finish', swatch: '#B0A898' },
    { id: 'composite-panel', label: 'Composite', desc: 'Low-maintenance wrap', swatch: '#6A6A6A' },
  ],
  'round': [
    { id: 'rendered-concrete', label: 'Concrete', desc: 'Solid rendered finish', swatch: '#B0A898' },
    { id: 'steel-black', label: 'Powder Steel', desc: 'Dark structural metal', swatch: '#1A1A1A' },
    { id: 'steel-brushed', label: 'Brushed Steel', desc: 'Satin stainless finish', swatch: '#8A8A8A' },
    { id: 'composite-panel', label: 'Composite', desc: 'Low-maintenance wrap', swatch: '#6A6A6A' },
  ],
}
function getColumnMaterials(styleId: string): MaterialOption[] {
  return COLUMN_MATERIALS_BY_STYLE[styleId] || COLUMN_MATERIALS
}
const DECKING_PATTERNS: PreviewOption[] = [
  { id: 'linear', label: 'Linear', desc: 'Parallel plank run' },
  { id: 'picture-frame', label: 'Picture Frame', desc: 'Border with field boards' },
  { id: 'diagonal', label: 'Diagonal', desc: 'Dynamic angled board run' },
]
const ROOF_MATERIALS: MaterialOption[] = [
  { id: 'steel-black', label: 'Void Steel', desc: 'Black powder-coated roof', swatch: '#111111' },
  { id: 'aluminium-white', label: 'White Alloy', desc: 'Clean aluminium shell', swatch: '#E8E8E8' },
  { id: 'corrugated-metal', label: 'Corrugated Metal', desc: 'Industrial folded sheet', swatch: '#888888' },
  { id: 'composite-panel', label: 'Composite Panel', desc: 'Insulated modern panel', swatch: '#5E5E5E' },
]
const CEILING_SHAPES: PreviewOption[] = [
  { id: 'slatted', label: 'Open Slats', desc: 'Linear batten canopy' },
  { id: 'lined', label: 'Lined Soffit', desc: 'Clean flush lining' },
  { id: 'panelled', label: 'Panel Grid', desc: 'Modular panel ceiling' },
  { id: 'corrugated', label: 'Corrugated', desc: 'Ribbed metal underside' },
]
const FEATURE_WALL_SHAPES: PreviewOption[] = [
  { id: 'screen', label: 'Screen', desc: 'Open vertical battens' },
  { id: 'solid', label: 'Solid', desc: 'Continuous blade wall' },
  { id: 'masonry', label: 'Masonry', desc: 'Stacked masonry rhythm' },
]
const FINISH_OPTIONS: FinishOption[] = [
  { id: 'matte', label: 'Matte', desc: 'Soft low-sheen surface' },
  { id: 'satin', label: 'Satin', desc: 'Balanced architectural sheen' },
  { id: 'gloss', label: 'Gloss', desc: 'Reflective premium finish' },
  { id: 'textured', label: 'Textured', desc: 'Grippy tactile surface' },
  { id: 'raw', label: 'Raw', desc: 'Natural unfinished read' },
]
const PAINT_OPTIONS = [
  { id: 'none', label: 'Natural', swatch: 'transparent' },
  { id: '#F4F4F2', label: 'Arctic White', swatch: '#F4F4F2' },
  { id: '#DC3545', label: 'Signal Red', swatch: '#DC3545' },
  { id: '#111111', label: 'Void Black', swatch: '#111111' },
  { id: '#6B7280', label: 'Graphite', swatch: '#6B7280' },
] as const

const ZONE_FEATURES = [
  { id: 'general', label: 'General' },
  { id: 'dining', label: 'Dining' },
  { id: 'lounge', label: 'Lounge' },
  { id: 'bbq', label: 'BBQ / Kitchen' },
  { id: 'firepit', label: 'Fire Pit' },
  { id: 'garden', label: 'Garden Bed' },
  { id: 'custom', label: 'Custom' },
]

const LEVEL_COLORS = ['#C4A265', '#DC3545', '#E8E8E8', '#C48A6B', '#888888', '#FF6B6B']

const DEFAULT_STYLING: LevelStyling = {
  columns: 'rectangular',
  columnMaterial: 'timber-natural',
  columnFinish: 'matte',
  columnPaint: null,
  railing: 'pipe',
  railingMaterial: 'steel-black',
  railingFinish: 'satin',
  railingPaint: null,
  decking: 'spotted-gum',
  deckingPattern: 'linear',
  deckingFinish: 'raw',
  deckingPaint: null,
  hasRoof: false,
  roofStyle: 'none',
  roofMaterial: 'steel-black',
  roofFinish: 'satin',
  roofPaint: null,
  ceilingMaterial: 'timber-slat',
  ceilingShape: 'slatted',
  ceilingFinish: 'matte',
  ceilingPaint: null,
  featureWall: { enabled: false, material: 'timber-screen', finish: 'raw', paint: null, shape: 'screen', sides: [] },
}

function paintToValue(paintId: string) {
  return paintId === 'none' ? null : paintId
}

function paintSelectionId(paint?: string | null) {
  return paint ?? 'none'
}

/* ─── Sub-step stages for sequential component wizard ─────────── */
type WizardSubStep = 'shape' | 'material' | 'finish' | 'paint' | 'summary'
const WIZARD_STEPS: WizardSubStep[] = ['shape', 'material', 'finish', 'paint', 'summary']
const WIZARD_LABELS: Record<WizardSubStep, string> = { shape: 'Shape', material: 'Material', finish: 'Finish', paint: 'Paint', summary: 'Preview' }

function ComponentWizard({
  kind,
  title,
  shapes,
  materials,
  currentShape,
  currentMaterial,
  currentFinish,
  currentPaint,
  onShapeChange,
  onMaterialChange,
  onFinishChange,
  onPaintChange,
  expanded,
  onToggle,
  completed,
  revitCheckSlot,
}: {
  kind: 'column' | 'railing' | 'decking' | 'roof' | 'ceiling' | 'featureWall'
  title: string
  shapes: PreviewOption[]
  materials: MaterialOption[]
  currentShape: string
  currentMaterial: string
  currentFinish: ComponentFinish
  currentPaint?: string | null
  onShapeChange: (v: string) => void
  onMaterialChange: (v: string) => void
  onFinishChange: (v: ComponentFinish) => void
  onPaintChange: (v: string | null) => void
  expanded: boolean
  onToggle: () => void
  completed: boolean
  revitCheckSlot?: React.ReactNode
}) {
  const [subStep, setSubStep] = useState<WizardSubStep>('shape')
  const subIdx = WIZARD_STEPS.indexOf(subStep)

  const goNext = () => { const ni = Math.min(subIdx + 1, WIZARD_STEPS.length - 1); setSubStep(WIZARD_STEPS[ni]) }
  const goBack = () => { const ni = Math.max(subIdx - 1, 0); setSubStep(WIZARD_STEPS[ni]) }

  const selectedShape = shapes.find(s => s.id === currentShape)
  const selectedMat = materials.find(m => m.id === currentMaterial)
  const selectedFinish = FINISH_OPTIONS.find(f => f.id === currentFinish)
  const selectedPaintOpt = PAINT_OPTIONS.find(p => p.id === (currentPaint ?? 'none'))

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.08]" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px) saturate(120%)', WebkitBackdropFilter: 'blur(12px) saturate(120%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 40px -16px rgba(0,0,0,0.9)' }}>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,transparent_0,transparent_39px,rgba(255,255,255,0.03)_39px,rgba(255,255,255,0.03)_40px),linear-gradient(0deg,transparent_0,transparent_39px,rgba(255,255,255,0.03)_39px,rgba(255,255,255,0.03)_40px)] opacity-15" />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,53,69,0.35), transparent)' }} />

      {/* ── Accordion header ── */}
      <button onClick={onToggle} className="relative w-full flex items-center justify-between p-5 md:p-6 text-left group">
        <div className="flex items-center gap-3">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors', completed ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40')}>
            {completed ? <Check size={14} /> : <span className="text-[10px]">{kind[0].toUpperCase()}</span>}
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">{title}</h4>
            {completed && !expanded && (
              <p className="mt-0.5 text-[11px] text-white/40">
                {selectedShape?.label} · {selectedMat?.label} · {selectedFinish?.label}{currentPaint ? ` · ${selectedPaintOpt?.label}` : ''}
              </p>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={cn('text-white/30 transition-transform duration-200', expanded && 'rotate-180')} />
      </button>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="relative px-5 pb-6 md:px-6 space-y-5">
          {/* Sub-step breadcrumb */}
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.25em]">
            {WIZARD_STEPS.map((ws, i) => (
              <span key={ws} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="text-white/15" />}
                <button
                  onClick={() => setSubStep(ws)}
                  className={cn(
                    'px-2 py-1 rounded transition-colors',
                    ws === subStep ? 'bg-red-500/15 text-red-400' : i <= subIdx ? 'text-white/50 hover:text-white/70' : 'text-white/20',
                  )}
                >
                  {WIZARD_LABELS[ws]}
                </button>
              </span>
            ))}
          </div>

          {/* ── SHAPE (SVG outlines) ── */}
          {subStep === 'shape' && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/30">Select Shape / Profile</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
                {shapes.map(option => {
                  const active = option.id === currentShape
                  return (
                    <button key={option.id} onClick={() => { onShapeChange(option.id); goNext() }}
                      className={cn(
                        'group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200',
                        active ? 'border-red-500/60 bg-white/[0.06] shadow-[0_0_24px_rgba(220,53,69,0.18)]' : 'border-white/[0.08] bg-white/[0.02] hover:border-red-500/30 hover:bg-white/[0.04]',
                      )}>
                      <div className="relative space-y-2">
                        <div className="rounded-lg border border-white/10 bg-black p-2 flex items-center justify-center">
                          <ShapeOutline kind={kind} shape={option.id} size={80} />
                        </div>
                        <p className="text-sm font-semibold text-white">{option.label}</p>
                        <p className="text-[11px] leading-relaxed text-white/40">{option.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── MATERIAL (color swatch squares) ── */}
          {subStep === 'material' && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/30">Select Material</p>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-5 xl:grid-cols-6">
                {materials.map(option => {
                  const active = option.id === currentMaterial
                  return (
                    <button key={option.id} onClick={() => { onMaterialChange(option.id); goNext() }}
                      className={cn(
                        'group relative overflow-hidden rounded-xl border p-3 text-center transition-all duration-200',
                        active ? 'border-red-500/60 bg-white/[0.06] shadow-[0_0_24px_rgba(220,53,69,0.18)]' : 'border-white/[0.08] bg-white/[0.02] hover:border-red-500/30 hover:bg-white/[0.04]',
                      )}>
                      <div className="relative space-y-2">
                        <div className="w-full aspect-square rounded-lg border border-white/10" style={{ backgroundColor: option.swatch }} />
                        <p className="text-xs font-semibold text-white truncate">{option.label}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {revitCheckSlot}
            </div>
          )}

          {/* ── FINISH (pill buttons) ── */}
          {subStep === 'finish' && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/30">Select Finish</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {FINISH_OPTIONS.map(option => (
                  <button key={option.id} onClick={() => { onFinishChange(option.id); goNext() }}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left transition-all duration-200',
                      currentFinish === option.id ? 'border-red-500/60 bg-red-500/10 text-white shadow-[0_0_22px_rgba(220,53,69,0.14)]' : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-red-500/30 hover:text-white',
                    )}>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-white/40">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PAINT (color swatch pills) ── */}
          {subStep === 'paint' && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/30">Select Paint (optional)</p>
              <div className="flex flex-wrap gap-2">
                {PAINT_OPTIONS.map(option => {
                  const active = option.id === (currentPaint ?? 'none')
                  const isNatural = option.id === 'none'
                  return (
                    <button key={option.id} onClick={() => { onPaintChange(paintToValue(option.id)); goNext() }}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-medium transition-all duration-200',
                        active ? 'border-red-500/60 bg-red-500/10 text-white shadow-[0_0_20px_rgba(220,53,69,0.14)]' : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-red-500/30 hover:text-white',
                      )}>
                      <span className={cn('h-4 w-4 rounded-full border', isNatural ? 'border-dashed border-white/25 bg-transparent' : 'border-white/15')} style={isNatural ? undefined : { backgroundColor: option.swatch }} />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SUMMARY PREVIEW ── */}
          {subStep === 'summary' && (
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/30">Component Preview</p>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="rounded-2xl border border-red-500/20 bg-black p-4 shadow-[0_0_40px_rgba(220,53,69,0.10)]">
                  <ComponentPreview kind={kind} shape={currentShape} material={currentMaterial} finish={currentFinish} paint={currentPaint ?? undefined} size={200} />
                </div>
                <div className="flex-1 space-y-3">
                  <h5 className="text-base font-semibold text-white">{title} — Final Selection</h5>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-red-400/70 text-[11px] uppercase tracking-wider">Shape</span><p className="text-white font-medium">{selectedShape?.label ?? currentShape}</p></div>
                    <div><span className="text-red-400/70 text-[11px] uppercase tracking-wider">Material</span>
                      <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-white/15" style={{ backgroundColor: selectedMat?.swatch }} /><p className="text-white font-medium">{selectedMat?.label ?? currentMaterial}</p></div>
                    </div>
                    <div><span className="text-red-400/70 text-[11px] uppercase tracking-wider">Finish</span><p className="text-white font-medium">{selectedFinish?.label ?? currentFinish}</p></div>
                    <div><span className="text-red-400/70 text-[11px] uppercase tracking-wider">Paint</span><p className="text-white font-medium">{selectedPaintOpt?.label ?? 'Natural'}</p></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setSubStep('shape')} className="text-[11px] text-red-400/80 hover:text-red-400 underline underline-offset-2">Edit shape</button>
                    <button onClick={() => setSubStep('material')} className="text-[11px] text-red-400/80 hover:text-red-400 underline underline-offset-2">Edit material</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <button onClick={goBack} disabled={subIdx === 0}
              className={cn('flex items-center gap-1 text-xs font-medium transition-colors', subIdx === 0 ? 'text-white/15 cursor-not-allowed' : 'text-white/50 hover:text-white')}>
              <ArrowLeft size={12} /> Back
            </button>
            <span className="text-[10px] text-white/20 font-mono">{subIdx + 1} / {WIZARD_STEPS.length}</span>
            <button onClick={goNext} disabled={subIdx === WIZARD_STEPS.length - 1}
              className={cn('flex items-center gap-1 text-xs font-medium transition-colors', subIdx === WIZARD_STEPS.length - 1 ? 'text-white/15 cursor-not-allowed' : 'text-red-400/80 hover:text-red-400')}>
              Next <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/* ─── Polygon helpers ──────────────────────────────────────────── */
function rectToVertices(x: number, y: number, w: number, h: number): DeckVertex[] {
  return [
    { x_pct: x, y_pct: y },
    { x_pct: x + w, y_pct: y },
    { x_pct: x + w, y_pct: y + h },
    { x_pct: x, y_pct: y + h },
  ]
}

function verticesBBox(verts: DeckVertex[]): { x_pct: number; y_pct: number; width_pct: number; height_pct: number } {
  const xs = verts.map(v => v.x_pct)
  const ys = verts.map(v => v.y_pct)
  const minX = Math.min(...xs), minY = Math.min(...ys)
  return { x_pct: minX, y_pct: minY, width_pct: Math.max(...xs) - minX, height_pct: Math.max(...ys) - minY }
}

function buildDeckArea(vertices: DeckVertex[]): DeckArea {
  return { ...verticesBBox(vertices), vertices }
}

function svgPolyPath(verts: DeckVertex[], w: number, h: number): string {
  if (verts.length < 3) return ''
  const px = (v: DeckVertex) => (v.x_pct / 100) * w
  const py = (v: DeckVertex) => (v.y_pct / 100) * h
  let d = `M ${px(verts[0])} ${py(verts[0])}`
  for (let i = 0; i < verts.length; i++) {
    const curr = verts[i]
    const next = verts[(i + 1) % verts.length]
    if (curr.curved) {
      const mx = (px(curr) + px(next)) / 2
      const my = (py(curr) + py(next)) / 2
      const dx = px(next) - px(curr)
      const dy = py(next) - py(curr)
      const offset = Math.sqrt(dx * dx + dy * dy) * 0.3
      const cx2 = mx + (dy / Math.sqrt(dx * dx + dy * dy || 1)) * offset
      const cy2 = my - (dx / Math.sqrt(dx * dx + dy * dy || 1)) * offset
      d += ` Q ${cx2} ${cy2} ${px(next)} ${py(next)}`
    } else {
      d += ` L ${px(next)} ${py(next)}`
    }
  }
  return d + ' Z'
}

/* ─── Adjacency / stair detection helpers ─────────────────────── */
const TOUCH_THRESHOLD = 3 // % — levels within 3% of each other are "touching"

function detectSharedEdge(a: DeckLevel, b: DeckLevel): { edge: 'left' | 'right' | 'top' | 'bottom'; midPct: number } | null {
  const aR = a.x_pct + a.width_pct, aB = a.y_pct + a.height_pct
  const bR = b.x_pct + b.width_pct, bB = b.y_pct + b.height_pct
  // Vertical overlap
  const vOverlap = Math.max(0, Math.min(aB, bB) - Math.max(a.y_pct, b.y_pct))
  // Horizontal overlap
  const hOverlap = Math.max(0, Math.min(aR, bR) - Math.max(a.x_pct, b.x_pct))

  // a's right edge touches b's left edge
  if (Math.abs(aR - b.x_pct) < TOUCH_THRESHOLD && vOverlap > 5) {
    return { edge: 'right', midPct: (Math.max(a.y_pct, b.y_pct) + Math.min(aB, bB)) / 2 }
  }
  // a's left edge touches b's right edge
  if (Math.abs(a.x_pct - bR) < TOUCH_THRESHOLD && vOverlap > 5) {
    return { edge: 'left', midPct: (Math.max(a.y_pct, b.y_pct) + Math.min(aB, bB)) / 2 }
  }
  // a's bottom edge touches b's top edge
  if (Math.abs(aB - b.y_pct) < TOUCH_THRESHOLD && hOverlap > 5) {
    return { edge: 'bottom', midPct: (Math.max(a.x_pct, b.x_pct) + Math.min(aR, bR)) / 2 }
  }
  // a's top edge touches b's bottom edge
  if (Math.abs(a.y_pct - bB) < TOUCH_THRESHOLD && hOverlap > 5) {
    return { edge: 'top', midPct: (Math.max(a.x_pct, b.x_pct) + Math.min(aR, bR)) / 2 }
  }
  return null
}

/* ─── Stair anchoring helpers ─────────────────────────────────
 * Stairs (G, P, level↔level) are anchored to the edge of a specific
 * level, not the user's free-drawn deck outline. `position_pct` is a
 * 0-100 offset along that edge from the level's top-left corner. */
type StairEdge = 'top' | 'bottom' | 'left' | 'right'

/** Resolve a stair anchor to absolute canvas percentage coordinates
 *  (i.e. 0-100 of the levelCanvas rect). Returns null when the
 *  referenced level is missing. */
function getStairAnchor(
  stair: StairConnectionV2,
  levels: DeckLevel[],
  deckArea: DeckArea,
): { absX: number; absY: number } | null {
  const lvl = levels.find(l => l.id === stair.fromId)
  if (!lvl) return null
  const pos = Math.max(0, Math.min(100, stair.position_pct ?? 50))
  const edge = (stair.edge ?? 'bottom') as StairEdge
  let daX = lvl.x_pct, daY = lvl.y_pct
  if (edge === 'top')         { daX = lvl.x_pct + (pos / 100) * lvl.width_pct;  daY = lvl.y_pct }
  else if (edge === 'bottom') { daX = lvl.x_pct + (pos / 100) * lvl.width_pct;  daY = lvl.y_pct + lvl.height_pct }
  else if (edge === 'left')   { daX = lvl.x_pct;                                daY = lvl.y_pct + (pos / 100) * lvl.height_pct }
  else if (edge === 'right')  { daX = lvl.x_pct + lvl.width_pct;                daY = lvl.y_pct + (pos / 100) * lvl.height_pct }
  return {
    absX: deckArea.x_pct + (daX / 100) * deckArea.width_pct,
    absY: deckArea.y_pct + (daY / 100) * deckArea.height_pct,
  }
}

/** Given a pointer position in canvas-% coords, find the closest
 *  level edge — this is what a drag operation snaps to while the user
 *  moves a G/P marker around. */
function findClosestLevelEdge(
  cx: number,
  cy: number,
  levels: DeckLevel[],
  deckArea: DeckArea,
): { levelId: string; edge: StairEdge; position_pct: number } | null {
  if (!levels.length || deckArea.width_pct === 0 || deckArea.height_pct === 0) return null
  const drx = ((cx - deckArea.x_pct) / deckArea.width_pct) * 100
  const dry = ((cy - deckArea.y_pct) / deckArea.height_pct) * 100
  let best: { levelId: string; edge: StairEdge; position_pct: number; dist: number } | null = null
  for (const lvl of levels) {
    const L = lvl.x_pct, R = lvl.x_pct + lvl.width_pct
    const T = lvl.y_pct, B = lvl.y_pct + lvl.height_pct
    if (lvl.width_pct === 0 || lvl.height_pct === 0) continue
    const candidates: { edge: StairEdge; px: number; py: number; pos: number }[] = [
      { edge: 'top',    px: Math.max(L, Math.min(R, drx)), py: T, pos: ((Math.max(L, Math.min(R, drx)) - L) / lvl.width_pct) * 100 },
      { edge: 'bottom', px: Math.max(L, Math.min(R, drx)), py: B, pos: ((Math.max(L, Math.min(R, drx)) - L) / lvl.width_pct) * 100 },
      { edge: 'left',   px: L, py: Math.max(T, Math.min(B, dry)), pos: ((Math.max(T, Math.min(B, dry)) - T) / lvl.height_pct) * 100 },
      { edge: 'right',  px: R, py: Math.max(T, Math.min(B, dry)), pos: ((Math.max(T, Math.min(B, dry)) - T) / lvl.height_pct) * 100 },
    ]
    for (const c of candidates) {
      const d = Math.hypot(c.px - drx, c.py - dry)
      if (!best || d < best.dist) best = { levelId: lvl.id, edge: c.edge, position_pct: c.pos, dist: d }
    }
  }
  if (!best) return null
  return { levelId: best.levelId, edge: best.edge, position_pct: best.position_pct }
}

/** Inline SVG showing a miniature stair (three tread steps) — used on the
 *  canvas at the junction of two meeting levels so the user sees at a glance
 *  "there is a staircase here" without reading the label. */
function StepSymbol({ color = '#DC3545', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-[0_0_6px_rgba(220,53,69,0.5)]">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0a0a0a" stroke={color} strokeWidth="1.5" />
      {/* Three step treads going up-right */}
      <path
        d="M5 17 L5 14 L10 14 L10 11 L15 11 L15 8 L19 8"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Riser accents */}
      <line x1="10" y1="14" x2="10" y2="17" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="15" y1="11" x2="15" y2="14" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

/**
 * rectsOverlap — axis-aligned rectangle intersection test with a tiny
 * padding so adjacent rects that share an edge don't register as
 * overlapping. Works on anything with x_pct/y_pct/width_pct/height_pct,
 * so it's used for both DeckLevel ↔ DeckLevel and DeckZone ↔ DeckZone.
 */
type PctRect = { x_pct: number; y_pct: number; width_pct: number; height_pct: number }
function rectsOverlap(a: PctRect, b: PctRect): boolean {
  const pad = 1
  return !(a.x_pct + a.width_pct <= b.x_pct + pad ||
    b.x_pct + b.width_pct <= a.x_pct + pad ||
    a.y_pct + a.height_pct <= b.y_pct + pad ||
    b.y_pct + b.height_pct <= a.y_pct + pad)
}
// Back-compat alias used by the existing level handlers.
const levelsOverlap = (a: DeckLevel, b: DeckLevel) => rectsOverlap(a, b)

/**
 * useFittedBounds — given an outer container and a target aspect ratio,
 * returns the pixel bounds of an axis-aligned "letterboxed" frame that
 * would fit that aspect inside the container.
 *
 * We use this to carve out an inner frame that matches the floor-plan
 * image's actual rendered area in BOTH step 1 (Shape) and step 2
 * (Structure). Because every deck overlay is positioned in % relative
 * to this frame, the deck stays pixel-perfectly anchored to the image
 * even if the outer canvas container is a different width between steps
 * (step 2 has a 288 px side panel, step 1 does not).
 *
 * The `enabled` flag lets callers re-attach the ResizeObserver when a
 * step becomes active — Workshop only mounts one step's viewport at a
 * time, so refs are only valid while that step is visible.
 */
function useFittedBounds(
  ref: React.RefObject<HTMLElement | null>,
  aspect: number | null,
  enabled: boolean,
) {
  const [bounds, setBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el || !aspect) { setBounds(null); return }
    const compute = () => {
      const r = el.getBoundingClientRect()
      const cw = r.width, ch = r.height
      if (cw <= 0 || ch <= 0) return
      const ca = cw / ch
      if (ca > aspect) {
        // container is wider than image — full height, letterbox sides
        const w = ch * aspect, h = ch
        setBounds({ left: (cw - w) / 2, top: 0, width: w, height: h })
      } else {
        // container is taller than image — full width, letterbox top/bottom
        const w = cw, h = cw / aspect
        setBounds({ left: 0, top: (ch - h) / 2, width: w, height: h })
      }
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, aspect, enabled])
  return bounds
}

export default function Workshop() {
  const [showIntro, setShowIntro] = useState(true)
  const [step, setStep] = useState(0)

  // Step 1: Floor Plan
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null)
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null)
  const [floorPlanAspect, setFloorPlanAspect] = useState<number | null>(null) // w/h of uploaded image
  const [analysis, setAnalysis] = useState<FloorPlanAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [propWidthM, setPropWidthM] = useState(23.7)
  const [propDepthM, setPropDepthM] = useState(38.6)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2: Deck Area
  const [deckArea, setDeckArea] = useState<DeckArea | null>(null)
  const [activeVertexIdx, setActiveVertexIdx] = useState<number | null>(null)
  const [showHandles, setShowHandles] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoom(z => Math.min(4, Math.max(0.5, +(z - e.deltaY * 0.002).toFixed(2))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Step 3: Structure
  const [deckMode, setDeckMode] = useState<'single' | 'multi'>('single')
  const [levels, setLevels] = useState<DeckLevel[]>([
    { id: 'main', name: 'Deck 1', elevation_ft: 1.5, x_pct: 0, y_pct: 0, width_pct: 100, height_pct: 100, color: '#C4A265', styling: { ...DEFAULT_STYLING } },
  ])
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null)
  const levelCanvasRef = useRef<HTMLDivElement>(null)
  const [structureZoom, setStructureZoom] = useState(1)
  const structureViewportRef = useRef<HTMLDivElement>(null)

  // Zones (for single-level sub-areas)
  const [zones, setZones] = useState<DeckZone[]>([])
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [zoneCounter, setZoneCounter] = useState(1)

  // Stair connections
  const [stairConnections, setStairConnections] = useState<StairConnectionV2[]>([])

  // Whether the deck physically abuts the property (house) — governs whether a
  // property-access stair/threshold is required. Defaults to true (most decks
  // attach to the house) but user can uncheck for standalone pool/garden decks.
  const [deckTouchesProperty, setDeckTouchesProperty] = useState(true)

  useEffect(() => {
    const el = structureViewportRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setStructureZoom(z => Math.min(4, Math.max(0.5, +(z - e.deltaY * 0.002).toFixed(2))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Compute the aspect-locked image frame bounds inside each viewport.
  // Step 1 draws the deck into this frame; step 2 just renders the same
  // frame so the deck lands pixel-perfectly where it was drawn.
  // The `enabled` flag re-runs the hook when the step mounts so the
  // ResizeObserver attaches to the freshly-mounted viewport.
  const drawBounds = useFittedBounds(viewportRef, floorPlanAspect, step === 1)
  const structureBounds = useFittedBounds(structureViewportRef, floorPlanAspect, step === 2)

  // Step 4: Styles (per-level)
  const [activeStyleLevelId, setActiveStyleLevelId] = useState<string | null>(null)
  const [expandedComponent, setExpandedComponent] = useState<string | null>('columns')

  // Revit column material check
  type RevitCheckResult = {
    revitConnected: boolean
    columnStyle: string
    materialCheck: Record<string, { available: boolean; recommended: boolean; matchingRevitMaterials: string[] }>
    totalRevitMaterials: number
  }
  const [columnRevitStatus, setColumnRevitStatus] = useState<{ checking: boolean; result: RevitCheckResult | null }>({ checking: false, result: null })

  const checkColumnMaterials = async (columnStyle: string) => {
    setColumnRevitStatus({ checking: true, result: null })
    try {
      const res = await api.checkColumnMaterials(columnStyle)
      setColumnRevitStatus({ checking: false, result: res })
    } catch {
      setColumnRevitStatus({ checking: false, result: { revitConnected: false, columnStyle, materialCheck: {}, totalRevitMaterials: 0 } })
    }
  }

  // Step 5: Generate
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<DesignResultV2 | null>(null)
  const [feedback, setFeedback] = useState('')
  const [refining, setRefining] = useState(false)

  const next = () => setStep(s => Math.min(s + 1, 4))
  const back = () => setStep(s => Math.max(s - 1, 0))

  // ── Deck dimensions for labels ──
  const deckWM = propWidthM * (deckArea?.width_pct ?? 50) / 100
  const deckDM = propDepthM * (deckArea?.height_pct ?? 50) / 100

  // ── Auto-detect stair connections for multi-level ──
  const autoStairs = useMemo(() => {
    if (deckMode !== 'multi' || levels.length < 1) return []
    const auto: { fromId: string; toId: string; edge: string; x_pct: number; y_pct: number }[] = []
    const connectedLevels = new Set<string>()

    // Check touching pairs
    for (let i = 0; i < levels.length; i++) {
      for (let j = i + 1; j < levels.length; j++) {
        const shared = detectSharedEdge(levels[i], levels[j])
        if (shared) {
          // Position the stair icon at the shared edge midpoint
          let sx = 0, sy = 0
          if (shared.edge === 'right') { sx = levels[i].x_pct + levels[i].width_pct; sy = shared.midPct }
          else if (shared.edge === 'left') { sx = levels[i].x_pct; sy = shared.midPct }
          else if (shared.edge === 'bottom') { sx = shared.midPct; sy = levels[i].y_pct + levels[i].height_pct }
          else if (shared.edge === 'top') { sx = shared.midPct; sy = levels[i].y_pct }
          auto.push({ fromId: levels[i].id, toId: levels[j].id, edge: shared.edge, x_pct: sx, y_pct: sy })
          connectedLevels.add(levels[i].id)
          connectedLevels.add(levels[j].id)
        }
      }
    }

    // Any level with no touching neighbor needs a ground stair
    for (const lvl of levels) {
      if (!connectedLevels.has(lvl.id)) {
        // Place ground stair at bottom-center of the level
        auto.push({ fromId: lvl.id, toId: 'ground', edge: 'bottom', x_pct: lvl.x_pct + lvl.width_pct / 2, y_pct: lvl.y_pct + lvl.height_pct })
      }
    }

    return auto
  }, [levels, deckMode])

  // Sync auto-detected stairs into stairConnections (preserve property stairs)
  useEffect(() => {
    if (deckMode !== 'multi') return
    setStairConnections(prev => {
      const existing = new Map(prev.map(s => [`${s.fromId}-${s.toId}`, s]))
      const newConns: StairConnectionV2[] = []
      // Pool of existing ground stairs — we reuse these as users may have
      // dragged G to a different level edge, and we don't want a level
      // move to erase that choice.
      const existingGround = prev.filter(s => s.toId === 'ground')
      const consumedGround = new Set<string>()
      for (const a of autoStairs) {
        if (a.toId === 'ground') {
          // Reuse any existing ground stair (drag-preserved) before creating a new one.
          const reuse = existingGround.find(s => !consumedGround.has(s.id))
          if (reuse) {
            consumedGround.add(reuse.id)
            newConns.push(reuse)
            continue
          }
          newConns.push({
            id: `stair-${a.fromId}-ground-${Date.now()}`,
            fromId: a.fromId,
            toId: 'ground',
            style: 'cascading',
            width: 'standard',
            edge: a.edge as any,
            position_pct: 50,
          })
          continue
        }
        const key = `${a.fromId}-${a.toId}`
        const keyR = `${a.toId}-${a.fromId}`
        if (existing.has(key)) {
          newConns.push(existing.get(key)!)
        } else if (existing.has(keyR)) {
          newConns.push(existing.get(keyR)!)
        } else {
          newConns.push({
            id: `stair-${a.fromId}-${a.toId}`,
            fromId: a.fromId,
            toId: a.toId,
            style: 'cascading',
            width: 'standard',
            edge: a.edge as any,
            position_pct: 50,
          })
        }
      }
      // Preserve manually-placed property connection stairs
      const manualStairs = prev.filter(s => s.toId === 'property')
      const autoIds = new Set(newConns.map(s => s.id))
      const uniqueManual = manualStairs.filter(s => !autoIds.has(s.id))
      return [...newConns, ...uniqueManual]
    })
  }, [autoStairs, deckMode])

  // ── Floor plan upload + analysis ──
  const handleFileUpload = useCallback(async (file: File) => {
    setFloorPlanFile(file)
    const url = URL.createObjectURL(file)
    setFloorPlanUrl(url)
    // Prime the image aspect ratio immediately so downstream steps can
    // render their aspect-locked image frame in sync with what step 1 used.
    const primer = new Image()
    primer.onload = () => setFloorPlanAspect(primer.naturalWidth / primer.naturalHeight)
    primer.src = url
    setAnalyzing(true)
    try {
      const res = await api.analyzeFloorPlan(file)
      if (res.analysis) {
        setAnalysis(res.analysis)
        setPropWidthM(res.analysis.property_width_m)
        setPropDepthM(res.analysis.property_depth_m)
        if (res.analysis.deck_suggestions?.length > 0) {
          const s = res.analysis.deck_suggestions[0]
          setDeckArea(buildDeckArea(rectToVertices(s.x_pct, s.y_pct, s.width_pct, s.height_pct)))
        }
      }
    } catch { /* pass */ } finally { setAnalyzing(false) }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFileUpload(file)
  }, [handleFileUpload])

  // ── Draw-to-create ──
  const handleCanvasDrawStart = useCallback((e: React.MouseEvent) => {
    if (deckArea || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const sy = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setDrawStart({ x: sx, y: sy })
    setIsDrawing(true)
    const onMove = (ev: MouseEvent) => {
      const ex = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100))
      const ey = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100))
      const x = Math.min(sx, ex), y = Math.min(sy, ey), w = Math.abs(ex - sx), h = Math.abs(ey - sy)
      if (w > 1 && h > 1) setDeckArea(buildDeckArea(rectToVertices(x, y, w, h)))
    }
    const onUp = () => { setIsDrawing(false); setDrawStart(null); setShowHandles(true); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [deckArea])

  // ── Vertex drag (NO auto-snap) ──
  const handleVertexDragStart = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setActiveVertexIdx(idx)
    const onMove = (ev: MouseEvent) => {
      const nx = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100))
      const ny = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100))
      setDeckArea(da => { if (!da) return da; const v = [...da.vertices]; v[idx] = { ...v[idx], x_pct: nx, y_pct: ny }; return buildDeckArea(v) })
    }
    const onUp = () => { setActiveVertexIdx(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const handlePolygonMoveStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    let lastX = ((e.clientX - rect.left) / rect.width) * 100, lastY = ((e.clientY - rect.top) / rect.height) * 100
    const onMove = (ev: MouseEvent) => {
      const cx = ((ev.clientX - rect.left) / rect.width) * 100, cy = ((ev.clientY - rect.top) / rect.height) * 100
      const dx = cx - lastX, dy = cy - lastY; lastX = cx; lastY = cy
      setDeckArea(da => { if (!da) return da; const xs = da.vertices.map(v => v.x_pct + dx); const ys = da.vertices.map(v => v.y_pct + dy); if (Math.min(...xs) < 0 || Math.max(...xs) > 100 || Math.min(...ys) < 0 || Math.max(...ys) > 100) return da; return buildDeckArea(da.vertices.map((v, i) => ({ ...v, x_pct: xs[i], y_pct: ys[i] }))) })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [])

  const addVertexOnEdge = useCallback((edgeIdx: number) => {
    setDeckArea(da => { if (!da) return da; const v = [...da.vertices]; const a = v[edgeIdx]; const b = v[(edgeIdx + 1) % v.length]; v.splice(edgeIdx + 1, 0, { x_pct: (a.x_pct + b.x_pct) / 2, y_pct: (a.y_pct + b.y_pct) / 2 }); return buildDeckArea(v) })
  }, [])
  const toggleCurvedEdge = useCallback((idx: number) => {
    setDeckArea(da => { if (!da) return da; const v = [...da.vertices]; v[idx] = { ...v[idx], curved: !v[idx].curved }; return buildDeckArea(v) })
  }, [])
  const removeVertex = useCallback((idx: number) => {
    setDeckArea(da => { if (!da || da.vertices.length <= 3) return da; return buildDeckArea(da.vertices.filter((_, i) => i !== idx)) })
  }, [])

  // ── Level management (multi-level) ──
  const addLevel = () => {
    const n = levels.length
    const maxE = levels.reduce((m, l) => Math.max(m, l.elevation_ft), 0)
    // Place side-by-side: divide deck area equally
    const slotW = Math.floor(100 / (n + 1))
    // Reposition existing levels
    const repositioned = levels.map((l, i) => ({ ...l, x_pct: i * slotW, width_pct: slotW - 2 }))
    repositioned.push({
      id: `level-${Date.now()}`,
      name: `Deck ${n + 1}`,
      elevation_ft: maxE + 2,
      x_pct: n * slotW,
      y_pct: 0,
      width_pct: slotW - 2,
      height_pct: 100,
      color: LEVEL_COLORS[n % LEVEL_COLORS.length],
      styling: { ...DEFAULT_STYLING },
    })
    setLevels(repositioned)
  }

  const removeLevel = (id: string) => {
    setLevels(ls => ls.filter(l => l.id !== id))
    setStairConnections(sc => sc.filter(s => s.fromId !== id && s.toId !== id))
  }

  const updateLevel = (id: string, updates: Partial<DeckLevel>) => {
    setLevels(ls => ls.map(l => l.id === id ? { ...l, ...updates } : l))
  }

  const updateLevelStyling = (id: string, updates: Partial<LevelStyling>) => {
    setLevels(ls => ls.map(l => l.id === id ? { ...l, styling: { ...l.styling, ...updates } } : l))
  }

  // Rotate a level 90° — swap its width/height (percentage-based) and keep it
  // pinned at its current top-left. If the rotated footprint overflows the
  // deck area OR overlaps another level, bail out and keep the original.
  const rotateLevel = (id: string) => {
    setLevels(ls => {
      const lvl = ls.find(l => l.id === id)
      if (!lvl) return ls
      const newW = lvl.height_pct
      const newH = lvl.width_pct
      if (lvl.x_pct + newW > 100 || lvl.y_pct + newH > 100) return ls
      const candidate = { ...lvl, width_pct: newW, height_pct: newH }
      const overlaps = ls.some(l => l.id !== id && levelsOverlap(candidate, l))
      if (overlaps) return ls
      return ls.map(l => l.id === id ? candidate : l)
    })
  }

  // ── Level drag (with overlap prevention) ──
  const handleLevelDragStart = useCallback((e: React.MouseEvent, levelId: string) => {
    e.stopPropagation()
    if (!levelCanvasRef.current || !deckArea) return
    const rect = levelCanvasRef.current.getBoundingClientRect()
    const da = deckArea
    const lvl = levels.find(l => l.id === levelId)
    if (!lvl) return
    setActiveLevelId(levelId)
    const cx0 = ((e.clientX - rect.left) / rect.width) * 100
    const cy0 = ((e.clientY - rect.top) / rect.height) * 100
    const offX = ((cx0 - da.x_pct) / da.width_pct) * 100 - lvl.x_pct
    const offY = ((cy0 - da.y_pct) / da.height_pct) * 100 - lvl.y_pct

    const onMove = (ev: MouseEvent) => {
      const mcx = ((ev.clientX - rect.left) / rect.width) * 100
      const mcy = ((ev.clientY - rect.top) / rect.height) * 100
      const drx = ((mcx - da.x_pct) / da.width_pct) * 100
      const dry = ((mcy - da.y_pct) / da.height_pct) * 100
      const nx = Math.max(0, Math.min(100 - lvl.width_pct, drx - offX))
      const ny = Math.max(0, Math.min(100 - lvl.height_pct, dry - offY))
      setLevels(ls => {
        const candidate = { ...ls.find(l => l.id === levelId)!, x_pct: nx, y_pct: ny }
        // Check overlap with other levels
        const overlaps = ls.some(l => l.id !== levelId && levelsOverlap(candidate, l))
        if (overlaps) return ls
        return ls.map(l => l.id === levelId ? candidate : l)
      })
    }
    const onUp = () => { setActiveLevelId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [levels, deckArea])

  // ── Stair marker drag (G / P / level↔level) ──
  // Snaps the stair anchor to the nearest level edge as the user drags —
  // keeps G and P symbols pinned to actual level geometry, not the
  // free-drawn deck outline from step 2.
  const handleStairDragStart = useCallback((e: React.MouseEvent, stairId: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!levelCanvasRef.current || !deckArea) return
    const rect = levelCanvasRef.current.getBoundingClientRect()
    const onMove = (ev: MouseEvent) => {
      const cx = ((ev.clientX - rect.left) / rect.width) * 100
      const cy = ((ev.clientY - rect.top) / rect.height) * 100
      const match = findClosestLevelEdge(cx, cy, levels, deckArea)
      if (!match) return
      setStairConnections(scs => scs.map(sc => sc.id === stairId
        ? { ...sc, fromId: match.levelId, edge: match.edge, position_pct: match.position_pct }
        : sc))
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [levels, deckArea])

  const handleLevelResizeStart = useCallback((e: React.MouseEvent, levelId: string) => {
    e.stopPropagation()
    if (!levelCanvasRef.current || !deckArea) return
    const rect = levelCanvasRef.current.getBoundingClientRect()
    const da = deckArea
    setActiveLevelId(levelId)
    const onMove = (ev: MouseEvent) => {
      const cx = ((ev.clientX - rect.left) / rect.width) * 100
      const cy = ((ev.clientY - rect.top) / rect.height) * 100
      const drx = ((cx - da.x_pct) / da.width_pct) * 100
      const dry = ((cy - da.y_pct) / da.height_pct) * 100
      setLevels(ls => {
        const lvl = ls.find(l => l.id === levelId)!
        const newW = Math.max(10, Math.min(100 - lvl.x_pct, drx - lvl.x_pct))
        const newH = Math.max(10, Math.min(100 - lvl.y_pct, dry - lvl.y_pct))
        const candidate = { ...lvl, width_pct: newW, height_pct: newH }
        const overlaps = ls.some(l => l.id !== levelId && levelsOverlap(candidate, l))
        if (overlaps) return ls
        return ls.map(l => l.id === levelId ? candidate : l)
      })
    }
    const onUp = () => { setActiveLevelId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [deckArea])

  // Top-left resize — anchors the bottom-right corner, drags the top-left.
  // The pointer position becomes the new (x, y); width/height shrink so that
  // (x + w, y + h) stays put. Same non-overlap + floor constraints apply.
  const handleLevelResizeTopLeftStart = useCallback((e: React.MouseEvent, levelId: string) => {
    e.stopPropagation()
    if (!levelCanvasRef.current || !deckArea) return
    const rect = levelCanvasRef.current.getBoundingClientRect()
    const da = deckArea
    setActiveLevelId(levelId)
    const onMove = (ev: MouseEvent) => {
      const cx = ((ev.clientX - rect.left) / rect.width) * 100
      const cy = ((ev.clientY - rect.top) / rect.height) * 100
      const drx = ((cx - da.x_pct) / da.width_pct) * 100
      const dry = ((cy - da.y_pct) / da.height_pct) * 100
      setLevels(ls => {
        const lvl = ls.find(l => l.id === levelId)!
        const rightEdge = lvl.x_pct + lvl.width_pct
        const bottomEdge = lvl.y_pct + lvl.height_pct
        const newX = Math.max(0, Math.min(rightEdge - 10, drx))
        const newY = Math.max(0, Math.min(bottomEdge - 10, dry))
        const candidate = { ...lvl, x_pct: newX, y_pct: newY, width_pct: rightEdge - newX, height_pct: bottomEdge - newY }
        const overlaps = ls.some(l => l.id !== levelId && levelsOverlap(candidate, l))
        if (overlaps) return ls
        return ls.map(l => l.id === levelId ? candidate : l)
      })
    }
    const onUp = () => { setActiveLevelId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [deckArea])

  // ── Zone management (single-level) ──
  const addZone = () => {
    const n = zones.length
    const num = zoneCounter
    setZoneCounter(c => c + 1)
    const col = n % 3, row = Math.floor(n / 3)
    setZones(zs => [...zs, {
      id: `zone-${Date.now()}`, name: `Zone ${num}`, zoneType: 'general',
      x_pct: 5 + col * 32, y_pct: 5 + row * 35, width_pct: 28, height_pct: 30,
      color: LEVEL_COLORS[(n + 1) % LEVEL_COLORS.length],
    }])
  }
  const removeZone = (id: string) => setZones(zs => zs.filter(z => z.id !== id))

  const handleZoneDragStart = useCallback((e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation()
    if (!levelCanvasRef.current || !deckArea) return
    const rect = levelCanvasRef.current.getBoundingClientRect()
    const da = deckArea
    const zone = zones.find(z => z.id === zoneId)
    if (!zone) return
    setActiveZoneId(zoneId)
    const cx0 = ((e.clientX - rect.left) / rect.width) * 100
    const cy0 = ((e.clientY - rect.top) / rect.height) * 100
    const offX = ((cx0 - da.x_pct) / da.width_pct) * 100 - zone.x_pct
    const offY = ((cy0 - da.y_pct) / da.height_pct) * 100 - zone.y_pct
    const onMove = (ev: MouseEvent) => {
      const cx = ((ev.clientX - rect.left) / rect.width) * 100
      const cy = ((ev.clientY - rect.top) / rect.height) * 100
      const drx = ((cx - da.x_pct) / da.width_pct) * 100
      const dry = ((cy - da.y_pct) / da.height_pct) * 100
      const nx = Math.max(0, Math.min(100 - zone.width_pct, drx - offX))
      const ny = Math.max(0, Math.min(100 - zone.height_pct, dry - offY))
      setZones(zs => {
        // Reject positions that would overlap a sibling zone — same
        // crisp-boundary rule as multi-level deck levels.
        const candidate = { ...zs.find(z => z.id === zoneId)!, x_pct: nx, y_pct: ny }
        const overlaps = zs.some(z => z.id !== zoneId && rectsOverlap(candidate, z))
        if (overlaps) return zs
        return zs.map(z => z.id === zoneId ? candidate : z)
      })
    }
    const onUp = () => { setActiveZoneId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [zones, deckArea])

  const handleZoneResizeStart = useCallback((e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation()
    if (!levelCanvasRef.current || !deckArea) return
    const rect = levelCanvasRef.current.getBoundingClientRect()
    const da = deckArea
    setActiveZoneId(zoneId)
    const onMove = (ev: MouseEvent) => {
      const cx = ((ev.clientX - rect.left) / rect.width) * 100
      const cy = ((ev.clientY - rect.top) / rect.height) * 100
      const drx = ((cx - da.x_pct) / da.width_pct) * 100
      const dry = ((cy - da.y_pct) / da.height_pct) * 100
      setZones(zs => {
        const z = zs.find(z => z.id === zoneId)!
        const candidate = {
          ...z,
          width_pct: Math.max(10, Math.min(100 - z.x_pct, drx - z.x_pct)),
          height_pct: Math.max(10, Math.min(100 - z.y_pct, dry - z.y_pct)),
        }
        const overlaps = zs.some(other => other.id !== zoneId && rectsOverlap(candidate, other))
        if (overlaps) return zs
        return zs.map(other => other.id === zoneId ? candidate : other)
      })
    }
    const onUp = () => { setActiveZoneId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [deckArea])

  // Top-left zone resize — drags the (x, y) corner inward, keeps the
  // bottom-right anchored. Mirrors handleLevelResizeTopLeftStart.
  const handleZoneResizeTopLeftStart = useCallback((e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation()
    if (!levelCanvasRef.current || !deckArea) return
    const rect = levelCanvasRef.current.getBoundingClientRect()
    const da = deckArea
    setActiveZoneId(zoneId)
    const onMove = (ev: MouseEvent) => {
      const cx = ((ev.clientX - rect.left) / rect.width) * 100
      const cy = ((ev.clientY - rect.top) / rect.height) * 100
      const drx = ((cx - da.x_pct) / da.width_pct) * 100
      const dry = ((cy - da.y_pct) / da.height_pct) * 100
      setZones(zs => {
        const z = zs.find(z => z.id === zoneId)!
        const rightEdge = z.x_pct + z.width_pct
        const bottomEdge = z.y_pct + z.height_pct
        const newX = Math.max(0, Math.min(rightEdge - 10, drx))
        const newY = Math.max(0, Math.min(bottomEdge - 10, dry))
        const candidate = { ...z, x_pct: newX, y_pct: newY, width_pct: rightEdge - newX, height_pct: bottomEdge - newY }
        const overlaps = zs.some(other => other.id !== zoneId && rectsOverlap(candidate, other))
        if (overlaps) return zs
        return zs.map(other => other.id === zoneId ? candidate : other)
      })
    }
    const onUp = () => { setActiveZoneId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [deckArea])

  // ── Stair connection helpers ──
  const updateStairConnection = (id: string, field: keyof StairConnectionV2, value: any) => {
    setStairConnections(sc => sc.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  // ── Generate ──
  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const config = { property_width_m: propWidthM, property_depth_m: propDepthM, deck_area: deckArea!, deck_mode: deckMode, levels, zones, stairConnections }
      const res = await api.generateDesignV2(config as any)
      setResult(res)
    } catch { /* */ } finally { setGenerating(false) }
  }

  const handleRefine = async () => {
    if (!result || !feedback.trim()) return
    setRefining(true)
    try { const res = await api.refineDesignV2(result.sessionId, feedback); setResult(res); setFeedback('') } catch { /* */ } finally { setRefining(false) }
  }

  // ── Required stair validation ──
  // Ground stair: ALWAYS required (single or multi-level).
  // Property stair: only required when deck physically connects to the property.
  const hasGroundStair = stairConnections.some(s => s.toId === 'ground')
  const hasPropertyStair = stairConnections.some(s => s.toId === 'property')
  const requiredStairsPlaced = hasGroundStair && (!deckTouchesProperty || hasPropertyStair)

  return (
    <>
      {/* ── Workshop process intro — sits as a fixed overlay that lifts away
           when the user clicks Begin, revealing the workspace below. ── */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="workshop-intro"
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Blueprint grid — matches Workshop ambient layer */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent 0, transparent 79px, rgba(255,255,255,0.04) 79px, rgba(255,255,255,0.04) 80px),' +
                  'repeating-linear-gradient(0deg, transparent 0, transparent 79px, rgba(255,255,255,0.04) 79px, rgba(255,255,255,0.04) 80px)',
              }}
            />
            {/* Soft red midline */}
            <div
              aria-hidden
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: '50%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(220,53,69,0.3) 50%, transparent 100%)',
              }}
            />
            {/* Content — compact, two-column grid, strict black/red/white.
                 Fits in a single viewport height, no scrolling required. */}
            <div className="relative z-10 w-full max-w-4xl px-8 py-6">
              {/* Sheet header */}
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span style={{ color: '#DC3545' }}>◆</span>&nbsp;&nbsp;Workshop · Process Brief
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.2)' }}>Rev 2026.04</span>
              </div>

              <motion.h1
                className="font-sans font-semibold text-white mb-1"
                style={{ fontSize: 'clamp(1.6rem, 3.6vw, 2.6rem)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                Here's how it works<span style={{ color: '#DC3545' }}>.</span>
              </motion.h1>
              <motion.p
                className="text-[13px] font-light mb-5"
                style={{ lineHeight: 1.5, color: 'rgba(255,255,255,0.4)' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                Five steps from blank canvas to complete deck design brief.
              </motion.p>

              {/* Step cards — 2-column grid, 5th card spans both columns */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {[
                  { icon: Upload,     label: 'Floor Plan',  desc: 'Upload floor plan — PDF, DWG, or image. AI reads your property boundary.' },
                  { icon: Move,       label: 'Deck Area',   desc: 'Draw or adjust the deck footprint directly on the plan with drag handles.' },
                  { icon: Layers,     label: 'Structure',   desc: 'Add levels, place stairs, and define zones — dining, lounge, BBQ.' },
                  { icon: Paintbrush, label: 'Styles',      desc: 'Pick decking, railings, columns, roof and feature walls — per level.' },
                  { icon: Wrench,     label: 'Generate',    desc: 'MAS agent pipeline synthesises your inputs into a Revit-ready brief.' },
                ].map(({ icon: Icon, label, desc }, i, arr) => (
                  <motion.div
                    key={label}
                    className={cn('flex items-start gap-3 p-3 rounded-md', i === arr.length - 1 && 'col-span-2')}
                    style={{
                      border: '1px solid rgba(220,53,69,0.18)',
                      background: 'rgba(0,0,0,0.4)',
                    }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center font-mono text-[10px] font-bold"
                      style={{ background: '#DC3545', color: '#fff' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon size={12} style={{ color: '#DC3545' }} />
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white">{label}</span>
                      </div>
                      <p className="text-[11.5px] leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom row — video walkthrough + Begin button, side by side */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <span style={{ color: '#DC3545', fontSize: 12 }}>▶</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Video walkthrough — coming soon
                  </span>
                </motion.div>

                <motion.button
                  onClick={() => setShowIntro(false)}
                  className="begin-cta group relative inline-flex items-center gap-3 h-[48px] pl-6 pr-4 font-mono text-[12px] font-semibold uppercase tracking-[0.28em] text-white"
                  style={{
                    background: '#DC3545',
                    clipPath: 'polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 11px 100%, 0 calc(100% - 11px))',
                    boxShadow: '0 0 24px rgba(220,53,69,0.45), 0 0 56px rgba(220,53,69,0.2)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 36px rgba(220,53,69,0.75), 0 0 72px rgba(220,53,69,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Begin Building
                  <span
                    className="inline-flex items-center justify-center w-6 h-6"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.4)' }}
                  >
                    →
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Side meta strip */}
            <div
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 right-6 font-mono text-[9px] uppercase tracking-[0.3em] pointer-events-none"
              style={{ writingMode: 'vertical-rl', color: '#DC3545', opacity: 0.45 }}
            >
              ● Workshop · Mission Brief · 05 Steps
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    <div className="relative h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* ══════════════════════════════════════════════════════════════
          LANDING-PAGE THEME — cyberpunk/blueprint ambient layers.
          Matches Hero: 80px white-hairline grid, red midline strip,
          center vignette. pointer-events-none so the workspace stays
          fully interactive above these layers.
      ══════════════════════════════════════════════════════════════ */}
      {/* Grid lattice */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0, transparent 79px, rgba(255,255,255,0.045) 79px, rgba(255,255,255,0.045) 80px),' +
            'repeating-linear-gradient(0deg, transparent 0, transparent 79px, rgba(255,255,255,0.045) 79px, rgba(255,255,255,0.045) 80px)',
        }}
      />
      {/* Soft red midline — signature brand accent */}
      <div
        aria-hidden
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          zIndex: 0,
          top: '50%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(220,53,69,0.35) 50%, transparent 100%)',
        }}
      />
      {/* Center vignette — keeps focus on the canvas */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {/* Side meta strips — mirror landing-page vertical tickers */}
      <div
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 left-2 pointer-events-none font-mono text-[9px] uppercase tracking-[0.3em] text-white/20"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)', zIndex: 1 }}
      >
        Workshop · Rev 2026.04
      </div>
      <div
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 right-2 pointer-events-none font-mono text-[9px] uppercase tracking-[0.3em]"
        style={{ writingMode: 'vertical-rl', color: '#DC3545', opacity: 0.5, zIndex: 1 }}
      >
        ● Build · One intent
      </div>

      {/* ── Top bar: Logo + Steps ── */}
      <div className="relative flex-shrink-0 border-b border-white/[0.08] bg-black/85 backdrop-blur-md z-40" style={{ boxShadow: '0 1px 0 rgba(220,53,69,0.15)' }}>
        <div className="flex items-center h-12 px-4">
          {/* Logo symbol */}
          <Link to="/" className="mr-4 flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" stroke="white" strokeWidth="1" opacity="0.5" />
              <line x1="2" y1="14" x2="26" y2="14" stroke="#DC3545" strokeWidth="1" opacity="0.7" />
              <rect x="8" y="8" width="12" height="12" stroke="#DC3545" strokeWidth="0.5" opacity="0.35" />
            </svg>
          </Link>
          <div className="w-px h-5 bg-white/10 mr-4" />
          {/* Steps */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {STEP_META.map((s, i) => {
              const Icon = s.icon
              return (
                <button key={i} onClick={() => i <= step && setStep(i)} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap', i === step ? 'bg-white/10 text-white' : i < step ? 'text-green-400 cursor-pointer hover:bg-white/5' : 'text-white/25 cursor-default')}>
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold', i === step ? 'bg-white/20 text-white' : i < step ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/25')}>
                    {i < step ? <CheckCircle size={10} /> : <Icon size={10} />}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                  {i < STEP_META.length - 1 && <div className={cn('hidden sm:block w-6 h-px ml-1', i < step ? 'bg-green-500/30' : 'bg-white/[0.06]')} />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content area — fills remaining viewport ── */}
      <div className="relative flex-1 overflow-y-auto" style={{ zIndex: 10 }}>
        <div className="px-4 md:px-6 py-4 h-full">
        {/* ═══ STEP 1: UPLOAD FLOOR PLAN ═══ */}
        {step === 0 && (
          <div className="flex flex-col h-full gap-3">
            {/* Top bar: title + property dims + continue */}
            <div className="flex items-center gap-4 flex-wrap flex-shrink-0">
              <h2 className="font-sans text-lg font-semibold text-white">Upload Floor Plan</h2>
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Width (m)</label>
                  <input type="number" step="0.1" value={propWidthM} onChange={e => setPropWidthM(parseFloat(e.target.value) || 0)} className="w-20 h-8 px-2 text-xs rounded border border-white/10 bg-white/5 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Depth (m)</label>
                  <input type="number" step="0.1" value={propDepthM} onChange={e => setPropDepthM(parseFloat(e.target.value) || 0)} className="w-20 h-8 px-2 text-xs rounded border border-white/10 bg-white/5 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition" />
                </div>
                {analysis && !analyzing && (
                  <span className="text-[10px] text-green-400 font-medium"><CheckCircle size={10} className="inline -mt-0.5 mr-0.5" />AI Analyzed · {analysis.rooms.length} rooms</span>
                )}
                <Button onClick={next} disabled={propWidthM <= 0 || propDepthM <= 0} className="h-8 text-xs">Continue <ArrowRight size={14} /></Button>
              </div>
            </div>

            {/* Upload canvas — fills remaining space */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
            <div
              onDragOver={e => e.preventDefault()} onDrop={onDrop}
              onClick={() => !floorPlanUrl && fileInputRef.current?.click()}
              className={cn('relative flex-1 min-h-0 rounded-lg border border-dashed transition-all overflow-hidden', floorPlanUrl ? 'border-white/10 bg-black' : 'border-white/15 bg-white/[0.02] cursor-pointer hover:border-white/25')}
            >
              {floorPlanUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={floorPlanUrl} alt="Floor plan" className="max-w-full max-h-full object-contain" />
                  {analyzing && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3"><Loader2 size={28} className="text-red-500 animate-spin" /><p className="text-sm font-medium text-white/70">AI analyzing floor plan...</p></div>}
                  <button onClick={(e) => { e.stopPropagation(); setFloorPlanFile(null); setFloorPlanUrl(null); setFloorPlanAspect(null); setAnalysis(null) }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white/60 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"><X size={14} /></button>
                  {analysis && !analyzing && analysis.deck_suggestions.length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded px-3 py-1.5"><p className="text-[10px] text-white/60">{analysis.deck_suggestions[0].reason}</p></div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full"><Upload size={36} className="text-white/15 mb-3" /><p className="text-sm font-medium text-white/40">Drop your house plan here</p><p className="text-xs text-white/20 mt-1">PNG, JPG or PDF up to 25MB</p></div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: DECK AREA — POLYGON EDITOR ═══ */}
        {step === 1 && (
          <div className="flex flex-col h-full gap-2">
            {/* Top bar */}
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              <h2 className="font-sans text-lg font-semibold text-white">Shape Your Deck</h2>
              <p className="text-[11px] text-white/30">{!deckArea ? 'Click & drag to draw deck area' : `${deckArea.vertices.length} pts · ${(propWidthM * deckArea.width_pct / 100).toFixed(1)}m × ${(propDepthM * deckArea.height_pct / 100).toFixed(1)}m`}</p>
              <div className="flex items-center gap-2 ml-auto">
                {deckArea && <button onClick={() => setDeckArea(null)} className="px-2 py-1 rounded text-[10px] font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">Clear</button>}
                {deckArea && <button onClick={() => setDeckArea(buildDeckArea(rectToVertices(20, 10, 60, 40)))} className="px-2 py-1 rounded text-[10px] font-medium border border-white/10 text-white/40 hover:bg-white/5 transition">Reset</button>}
                {zoom !== 1 && <span className="text-[10px] font-medium text-white/30 cursor-pointer hover:text-white/60" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</span>}
                <Button variant="ghost" onClick={back} className="h-7 text-xs"><ArrowLeft size={12} /> Back</Button>
                <Button onClick={next} disabled={!deckArea} className="h-7 text-xs">Continue <ArrowRight size={12} /></Button>
              </div>
            </div>
            {/* Canvas — fills remaining viewport. The zoom transform lives on
                an outer wrapper; the inner aspect-locked frame (canvasRef) is
                letterboxed to the floor-plan's true rendered bounds so every
                deck percentage is anchored to the image, not the canvas. */}
            <div ref={viewportRef} className="flex-1 min-h-0 rounded-lg border border-white/[0.06] bg-black select-none overflow-hidden relative">
              <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
                <div
                  ref={canvasRef}
                  className={cn('absolute', !deckArea && 'cursor-crosshair')}
                  style={
                    drawBounds
                      ? { left: drawBounds.left, top: drawBounds.top, width: drawBounds.width, height: drawBounds.height }
                      : { inset: 0 }
                  }
                  onMouseDown={!deckArea ? handleCanvasDrawStart : undefined}
                  onClick={(e) => { if (!deckArea) return; if ((e.target as HTMLElement).closest('[data-handle]')) return; setShowHandles(sh => !sh) }}
                >
                  {floorPlanUrl && <img src={floorPlanUrl} alt="" onLoad={(e) => { if (!floorPlanAspect) setFloorPlanAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight) }} className={cn('absolute inset-0 w-full h-full pointer-events-none', drawBounds ? '' : 'object-contain', deckArea ? 'opacity-40' : 'opacity-90')} />}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/25 bg-black/60 px-1.5 py-0.5 rounded z-10 pointer-events-none">{propWidthM.toFixed(1)}m</div>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/25 bg-black/60 px-1.5 py-0.5 rounded rotate-90 origin-center z-10 pointer-events-none">{propDepthM.toFixed(1)}m</div>
                {analysis?.rooms.map((r, i) => (<div key={i} className="absolute border border-white/[0.08] rounded-sm flex items-center justify-center pointer-events-none" style={{ left: `${r.x_pct}%`, top: `${r.y_pct}%`, width: `${r.width_pct}%`, height: `${r.height_pct}%` }}><span className="text-[7px] text-white/20 font-medium truncate px-1">{r.name}</span></div>))}
                {!deckArea && !isDrawing && <div className="absolute top-3 left-3 z-10 pointer-events-none"><div className="bg-black/60 backdrop-blur-sm rounded px-3 py-2"><p className="text-[10px] font-medium text-white/40"><Plus size={10} className="inline -mt-0.5 mr-1 text-red-400" />Click & drag to draw</p></div></div>}
                {deckArea && (<>
                  <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={svgPolyPath(deckArea.vertices, 100, 100)} fill="rgba(220,53,69,0.08)" stroke="none" /></svg>
                  {(() => { const cx = deckArea.vertices.reduce((s, v) => s + v.x_pct, 0) / deckArea.vertices.length; const cy = deckArea.vertices.reduce((s, v) => s + v.y_pct, 0) / deckArea.vertices.length; return (<div data-handle="move" className="absolute z-20 -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm rounded px-2.5 py-1 text-center cursor-grab active:cursor-grabbing border border-white/10" style={{ left: `${cx}%`, top: `${cy}%` }} onMouseDown={handlePolygonMoveStart}><Move size={10} className="mx-auto text-white/30 mb-0.5" /><p className="text-[10px] font-semibold text-white/60">Deck</p><p className="text-[8px] text-white/30">{(propWidthM * deckArea.width_pct / 100).toFixed(1)}m × {(propDepthM * deckArea.height_pct / 100).toFixed(1)}m</p></div>) })()}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>{deckArea.vertices.map((v, i) => { const next = deckArea.vertices[(i + 1) % deckArea.vertices.length]; return <line key={`e-${i}`} x1={`${v.x_pct}%`} y1={`${v.y_pct}%`} x2={`${next.x_pct}%`} y2={`${next.y_pct}%`} stroke="#DC3545" strokeWidth="2" strokeLinecap="round" opacity="0.6" /> })}</svg>
                  {showHandles && (<>
                    {deckArea.vertices.map((v, i) => { const next = deckArea.vertices[(i + 1) % deckArea.vertices.length]; const mx = (v.x_pct + next.x_pct) / 2; const my = (v.y_pct + next.y_pct) / 2; return (<div key={`mid-${i}`} data-handle="mid" className="absolute z-30 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black border border-red-500/50 flex items-center justify-center cursor-pointer hover:bg-red-500/20 hover:scale-125 transition-all" style={{ left: `${mx}%`, top: `${my}%` }} onMouseDown={(e) => { e.stopPropagation(); addVertexOnEdge(i) }}><span className="text-[9px] font-bold text-red-400 leading-none">+</span></div>) })}
                    {deckArea.vertices.map((v, i) => { const next = deckArea.vertices[(i + 1) % deckArea.vertices.length]; return (<div key={`c-${i}`} data-handle="curve" className={cn('absolute z-30 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center cursor-pointer transition-all text-[7px] font-bold border', v.curved ? 'bg-white/20 border-white/40 text-white' : 'bg-black/80 border-white/10 text-white/25 hover:border-white/30')} style={{ left: `${v.x_pct * 0.65 + next.x_pct * 0.35}%`, top: `${v.y_pct * 0.65 + next.y_pct * 0.35}%` }} onClick={(e) => { e.stopPropagation(); toggleCurvedEdge(i) }}>⌒</div>) })}
                    {deckArea.vertices.map((v, i) => (<div key={`v-${i}`} data-handle="vertex" className={cn('absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all', activeVertexIdx === i ? 'w-6 h-6 bg-red-500 border-red-400' : 'w-5 h-5 bg-black border-red-500/60 hover:bg-red-500/20 hover:scale-110')} style={{ left: `${v.x_pct}%`, top: `${v.y_pct}%` }} onMouseDown={(e) => handleVertexDragStart(e, i)} onContextMenu={(e) => { e.preventDefault(); removeVertex(i) }}><span className={cn('text-[8px] font-bold leading-none', activeVertexIdx === i ? 'text-white' : 'text-red-300')}>{i + 1}</span></div>))}
                  </>)}
                </>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: DECK STRUCTURE ═══ */}
        {step === 2 && (
          <div className="flex flex-col h-full gap-2">
            {/* Top bar — toggle moved into side panel; this row is now just
                title · footprint · zoom · validation · nav. */}
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              <h2 className="font-sans text-lg font-semibold text-white">Deck Structure</h2>
              <span className="text-[11px] text-white font-mono">{deckWM.toFixed(1)}m × {deckDM.toFixed(1)}m</span>
              <div className="flex items-center gap-2 ml-auto">
                {structureZoom !== 1 && <span className="text-[10px] text-white/80 cursor-pointer hover:text-white" onClick={() => setStructureZoom(1)}>{Math.round(structureZoom * 100)}%</span>}
                {!requiredStairsPlaced && (
                  <span className="text-[10px] text-amber-300 font-semibold animate-pulse">
                    ⚠ {hasGroundStair ? '' : 'Ground entry'}
                    {!hasGroundStair && deckTouchesProperty && !hasPropertyStair ? ' & ' : ''}
                    {deckTouchesProperty && !hasPropertyStair ? 'Property access' : ''}
                    {' required'}
                  </span>
                )}
                <Button variant="ghost" onClick={back} className="h-7 text-xs"><ArrowLeft size={12} /> Back</Button>
                <Button onClick={next} disabled={!requiredStairsPlaced} className="h-7 text-xs">Continue <ArrowRight size={12} /></Button>
              </div>
            </div>

            {/* Main content: Canvas + Side panel */}
            <div className="flex-1 min-h-0 flex gap-3">
              {/* ═══ LEFT: Canvas ═══
                  Identical frame pattern as step 1: zoom-wrapper outside,
                  aspect-locked image frame inside (levelCanvasRef). Every
                  deck/zone/level/stair overlay uses percentages of this
                  frame, which IS the image's rendered bounds — so nothing
                  shifts relative to the floor plan between step 1 and 2. */}
              <div ref={structureViewportRef} className="flex-1 min-w-0 rounded-lg border border-white/[0.06] bg-black select-none overflow-hidden relative">
                <div className="absolute inset-0" style={{ transform: `scale(${structureZoom})`, transformOrigin: 'center center' }}>
                  <div
                    ref={levelCanvasRef}
                    className="absolute"
                    style={
                      structureBounds
                        ? { left: structureBounds.left, top: structureBounds.top, width: structureBounds.width, height: structureBounds.height }
                        : { inset: 0 }
                    }
                  >

                  {/* Floor plan overlay for spatial context */}
                  {floorPlanUrl && (
                    <img src={floorPlanUrl} alt="" onLoad={(e) => { if (!floorPlanAspect) setFloorPlanAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight) }} className={cn('absolute inset-0 w-full h-full pointer-events-none opacity-40', structureBounds ? '' : 'object-contain')} />
                  )}

                  {/* Confirmed deck boundary — concrete outline, non-editable */}
                  {deckArea && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}>
                      <defs>
                        <pattern id="deck-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect x={`${deckArea.x_pct}%`} y={`${deckArea.y_pct}%`} width={`${deckArea.width_pct}%`} height={`${deckArea.height_pct}%`} fill="url(#deck-hatch)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="6 3" rx="2" />
                    </svg>
                  )}

                  {/* Grid inside deck boundary */}
                  {deckArea && (
                    <svg className="absolute pointer-events-none" style={{ left: `${deckArea.x_pct}%`, top: `${deckArea.y_pct}%`, width: `${deckArea.width_pct}%`, height: `${deckArea.height_pct}%`, zIndex: 2 }}>
                      {[10,20,30,40,50,60,70,80,90].map(p => <g key={p}><line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" /><line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" /></g>)}
                    </svg>
                  )}

                  {/* Deck boundary dimension labels */}
                  {deckArea && (<>
                    <div className="absolute text-[10px] font-mono text-white bg-black/70 px-1.5 py-0.5 rounded z-30 pointer-events-none -translate-x-1/2" style={{ left: `${deckArea.x_pct + deckArea.width_pct / 2}%`, top: `${deckArea.y_pct}%`, transform: 'translate(-50%, -120%)' }}>{deckWM.toFixed(1)}m</div>
                    <div className="absolute text-[10px] font-mono text-white bg-black/70 px-1.5 py-0.5 rounded z-30 pointer-events-none" style={{ left: `${deckArea.x_pct}%`, top: `${deckArea.y_pct + deckArea.height_pct / 2}%`, transform: 'translate(-120%, -50%) rotate(-90deg)' }}>{deckDM.toFixed(1)}m</div>
                  </>)}

                  {/* ── Multi-level: Level rectangles ── */}
                  {deckMode === 'multi' && deckArea && levels.map((lvl) => {
                    const lvlWM = (deckWM * lvl.width_pct / 100).toFixed(1)
                    const lvlDM = (deckDM * lvl.height_pct / 100).toFixed(1)
                    const isActive = activeLevelId === lvl.id
                    // Map level pct coords into deck boundary pct coords
                    const absL = deckArea.x_pct + (lvl.x_pct / 100) * deckArea.width_pct
                    const absT = deckArea.y_pct + (lvl.y_pct / 100) * deckArea.height_pct
                    const absW = (lvl.width_pct / 100) * deckArea.width_pct
                    const absH = (lvl.height_pct / 100) * deckArea.height_pct
                    return (
                      <div key={lvl.id} onMouseDown={e => handleLevelDragStart(e, lvl.id)} className={cn('absolute rounded border transition-shadow cursor-grab active:cursor-grabbing', isActive ? 'shadow-[0_0_12px_rgba(255,255,255,0.15)] z-20' : 'z-10')} style={{ left: `${absL}%`, top: `${absT}%`, width: `${absW}%`, height: `${absH}%`, borderColor: lvl.color + 'AA', backgroundColor: `${lvl.color}18` }}>
                        <div className="absolute top-1 left-1.5 flex items-center gap-1"><GripVertical size={9} style={{ color: lvl.color }} className="opacity-80" /><span className="text-[11px] font-bold" style={{ color: lvl.color }}>{lvl.name}</span></div>
                        <div className="absolute top-1 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: lvl.color }}>{lvl.elevation_ft}ft</div>
                        <div className="absolute bottom-1 left-1.5 text-[9px] font-semibold" style={{ color: lvl.color }}>{lvlWM}m × {lvlDM}m</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); rotateLevel(lvl.id) }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title="Rotate 90°"
                          className="absolute top-1 right-14 w-6 h-6 rounded flex items-center justify-center bg-black/50 hover:bg-black/80 text-white transition z-30"
                          style={{ border: `1px solid ${lvl.color}` }}
                        >
                          <RotateCw size={11} />
                        </button>
                        <div onMouseDown={e => handleLevelResizeStart(e, lvl.id)} className="absolute -bottom-1 -right-1 w-8 h-8 cursor-se-resize z-30 flex items-end justify-end" style={{ borderRight: `3px solid ${lvl.color}`, borderBottom: `3px solid ${lvl.color}`, borderRadius: '0 0 4px 0' }}><span className="text-[8px] font-bold pr-0.5 pb-0.5" style={{ color: lvl.color }}>⤡</span></div>
                      </div>
                    )
                  })}

                  {/* ── Auto level↔level stair icons (step-symbols at shared edges) ── */}
                  {deckMode === 'multi' && deckArea && autoStairs.filter(s => s.toId !== 'ground').map((s, i) => {
                    const toLvl = levels.find(l => l.id === s.toId)
                    const label = toLvl?.name || '?'
                    const absX = deckArea.x_pct + (s.x_pct / 100) * deckArea.width_pct
                    const absY = deckArea.y_pct + (s.y_pct / 100) * deckArea.height_pct
                    return (
                      <div key={`auto-stair-${i}`} className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 pointer-events-none" style={{ left: `${absX}%`, top: `${absY}%` }}>
                        <StepSymbol color="#DC3545" />
                        <span className="text-[8px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded whitespace-nowrap">{label}</span>
                      </div>
                    )
                  })}
                  {/* ── G / P markers (multi-level) — anchored to LEVEL edges, draggable ── */}
                  {deckMode === 'multi' && deckArea && stairConnections
                    .filter(sc => sc.toId === 'ground' || sc.toId === 'property')
                    .map((sc) => {
                      const anchor = getStairAnchor(sc, levels, deckArea)
                      if (!anchor) return null
                      const isProperty = sc.toId === 'property'
                      const label = isProperty ? 'Property' : 'Ground'
                      return (
                        <div
                          key={sc.id}
                          onMouseDown={e => handleStairDragStart(e, sc.id)}
                          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing select-none"
                          style={{ left: `${anchor.absX}%`, top: `${anchor.absY}%` }}
                          title={`Drag to reposition ${label} access`}
                        >
                          {isProperty ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/40 bg-black/80 backdrop-blur-sm shadow-[0_0_8px_rgba(255,255,255,0.12)]">P</div>
                          ) : (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/40 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]">G</div>
                          )}
                          <span className="text-[8px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">{label}</span>
                        </div>
                      )
                    })}

                  {/* ── Single-level: Zone rectangles (constrained within deck) ── */}
                  {deckMode === 'single' && deckArea && zones.map((zone) => {
                    const zW = (deckWM * zone.width_pct / 100).toFixed(1)
                    const zD = (deckDM * zone.height_pct / 100).toFixed(1)
                    const isActive = activeZoneId === zone.id
                    const absL = deckArea.x_pct + (zone.x_pct / 100) * deckArea.width_pct
                    const absT = deckArea.y_pct + (zone.y_pct / 100) * deckArea.height_pct
                    const absW = (zone.width_pct / 100) * deckArea.width_pct
                    const absH = (zone.height_pct / 100) * deckArea.height_pct
                    return (
                      <div key={zone.id} onMouseDown={e => handleZoneDragStart(e, zone.id)} className={cn('absolute rounded border transition-shadow cursor-grab active:cursor-grabbing', isActive ? 'shadow-[0_0_10px_rgba(255,255,255,0.15)] z-20' : 'z-10')} style={{ left: `${absL}%`, top: `${absT}%`, width: `${absW}%`, height: `${absH}%`, borderColor: zone.color + 'AA', backgroundColor: `${zone.color}16` }}>
                        <div className="absolute top-1 left-1.5 flex items-center gap-1"><GripVertical size={9} style={{ color: zone.color }} className="opacity-80" /><span className="text-[10px] font-bold" style={{ color: zone.color }}>{zone.name}</span></div>
                        <div className="absolute bottom-1 left-1.5 text-[9px] font-semibold" style={{ color: zone.color }}>{zW}m × {zD}m</div>
                        <div onMouseDown={e => handleZoneResizeStart(e, zone.id)} className="absolute -bottom-1 -right-1 w-8 h-8 cursor-se-resize z-30 flex items-end justify-end" style={{ borderRight: `3px solid ${zone.color}`, borderBottom: `3px solid ${zone.color}`, borderRadius: '0 0 4px 0' }}><span className="text-[7px] font-bold pr-0.5 pb-0.5" style={{ color: zone.color }}>⤡</span></div>
                      </div>
                    )
                  })}

                  {/* ── Single-level stair placement (G = ground, P = property) — draggable, anchored to the single level's edges ── */}
                  {deckMode === 'single' && deckArea && stairConnections.map((sc) => {
                    const anchor = getStairAnchor(sc, levels, deckArea)
                    if (!anchor) return null
                    const isGround = sc.toId === 'ground'
                    const isProperty = sc.toId === 'property'
                    const label = isProperty ? 'Property' : isGround ? 'Ground' : 'Stairs'
                    return (
                      <div
                        key={sc.id}
                        onMouseDown={e => handleStairDragStart(e, sc.id)}
                        className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing select-none"
                        style={{ left: `${anchor.absX}%`, top: `${anchor.absY}%` }}
                        title={`Drag to reposition ${label} access`}
                      >
                        {isGround ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/40 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]">G</div>
                        ) : isProperty ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/40 bg-black/80 backdrop-blur-sm shadow-[0_0_8px_rgba(255,255,255,0.12)]">P</div>
                        ) : (
                          <StepSymbol color="#DC3545" />
                        )}
                        <span className="text-[8px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">{label}</span>
                      </div>
                    )
                  })}
                  </div>
                </div>
              </div>

              {/* ═══ RIGHT: Side Panel ═══ */}
              <div className="w-72 flex-shrink-0 overflow-y-auto space-y-3 pr-1">

                {/* ── Deck mode toggle — FIRST & LARGEST control ── */}
                <div className="p-1 rounded-xl border border-white/15 bg-white/[0.03] grid grid-cols-2 gap-1">
                  {(['single', 'multi'] as const).map(m => {
                    const active = deckMode === m
                    const label = m === 'single' ? 'Single-Level' : 'Multi-Level'
                    const desc  = m === 'single' ? 'One platform, optional zones' : 'Stepped levels at different heights'
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          setDeckMode(m)
                          if (m === 'single') {
                            setLevels([{ id: 'main', name: 'Deck 1', elevation_ft: 1.5, x_pct: 0, y_pct: 0, width_pct: 100, height_pct: 100, color: '#C4A265', styling: { ...DEFAULT_STYLING } }])
                            setStairConnections([])
                          }
                          if (m === 'multi') { setZones([]) }
                        }}
                        className={cn(
                          'relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg text-left transition-all',
                          active
                            ? 'bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.15)]'
                            : 'bg-transparent text-white hover:bg-white/10'
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Layers size={12} className={active ? 'text-black' : 'text-white'} />
                          <span className="text-[11px] font-semibold">{label}</span>
                        </div>
                        <span className={cn('text-[9px] leading-tight', active ? 'text-black/60' : 'text-white/70')}>{desc}</span>
                      </button>
                    )
                  })}
                </div>

                {/* ── Deck ↔ Property connection — BIG checkbox card ── */}
                <label
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none',
                    deckTouchesProperty
                      ? 'border-red-500/50 bg-red-500/[0.08] shadow-[0_0_18px_rgba(220,53,69,0.15)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={deckTouchesProperty}
                    onChange={e => setDeckTouchesProperty(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={cn(
                    'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    deckTouchesProperty ? 'border-red-400 bg-red-500' : 'border-white/40 bg-transparent'
                  )}>
                    {deckTouchesProperty && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={12} className="text-white" />
                      <span className="text-[12px] font-semibold text-white">Connects to property</span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-snug mt-0.5">
                      {deckTouchesProperty
                        ? 'A property access (P) stair/threshold is required.'
                        : 'Standalone deck — no house connection required.'}
                    </p>
                  </div>
                </label>

                {/* ── Multi-Level: Level cards ── */}
                {deckMode === 'multi' && (<>
                  <div className="flex items-center justify-between pt-1">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white">Deck Levels</h4>
                    <button onClick={addLevel} className="px-2 py-1 rounded text-[10px] font-semibold border border-white/25 text-white hover:bg-white/10 transition"><Plus size={10} className="inline -mt-0.5 mr-0.5" /> Add Level</button>
                  </div>
                  <div className="space-y-2">
                    {levels.map((lvl, i) => (
                      <div key={lvl.id} className={cn('p-2 rounded-lg border transition-all', activeLevelId === lvl.id ? 'border-white/30 bg-white/[0.06]' : 'border-white/10 hover:bg-white/[0.03]')} onClick={() => setActiveLevelId(lvl.id)}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: lvl.color }}>{i + 1}</div>
                          <input type="text" value={lvl.name} onChange={e => updateLevel(lvl.id, { name: e.target.value })} className="flex-1 text-xs font-semibold bg-transparent border-none focus:outline-none text-white min-w-0" />
                          <button
                            onClick={(e) => { e.stopPropagation(); rotateLevel(lvl.id) }}
                            title="Rotate 90° (swap width / height)"
                            className="text-white/70 hover:text-white p-0.5 rounded hover:bg-white/10 transition shrink-0"
                          >
                            <RotateCw size={12} />
                          </button>
                          {levels.length > 1 && <button onClick={(e) => { e.stopPropagation(); removeLevel(lvl.id) }} className="text-white/70 hover:text-red-400 transition shrink-0"><X size={12} /></button>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-white/80">Elev</span>
                            <input type="number" step="0.5" min="-10" max="20" value={lvl.elevation_ft} onChange={e => updateLevel(lvl.id, { elevation_ft: parseFloat(e.target.value) || 0 })} className="w-12 h-6 px-1 text-[10px] rounded border border-white/15 bg-white/5 text-white text-center" />
                            <span className="text-[10px] text-white/80">ft</span>
                          </div>
                          <label className="flex items-center gap-1 text-[10px] text-white cursor-pointer ml-auto">
                            <input type="checkbox" checked={lvl.styling.hasRoof} onChange={e => updateLevelStyling(lvl.id, { hasRoof: e.target.checked, roofStyle: e.target.checked ? (lvl.styling.roofStyle === 'none' ? 'pergola-flat' : lvl.styling.roofStyle) : 'none' })} className="w-3 h-3 rounded border-white/30 bg-white/5" />
                            Roof
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Required stairs + auto-detected connections */}
                  <div className="p-2.5 rounded-lg border border-white/15 bg-white/[0.03]">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white mb-2">Stairs &amp; Access</h4>
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold', hasGroundStair ? 'bg-green-500 text-white' : 'bg-amber-500/30 text-amber-200')}>{hasGroundStair ? '✓' : 'G'}</div>
                        <span className={cn('text-[10px] font-medium', hasGroundStair ? 'text-green-300' : 'text-white')}>Ground Entry {hasGroundStair ? '' : '(required)'}</span>
                        {!hasGroundStair && <button onClick={() => setStairConnections(sc => [...sc, { id: `stair-g-${Date.now()}`, fromId: levels[0]?.id || 'main', toId: 'ground', style: 'standard', width: 'standard', edge: 'bottom', position_pct: 50 }])} className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/25 text-amber-200 hover:bg-amber-500/40 transition">+ Add</button>}
                      </div>
                      {deckTouchesProperty && (
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold', hasPropertyStair ? 'bg-green-500 text-white' : 'bg-black/60 backdrop-blur-sm text-white/60 border border-white/10')}>{hasPropertyStair ? '✓' : 'P'}</div>
                          <span className={cn('text-[10px] font-medium', hasPropertyStair ? 'text-green-300' : 'text-white')}>Property Access {hasPropertyStair ? '' : '(required)'}</span>
                          {!hasPropertyStair && <button onClick={() => setStairConnections(sc => [...sc, { id: `stair-p-${Date.now()}`, fromId: levels[0]?.id || 'main', toId: 'property', style: 'standard', width: 'standard', edge: 'top', position_pct: 50 }])} className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/50 backdrop-blur-sm text-white/55 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80 transition">+ Add</button>}
                        </div>
                      )}
                    </div>
                    {stairConnections.length > 0 && <div className="h-px bg-white/10 my-1.5" />}
                    {stairConnections.map(sc => {
                      const from = sc.fromId === 'ground' ? 'Ground' : levels.find(l => l.id === sc.fromId)?.name || '?'
                      const to = sc.toId === 'ground' ? 'Ground' : sc.toId === 'property' ? 'Property' : levels.find(l => l.id === sc.toId)?.name || '?'
                      const symbol = sc.toId === 'property' ? '(P)' : sc.toId === 'ground' ? '(G)' : '⌒'
                      const symColor = sc.toId === 'property' ? 'text-white/55' : sc.toId === 'ground' ? 'text-amber-300' : 'text-red-300'
                      return (
                        <div key={sc.id} className="flex items-center gap-1.5 mb-1 text-[10px]">
                          <span className={cn('font-bold', symColor)}>{symbol}</span>
                          <span className="text-white">{from}</span>
                          <span className="text-white/50">↔</span>
                          <span className="text-white">{to}</span>
                          <span className="ml-auto text-[9px] text-white/70 capitalize">{sc.style}</span>
                          <button onClick={() => setStairConnections(s => s.filter(x => x.id !== sc.id))} className="text-white/60 hover:text-red-400 ml-1"><X size={9} /></button>
                        </div>
                      )
                    })}
                  </div>
                </>)}

                {/* ── Single-Level: Zone management + Stairs ── */}
                {deckMode === 'single' && (<>
                  <div className="flex items-center justify-between pt-1">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white">Zones</h4>
                    <button onClick={addZone} className="px-2 py-1 rounded text-[10px] font-semibold border border-white/25 text-white hover:bg-white/10 transition"><Plus size={10} className="inline -mt-0.5 mr-0.5" /> Add Zone</button>
                  </div>
                  {zones.length === 0 && <p className="text-[10px] text-white/70">Add zones to define areas within your deck (dining, lounge, BBQ...).</p>}
                  <div className="space-y-1.5">
                    {zones.map(zone => (
                      <div key={zone.id} className={cn('p-2 rounded-lg border transition-all text-xs', activeZoneId === zone.id ? 'border-white/30 bg-white/[0.06]' : 'border-white/10 hover:bg-white/[0.03]')} onClick={() => setActiveZoneId(zone.id)}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: zone.color }} />
                          <input type="text" value={zone.name} onChange={e => setZones(zs => zs.map(z => z.id === zone.id ? { ...z, name: e.target.value } : z))} className="flex-1 bg-transparent border-none font-semibold focus:outline-none text-white min-w-0 text-[11px]" />
                          <button onClick={(e) => { e.stopPropagation(); removeZone(zone.id) }} className="text-white/60 hover:text-red-400"><X size={10} /></button>
                        </div>
                        <select value={zone.zoneType} onChange={e => setZones(zs => zs.map(z => z.id === zone.id ? { ...z, zoneType: e.target.value } : z))} className="w-full text-[10px] px-1.5 py-0.5 rounded border border-white/15 bg-white/5 text-white">
                          {ZONE_FEATURES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Single-level stair placement — required stairs */}
                  <div className="p-2.5 rounded-lg border border-white/15 bg-white/[0.03]">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white mb-2">Stairs &amp; Access</h4>
                    {/* Required stair checklist */}
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold', hasGroundStair ? 'bg-green-500 text-white' : 'bg-amber-500/30 text-amber-200')}>{hasGroundStair ? '✓' : 'G'}</div>
                        <span className={cn('text-[10px] font-medium', hasGroundStair ? 'text-green-300' : 'text-white')}>Ground Entry {hasGroundStair ? '' : '(required)'}</span>
                        {!hasGroundStair && <button onClick={() => setStairConnections(sc => [...sc, { id: `stair-g-${Date.now()}`, fromId: 'main', toId: 'ground', style: 'standard', width: 'standard', edge: 'bottom', position_pct: 50 }])} className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/25 text-amber-200 hover:bg-amber-500/40 transition">+ Add</button>}
                      </div>
                      {deckTouchesProperty && (
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold', hasPropertyStair ? 'bg-green-500 text-white' : 'bg-black/60 backdrop-blur-sm text-white/60 border border-white/10')}>{hasPropertyStair ? '✓' : 'P'}</div>
                          <span className={cn('text-[10px] font-medium', hasPropertyStair ? 'text-green-300' : 'text-white')}>Property Access {hasPropertyStair ? '' : '(required)'}</span>
                          {!hasPropertyStair && <button onClick={() => setStairConnections(sc => [...sc, { id: `stair-p-${Date.now()}`, fromId: 'main', toId: 'property', style: 'standard', width: 'standard', edge: 'top', position_pct: 50 }])} className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/50 backdrop-blur-sm text-white/55 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80 transition">+ Add</button>}
                        </div>
                      )}
                    </div>
                    {/* Add extra stairs */}
                    <button onClick={() => setStairConnections(sc => [...sc, { id: `stair-${Date.now()}`, fromId: 'main', toId: 'ground', style: 'standard', width: 'standard', edge: 'bottom', position_pct: 50 }])} className="w-full px-2 py-1.5 rounded text-[10px] font-semibold border border-white/20 text-white hover:bg-white/10 transition mb-2"><Plus size={10} className="inline -mt-0.5 mr-0.5" /> Add Extra Stair</button>
                    {stairConnections.map(sc => {
                      const isGround = sc.toId === 'ground'
                      const isProperty = sc.toId === 'property'
                      const typeLabel = isProperty ? '(P) Property' : isGround ? '(G) Ground' : '→ Level'
                      const typeBg = isProperty ? 'text-white/55' : isGround ? 'text-amber-300' : 'text-white'
                      return (
                        <div key={sc.id} className="p-2 rounded-lg border border-white/10 bg-white/[0.03] mb-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn('text-[10px] font-semibold', typeBg)}>{typeLabel}</span>
                            <button onClick={() => setStairConnections(s => s.filter(x => x.id !== sc.id))} className="text-white/60 hover:text-red-400"><X size={10} /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <select value={sc.edge} onChange={e => updateStairConnection(sc.id, 'edge', e.target.value)} className="text-[10px] px-1 py-0.5 rounded border border-white/15 bg-white/5 text-white">
                              <option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option>
                            </select>
                            <select value={sc.style} onChange={e => updateStairConnection(sc.id, 'style', e.target.value)} className="text-[10px] px-1 py-0.5 rounded border border-white/15 bg-white/5 text-white">
                              {STAIR_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>)}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: STYLES — PER-LEVEL INDEPENDENCE ═══ */}
        {step === 3 && (
          <div className="max-w-5xl mx-auto space-y-10">
            <div><h2 className="font-sans text-2xl md:text-3xl font-semibold mb-2">Styles & Materials</h2><p className="text-white/40">Each deck level is styled independently. Stairs are styled per-connection.</p></div>

            {/* ── Level tabs ── */}
            {deckMode === 'multi' && levels.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {levels.map(lvl => (
                  <button key={lvl.id} onClick={() => setActiveStyleLevelId(lvl.id)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all', (activeStyleLevelId || levels[0].id) === lvl.id ? 'border-white/30 bg-white/10 text-white' : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/15')}>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: lvl.color }} />{lvl.name}
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const activeLvl = levels.find(l => l.id === (activeStyleLevelId || levels[0]?.id)) || levels[0]
              if (!activeLvl) return null
              const s = activeLvl.styling
              const toggle = (c: string) => setExpandedComponent(prev => prev === c ? null : c)

              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-red-500/20" style={{ background: 'rgba(0,0,0,0.85)' }}>
                    <h3 className="font-sans text-lg font-semibold mb-1 text-white">{activeLvl.name} — Styling</h3>
                    <p className="text-xs text-white/40">Select each component sequentially — shape, material, finish, paint.</p>
                  </div>

                  {/* ── Columns ── */}
                  <ComponentWizard
                    kind="column"
                    title="Columns"
                    shapes={COLUMN_STYLES.map(({ id, label, desc }) => ({ id, label, desc }))}
                    materials={getColumnMaterials(s.columns)}
                    currentShape={s.columns}
                    currentMaterial={s.columnMaterial}
                    currentFinish={s.columnFinish}
                    currentPaint={s.columnPaint}
                    onShapeChange={(v) => updateLevelStyling(activeLvl.id, { columns: v })}
                    onMaterialChange={(v) => updateLevelStyling(activeLvl.id, { columnMaterial: v })}
                    onFinishChange={(v) => updateLevelStyling(activeLvl.id, { columnFinish: v })}
                    onPaintChange={(v) => updateLevelStyling(activeLvl.id, { columnPaint: v })}
                    expanded={expandedComponent === 'columns'}
                    onToggle={() => toggle('columns')}
                    completed={!!s.columns && !!s.columnMaterial}
                    revitCheckSlot={(
                      <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/50 backdrop-blur-sm p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 size={12} className="text-white/30" />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">Revit Availability</span>
                            {columnRevitStatus.result?.columnStyle !== s.columns && columnRevitStatus.result && (
                              <span className="text-[10px] text-white/25 italic">({columnRevitStatus.result.columnStyle})</span>
                            )}
                          </div>
                          <button
                            onClick={() => checkColumnMaterials(s.columns)}
                            disabled={columnRevitStatus.checking}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11px] text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-40"
                          >
                            {columnRevitStatus.checking ? <Loader2 size={10} className="animate-spin" /> : <Building2 size={10} />}
                            {columnRevitStatus.checking ? 'Checking…' : 'Check Revit'}
                          </button>
                        </div>
                        {columnRevitStatus.result && !columnRevitStatus.result.revitConnected && (
                          <p className="text-[11px] text-white/30">Revit not connected — start RevitMCPBridge2026 to verify.</p>
                        )}
                        {columnRevitStatus.result?.revitConnected && (
                          <div className="grid grid-cols-2 gap-1.5">
                            {getColumnMaterials(s.columns).map(mat => {
                              const check = columnRevitStatus.result!.materialCheck[mat.id]
                              if (!check) return null
                              return (
                                <div key={mat.id} className={cn(
                                  'flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[11px]',
                                  check.available ? 'border-green-500/20 bg-green-500/[0.06]' : 'border-white/[0.05] bg-white/[0.02]',
                                )}>
                                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', check.available ? 'bg-green-400' : 'bg-white/15')} />
                                  <span className={cn('flex-1 truncate', check.available ? 'text-white/80' : 'text-white/25')}>{mat.label}</span>
                                  {check.recommended && <span className="text-[9px] text-amber-400/80 font-semibold tracking-wide">REC</span>}
                                  <span className={cn('text-[9px] font-medium', check.available ? 'text-green-400' : 'text-white/20')}>
                                    {check.available ? '✓' : '—'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {columnRevitStatus.result?.revitConnected && (
                          <p className="text-[10px] text-white/20">{columnRevitStatus.result.totalRevitMaterials} materials in Revit project · REC = recommended for {COLUMN_STYLES.find(c => c.id === s.columns)?.label}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* ── Railing ── */}
                  <ComponentWizard
                    kind="railing"
                    title="Railing"
                    shapes={RAILING_STYLES}
                    materials={RAILING_MATERIALS.map(m => ({ ...m, desc: m.label }))}
                    currentShape={s.railing}
                    currentMaterial={s.railingMaterial}
                    currentFinish={s.railingFinish}
                    currentPaint={s.railingPaint}
                    onShapeChange={(v) => updateLevelStyling(activeLvl.id, { railing: v })}
                    onMaterialChange={(v) => updateLevelStyling(activeLvl.id, { railingMaterial: v })}
                    onFinishChange={(v) => updateLevelStyling(activeLvl.id, { railingFinish: v })}
                    onPaintChange={(v) => updateLevelStyling(activeLvl.id, { railingPaint: v })}
                    expanded={expandedComponent === 'railing'}
                    onToggle={() => toggle('railing')}
                    completed={!!s.railing && !!s.railingMaterial}
                  />

                  {/* ── Deck Flooring ── */}
                  <ComponentWizard
                    kind="decking"
                    title="Deck Flooring"
                    shapes={DECKING_PATTERNS}
                    materials={DECKING_MATERIALS.map(m => ({ ...m, desc: m.label }))}
                    currentShape={s.deckingPattern}
                    currentMaterial={s.decking}
                    currentFinish={s.deckingFinish}
                    currentPaint={s.deckingPaint}
                    onShapeChange={(v) => updateLevelStyling(activeLvl.id, { deckingPattern: v })}
                    onMaterialChange={(v) => updateLevelStyling(activeLvl.id, { decking: v })}
                    onFinishChange={(v) => updateLevelStyling(activeLvl.id, { deckingFinish: v })}
                    onPaintChange={(v) => updateLevelStyling(activeLvl.id, { deckingPaint: v })}
                    expanded={expandedComponent === 'decking'}
                    onToggle={() => toggle('decking')}
                    completed={!!s.deckingPattern && !!s.decking}
                  />

                  {/* ── Roof / Cover ── */}
                  <ComponentWizard
                    kind="roof"
                    title="Roof / Cover"
                    shapes={ROOF_STYLES}
                    materials={ROOF_MATERIALS}
                    currentShape={s.roofStyle || 'none'}
                    currentMaterial={s.roofMaterial || 'steel-black'}
                    currentFinish={s.roofFinish || 'satin'}
                    currentPaint={s.roofPaint}
                    onShapeChange={(v) => updateLevelStyling(activeLvl.id, { roofStyle: v, hasRoof: v !== 'none' })}
                    onMaterialChange={(v) => updateLevelStyling(activeLvl.id, { roofMaterial: v })}
                    onFinishChange={(v) => updateLevelStyling(activeLvl.id, { roofFinish: v })}
                    onPaintChange={(v) => updateLevelStyling(activeLvl.id, { roofPaint: v })}
                    expanded={expandedComponent === 'roof'}
                    onToggle={() => toggle('roof')}
                    completed={!!s.roofStyle}
                  />

                  {/* ── Ceiling (only when roof is enabled) ── */}
                  {s.hasRoof && (
                    <ComponentWizard
                      kind="ceiling"
                      title="Ceiling"
                      shapes={CEILING_SHAPES}
                      materials={CEILING_MATERIALS.map(m => ({ ...m, desc: m.label }))}
                      currentShape={s.ceilingShape || 'slatted'}
                      currentMaterial={s.ceilingMaterial || 'timber-slat'}
                      currentFinish={s.ceilingFinish || 'matte'}
                      currentPaint={s.ceilingPaint}
                      onShapeChange={(v) => updateLevelStyling(activeLvl.id, { ceilingShape: v })}
                      onMaterialChange={(v) => updateLevelStyling(activeLvl.id, { ceilingMaterial: v })}
                      onFinishChange={(v) => updateLevelStyling(activeLvl.id, { ceilingFinish: v })}
                      onPaintChange={(v) => updateLevelStyling(activeLvl.id, { ceilingPaint: v })}
                      expanded={expandedComponent === 'ceiling'}
                      onToggle={() => toggle('ceiling')}
                      completed={!!(s.ceilingShape && s.ceilingMaterial)}
                    />
                  )}

                  {/* ── Feature Wall (toggle + wizard + sides) ── */}
                  <section className="relative overflow-hidden rounded-2xl border border-white/[0.08]" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px) saturate(120%)', WebkitBackdropFilter: 'blur(12px) saturate(120%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 40px -16px rgba(0,0,0,0.9)' }}>
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,transparent_0,transparent_39px,rgba(255,255,255,0.03)_39px,rgba(255,255,255,0.03)_40px),linear-gradient(0deg,transparent_0,transparent_39px,rgba(255,255,255,0.03)_39px,rgba(255,255,255,0.03)_40px)] opacity-15" />
                    <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,53,69,0.35), transparent)' }} />
                    <div className="relative p-5 md:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold', s.featureWall?.enabled ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40')}>
                            {s.featureWall?.enabled ? <Check size={14} /> : <span className="text-[10px]">F</span>}
                          </div>
                          <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">Feature Wall</h4>
                        </div>
                        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/72 cursor-pointer">
                          <input type="checkbox" checked={s.featureWall?.enabled ?? false}
                            onChange={e => updateLevelStyling(activeLvl.id, { featureWall: { ...(s.featureWall || { material: 'timber-screen', finish: 'raw', paint: null, shape: 'screen', sides: [] }), enabled: e.target.checked } })}
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-400" />
                          Enable
                        </label>
                      </div>
                      {s.featureWall?.enabled && (
                        <div className="space-y-4">
                          <ComponentWizard
                            kind="featureWall"
                            title="Feature Wall"
                            shapes={FEATURE_WALL_SHAPES}
                            materials={FEATURE_WALL_MATERIALS.map(m => ({ ...m, desc: m.label }))}
                            currentShape={s.featureWall.shape || 'screen'}
                            currentMaterial={s.featureWall.material}
                            currentFinish={s.featureWall.finish}
                            currentPaint={s.featureWall.paint}
                            onShapeChange={(v) => updateLevelStyling(activeLvl.id, { featureWall: { ...s.featureWall!, shape: v } })}
                            onMaterialChange={(v) => updateLevelStyling(activeLvl.id, { featureWall: { ...s.featureWall!, material: v } })}
                            onFinishChange={(v) => updateLevelStyling(activeLvl.id, { featureWall: { ...s.featureWall!, finish: v } })}
                            onPaintChange={(v) => updateLevelStyling(activeLvl.id, { featureWall: { ...s.featureWall!, paint: v } })}
                            expanded={expandedComponent === 'featureWall'}
                            onToggle={() => toggle('featureWall')}
                            completed={!!(s.featureWall.shape && s.featureWall.material)}
                          />
                          <div className="space-y-3 px-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/30">Applied Sides</p>
                            <div className="flex flex-wrap gap-2">
                              {(['north', 'south', 'east', 'west'] as const).map(side => {
                                const active = s.featureWall?.sides.includes(side) ?? false
                                return (
                                  <button key={side}
                                    onClick={() => { const newSides = active ? s.featureWall!.sides.filter(x => x !== side) : [...(s.featureWall?.sides || []), side]; updateLevelStyling(activeLvl.id, { featureWall: { ...s.featureWall!, sides: newSides } }) }}
                                    className={cn('rounded-full border px-3 py-2 text-xs font-medium capitalize transition-all duration-200', active ? 'border-red-500/60 bg-red-500/10 text-white' : 'border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-red-500/30 hover:text-white/75')}>
                                    {side}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )
            })()}

            {/* ── Stair styling (per unique stair connection) ── */}
            {stairConnections.length > 0 && (
              <div className="border-t border-white/10 pt-8 space-y-6">
                <div><h3 className="font-sans text-xl font-semibold mb-1">Stair Styling</h3><p className="text-sm text-white/40">Each stair connection is styled individually.</p></div>
                {stairConnections.map(sc => {
                  const from = sc.fromId === 'ground' ? 'Ground' : levels.find(l => l.id === sc.fromId)?.name || '?'
                  const to = sc.toId === 'ground' ? 'Ground' : sc.toId === 'property' ? 'Property' : levels.find(l => l.id === sc.toId)?.name || '?'
                  const stairSymbol = sc.toId === 'property' ? '(P)' : sc.toId === 'ground' ? '(G)' : '(C)'
                  return (
                    <div key={sc.id} className="p-4 rounded-lg border border-white/10 bg-white/[0.03]">
                      <p className="text-sm font-semibold text-white/80 mb-3">{stairSymbol} {from} ↔ {to}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Style</p>
                          <div className="space-y-1.5">{STAIR_STYLES.map(ss => (<button key={ss.id} onClick={() => updateStairConnection(sc.id, 'style', ss.id)} className={cn('w-full p-2.5 rounded-lg border text-left text-xs transition-all', sc.style === ss.id ? 'border-white/30 bg-white/10 font-semibold text-white' : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/15')}>{ss.label}<span className="block text-[10px] text-white/30 mt-0.5">{ss.desc}</span></button>))}</div>
                        </div>
                        <div><p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Width</p>
                          <div className="space-y-1.5">{STAIR_WIDTHS.map(sw => (<button key={sw.id} onClick={() => updateStairConnection(sc.id, 'width', sw.id)} className={cn('w-full p-2.5 rounded-lg border text-left text-xs transition-all', sc.width === sw.id ? 'border-white/30 bg-white/10 font-semibold text-white' : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/15')}>{sw.label}</button>))}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-between"><Button variant="ghost" onClick={back}><ArrowLeft size={16} /> Back</Button><Button onClick={next}>Continue <ArrowRight size={16} /></Button></div>
          </div>
        )}

        {/* ═══ STEP 5: GENERATE ═══ */}
        {step === 4 && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div><h2 className="font-sans text-2xl md:text-3xl font-semibold mb-2">Generate & Review</h2><p className="text-white/40">Review your configuration and generate the 3D model.</p></div>
            <div className="p-5 rounded-lg border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div><p className="text-[11px] text-white/40 uppercase tracking-wider">Deck Size</p><p className="font-semibold text-white/80">{deckWM.toFixed(1)}m × {deckDM.toFixed(1)}m</p></div>
                <div><p className="text-[11px] text-white/40 uppercase tracking-wider">Mode</p><p className="font-semibold text-white/80 capitalize">{deckMode}-Level ({deckMode === 'multi' ? levels.length : 1})</p></div>
                <div><p className="text-[11px] text-white/40 uppercase tracking-wider">Stair Connections</p><p className="font-semibold text-white/80">{stairConnections.length}</p></div>
                <div><p className="text-[11px] text-white/40 uppercase tracking-wider">{deckMode === 'single' ? 'Zones' : 'Levels'}</p><p className="font-semibold text-white/80">{deckMode === 'single' ? zones.length : levels.length}</p></div>
              </div>
              {deckMode === 'multi' && (
                <div className="border-t border-white/10 mt-4 pt-4 space-y-2">
                  {levels.map(lvl => (
                    <div key={lvl.id} className="flex items-center gap-3 text-sm">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: lvl.color }} />
                      <span className="font-medium text-white/80">{lvl.name}</span>
                      <span className="text-white/40 text-xs">{lvl.elevation_ft}ft · {DECKING_MATERIALS.find(m => m.id === lvl.styling.decking)?.label} · {COLUMN_STYLES.find(c => c.id === lvl.styling.columns)?.label} · {lvl.styling.hasRoof ? (ROOF_STYLES.find(r => r.id === lvl.styling.roofStyle)?.label || 'Roofed') : 'Open Sky'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!result && <div className="text-center"><Button size="lg" loading={generating} onClick={handleGenerate}><Wrench size={18} /> Generate 3D Model</Button></div>}
            {generating && <div className="text-center py-16 rounded-lg border border-white/10 bg-white/[0.03]"><div className="space-y-4"><div className="w-20 h-20 rounded-full bg-red-500/10 mx-auto flex items-center justify-center"><Loader2 size={36} className="text-red-400 animate-spin" /></div><p className="font-sans text-xl text-white/80">Agents are designing your deck...</p></div></div>}
            {result && !generating && (<>
              <div className="p-5 rounded-lg border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between mb-4"><h3 className="font-sans text-xl font-semibold text-white/80">Generated Design</h3><span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-full border border-white/10">Iteration {result.iteration}</span></div>
                <p className="text-sm text-white/40 mb-4">{result.summary}</p>
                {result.screenshotUrls.length > 0 ? result.screenshotUrls.map((url, i) => <img key={i} src={url} alt={`Render ${i + 1}`} className="w-full rounded-lg border border-white/10 mb-4" />) : <div className="bg-white/[0.02] rounded-lg p-12 text-center border border-white/[0.06]"><Eye size={40} className="mx-auto text-white/20 mb-3" /><p className="text-sm text-white/40">Connect Revit to see 3D preview.</p></div>}
              </div>
              <div className="p-5 rounded-lg border border-white/10 bg-white/[0.03]"><h3 className="font-medium text-white/80 mb-3 flex items-center gap-2"><MessageSquare size={16} className="text-red-400" />Refine Your Design</h3><div className="flex gap-3"><input type="text" value={feedback} onChange={e => setFeedback(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRefine()} placeholder="e.g. Make the upper deck bigger..." className="flex-1 h-12 px-4 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition" /><Button onClick={handleRefine} loading={refining} disabled={!feedback.trim()}><Send size={16} /></Button></div></div>
            </>)}
            <div className="flex justify-between"><Button variant="ghost" onClick={back}><ArrowLeft size={16} /> Back</Button>{result && <Button variant="secondary" onClick={() => { setResult(null); setStep(0) }}>Start New Design</Button>}</div>
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  )
}

/* ─── Helper components ───────────────────────────────────────── */
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (<div><label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1.5">{label}</label><div className="relative"><select value={value} onChange={e => onChange(e.target.value)} className="w-full h-10 pl-3 pr-8 text-sm rounded-lg border border-white/10 bg-white/5 text-white/80 focus:border-red-400/50 appearance-none cursor-pointer">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" /></div></div>)
}
