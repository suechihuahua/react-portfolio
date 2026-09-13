import { useRef, useState } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial, useTexture } from '@react-three/drei'
import { AdditiveBlending, BackSide, Color, MathUtils, SRGBColorSpace } from 'three'
import { SUN_RADIUS } from './systemLayout.js'
import { SUN_TEXTURE } from './planets.js'

// Atmosphere glow: drawn on the back faces of a larger sphere so the core
// occludes the centre and only the halo between core edge and shell
// silhouette remains, fading outward.
const CoronaMaterial = shaderMaterial(
  { uTime: 0, uColor: new Color('#ff9a3c'), uIntensity: 1 },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      float facing = abs(dot(vNormal, vView));
      float flicker = 0.92 + 0.08 * sin(uTime * 1.7) * sin(uTime * 0.9 + 1.3);
      float a = pow(facing, 1.5) * flicker * uIntensity;
      gl_FragColor = vec4(uColor * a * 1.6, a);
    }
  `,
)

extend({ CoronaMaterial })

export default function Sun({ full }) {
  const coreRef = useRef()
  const coronaRef = useRef()
  const [hovered, setHovered] = useState(false)
  const texture = useTexture(SUN_TEXTURE)
  texture.colorSpace = SRGBColorSpace

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.04
      const pulse = 1 + Math.sin(t * 0.8) * 0.008
      coreRef.current.scale.setScalar(pulse)
      coreRef.current.material.emissiveIntensity = MathUtils.damp(
        coreRef.current.material.emissiveIntensity,
        hovered ? 2.4 : 1.9,
        4,
        delta,
      )
    }
    if (coronaRef.current) {
      coronaRef.current.uTime = t
      coronaRef.current.uIntensity = MathUtils.damp(
        coronaRef.current.uIntensity,
        hovered ? 1.3 : 1,
        4,
        delta,
      )
    }
  })

  return (
    <group>
      {/* The sun is the scene's key light; a gentle falloff keeps Neptune lit. */}
      <pointLight
        intensity={40}
        distance={0}
        decay={1.4}
        color="#fff1d6"
        castShadow={full}
        shadow-mapSize={[1024, 1024]}
      />

      <mesh
        ref={coreRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#ffc37a"
          emissiveMap={texture}
          emissiveIntensity={1.9}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh scale={1.5}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <coronaMaterial
          ref={coronaRef}
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
