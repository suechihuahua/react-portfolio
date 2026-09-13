import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrame } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import { DoubleSide, RingGeometry, SRGBColorSpace } from 'three'
import { useSceneStore } from '../../store/useSceneStore.js'
import { orbitPosition } from './systemLayout.js'
import { MOON_TEXTURE, SATURN_RING_TEXTURE } from './planets.js'

function useSrgbTexture(url) {
  const texture = useTexture(url)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// RingGeometry maps UVs planarly, but the ring texture is a radial strip, so
// rewrite `u` as the normalised radius.
function useRingGeometry(inner, outer) {
  const geometry = useMemo(() => {
    const ring = new RingGeometry(inner, outer, 128, 1)
    const position = ring.attributes.position
    const uv = ring.attributes.uv
    for (let i = 0; i < position.count; i += 1) {
      const r = Math.hypot(position.getX(i), position.getY(i))
      uv.setXY(i, (r - inner) / (outer - inner), 0.5)
    }
    return ring
  }, [inner, outer])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

function SaturnRing({ size }) {
  const texture = useSrgbTexture(SATURN_RING_TEXTURE)
  const geometry = useRingGeometry(size * 1.3, size * 2.2)
  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial
        map={texture}
        transparent
        side={DoubleSide}
        depthWrite={false}
        roughness={0.9}
      />
    </mesh>
  )
}

function Moon({ size }) {
  const texture = useSrgbTexture(MOON_TEXTURE)
  const ref = useRef()
  const angle = useRef(0)
  useFrame((_, delta) => {
    angle.current += delta * 0.6
    if (!ref.current) return
    ref.current.position.set(
      Math.cos(angle.current) * size * 2.4,
      size * 0.3,
      Math.sin(angle.current) * size * 2.4,
    )
    ref.current.rotation.y += delta * 0.6
  })
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[size * 0.27, 24, 24]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  )
}

export default function Planet({ page, orbit, planet, full }) {
  const navigate = useNavigate()
  const groupRef = useRef()
  const meshRef = useRef()
  const angleRef = useRef(orbit.startAngle)
  const texture = useSrgbTexture(planet.texture)

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
    if (meshRef.current) meshRef.current.rotation.y += delta * planet.spin
  })

  useEffect(() => {
    if (!isActive) return
    const position = orbitPosition(orbit, angleRef.current)
    setFocus({ slug: page.slug, position, orbit })
  }, [isActive, orbit, page.slug, setFocus])

  // A planet can unmount while it still owns the pointer cursor (tier change,
  // simple-view toggle); without this the page is left stuck on `pointer`.
  useEffect(
    () => () => {
      document.body.style.cursor = 'auto'
    },
    [],
  )

  const go = () => navigate(`/${page.slug}`)
  const hasContent = page.sections.length > 0

  return (
    <group ref={groupRef}>
      <group rotation-z={planet.tilt}>
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
            // Only give up the hover if it is still ours -- pointer-out can
            // arrive after another planet has already claimed it.
            if (useSceneStore.getState().hoveredSlug !== page.slug) return
            setHoveredSlug(null)
            document.body.style.cursor = 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            go()
          }}
        >
          <sphereGeometry args={[orbit.size, 64, 64]} />
          <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
        </mesh>
        {planet.ring && <SaturnRing size={orbit.size} />}
      </group>

      {planet.moon && <Moon size={orbit.size} />}

      {isHovered && !isActive && (
        <mesh scale={1.25}>
          <sphereGeometry args={[orbit.size, 24, 24]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} />
        </mesh>
      )}

      {/* Hidden while active: the camera parks right beside the planet, where
          the distance-scaled label would blow up and cover the pane. */}
      {!isActive && (
        <Html position={[0, orbit.size * 1.35 + 0.3, 0]} center occlude={false}>
          {/* Decorative: the HUD nav is the accessible route to every page. */}
          <a
            href={`/${page.slug}`}
            tabIndex={-1}
            aria-hidden="true"
            className="planet-label"
            onClick={(e) => {
              e.preventDefault()
              go()
            }}
          >
            <span className="planet-label__title">{page.planetName}</span>
            <span className="planet-label__caption" style={{ opacity: frozen || hasContent ? 1 : 0 }}>
              {hasContent ? page.label : 'in development...'}
            </span>
          </a>
        </Html>
      )}
    </group>
  )
}
