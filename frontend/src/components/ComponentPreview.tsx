import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { memo, useMemo } from 'react'
import * as THREE from 'three'

/* ─── Material palette ────────────────────────────────────────── */
/* Each entry maps a catalog material id to a base colour and a
 * physical-material hint. `paint` overrides the base colour when the
 * user has picked a paint; natural timbers ignore it. */
const MATERIAL_PALETTE: Record<string, { color: string; roughness?: number; metalness?: number; paintable?: boolean }> = {
  // Timbers
  'spotted-gum':       { color: '#9B6B42', roughness: 0.75 },
  'merbau':            { color: '#6B3A2A', roughness: 0.75 },
  'blackbutt':         { color: '#C4A06A', roughness: 0.75 },
  'ipe':               { color: '#5C3A1E', roughness: 0.75 },
  'timber-natural':    { color: '#9B6B42', roughness: 0.75 },
  'timber-slat':       { color: '#9B6B42', roughness: 0.75 },
  'cedar-lined':       { color: '#A0704A', roughness: 0.75 },
  'timber-screen':     { color: '#8B6B3A', roughness: 0.75 },
  // Composites (paintable)
  'composite-charcoal':{ color: '#3A3A3A', roughness: 0.6, paintable: true },
  'composite-teak':    { color: '#A07850', roughness: 0.6, paintable: true },
  'composite-silver':  { color: '#8A8580', roughness: 0.6, paintable: true },
  'composite-panel':   { color: '#6A6A6A', roughness: 0.6, paintable: true },
  'painted-white':     { color: '#F5F5F0', roughness: 0.55, paintable: true },
  // Metals
  'steel-black':       { color: '#1A1A1A', roughness: 0.35, metalness: 0.85 },
  'steel-brushed':     { color: '#8A8A8A', roughness: 0.4,  metalness: 0.85 },
  'aluminium-white':   { color: '#E8E8E8', roughness: 0.45, metalness: 0.65, paintable: true },
  'corrugated-metal':  { color: '#8A8A8A', roughness: 0.45, metalness: 0.75, paintable: true },
  // Glass
  'glass-clear':       { color: '#F0F0F0', roughness: 0.05, metalness: 0.0 },
  // Stone / masonry
  'stone-veneer':      { color: '#9A9080', roughness: 0.9 },
  'rendered-concrete': { color: '#B0A898', roughness: 0.85, paintable: true },
  'brick':             { color: '#8B4A30', roughness: 0.85 },
  'cladding':          { color: '#5A5A5A', roughness: 0.7,  paintable: true },
  'green-wall':        { color: '#4A7A4A', roughness: 0.85 },
}

const FINISH_ROUGHNESS: Record<string, number> = {
  matte:    0.95,
  satin:    0.55,
  gloss:    0.12,
  textured: 0.85,
  raw:      0.75,
}

/* ─── Geometry presets per component kind ─────────────────────── */
/* Each "kind" returns a group of meshes that sits in a unit-ish box
 * centered near the origin so one camera works for every preview. */
type Kind =
  | 'column'
  | 'railing'
  | 'decking'
  | 'ceiling'
  | 'roof'
  | 'featureWall'
  | 'stair'

type MatProps = { color: string; roughness: number; metalness: number; transparent?: boolean; opacity?: number }

function useMatProps(material: string, finish: string, paint?: string): MatProps {
  return useMemo(() => {
    const m = MATERIAL_PALETTE[material] ?? { color: '#9B6B42', roughness: 0.7 }
    const color = paint ?? m.color
    const roughness = FINISH_ROUGHNESS[finish] ?? m.roughness ?? 0.6
    const metalness = m.metalness ?? 0
    const isGlass = material === 'glass-clear'
    return {
      color,
      roughness: isGlass ? 0.05 : roughness,
      metalness,
      transparent: isGlass,
      opacity: isGlass ? 0.35 : 1,
    }
  }, [material, finish, paint])
}

