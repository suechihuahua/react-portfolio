import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random'
import { useSceneStore } from '../../store/useSceneStore.js'

// Ambient "data field" drifting behind the hub. A single instanced Points
// cloud -- one draw call no matter how many particles -- with the count
// capped by caller for mobile/low-power screens.
export default function ParticleField({ count = 1200 }) {
  const pointsRef = useRef()
  const prefersReducedMotion = useSceneStore((s) => s.prefersReducedMotion)

  const positions = useMemo(
    () => random.inSphere(new Float32Array(count * 3), { radius: 16 }),
    [count],
  )

  useFrame((_, delta) => {
    if (prefersReducedMotion || !pointsRef.current) return
    pointsRef.current.rotation.y += delta * 0.025
    pointsRef.current.rotation.x += delta * 0.006
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#4df1ff"
        size={0.028}
        sizeAttenuation
        depthWrite={false}
        opacity={0.55}
      />
    </Points>
  )
}
