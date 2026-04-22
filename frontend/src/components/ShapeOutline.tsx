/**
 * ShapeOutline — inline SVG silhouettes of real Revit family profiles.
 * White stroke on transparent bg; renders inside a fixed-size container.
 * Each drawing is a simplified cross-section / elevation of the actual
 * family geometry (columns, railings, decking patterns, roof, ceiling, feature wall).
 */

import { memo } from 'react'

type Kind = 'column' | 'railing' | 'decking' | 'roof' | 'ceiling' | 'featureWall'

interface ShapeOutlineProps {
  kind: Kind
  shape: string
  size?: number
  className?: string
}

/* ─── Column profiles (matched to Revit family thumbnails) ───── */
function ColumnSVG({ shape }: { shape: string }) {
  switch (shape) {
    case 'chamfered':
      return (
        <g>
          {/* Chamfered Column — square post with 45° bevelled edges visible in 3/4 view */}
          {/* Main face */}
          <path d="M34 6 L34 92 L62 92 L62 6 Z" />
          {/* Visible side face (3/4 perspective) */}
          <path d="M62 6 L72 12 L72 86 L62 92" />
          {/* Top face */}
          <path d="M34 6 L44 12 L72 12 L62 6 Z" />
          {/* Chamfer on front-left edge */}
          <line x1="34" y1="6" x2="38" y2="10" />
          <line x1="34" y1="92" x2="38" y2="88" />
          <line x1="38" y1="10" x2="38" y2="88" strokeWidth="0.8" strokeDasharray="1 2" />
        </g>
      )
    case 'doric':
      return (
        <g>
          {/* Doric Column — classical with capital, fluted shaft, and base */}
          {/* Capital top plate */}
          <rect x="28" y="4" width="44" height="3" />
          {/* Abacus */}
          <path d="M31 7 L31 11 Q50 14 69 11 L69 7 Z" />
          {/* Echinus (curved transition) */}
          <path d="M34 11 Q50 16 66 11" fill="none" />
          {/* Necking band */}
          <rect x="36" y="14" width="28" height="2" />
          {/* Shaft with entasis — slight taper */}
          <path d="M38 16 L39 80 L61 80 L62 16 Z" />
          {/* Fluting lines on shaft */}
          <line x1="42" y1="17" x2="42.5" y2="79" strokeWidth="0.5" opacity="0.5" />
          <line x1="46" y1="17" x2="46.5" y2="79" strokeWidth="0.5" opacity="0.5" />
          <line x1="50" y1="17" x2="50" y2="79" strokeWidth="0.5" opacity="0.5" />
          <line x1="54" y1="17" x2="53.5" y2="79" strokeWidth="0.5" opacity="0.5" />
          <line x1="58" y1="17" x2="57.5" y2="79" strokeWidth="0.5" opacity="0.5" />
          {/* Base torus */}
          <path d="M36 80 Q36 84 34 84 L66 84 Q64 84 64 80" fill="none" />
          {/* Base plinth */}
          <rect x="32" y="84" width="36" height="3" />
          {/* Bottom plate */}
          <rect x="29" y="87" width="42" height="3" />
          {/* Decorative rings */}
          <line x1="36" y1="26" x2="64" y2="26" strokeWidth="0.6" />
          <line x1="36" y1="28" x2="64" y2="28" strokeWidth="0.6" />
        </g>
      )
    case 'metal-clad':
      return (
        <g>
          {/* Metal Clad Column — cylindrical with visible horizontal cladding bands */}
          {/* Main cylinder body */}
          <rect x="38" y="10" width="24" height="78" rx="12" />
          {/* Top cap */}
          <ellipse cx="50" cy="10" rx="14" ry="3" />
          {/* Bottom flange */}
          <ellipse cx="50" cy="88" rx="16" ry="3.5" />
          {/* Horizontal cladding joints */}
          <path d="M38 26 Q50 29 62 26" fill="none" strokeWidth="0.8" />
          <path d="M38 42 Q50 45 62 42" fill="none" strokeWidth="0.8" />
          <path d="M38 58 Q50 61 62 58" fill="none" strokeWidth="0.8" />
          <path d="M38 74 Q50 77 62 74" fill="none" strokeWidth="0.8" />
          {/* Vertical seam line */}
          <line x1="50" y1="13" x2="50" y2="85" strokeWidth="0.4" opacity="0.35" />
        </g>
      )
    case 'rectangular':
      return (
        <g>
          {/* Rectangular Column — clean minimal post, slight 3/4 perspective */}
          {/* Front face */}
          <rect x="36" y="8" width="22" height="84" />
          {/* Side face */}
          <path d="M58 8 L68 14 L68 86 L58 92" />
          {/* Top face */}
          <path d="M36 8 L46 14 L68 14 L58 8 Z" fill="none" />
        </g>
      )
    case 'round':
      return (
        <g>
          {/* Round Column — simple clean cylinder, architectural elevation */}
          {/* Shaft */}
          <line x1="38" y1="12" x2="38" y2="86" />
          <line x1="62" y1="12" x2="62" y2="86" />
          {/* Top ellipse */}
          <ellipse cx="50" cy="10" rx="12" ry="4" />
          {/* Bottom ellipse */}
          <ellipse cx="50" cy="88" rx="12" ry="4" />
          {/* Subtle center highlight */}
          <line x1="50" y1="14" x2="50" y2="84" strokeWidth="0.4" opacity="0.2" />
        </g>
      )
    case 'wood-timber':
      return (
        <g>
          {/* Wood Timber Column — square timber post with subtle grain indication */}
          {/* Front face */}
          <rect x="37" y="6" width="20" height="88" />
          {/* Side face (3/4 view) */}
          <path d="M57 6 L66 11 L66 88 L57 94" />
          {/* Top */}
          <path d="M37 6 L46 11 L66 11 L57 6 Z" fill="none" />
          {/* Grain lines on front face */}
          <line x1="41" y1="8" x2="41" y2="92" strokeWidth="0.3" opacity="0.35" />
          <line x1="45" y1="8" x2="45" y2="92" strokeWidth="0.3" opacity="0.25" />
          <line x1="50" y1="8" x2="50" y2="92" strokeWidth="0.3" opacity="0.3" />
          <line x1="54" y1="8" x2="54" y2="92" strokeWidth="0.3" opacity="0.2" />
        </g>
      )
    default:
      return (
        <g>
          <rect x="36" y="8" width="22" height="84" />
          <path d="M58 8 L68 14 L68 86 L58 92" />
          <path d="M36 8 L46 14 L68 14 L58 8 Z" fill="none" />
        </g>
      )
  }
}