function Column({ shape, mat }: { shape: string; mat: MatProps }) {
  if (shape === 'round') {
    return (
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 24]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    )
  }
  if (shape === 'doric') {
    return (
      <group>
        {/* Shaft with slight taper */}
        <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.08, 0.1, 1.05, 20]} /><meshStandardMaterial {...mat} /></mesh>
        {/* Capital — abacus plate */}
        <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.28, 0.06, 0.28]} /><meshStandardMaterial {...mat} /></mesh>
        {/* Capital — echinus */}
        <mesh position={[0, 0.48, 0]}><cylinderGeometry args={[0.12, 0.08, 0.08, 16]} /><meshStandardMaterial {...mat} /></mesh>
        {/* Base torus */}
        <mesh position={[0, -0.58, 0]}><cylinderGeometry args={[0.12, 0.10, 0.06, 16]} /><meshStandardMaterial {...mat} /></mesh>
        {/* Base plinth */}
        <mesh position={[0, -0.65, 0]}><boxGeometry args={[0.26, 0.06, 0.26]} /><meshStandardMaterial {...mat} /></mesh>
      </group>
    )
  }
  if (shape === 'metal-clad') {
    return (
      <group>
        {/* Cylinder with cladding bands */}
        <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 1.3, 20]} /><meshStandardMaterial {...mat} /></mesh>
        {/* Top cap */}
        <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.11, 0.11, 0.04, 20]} /><meshStandardMaterial {...mat} /></mesh>
        {/* Bottom flange */}
        <mesh position={[0, -0.68, 0]}><cylinderGeometry args={[0.12, 0.12, 0.04, 20]} /><meshStandardMaterial {...mat} /></mesh>
      </group>
    )
  }
  if (shape === 'chamfered') {
    const geo = useMemo(() => {
      const s = 0.08
      const c = 0.02
      const pts = [
        new THREE.Vector2(-s + c, -s),
        new THREE.Vector2(s - c, -s),
        new THREE.Vector2(s, -s + c),
        new THREE.Vector2(s, s - c),
        new THREE.Vector2(s - c, s),
        new THREE.Vector2(-s + c, s),
        new THREE.Vector2(-s, s - c),
        new THREE.Vector2(-s, -s + c),
      ]
      const shape2d = new THREE.Shape(pts)
      return new THREE.ExtrudeGeometry(shape2d, { depth: 1.4, bevelEnabled: false })
    }, [])
    return (
      <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.7, 0]} castShadow>
        <meshStandardMaterial {...mat} />
      </mesh>
    )
  }
  if (shape === 'wood-timber') {
    return (
      <group>
        <mesh castShadow position={[0, 0, 0]}><boxGeometry args={[0.15, 1.4, 0.15]} /><meshStandardMaterial {...mat} /></mesh>
      </group>
    )
  }
  // rectangular (default)
  return (
    <group>
      <mesh castShadow position={[0, 0, 0]}><boxGeometry args={[0.16, 1.4, 0.12]} /><meshStandardMaterial {...mat} /></mesh>
    </group>
  )
}

