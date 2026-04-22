/**
 * HeroScene — Blender deck wireframe with buttery-smooth intro.
 *
 *  Phase          Timing    Visual
 *  Structure      0.0–2.5s  white edges fade in (smoothstep)
 *  Pool           2.0–4.0s  white edges fade in
 *  Stairs         2.8–4.8s  RED edges fade in
 *  Pit            3.5–5.5s  red edges fade in
 *  Orbit handoff  6.0s      OrbitControls mounted, autoRotate from rest
 *
 * Node labels in the GLB live on Group/Node ancestors, not on leaf meshes
 * (leaves are named `Cube.1368` etc.). We walk UP the parent chain to find
 * a semantic name like `DeckStairs` / `DeckPit` / `DeckPool`, which is how
 * stairs get routed to the red phase.
 */

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const WHITE = new THREE.Color(0xffffff)
const RED   = new THREE.Color(0xDC3545)

type Phase = { start: number; end: number; color: THREE.Color; target: number }
const STRUCTURE_PHASE: Phase = { start: 0.0, end: 2.5, color: WHITE, target: 0.90 }
const POOL_PHASE:      Phase = { start: 2.0, end: 4.0, color: WHITE, target: 0.92 }
const STAIRS_PHASE:    Phase = { start: 2.8, end: 4.8, color: RED,   target: 0.98 }
const PIT_PHASE:       Phase = { start: 3.5, end: 5.5, color: RED,   target: 0.95 }
const ASSEMBLY_END = 6.0

function phaseOpacity(phase: Phase, t: number): number {
  if (t <= phase.start) return 0
  if (t >= phase.end)   return phase.target
  const p = (t - phase.start) / (phase.end - phase.start)
  const eased = p * p * (3 - 2 * p)
  return eased * phase.target
}

/** Walk up the parent chain looking for a semantic group name. */
function resolvePhase(mesh: THREE.Object3D): Phase {
  let node: THREE.Object3D | null = mesh
  while (node) {
    const n = (node.name || '').toLowerCase()
    if (n.includes('stair')) return STAIRS_PHASE
    if (n.includes('pit'))   return PIT_PHASE
    if (n.includes('pool'))  return POOL_PHASE
    if (n.includes('structure')) return STRUCTURE_PHASE
    node = node.parent
  }
  return STRUCTURE_PHASE
}

