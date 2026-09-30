import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { person, sections, routeOrder } from '../content/site.js'
import { useConsoleStore, watchMediaPreferences } from '../store/useConsoleStore.js'
import { useScrollNavigation } from '../hooks/useScrollNavigation.js'
import CrtBoot from './CrtBoot.jsx'
import Ambient from './Ambient.jsx'
import Sidebar from './Sidebar.jsx'
import StatusBar from './StatusBar.jsx'
import CommandPalette from './CommandPalette.jsx'

// Mounts once and persists across every route change. Every load opens on the
// CRT loading page; a click anywhere enters the console.
export default function Layout() {
  const location = useLocation()
  const captureMode = new URLSearchParams(location.search).has('capture')
  const reducedMotion = useReducedMotion()

  const bootedStore = useConsoleStore((s) => s.booted)
  const finishBoot = useConsoleStore((s) => s.finishBoot)
  const setActiveSlug = useConsoleStore((s) => s.setActiveSlug)
  const paletteOpen = useConsoleStore((s) => s.paletteOpen)
  const togglePalette = useConsoleStore((s) => s.togglePalette)

  // The loading page shows on every load, deep links included; only capture
  // runs skip it.
  const booted = bootedStore || captureMode

  useEffect(() => watchMediaPreferences(), [])

  useEffect(() => {
    const slug = location.pathname.replace(/^\//, '') || null
    const match = sections.find((s) => s.slug === slug)
    setActiveSlug(match ? match.slug : null)
  }, [location.pathname, setActiveSlug])

  useEffect(() => {
    if (captureMode && !bootedStore) finishBoot()
  }, [captureMode, bootedStore, finishBoot])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        togglePalette()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePalette])

  // Arrow keys step through sections, but not while the palette owns them.
  useScrollNavigation(routeOrder, booted && !captureMode && !paletteOpen)

  return (
    <div className="console">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Ambient />

      <AnimatePresence>
        {!booted && (
          <motion.div
            key="crt"
            className="crt-layer"
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.55 }}
          >
            <CrtBoot onEnter={finishBoot} />
          </motion.div>
        )}
      </AnimatePresence>

      {booted && !captureMode && <Sidebar />}

      <main className="main" id="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="main__inner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.2, 0.7, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {booted && !captureMode && (
        <>
          <StatusBar />
          <CommandPalette />
        </>
      )}

      <p className="sr-only">
        {person.name}. {person.tagline}
      </p>
    </div>
  )
}
