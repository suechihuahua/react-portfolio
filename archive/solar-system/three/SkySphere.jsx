import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { BackSide, SRGBColorSpace } from 'three'
import { SKY_TEXTURE } from './planets.js'

export default function SkySphere() {
  const ref = useRef()
  const texture = useTexture(SKY_TEXTURE)
  texture.colorSpace = SRGBColorSpace

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.003
  })

  return (
    <mesh ref={ref} rotation={[0.35, 0, 0.2]}>
      <sphereGeometry args={[90, 48, 32]} />
      <meshBasicMaterial map={texture} side={BackSide} color="#b8bfd6" fog={false} />
    </mesh>
  )
}