function Railing({ shape, mat }: { shape: string; mat: MatProps }) {
  // Top + bottom rails with infill appropriate to the style
  const rail = (y: number) => (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[1.5, 0.04, 0.04]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  )
  const balusters = Array.from({ length: 7 }, (_, i) => 0.9 * (i / 6 - 0.5))
  return (
    <group position={[0, -0.1, 0]}>
      {rail(0.5)}
      {rail(-0.35)}
      {shape === 'timber' && balusters.map((x, i) => (
        <mesh key={i} position={[x * 1.2, 0.08, 0]}><boxGeometry args={[0.05, 0.86, 0.05]} /><meshStandardMaterial {...mat} /></mesh>
      ))}
      {shape === 'pipe' && balusters.map((x, i) => (
        <mesh key={i} position={[x * 1.2, 0.08, 0]}><cylinderGeometry args={[0.018, 0.018, 0.86, 12]} /><meshStandardMaterial {...mat} /></mesh>
      ))}
      {shape === 'wire' && Array.from({ length: 4 }, (_, i) => (
        <group key={i} rotation={[0, 0, Math.PI / 2]}>
          <mesh position={[0, -0.3 + i * 0.22, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 1.48, 6]} />
            <meshStandardMaterial color="#B8B8B8" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {shape === 'glass' && (
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.45, 0.82, 0.02]} />
          <meshStandardMaterial color="#F0F0F0" roughness={0.05} metalness={0} transparent opacity={0.35} />
        </mesh>
      )}
      {shape === 'none' && null}
    </group>
  )
}

function Decking({ shape, mat }: { shape: string; mat: MatProps }) {
  const planks = Array.from({ length: 6 }, (_, i) => -0.55 + i * 0.22)
  if (shape === 'picture-frame') {
    return (
      <group rotation={[-Math.PI / 2.6, 0, 0]} position={[0, -0.1, 0]}>
        <mesh>
          <boxGeometry args={[1.55, 0.05, 1.1]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[1.22, 0.05, 0.78]} />
          <meshStandardMaterial color="#060606" roughness={0.95} metalness={0} />
        </mesh>
        {Array.from({ length: 4 }, (_, i) => -0.33 + i * 0.22).map((z, i) => (
          <mesh key={i} position={[0, 0.035, z]}>
            <boxGeometry args={[1.14, 0.04, 0.14]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        ))}
      </group>
    )
  }
  if (shape === 'diagonal') {
    return (
      <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -0.1, 0]}>
        {Array.from({ length: 7 }, (_, i) => -0.72 + i * 0.24).map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 5]}>
            <boxGeometry args={[0.16, 0.05, 1.55]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        ))}
      </group>
    )
  }
  return (
    <group rotation={[-Math.PI / 2.6, 0, 0]} position={[0, -0.1, 0]}>
      {planks.map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <boxGeometry args={[1.5, 0.06, 0.2]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  )
}

function Ceiling({ shape, mat }: { shape: string; mat: MatProps }) {
  if (shape === 'panelled') {
    return (
      <group position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.42, 0.04, 1.18]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        {[-0.46, 0, 0.46].map((x, i) => (
          <mesh key={i} position={[x, -0.02, 0]}>
            <boxGeometry args={[0.03, 0.02, 1.12]} />
            <meshStandardMaterial color="#101010" roughness={0.85} metalness={0.2} />
          </mesh>
        ))}
        {[-0.36, 0.36].map((z, i) => (
          <mesh key={`z-${i}`} position={[0, -0.02, z]}>
            <boxGeometry args={[1.32, 0.02, 0.03]} />
            <meshStandardMaterial color="#101010" roughness={0.85} metalness={0.2} />
          </mesh>
        ))}
      </group>
    )
  }
  if (shape === 'corrugated') {
    return (
      <group position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        {Array.from({ length: 8 }, (_, i) => -0.6 + i * 0.17).map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[0.1, 0.09, 1.25]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        ))}
      </group>
    )
  }
  if (shape === 'lined') {
    return (
      <group position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.4, 0.03, 1.2]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => -0.48 + i * 0.24).map((x, i) => (
          <mesh key={i} position={[x, -0.03, 0]}>
            <boxGeometry args={[0.04, 0.03, 1.18]} />
            <meshStandardMaterial color="#111111" roughness={0.9} metalness={0.1} />
          </mesh>
        ))}
      </group>
    )
  }
  const slats = Array.from({ length: 8 }, (_, i) => -0.6 + i * 0.17)
  return (
    <group position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
      {slats.map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.12, 0.05, 1.3]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  )
}

function Roof({ shape, mat }: { shape: string; mat: MatProps }) {
  if (shape === 'none') {
    return <mesh position={[0, 0, 0]}><boxGeometry args={[1.4, 0.02, 1]} /><meshStandardMaterial color="#3a3a3a" transparent opacity={0.25} /></mesh>
  }
  if (shape === 'gable') {
    return (
      <group position={[0, -0.05, 0]}>
        <mesh rotation={[0, 0, Math.PI / 5]} position={[-0.35, 0.25, 0]}><boxGeometry args={[1, 0.04, 1]} /><meshStandardMaterial {...mat} /></mesh>
        <mesh rotation={[0, 0, -Math.PI / 5]} position={[0.35, 0.25, 0]}><boxGeometry args={[1, 0.04, 1]} /><meshStandardMaterial {...mat} /></mesh>
      </group>
    )
  }
  if (shape === 'slanted') {
    return <mesh rotation={[0, 0, Math.PI / 10]} position={[0, 0.15, 0]}><boxGeometry args={[1.5, 0.04, 1]} /><meshStandardMaterial {...mat} /></mesh>
  }
  if (shape === 'pergola-louvre') {
    const louvres = Array.from({ length: 7 }, (_, i) => -0.6 + i * 0.2)
    return (
      <group position={[0, 0.15, 0]}>
        {louvres.map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.12, 0.03, 1.1]} /><meshStandardMaterial {...mat} /></mesh>
        ))}
      </group>
    )
  }
  // pergola-flat
  const beams = Array.from({ length: 6 }, (_, i) => -0.55 + i * 0.22)
  return (
    <group position={[0, 0.18, 0]}>
      {beams.map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}><boxGeometry args={[0.06, 0.06, 1.1]} /><meshStandardMaterial {...mat} /></mesh>
      ))}
      <mesh position={[0, -0.04, 0]}><boxGeometry args={[1.4, 0.04, 0.06]} /><meshStandardMaterial {...mat} /></mesh>
    </group>
  )
}

