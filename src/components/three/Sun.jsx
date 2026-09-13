import { useRef, useState } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { AdditiveBlending, BackSide, Color, MathUtils } from 'three'
import { SUN_RADIUS } from './systemLayout.js'

// Atmosphere glow: drawn on the back faces of a larger sphere so the core
// occludes the centre and only the halo between core edge and shell
// silhouette remains, fading outward.
const CoronaMaterial = shaderMaterial(
  { uTime: 0, uColor: new Color('#ffb347'), uIntensity: 1 },
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
  const shellRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.05
      const pulse = 1 + Math.sin(t * 0.8) * 0.01
      coreRef.current.scale.setScalar(pulse)
      coreRef.current.material.emissiveIntensity = MathUtils.damp(
        coreRef.current.material.emissiveIntensity,
        hovered ? 2.6 : 2,
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
    if (shellRef.current) {
      shellRef.current.rotation.y -= delta * 0.08
      shellRef.current.rotation.x += delta * 0.03
    }
  })

  return (
    <group>
      <pointLight
        intensity={full ? 60 : 40}
        distance={40}
        decay={2}
        color="#ffc27a"
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
          color="#ff8c1a"
          emissive="#ff9a2e"
          emissiveIntensity={2}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh scale={1.6}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <coronaMaterial
          ref={coronaRef}
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
        />
      </mesh>

      {full && (
        <mesh ref={shellRef} scale={1.9}>
          <icosahedronGeometry args={[SUN_RADIUS, 1]} />
          <meshBasicMaterial color="#4df1ff" wireframe transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  )
}
