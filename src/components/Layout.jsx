import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { pages, person } from '../content/site.js'
import { useSceneStore, watchMediaPreferences } from '../store/useSceneStore.js'
import HUD from './HUD.jsx'
import BootSequence from './BootSequence.jsx'
import StaticHero from './StaticHero.jsx'
import SceneErrorBoundary from './SceneErrorBoundary.jsx'

const Scene = lazy(() => import('./three/Scene.jsx'))

// Mounts once and persists across every route change, so the canvas never
// remounts on navigation -- only `activeSlug` changes.
export default function Layout() {
  const location = useLocation()
  const captureMode = new URLSearchParams(location.search).has('capture')

  const booted = useSceneStore((s) => s.booted)
  const setBooted = useSceneStore((s) => s.setBooted)
  const setActiveSlug = useSceneStore((s) => s.setActiveSlug)
  const renderTier = useSceneStore((s) => s.renderTier)
  const degradeToStatic = useSceneStore((s) => s.degradeToStatic)
  // The static tier has no camera flight to wait on -- gating on flyProgress
  // alone would strand the pane invisible if the Scene unmounts mid-flight.
  const revealed = useSceneStore((s) => s.renderTier === 'static' || s.flyProgress >= 0.6)

  const isStatic = renderTier === 'static'

  useEffect(() => watchMediaPreferences(), [])

  useEffect(() => {
    const slug = location.pathname.replace(/^\//, '') || null
    const match = pages.find((p) => p.slug === slug)
    setActiveSlug(match ? match.slug : null)
  }, [location.pathname, setActiveSlug])

  useEffect(() => {
    if ((isStatic || captureMode) && !booted) setBooted(true)
  }, [isStatic, captureMode, booted, setBooted])

  return (
    <div className="experience">
      <a className="skip-link" href="#overlay-content">
        Skip to content
      </a>

      <div className="scene-layer" aria-hidden="true">
        {isStatic ? (
          <StaticHero />
        ) : (
          <SceneErrorBoundary onError={degradeToStatic}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </SceneErrorBoundary>
        )}
      </div>
      <div className="scanline-overlay" aria-hidden="true" />

      {!booted ? (
        <BootSequence />
      ) : captureMode ? null : (
        <>
          <HUD />

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              className="overlay-pane"
              id="overlay-content"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 14 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="overlay-pane__inner">
                <Outlet />
              </div>
            </motion.main>
          </AnimatePresence>

          <footer className="colophon">
            <span>{person.name}</span>
            <a href={`mailto:${person.email}`}>{person.email}</a>
            <a href={person.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </footer>
        </>
      )}
    </div>
  )
}
