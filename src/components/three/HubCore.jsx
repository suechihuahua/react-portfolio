import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSceneStore } from '../../store/useSceneStore.js'

// Decorative rotating core at the center of the control room -- procedural
// geometry only, no imported models.
export default function HubCore() {
  const meshRef = useRef()
  const prefersReducedMotion = useSceneStore((s) => s.prefersReducedMotion)

  useFrame((_, delta) => {
    if (!meshRef.current || prefersReducedMotion) return
    meshRef.current.rotation.x += delta * 0.12
    meshRef.current.rotation.y += delta * 0.18
  })

  return (
    <mesh ref={meshRef} position={[0, 1.1, -1.5]}>
      <torusKnotGeometry args={[0.55, 0.16, 128, 16]} />
      <meshStandardMaterial
        color="#031a12"
        emissive="#39ff88"
        emissiveIntensity={0.35}
        wireframe
      />
    </mesh>
  )
}