function FeatureWall({ shape, mat }: { shape: string; mat: MatProps }) {
  if (shape === 'masonry') {
    return (
      <group position={[0, 0, 0]}>
        {Array.from({ length: 4 }, (_, row) => row).flatMap((row) =>
          Array.from({ length: 3 }, (_, col) => (
            <mesh key={`${row}-${col}`} position={[-0.42 + col * 0.42 + (row % 2 ? 0.08 : 0), 0.4 - row * 0.28, 0]}>
              <boxGeometry args={[0.34, 0.22, 0.08]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          )),
        )}
      </group>
    )
  }
  if (shape === 'screen') {
    return (
      <group position={[0, 0, 0]}>
        {Array.from({ length: 7 }, (_, i) => -0.48 + i * 0.16).map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[0.08, 1.1, 0.08]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        ))}
      </group>
    )
  }
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1.3, 1.1, 0.08]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  )
}

function Stair({ mat }: { mat: MatProps }) {
  const steps = Array.from({ length: 4 }, (_, i) => i)
  return (
    <group position={[-0.3, -0.4, 0]}>
      {steps.map(i => (
        <mesh key={i} position={[i * 0.18, i * 0.18, 0]}>
          <boxGeometry args={[0.22, 0.08, 0.9]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Per-kind camera configs ─────────────────────────────────── */
const KIND_CAMERA: Record<Kind, { pos: [number, number, number]; fov: number; rotation: [number, number, number] }> = {
  column:      { pos: [1.4, 0.6, 1.4],   fov: 34, rotation: [0, -0.4, 0] },
  railing:     { pos: [0.0, 0.3, 2.2],    fov: 30, rotation: [0, 0, 0] },
  decking:     { pos: [0.6, 1.8, 1.0],    fov: 32, rotation: [0, -0.3, 0] },
  ceiling:     { pos: [0.0, -1.2, 1.8],   fov: 32, rotation: [0, 0, 0] },
  roof:        { pos: [1.4, 1.0, 1.6],    fov: 34, rotation: [0, -0.35, 0] },
  featureWall: { pos: [0.0, 0.2, 2.0],    fov: 32, rotation: [0, 0, 0] },
  stair:       { pos: [1.2, 0.8, 1.5],    fov: 34, rotation: [0, -0.4, 0] },
}

/* ─── Public preview component ────────────────────────────────── */
export interface ComponentPreviewProps {
  kind: Kind
  shape: string            // column style / railing style / roof style id
  material: string         // catalog material id
  finish?: string          // matte | satin | gloss | textured | raw
  paint?: string           // hex — applied only if material.paintable
  size?: number            // px — defaults to 120
  className?: string
}

/** Inline 3D thumbnail for a catalog option. A single <Canvas> per
 *  card — cheap because each scene has 1-8 small meshes and shares the
 *  same Environment preset. */
function ComponentPreviewImpl({ kind, shape, material, finish = 'satin', paint, size = 120, className }: ComponentPreviewProps) {
  const mat = useMatProps(material, finish, paint)
  const cam = KIND_CAMERA[kind]

  const scene = (() => {
    switch (kind) {
      case 'column':      return <Column shape={shape} mat={mat} />
      case 'railing':     return <Railing shape={shape} mat={mat} />
      case 'decking':     return <Decking shape={shape} mat={mat} />
      case 'ceiling':     return <Ceiling shape={shape} mat={mat} />
      case 'roof':        return <Roof shape={shape} mat={mat} />
      case 'featureWall': return <FeatureWall shape={shape} mat={mat} />
      case 'stair':       return <Stair mat={mat} />
    }
  })()

  return (
    <div className={className} style={{ width: size, height: size, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: cam.pos, fov: cam.fov }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
        onCreated={({ scene }) => { scene.background = null }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 4, 2]} intensity={1.0} />
        <directionalLight position={[-2, 1, -3]} intensity={0.25} color="#DC3545" />
        <directionalLight position={[0, -2, 1]} intensity={0.15} />
        <Environment preset="night" />
        <OrbitControls enabled={false} target={[0, 0, 0]} />
        <group rotation={cam.rotation}>{scene}</group>
      </Canvas>
    </div>
  )
}

export const ComponentPreview = memo(ComponentPreviewImpl)
export default ComponentPreview
