import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSceneStore } from '../../store/useSceneStore.js'
import { orbitPosition } from './systemLayout.js'

function PlanetMaterial({ kind, full }) {
  if (kind === 'ice') {
    return full ? (
      <meshPhysicalMaterial
        color="#bfe9ff"
        transmission={0.85}
        thickness={0.6}
        roughness={0.12}
        ior={1.4}
        clearcoat={1}
        envMapIntensity={1.2}
      />
    ) : (
      <meshPhysicalMaterial color="#9fd6f5" roughness={0.1} clearcoat={1} envMapIntensity={1.2} />
    )
  }
  if (kind === 'metal') {
    return <meshStandardMaterial color="#9aa4b8" metalness={1} roughness={0.35} envMapIntensity={1.4} />
  }
  return (
    <meshStandardMaterial color="#3a0f0f" emissive="#ff5a1f" emissiveIntensity={1.4} roughness={0.7} />
  )
}

export default function Planet({ page, orbit, full }) {
  const navigate = useNavigate()
  const groupRef = useRef()
  const meshRef = useRef()
  const angleRef = useRef(orbit.startAngle)

  const activeSlug = useSceneStore((s) => s.activeSlug)
  const hoveredSlug = useSceneStore((s) => s.hoveredSlug)
  const setHoveredSlug = useSceneStore((s) => s.setHoveredSlug)
  const setFocus = useSceneStore((s) => s.setFocus)

  const isActive = activeSlug === page.slug
  const isHovered = hoveredSlug === page.slug
  const frozen = isActive || isHovered

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (!frozen) angleRef.current += delta * orbit.speed
    const [x, y, z] = orbitPosition(orbit, angleRef.current)
    groupRef.current.position.set(x, y, z)
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4
  })

  useEffect(() => {
    if (!isActive) return
    const position = orbitPosition(orbit, angleRef.current)
    setFocus({ slug: page.slug, position, orbit })
  }, [isActive, orbit, page.slug, setFocus])

  const go = () => navigate(`/${page.slug}`)

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        castShadow={full}
        receiveShadow={full}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredSlug(page.slug)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHoveredSlug(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          go()
        }}
      >
        <sphereGeometry args={[orbit.size, 48, 48]} />
        <PlanetMaterial kind={orbit.material} full={full} />
      </mesh>

      {frozen && (
        <mesh scale={1.3}>
          <sphereGeometry args={[orbit.size, 20, 20]} />
          <meshBasicMaterial color="#4df1ff" wireframe transparent opacity={0.25} />
        </mesh>
      )}

      <Html position={[0, orbit.size + 0.35, 0]} center distanceFactor={10} occlude={false}>
        {/* Decorative: the HUD nav is the accessible route to every page. */}
        <a
          href={`/${page.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className={`planet-label${isActive ? ' planet-label--active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            go()
          }}
        >
          <span className="planet-label__title">// {page.label.toLowerCase()}</span>
          <span className="planet-label__blurb" style={{ opacity: frozen ? 1 : 0 }}>
            {page.blurb}
          </span>
        </a>
      </Html>
    </group>
  )
}
