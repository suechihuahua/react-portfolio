import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
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
        toneMappingExposure: 1.1,
      }}
      camera={{ position: home.position, fov: 45, near: 0.1, far: 120 }}
    >
      <color attach="background" args={['#06040c']} />
      <fog attach="fog" args={['#06040c', 30, 80]} />
      <ambientLight intensity={0.35} color="#8ab4ff" />
      <directionalLight position={[-6, 8, 12]} intensity={0.6} color="#cfe6ff" />

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
          <Bloom intensity={0.9} luminanceThreshold={0.6} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}