/* ─── Railing profiles ─────────────────────────────────────────── */
function RailingSVG({ shape }: { shape: string }) {
  switch (shape) {
    case 'pipe':
      return (
        <g>
          {/* Pipe guardrail — horizontal pipes with posts */}
          <rect x="8" y="10" width="6" height="78" rx="3" />
          <rect x="86" y="10" width="6" height="78" rx="3" />
          <line x1="14" y1="16" x2="86" y2="16" strokeWidth="3" />
          <line x1="14" y1="36" x2="86" y2="36" strokeWidth="2" />
          <line x1="14" y1="56" x2="86" y2="56" strokeWidth="2" />
          <line x1="14" y1="76" x2="86" y2="76" strokeWidth="2" />
        </g>
      )
    case 'glass':
      return (
        <g>
          {/* Glass panel — frameless balustrade */}
          <rect x="8" y="10" width="4" height="78" rx="1" />
          <rect x="88" y="10" width="4" height="78" rx="1" />
          {/* Glass panel (dashed to imply transparency) */}
          <rect x="14" y="18" width="72" height="62" rx="2" strokeDasharray="4 2" />
          {/* Top rail */}
          <line x1="8" y1="14" x2="92" y2="14" strokeWidth="3" />
        </g>
      )
    case 'wire':
      return (
        <g>
          {/* Wire tension — posts with horizontal cables */}
          <rect x="8" y="10" width="5" height="78" rx="1" />
          <rect x="87" y="10" width="5" height="78" rx="1" />
          <rect x="46" y="10" width="5" height="78" rx="1" />
          <line x1="13" y1="14" x2="87" y2="14" strokeWidth="3" />
          {/* Wire cables */}
          {[26, 34, 42, 50, 58, 66, 74, 82].map(y => (
            <line key={y} x1="13" y1={y} x2="87" y2={y} strokeWidth="0.8" strokeDasharray="2 1" />
          ))}
        </g>
      )
    case 'timber':
      return (
        <g>
          {/* Timber balusters — classic vertical pickets */}
          <rect x="8" y="10" width="6" height="78" rx="1" />
          <rect x="86" y="10" width="6" height="78" rx="1" />
          <line x1="8" y1="14" x2="92" y2="14" strokeWidth="3" />
          <line x1="8" y1="80" x2="92" y2="80" strokeWidth="2" />
          {/* Balusters */}
          {[22, 32, 42, 52, 62, 72].map(x => (
            <rect key={x} x={x} y="16" width="4" height="62" rx="1" />
          ))}
        </g>
      )
    case 'none':
      return (
        <g>
          {/* No railing — just a subtle floor line */}
          <line x1="10" y1="84" x2="90" y2="84" strokeWidth="2" strokeDasharray="6 4" />
          <text x="50" y="50" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.3">NONE</text>
        </g>
      )
    default:
      return <rect x="10" y="10" width="80" height="78" rx="4" />
  }
}

