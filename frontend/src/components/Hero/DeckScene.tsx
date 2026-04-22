/**
 * DeckScene — scroll-driven Three.js deck assembly
 *
 * Accepts either:
 *   progress    (React prop) — for React state-driven updates
 *   liveTarget  ({ value: number }) — for GSAP-driven updates with zero re-renders
 *
 * Components are INVISIBLE (mesh.visible = false) until their threshold is reached,
 * so the initial state is a clean empty black canvas.
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

// ── Timber palette — warm, rich, slightly saturated ─────────────────────
const BOARD_COLOURS = ['#C8943A', '#D8A848', '#B87830', '#D09848', '#A87030']
const JOIST_COLOUR  = '#7A5028'
const POST_COLOUR   = '#6A4020'
const RAIL_COLOUR   = '#9A6840'
const PERGOLA_COL   = '#8A6030'
const LOUVER_COL    = '#9A7040'

// ── Easing ─────────────────────────────────────────────────────────────
function easeOutExpo(t: number) {
  const s = Math.max(0, Math.min(1, t))
  return s === 1 ? 1 : 1 - Math.pow(2, -10 * s)
}
function easeOutBack(t: number) {
  const c1 = 1.4, c3 = c1 + 1
  const s = Math.max(0, Math.min(1, t))
  return 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2)
}

// ── Animated mesh — INVISIBLE until threshold reached ───────────────────
interface BoxProps {
  position: [number, number, number]
  args: [number, number, number]
  color: string
  threshold: number
  spread?: number
  axis?: 'y' | 'x' | 'y-drop'
  roughness?: number
  metalness?: number
  progRef: React.MutableRefObject<number>
}

function AnimatedBox({
  position, args, color,
  threshold, spread = 0.06,
  axis = 'y', roughness = 0.78, metalness = 0.04,
  progRef,
}: BoxProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const raw = Math.max(0, Math.min(1, (progRef.current - threshold) / spread))

    // Hide completely until animation starts — no floating squares
    if (raw <= 0) { mesh.visible = false; return }
    mesh.visible = true

    const exp  = easeOutExpo(raw)
    const back = easeOutBack(raw)

    if (axis === 'y') {
      mesh.scale.y    = Math.max(0.001, exp)
      mesh.position.y = position[1] - (args[1] / 2) * (1 - exp)
    } else if (axis === 'x') {
      mesh.scale.x    = Math.max(0.001, back)
      mesh.position.x = position[0]
    } else if (axis === 'y-drop') {
      mesh.scale.y    = Math.max(0.001, exp)
      mesh.position.y = position[1] + 2.2 * (1 - exp)
    }
  })

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow visible={false}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

// ── Grain line on board ─────────────────────────────────────────────────
function GrainLine({ x, z, threshold, progRef }: {
  x: number; z: number; threshold: number
  progRef: React.MutableRefObject<number>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const raw = Math.max(0, Math.min(1, (progRef.current - threshold) / 0.04))
    if (raw <= 0) { mesh.visible = false; return }
    mesh.visible = true
    const p = easeOutExpo(raw)
    mesh.scale.z    = Math.max(0.001, p)
    mesh.scale.y    = Math.max(0.001, p)
    mesh.position.y = 0.097 - (0.018 / 2) * (1 - p)
  })
  return (
    <mesh ref={meshRef} position={[x, 0.097, z]} visible={false}>
      <boxGeometry args={[0.004, 0.018, 2.52]} />
      <meshStandardMaterial color="#7A4E20" roughness={0.9} metalness={0} />
    </mesh>
  )
}

// ── Deck constants ──────────────────────────────────────────────────────
const JOIST_COUNT  = 7
const JOIST_GAP    = 0.38
const BOARD_COUNT  = 20
const BOARD_W      = 0.088
const BOARD_GAP    = 0.009
const BOARD_STEP   = BOARD_W + BOARD_GAP
const BOARD_L      = 2.52

// Assembly thresholds — tuned so each phase is clearly distinct
const J_S  = 0.08;  const J_E  = 0.26   // joists
const B_S  = 0.28;  const B_E  = 0.58   // boards
const P_S  = 0.60;  const P_E  = 0.72   // deck posts
const R_S  = 0.73                        // railing rails
const PG_S = 0.82;  const PG_E = 0.92   // pergola posts
const LV_S = 0.88;  const LV_E = 0.97   // louvers

// ── Full deck group ─────────────────────────────────────────────────────
interface DeckMeshProps {
  progRef: React.MutableRefObject<number>
  targetProgress?: number
  liveTarget?: { value: number }
}

function DeckMesh({ progRef, targetProgress = 0, liveTarget }: DeckMeshProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const target = liveTarget ? liveTarget.value : targetProgress
    progRef.current += (target - progRef.current) * 0.07

    if (groupRef.current) {
      // Rotate 0→120° over full assembly; stays at 120° when complete
      const targetRot = Math.min(progRef.current, 1) * Math.PI * 0.67
      groupRef.current.rotation.y += (targetRot - groupRef.current.rotation.y) * 0.05
    }
  })

  const joists = useMemo(() =>
    Array.from({ length: JOIST_COUNT }, (_, i) => ({
      z: (i - (JOIST_COUNT - 1) / 2) * JOIST_GAP,
      threshold: J_S + (i / (JOIST_COUNT - 1)) * (J_E - J_S),
    })), [])

  const boards = useMemo(() =>
    Array.from({ length: BOARD_COUNT }, (_, i) => ({
      x: (i - (BOARD_COUNT - 1) / 2) * BOARD_STEP,
      threshold: B_S + (i / (BOARD_COUNT - 1)) * (B_E - B_S),
      color: BOARD_COLOURS[i % BOARD_COLOURS.length],
    })), [])

  const posts = useMemo(() => {
    const xs = [
      -(BOARD_COUNT / 2) * BOARD_STEP + BOARD_W / 2,
       (BOARD_COUNT / 2) * BOARD_STEP - BOARD_W / 2,
    ]
    const zs = [-(JOIST_COUNT / 2) * JOIST_GAP, (JOIST_COUNT / 2) * JOIST_GAP]
    return xs.flatMap((x, xi) => zs.map((z, zi) => ({
      x, z, threshold: P_S + (xi * 2 + zi) * 0.03,
    })))
  }, [])

  const railZ = [-(JOIST_COUNT / 2) * JOIST_GAP, (JOIST_COUNT / 2) * JOIST_GAP]

  const louvers = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => ({
      z: (i - 3) * JOIST_GAP * 0.8,
      threshold: LV_S + (i / 6) * (LV_E - LV_S),
    })), [])

  return (
    <group ref={groupRef}>
      {/* Subtle ground plane — grounds the scene */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#0a0806" roughness={0.98} metalness={0} />
      </mesh>

      {/* Joists */}
      {joists.map((j, i) => (
        <AnimatedBox key={`j${i}`}
          position={[0, 0, j.z]}
          args={[BOARD_COUNT * BOARD_STEP + 0.06, 0.14, 0.044]}
          color={JOIST_COLOUR} threshold={j.threshold} spread={0.05}
          roughness={0.88} progRef={progRef}
        />
      ))}

      {/* Boards */}
      {boards.map((b, i) => (
        <AnimatedBox key={`b${i}`}
          position={[b.x, 0.096, 0]}
          args={[BOARD_W, 0.020, BOARD_L]}
          color={b.color} threshold={b.threshold} spread={0.04}
          roughness={0.75} metalness={0.01} progRef={progRef}
        />
      ))}

      {/* Grain (every 3rd board) */}
      {boards.filter((_, i) => i % 3 === 1).map((b, i) => (
        <GrainLine key={`g${i}`}
          x={b.x + 0.019} z={0}
          threshold={b.threshold + 0.02} progRef={progRef}
        />
      ))}

      {/* Deck posts */}
      {posts.map((p, i) => (
        <AnimatedBox key={`dp${i}`}
          position={[p.x, 0.62, p.z]}
          args={[0.072, 1.15, 0.072]}
          color={POST_COLOUR} threshold={p.threshold} spread={0.05}
          roughness={0.82} progRef={progRef}
        />
      ))}

      {/* Railing rails */}
      {railZ.map((z, i) => (
        <AnimatedBox key={`r${i}`}
          position={[0, 1.18, z]}
          args={[BOARD_COUNT * BOARD_STEP + 0.06, 0.052, 0.062]}
          color={RAIL_COLOUR} threshold={R_S + i * 0.04} spread={0.07}
          axis="x" roughness={0.72} progRef={progRef}
        />
      ))}

      {/* Pergola posts (tall) */}
      {posts.map((p, i) => (
        <AnimatedBox key={`pp${i}`}
          position={[p.x, 1.98, p.z]}
          args={[0.064, 1.58, 0.064]}
          color={PERGOLA_COL} threshold={PG_S + i * 0.025} spread={0.06}
          roughness={0.72} metalness={0.06} progRef={progRef}
        />
      ))}

      {/* Pergola main beams — drop from above */}
      {railZ.map((z, i) => (
        <AnimatedBox key={`pb${i}`}
          position={[0, 2.78, z + (i === 0 ? -0.06 : 0.06)]}
          args={[BOARD_COUNT * BOARD_STEP + 0.32, 0.058, 0.074]}
          color={PERGOLA_COL} threshold={PG_S + 0.04 + i * 0.03} spread={0.06}
          axis="y-drop" roughness={0.72} metalness={0.06} progRef={progRef}
        />
      ))}

      {/* Louver slats */}
      {louvers.map((l, i) => (
        <AnimatedBox key={`lv${i}`}
          position={[0, 2.74, l.z]}
          args={[BOARD_COUNT * BOARD_STEP + 0.22, 0.042, 0.026]}
          color={LOUVER_COL} threshold={l.threshold} spread={0.025}
          axis="x" roughness={0.68} metalness={0.10} progRef={progRef}
        />
      ))}
    </group>
  )
}

// ── Export ──────────────────────────────────────────────────────────────
export interface DeckSceneProps {
  progress?: number
  liveTarget?: { value: number }
}

export default function DeckScene({ progress = 0, liveTarget }: DeckSceneProps) {
  const progRef = useRef(0)

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3.6, 2.6, 3.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      {/* IBL for physically correct materials */}
      <Environment preset="studio" />

      {/* Key light — warm top-right */}
      <directionalLight
        position={[5, 8, 4]} intensity={1.8}
        castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={0.5} shadow-camera-far={30}
        shadow-camera-left={-7} shadow-camera-right={7}
        shadow-camera-top={7}  shadow-camera-bottom={-7}
        shadow-bias={-0.0003}
      />
      {/* Warm fill — timber bounce */}
      <pointLight position={[-4, 2, -3]} intensity={0.8} color="#E0A050" />
      {/* Cool rim — depth */}
      <pointLight position={[0, 7, -8]} intensity={0.4} color="#6090BB" />
      {/* Ambient base */}
      <ambientLight intensity={0.18} />

      <DeckMesh progRef={progRef} targetProgress={progress} liveTarget={liveTarget} />
    </Canvas>
  )
}