/* ─── Model ─────────────────────────────────────────────────── */
function BlueprintModel() {
  const { scene } = useGLTF('/models/deck.glb')
  const linesRef = useRef<{ mat: THREE.LineBasicMaterial; phase: Phase }[]>([])
  const startRef = useRef<number | null>(null)

  const { center, scaleFactor } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const c = box.getCenter(new THREE.Vector3())
    const s = box.getSize(new THREE.Vector3())
    const sf = 6.4 / Math.max(s.x, s.y, s.z)
    return { center: c, scaleFactor: sf }
  }, [scene])

  useEffect(() => {
    const refs: { mat: THREE.LineBasicMaterial; phase: Phase }[] = []
    const added: { parent: THREE.Mesh; line: THREE.LineSegments }[] = []

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.geometry) return

      const phase = resolvePhase(child)

      child.material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.003,
        depthWrite: false,
        side: THREE.DoubleSide,
      })

      const edgesGeo = new THREE.EdgesGeometry(child.geometry, 15)
      const mat = new THREE.LineBasicMaterial({
        color: phase.color.clone(),
        transparent: true,
        opacity: 0,
      })
      const line = new THREE.LineSegments(edgesGeo, mat)
      child.add(line)
      added.push({ parent: child, line })
      refs.push({ mat, phase })
    })

    linesRef.current = refs

    return () => {
      added.forEach(({ parent, line }) => {
        parent.remove(line)
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      })
    }
  }, [scene])

  useFrame(({ clock }) => {
    if (startRef.current === null) startRef.current = clock.elapsedTime
    const t = clock.elapsedTime - startRef.current
    linesRef.current.forEach(({ mat, phase }) => {
      mat.opacity = phaseOpacity(phase, t)
    })
  })

  return (
    <group scale={scaleFactor}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

/* ─── Camera — eases from start to end, then signals ready ─── */
function CameraRig({ onReady }: { onReady: () => void }) {
  const { camera } = useThree()
  const startRef = useRef<number | null>(null)
  const firedRef = useRef(false)

  // Start slightly pulled back and high; settle to a closer, LOWER angle
  // so the camera is "right there at deck level" for a cinematic feel.
  const START  = useMemo(() => new THREE.Vector3(7.4, 3.8, 7.4), [])
  const END    = useMemo(() => new THREE.Vector3(4.2, 1.15, 4.2), [])
  const TARGET = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useEffect(() => {
    camera.position.copy(START)
    camera.lookAt(TARGET)
    camera.updateProjectionMatrix()
  }, [camera, START, TARGET])

  useFrame(({ clock }) => {
    if (firedRef.current) return
    if (startRef.current === null) startRef.current = clock.elapsedTime
    const t = clock.elapsedTime - startRef.current

    if (t >= ASSEMBLY_END) {
      camera.position.copy(END)
      camera.lookAt(TARGET)
      firedRef.current = true
      onReady()
      return
    }

    const p = Math.min(1, t / ASSEMBLY_END)
    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
    camera.position.lerpVectors(START, END, eased)
    camera.lookAt(TARGET)
  })

  return null
}

/* ─── Floor grid — larger extent + red accent every 5 units ─── */
function FloorGrid() {
  const { minorGeo, majorGeo } = useMemo(() => {
    const size = 24
    const step = 0.5
    const minorPts: THREE.Vector3[] = []
    const majorPts: THREE.Vector3[] = []
    for (let i = -size; i <= size; i += step) {
      const isMajor = Math.abs(i) % 5 === 0
      const tgt = isMajor ? majorPts : minorPts
      tgt.push(new THREE.Vector3(-size, 0, i), new THREE.Vector3(size, 0, i))
      tgt.push(new THREE.Vector3(i, 0, -size), new THREE.Vector3(i, 0, size))
    }
    return {
      minorGeo: new THREE.BufferGeometry().setFromPoints(minorPts),
      majorGeo: new THREE.BufferGeometry().setFromPoints(majorPts),
    }
  }, [])

  return (
    <group position={[0, -1.9, 0]}>
      {/* Minor white lines — sparse */}
      <lineSegments geometry={minorGeo}>
        <lineBasicMaterial color={0xffffff} transparent opacity={0.045} />
      </lineSegments>
      {/* Major red lines every 5 units — gives the ground a "zoned" feel */}
      <lineSegments geometry={majorGeo}>
        <lineBasicMaterial color={0xDC3545} transparent opacity={0.09} />
      </lineSegments>
    </group>
  )
}

/* ─── Starfield — sparse speckles on a distant sphere shell ─── */
function Starfield() {
  const geo = useMemo(() => {
    const pts: number[] = []
    const colors: number[] = []
    const N = 160
    for (let i = 0; i < N; i++) {
      // Spherical shell between radius 60 and 85, mostly in upper hemisphere
      const r = 60 + Math.random() * 25
      const theta = Math.random() * Math.PI * 2          // azimuth
      const phi = Math.acos(0.15 + Math.random() * 0.85) // bias upward
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.cos(phi) + 6                    // lift above horizon
      const z = r * Math.sin(phi) * Math.sin(theta)
      pts.push(x, y, z)
      // ~15% faint red stars, rest white-ish
      const red = Math.random() < 0.15
      if (red) {
        colors.push(0.86, 0.21, 0.27)
      } else {
        const s = 0.75 + Math.random() * 0.25
        colors.push(s, s, s)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return g
  }, [])

  const matRef = useRef<THREE.PointsMaterial>(null!)
  // Gentle twinkle by modulating overall opacity
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.55 + Math.sin(clock.elapsedTime * 0.7) * 0.08
    }
  })

  return (
    <points geometry={geo}>
      <pointsMaterial
        ref={matRef}
        size={0.22}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  )
}

/* ─── Scene — OrbitControls mounts ONLY after intro finishes ─── */
export default function HeroScene() {
  const [orbitReady, setOrbitReady] = useState(false)

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [7.4, 3.8, 7.4], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      {!orbitReady && <CameraRig onReady={() => setOrbitReady(true)} />}
      {orbitReady && (
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.18}
          enableZoom={false}
          enablePan={false}
          target={[0, 0, 0]}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 2.1}
          enableDamping
          dampingFactor={0.12}
        />
      )}
      <Suspense fallback={null}>
        <BlueprintModel />
      </Suspense>
      <FloorGrid />
      <Starfield />
    </Canvas>
  )
}

useGLTF.preload('/models/deck.glb')