/* ─── Decking patterns (plan view) ─────────────────────────────── */
function DeckingSVG({ shape }: { shape: string }) {
  switch (shape) {
    case 'linear':
      return (
        <g>
          {[12, 24, 36, 48, 60, 72, 84].map(x => (
            <rect key={x} x={x} y="8" width="8" height="82" rx="1" />
          ))}
        </g>
      )
    case 'picture-frame':
      return (
        <g>
          {/* Border */}
          <rect x="8" y="8" width="84" height="82" rx="2" fill="none" />
          <rect x="12" y="12" width="76" height="74" rx="1" fill="none" />
          {/* Inner field boards */}
          {[22, 34, 46, 58, 70].map(x => (
            <rect key={x} x={x} y="16" width="6" height="66" rx="1" />
          ))}
        </g>
      )
    case 'diagonal':
      return (
        <g>
          {/* Diagonal boards */}
          <clipPath id="deck-clip"><rect x="8" y="8" width="84" height="82" /></clipPath>
          <g clipPath="url(#deck-clip)">
            {[-40, -28, -16, -4, 8, 20, 32, 44, 56, 68, 80].map(offset => (
              <line key={offset} x1={offset} y1="95" x2={offset + 95} y2="0" strokeWidth="6" />
            ))}
          </g>
        </g>
      )
    default:
      return <rect x="10" y="10" width="80" height="78" rx="2" />
  }
}

/* ─── Roof profiles (elevation) ────────────────────────────────── */
function RoofSVG({ shape }: { shape: string }) {
  switch (shape) {
    case 'none':
      return (
        <g>
          <line x1="10" y1="50" x2="90" y2="50" strokeWidth="1" strokeDasharray="6 4" />
          <text x="50" y="46" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.3">OPEN SKY</text>
        </g>
      )
    case 'pergola-flat':
      return (
        <g>
          {/* Posts */}
          <rect x="12" y="30" width="4" height="56" rx="1" />
          <rect x="84" y="30" width="4" height="56" rx="1" />
          {/* Flat beams */}
          <rect x="10" y="26" width="80" height="4" rx="1" />
          {/* Cross battens */}
          {[24, 38, 52, 66, 80].map(x => (
            <rect key={x} x={x} y="14" width="3" height="12" rx="1" />
          ))}
          <rect x="10" y="12" width="80" height="3" rx="1" />
        </g>
      )
    case 'pergola-louvre':
      return (
        <g>
          {/* Posts */}
          <rect x="12" y="34" width="4" height="52" rx="1" />
          <rect x="84" y="34" width="4" height="52" rx="1" />
          <rect x="10" y="30" width="80" height="4" rx="1" />
          {/* Angled louvre blades */}
          {[20, 32, 44, 56, 68, 80].map(x => (
            <line key={x} x1={x} y1="14" x2={x + 8} y2="28" strokeWidth="2" />
          ))}
        </g>
      )
    case 'gable':
      return (
        <g>
          {/* Posts */}
          <rect x="12" y="40" width="4" height="46" rx="1" />
          <rect x="84" y="40" width="4" height="46" rx="1" />
          {/* Gable roof */}
          <path d="M10 40 L50 10 L90 40 Z" fill="none" />
          <line x1="10" y1="40" x2="90" y2="40" strokeWidth="2" />
        </g>
      )
    case 'skillion':
      return (
        <g>
          {/* Posts - different heights */}
          <rect x="12" y="26" width="4" height="60" rx="1" />
          <rect x="84" y="42" width="4" height="44" rx="1" />
          {/* Sloped roof */}
          <line x1="10" y1="24" x2="90" y2="40" strokeWidth="3" />
        </g>
      )
    default:
      return <rect x="10" y="10" width="80" height="78" rx="2" />
  }
}

