import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useSceneStore } from '../../store/useSceneStore.js'
import { HOME_CAMERA } from './hubLayout.js'
import GridFloor from './GridFloor.jsx'
import ParticleField from './ParticleField.jsx'
import Hub from './Hub.jsx'
import CameraRig from './CameraRig.jsx'

export default function Scene() {
  const prefersReducedMotion = useSceneStore((s) => s.prefersReducedMotion)
  const isNarrowViewport = useSceneStore((s) => s.isNarrowViewport)
  const lightWeight = isNarrowViewport || prefersReducedMotion

  return (
    <Canvas
      dpr={[1, lightWeight ? 1.25 : 2]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: HOME_CAMERA.position, fov: 50, near: 0.1, far: 60 }}
    >
      <color attach="background" args={['#05070a']} />
      <fog attach="fog" args={['#05070a', 14, 34]} />
      <ambientLight intensity={0.4} color="#4df1ff" />
      <pointLight position={[0, 4, 3]} intensity={1.1} color="#39ff88" />
      <pointLight position={[0, 2, -6]} intensity={0.6} color="#4df1ff" />

      <Suspense fallback={null}>
        <GridFloor />
        <ParticleField count={lightWeight ? 350 : 1400} />
        <Hub />
      </Suspense>

      <CameraRig />

      {!lightWeight && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
