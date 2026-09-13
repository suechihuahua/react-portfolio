import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getHomeCamera } from './systemLayout.js'
import Starfield from './Starfield.jsx'
import SkySphere from './SkySphere.jsx'
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
  const dprScale = useSceneStore((s) => s.dprScale)
  const setDprScale = useSceneStore((s) => s.setDprScale)
  const full = renderTier === 'full'
  const home = getHomeCamera({ narrow }, pages.length)
  const maxDpr = (full ? 2 : 1.25) * dprScale

  return (
    <Canvas
      dpr={[1, maxDpr]}
      shadows={full ? 'soft' : false}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: home.position, fov: 45, near: 0.1, far: 200 }}
    >
      <color attach="background" args={['#04030a']} />
      {/* Faint fill so night sides keep their silhouette against the sky. */}
      <ambientLight intensity={0.16} color="#9fb2ff" />

      <Suspense fallback={null}>
        <SkySphere />
        <Starfield full={full} />
        <Sun full={full} />
        <OrbitSystem full={full} />
      </Suspense>

      <CameraRig />
      <ReadySignal />

      {full && (
        <PerformanceMonitor
          flipflops={3}
          // Spec §3.4: drop resolution first, only then give up post-processing.
          onDecline={() => {
            if (dprScale > 0.75) setDprScale(0.75)
            else setEffectsEnabled(false)
          }}
          onFallback={() => setEffectsEnabled(false)}
        />
      )}

      {full && effectsEnabled && (
        <EffectComposer multisampling={0}>
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Bloom intensity={0.7} luminanceThreshold={0.75} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}