/* ─── Ceiling profiles ─────────────────────────────────────────── */
function CeilingSVG({ shape }: { shape: string }) {
  switch (shape) {
    case 'slatted':
      return (
        <g>
          {/* Horizontal slats with gaps */}
          {[10, 22, 34, 46, 58, 70, 82].map(y => (
            <rect key={y} x="10" y={y} width="80" height="8" rx="1" />
          ))}
        </g>
      )
    case 'lined':
      return (
        <g>
          {/* Tongue-and-groove lining — tight lines */}
          {[10, 20, 30, 40, 50, 60, 70, 80].map(y => (
            <g key={y}>
              <rect x="10" y={y} width="80" height="9" rx="0" />
              <line x1="10" y1={y} x2="90" y2={y} strokeWidth="0.5" />
            </g>
          ))}
        </g>
      )
    case 'panelled':
      return (
        <g>
          {/* Grid panels */}
          {[10, 38, 66].map(y =>
            [10, 38, 66].map(x => (
              <rect key={`${x}-${y}`} x={x} y={y} width="24" height="24" rx="2" />
            ))
          )}
        </g>
      )
    case 'corrugated':
      return (
        <g>
          {/* Corrugated wave */}
          <path d="M10 20 Q18 10, 26 20 Q34 30, 42 20 Q50 10, 58 20 Q66 30, 74 20 Q82 10, 90 20" fill="none" strokeWidth="2" />
          <path d="M10 40 Q18 30, 26 40 Q34 50, 42 40 Q50 30, 58 40 Q66 50, 74 40 Q82 30, 90 40" fill="none" strokeWidth="2" />
          <path d="M10 60 Q18 50, 26 60 Q34 70, 42 60 Q50 50, 58 60 Q66 70, 74 60 Q82 50, 90 60" fill="none" strokeWidth="2" />
          <path d="M10 80 Q18 70, 26 80 Q34 90, 42 80 Q50 70, 58 80 Q66 90, 74 80 Q82 70, 90 80" fill="none" strokeWidth="2" />
        </g>
      )
    default:
      return <rect x="10" y="10" width="80" height="78" rx="2" />
  }
}

/* ─── Feature wall profiles ────────────────────────────────────── */
function FeatureWallSVG({ shape }: { shape: string }) {
  switch (shape) {
    case 'screen':
      return (
        <g>
          {/* Vertical battens with spacing */}
          {[14, 26, 38, 50, 62, 74, 86].map(x => (
            <rect key={x} x={x} y="8" width="5" height="82" rx="1" />
          ))}
        </g>
      )
    case 'solid':
      return (
        <g>
          {/* Solid wall */}
          <rect x="10" y="8" width="80" height="82" rx="2" />
          {/* Subtle horizontal joint lines */}
          <line x1="10" y1="35" x2="90" y2="35" strokeWidth="0.5" />
          <line x1="10" y1="62" x2="90" y2="62" strokeWidth="0.5" />
        </g>
      )
    case 'masonry':
      return (
        <g>
          {/* Brick/masonry pattern */}
          {[8, 22, 36, 50, 64, 78].map((y, row) => (
            <g key={y}>
              {(row % 2 === 0
                ? [10, 32, 54, 76]
                : [20, 42, 64]
              ).map(x => (
                <rect key={`${x}-${y}`} x={x} y={y} width="18" height="10" rx="1" />
              ))}
            </g>
          ))}
        </g>
      )
    default:
      return <rect x="10" y="10" width="80" height="78" rx="2" />
  }
}

/* ─── Main component ───────────────────────────────────────────── */
function ShapeOutlineImpl({ kind, shape, size = 100, className }: ShapeOutlineProps) {
  const inner = (() => {
    switch (kind) {
      case 'column':      return <ColumnSVG shape={shape} />
      case 'railing':     return <RailingSVG shape={shape} />
      case 'decking':     return <DeckingSVG shape={shape} />
      case 'roof':        return <RoofSVG shape={shape} />
      case 'ceiling':     return <CeilingSVG shape={shape} />
      case 'featureWall': return <FeatureWallSVG shape={shape} />
    }
  })()

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: '#ffffff' }}
    >
      {inner}
    </svg>
  )
}

export const ShapeOutline = memo(ShapeOutlineImpl)
export default ShapeOutline
