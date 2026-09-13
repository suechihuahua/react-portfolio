import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { pages } from '../../content/site.js'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

// Courses zone: one thin stacked panel per term, floating in front of the
// main terminal. Clicking/pressing a term jumps the real DOM overlay to that
// term's listing (see the matching id in Page.jsx's Courses renderer).
export default function CourseStack({ origin }) {
  const stacked = useMemo(() => {
    const coursesPage = pages.find((p) => p.slug === 'courses')
    const terms = coursesPage?.sections.find((s) => s.kind === 'courses')?.terms ?? []
    return terms.map((term, i) => ({
      term,
      position: [origin[0], origin[1] + 0.55 - i * 0.5, origin[2] + 1.3 + i * 0.5],
    }))
  }, [origin])

  return (
    <group>
      {stacked.map(({ term, position }, i) => (
        <group key={term.name} position={position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              document
                .getElementById(`term-${slugify(term.name)}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <boxGeometry args={[1.9, 0.35, 0.03]} />
            <meshStandardMaterial
              color="#050f0c"
              transparent
              opacity={0.6}
              emissive={i === 0 ? '#39ff88' : '#1c8a5c'}
              emissiveIntensity={0.3}
            />
          </mesh>
          <Html center distanceFactor={9} occlude={false}>
            <div className="node-label">
              <span># {term.name} -- ls ./{slugify(term.name)}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
