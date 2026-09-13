import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { pages } from '../../content/site.js'

// Projects zone: one node per project item, connected back to a hub point by
// faint glowing lines -- a small network graph. Lazy-loaded (see Hub.jsx)
// since it's only needed when the visitor is actually looking at /projects.
export default function ProjectGraph({ origin }) {
  const groupRef = useRef()

  const nodes = useMemo(() => {
    const projectsPage = pages.find((p) => p.slug === 'projects')
    const items = projectsPage?.sections.find((s) => s.kind === 'projects')?.items ?? []
    const spread = Math.PI * 0.8
    const start = -spread / 2
    return items.map((item, i) => {
      const angle = items.length === 1 ? 0 : start + (spread * i) / (items.length - 1)
      const radius = 1.9
      return {
        item,
        position: [
          origin[0] + Math.sin(angle) * radius,
          origin[1] + 0.6 + Math.cos(i * 1.7) * 0.25,
          origin[2] + 1.4 + Math.cos(angle) * 0.6,
        ],
      }
    })
  }, [origin])

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.02
  })

  return (
    <group ref={groupRef}>
      {nodes.map(({ item, position }) => (
        <Line
          key={`line-${item.title}`}
          points={[origin, position]}
          color="#1c8a5c"
          transparent
          opacity={0.45}
          lineWidth={1}
        />
      ))}

      {nodes.map(({ item, position }) => (
        <group key={item.title} position={position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              if (item.link) window.open(item.link, '_blank', 'noopener,noreferrer')
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              if (item.link) document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <icosahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial
              color="#031a12"
              emissive="#4df1ff"
              emissiveIntensity={0.6}
              wireframe
            />
          </mesh>
          <Html center distanceFactor={9} occlude={false}>
            <div className="node-label">
              <span>{item.title}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
