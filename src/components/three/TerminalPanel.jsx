import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrame } from '@react-three/fiber'
import { Edges, Html } from '@react-three/drei'
import { useSceneStore } from '../../store/useSceneStore.js'

// One floating holographic terminal per entry in `pages` (see site.js). It is
// both a visual hotspot in the 3D hub *and* a real, keyboard-reachable link --
// the <Html> label below is an actual <a>, not a canvas texture.
export default function TerminalPanel({ page, position }) {
  const navigate = useNavigate()
  const groupRef = useRef()
  const baseY = position[1]

  const hoveredSlug = useSceneStore((s) => s.hoveredSlug)
  const setHoveredSlug = useSceneStore((s) => s.setHoveredSlug)
  const activeSlug = useSceneStore((s) => s.activeSlug)
  const prefersReducedMotion = useSceneStore((s) => s.prefersReducedMotion)

  const isHovered = hoveredSlug === page.slug
  const isActive = activeSlug === page.slug
  const color = isActive ? '#4df1ff' : isHovered ? '#39ff88' : '#1c8a5c'

  useFrame((state) => {
    if (!groupRef.current || prefersReducedMotion) return
    groupRef.current.position.y =
      baseY + Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.06
  })

  const go = () => navigate(`/${page.slug}`)

  return (
    <group ref={groupRef} position={position}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredSlug(page.slug)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHoveredSlug(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          go()
        }}
      >
        <boxGeometry args={[2.5, 1.5, 0.04]} />
        <meshStandardMaterial
          color="#050f0c"
          transparent
          opacity={0.55}
          emissive={color}
          emissiveIntensity={isHovered || isActive ? 0.5 : 0.18}
        />
        <Edges color={color} linewidth={1.5} />
      </mesh>

      <Html center distanceFactor={7.2} position={[0, 0, 0.05]} occlude={false}>
        {/*
          Decorative/redundant: the HUD's <nav> (see HUD.jsx) is the
          authoritative, always-tabbable way to reach every page, so this
          in-scene hotspot is pulled out of the tab order and hidden from
          assistive tech rather than duplicating a focusable link inside a
          3D-positioned layer.
        */}
        <a
          href={`/${page.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className={`panel-label${isActive ? ' panel-label--active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            go()
          }}
          onFocus={() => setHoveredSlug(page.slug)}
          onBlur={() => setHoveredSlug(null)}
        >
          <span className="panel-label__prompt">$</span>
          <span className="panel-label__title">{page.label}</span>
          <span
            className="panel-label__blurb"
            style={{ opacity: isHovered || isActive ? 1 : 0 }}
          >
            {page.blurb}
          </span>
        </a>
      </Html>
    </group>
  )
}
