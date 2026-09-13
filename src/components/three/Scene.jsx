import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getHomeCamera } from './systemLayout.js'
import Starfield from './Starfield.jsx'
import GridHorizon from './GridHorizon.jsx'
import Nebula from './Nebula.jsx'
import Sun from './Sun.jsx'
import OrbitSystem from './OrbitSystem.jsx'
import CameraRig from './CameraRig.jsx'

function ReadySignal() {
  const setSceneReady = useSceneStore((s) => s.setSceneReady)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    setSceneReady(true)
  })
  return null
}

export default function Scene() {
  const renderTier = useSceneStore((s) => s.renderTier)
  const narrow = useSceneStore((s) => s.isNarrowViewport)
  const effectsEnabled = useSceneStore((s) => s.effectsEnabled)
  const setEffectsEnabled = useSceneStore((s) => s.setEffectsEnabled)
  const full = renderTier === 'full'
  const home = getHomeCamera({ narrow }, pages.length)

  return (
    <Canvas
      dpr={full ? [1, 2] : [1, 1.25]}
      shadows={full ? 'soft' : false}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      camera={{ position: home.position, fov: 45, near: 0.1, far: 120 }}
    >
      <color attach="background" args={['#06040c']} />
      <fog attach="fog" args={['#06040c', 30, 80]} />
      <ambientLight intensity={0.12} color="#8ab4ff" />

      <Environment resolution={64} frames={1}>
        <Lightformer intensity={1.2} color="#9fd8ff" position={[0, 8, -4]} scale={[12, 4, 1]} />
        <Lightformer intensity={2} color="#ffb347" form="ring" position={[0, 0.5, 0]} scale={3} />
      </Environment>

      <Suspense fallback={null}>
        <Starfield full={full} />
        <GridHorizon />
        {full && <Nebula />}
        <Sun full={full} />
        <OrbitSystem full={full} />
      </Suspense>

      <CameraRig />
      <ReadySignal />

      {full && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setEffectsEnabled(false)}
          onFallback={() => setEffectsEnabled(false)}
        />
      )}

      {full && effectsEnabled && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.9} luminanceThreshold={0.6} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}
