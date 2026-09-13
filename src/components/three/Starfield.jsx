import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random'

function Layer({ count, radius, size, opacity, spin, shell }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const buffer = new Float32Array(count * 3)
    return shell ? random.onSphere(buffer, { radius }) : random.inSphere(buffer, { radius })
  }, [count, radius, shell])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * spin
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#dfe8ff"
        size={size}
        sizeAttenuation
        depthWrite={false}
        opacity={opacity}
      />
    </Points>
  )
}

export default function Starfield({ full }) {
  return (
    <>
      <Layer count={full ? 2500 : 900} radius={70} size={0.14} opacity={0.75} spin={0.004} shell />
      <Layer count={full ? 600 : 200} radius={40} size={0.22} opacity={0.45} spin={0.012} />
    </>
  )
}
