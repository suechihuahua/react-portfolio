import { useEffect } from 'react'
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { pages, person } from '../content/site.js'
import { useSceneStore, watchMediaPreferences } from '../store/useSceneStore.js'
import Scene from './three/Scene.jsx'
import HUD from './HUD.jsx'
import BootSequence from './BootSequence.jsx'

// Mounts once and persists across every route change (react-router keeps a
// parent Route's element instance alive while only swapping the Outlet), so
// the <Canvas> below never remounts on navigation -- only `activeSlug`
// changes, and the camera rig reacts to that.
export default function Layout() {
  const location = useLocation()

  const simpleView = useSceneStore((s) => s.simpleView)
  const setSimpleView = useSceneStore((s) => s.setSimpleView)
  const booted = useSceneStore((s) => s.booted)
  const setBooted = useSceneStore((s) => s.setBooted)
  const setActiveSlug = useSceneStore((s) => s.setActiveSlug)
  const prefersReducedMotion = useSceneStore((s) => s.prefersReducedMotion)

  useEffect(() => watchMediaPreferences(), [])

  // Camera/overlay zone always mirrors the URL -- deep links and the browser
  // back/forward buttons work exactly like normal react-router navigation.
  useEffect(() => {
    const slug = location.pathname.replace(/^\//, '') || null
    const match = pages.find((p) => p.slug === slug)
    setActiveSlug(match ? match.slug : null)
  }, [location.pathname, setActiveSlug])

  // Reduced-motion visitors skip the typed boot animation outright.
  useEffect(() => {
    if (prefersReducedMotion && !booted) setBooted(true)
  }, [prefersReducedMotion, booted, setBooted])

  if (simpleView) {
    return (
      <div className="shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="masthead">
          <Link to="/" className="masthead__name">
            {person.name}
          </Link>
          <nav className="masthead__nav" aria-label="Sections">
            {pages.map((page) => (
              <NavLink
                key={page.slug}
                to={page.slug}
                className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
              >
                {page.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className="hud__toggle" onClick={() => setSimpleView(false)}>
            exit simple view
          </button>
        </header>

        <main className="page" id="main-content">
          <Outlet />
        </main>

        <footer className="colophon">
          <span>{person.name}</span>
          <a href={`mailto:${person.email}`}>{person.email}</a>
          <a href={person.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </footer>
      </div>
    )
  }

  return (
    <div className="experience">
      <a className="skip-link" href="#overlay-content">
        Skip to content
      </a>

      {/* Backdrop only -- every real link/heading lives in the HUD and the
          overlay pane below, so this whole layer is hidden from AT. Stays
          mounted through the boot sequence so the scene is already live
          (just hidden behind the boot's opaque black) once it resolves. */}
      <div className="scene-layer" aria-hidden="true">
        <Scene />
      </div>
      <div className="scanline-overlay" aria-hidden="true" />

      {!booted ? (
        <BootSequence />
      ) : (
        <>
          <HUD />

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              className="overlay-pane"
              id="overlay-content"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="overlay-pane__inner">
                <Outlet />
              </div>
            </motion.main>
          </AnimatePresence>

          <footer className="colophon colophon--float">
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
