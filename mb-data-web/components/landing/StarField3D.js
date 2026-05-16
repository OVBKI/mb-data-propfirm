'use client'
// Scène 3D du hero Quantara : champ d'étoiles parallax + planète Earth NASA.
//
// COMPOSITION :
//   1. Champ d'étoiles 3D (1500 points en sphère, mix bleu/blanc)
//   2. Planète Earth (texture jour + lumières villes de nuit en emissive)
//      → positionnée en bas pour effet "vue depuis l'orbite"
//   3. Atmosphère : 2 sphères concentriques en additive blending = rim glow bleu
//   4. Caméra parallax souris (vraie 3D = étoiles proches bougent plus)
//
// TEXTURES :
//   - threejs.org/examples/textures/planets/ : textures officielles Three.js
//     stables depuis 10+ ans, CORS OK. NASA Visible Earth en source.
//
// PERF :
//   - Une seule WebGL Canvas pour tout
//   - dpr capé à 1.5
//   - antialias off
//
// ACCESSIBILITÉ :
//   - prefers-reduced-motion : rend null → fallback au logo 2D standard

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// MOUSE TRACKER (window-level)
// ============================================================================

const mouseRef = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    mouseRef.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseRef.y = -(e.clientY / window.innerHeight) * 2 + 1
  }, { passive: true })
}

// ============================================================================
// ÉTOILES (deux groupes pour profondeur)
// ============================================================================

function StarGroup({ count, color, size, radiusInner, radiusOuter, rotSpeed }) {
  const ref = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const r = radiusInner + Math.random() * (radiusOuter - radiusInner)
      const sqrt = Math.sqrt(1 - u * u)
      arr[i * 3]     = r * sqrt * Math.cos(theta)
      arr[i * 3 + 1] = r * sqrt * Math.sin(theta)
      arr[i * 3 + 2] = r * u
    }
    return arr
  }, [count, radiusInner, radiusOuter])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * rotSpeed
    ref.current.rotation.x += delta * rotSpeed * 0.4
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
      />
    </Points>
  )
}

// ============================================================================
// PLANÈTE EARTH — texture jour + emissive nuit + atmosphère
// ============================================================================

// URLs des textures NASA hébergées sur threejs.org (CORS OK, stable depuis des années)
const EARTH_DAY_URL    = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
const EARTH_LIGHTS_URL = 'https://threejs.org/examples/textures/planets/earth_lights_2048.png'
const EARTH_SPEC_URL   = 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg'

function Planet() {
  // useTexture est suspense-compatible (suspend jusqu'au chargement complet)
  const [dayMap, lightsMap, specMap] = useTexture([
    EARTH_DAY_URL,
    EARTH_LIGHTS_URL,
    EARTH_SPEC_URL,
  ])

  const planetRef = useRef()

  useFrame((state, delta) => {
    // Rotation continue très lente (Earth fait 1 tour en ~24h IRL, ici en ~2min)
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.04
    }
  })

  return (
    // Position basse + légère inclinaison axiale (comme la Terre, 23°)
    <group position={[0, -1.1, 0]} rotation={[0.15, 0, -0.4]}>
      {/* ATMOSPHÈRE EXTERNE — rim glow bleu profond, très subtil */}
      <mesh>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ATMOSPHÈRE INTERNE — rim glow plus intense près de la surface */}
      <mesh>
        <sphereGeometry args={[0.98, 64, 64]} />
        <meshBasicMaterial
          color="#88baff"
          transparent
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* TERRE — sphère avec texture jour + lumières des villes en emissive */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[0.9, 128, 128]} />
        <meshStandardMaterial
          map={dayMap}
          emissiveMap={lightsMap}
          emissive="#ffb86b"
          emissiveIntensity={1.4}
          roughnessMap={specMap}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
    </group>
  )
}

// ============================================================================
// PARALLAX CAMÉRA
// ============================================================================

function ParallaxCamera() {
  useFrame((state) => {
    const targetX = mouseRef.x * 0.5
    const targetY = mouseRef.y * 0.3
    state.camera.position.x += (targetX - state.camera.position.x) * 0.04
    state.camera.position.y += (targetY - state.camera.position.y) * 0.04
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function StarField3D() {
  if (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 55, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true, // important pour la silhouette de la planète
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lumières : soleil directionnel (côté droit, comme un sun-from-east) */}
          <ambientLight intensity={0.15} />
          <directionalLight
            position={[5, 2, 3]}
            intensity={1.8}
            color="#fff5e1"
          />
          {/* Légère rim light bleue côté gauche pour faire ressortir la silhouette */}
          <pointLight position={[-3, 0.5, 2]} intensity={0.4} color="#4d8fff" />

          {/* Champ d'étoiles bleues (profondes, nombreuses) */}
          <StarGroup
            count={1100}
            color="#4d8fff"
            size={0.013}
            radiusInner={3}
            radiusOuter={12}
            rotSpeed={0.012}
          />
          {/* Étoiles blanches plus proches (pop visuel) */}
          <StarGroup
            count={400}
            color="#e8f0ff"
            size={0.018}
            radiusInner={2}
            radiusOuter={7}
            rotSpeed={0.020}
          />

          {/* Planète Earth en bas */}
          <Planet />

          <ParallaxCamera />
        </Suspense>
      </Canvas>
    </div>
  )
}
