import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, SRGBColorSpace } from 'three'

const CLOUDS = [
  { color: 'rgba(120, 70, 220, 0.55)', position: [-14, 4, -30], scale: 42, drift: 0.02 },
  { color: 'rgba(40, 180, 230, 0.4)', position: [16, -2, -36], scale: 38, drift: -0.015 },
  { color: 'rgba(160, 60, 200, 0.35)', position: [4, 9, -44], scale: 50, drift: 0.01 },
]

function useGlowTexture(color) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [color])
}

function Cloud({ color, position, scale, drift }) {
  const texture = useGlowTexture(color)
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) ref.current.material.rotation = state.clock.elapsedTime * drift
  })

  return (
    <sprite ref={ref} position={position} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        opacity={0.9}
      />
    </sprite>
  )
}

export default function Nebula() {
  return CLOUDS.map((cloud) => <Cloud key={cloud.position.join(',')} {...cloud} />)
}
