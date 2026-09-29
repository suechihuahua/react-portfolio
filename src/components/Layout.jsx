import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { person, sections, routeOrder } from '../content/site.js'
import { useConsoleStore, watchMediaPreferences } from '../store/useConsoleStore.js'
import { useScrollNavigation } from '../hooks/useScrollNavigation.js'
import Boot from './Boot.jsx'
import Sidebar from './Sidebar.jsx'
import StatusBar from './StatusBar.jsx'
import CommandPalette from './CommandPalette.jsx'

// Mounts once and persists across every route change. There is no gate to
// click through: the boot lines run once per session and hand straight over.
export default function Layout() {
  const location = useLocation()
  const captureMode = new URLSearchParams(location.search).has('capture')
  const reducedMotion = useReducedMotion()

  const bootedStore = useConsoleStore((s) => s.booted)
  const finishBoot = useConsoleStore((s) => s.finishBoot)
  const setActiveSlug = useConsoleStore((s) => s.setActiveSlug)
  const paletteOpen = useConsoleStore((s) => s.paletteOpen)
  const togglePalette = useConsoleStore((s) => s.togglePalette)

  // Deep links and capture runs never show the boot, not even for a frame.
  const deepLinked = location.pathname !== '/'
  const booted = bootedStore || deepLinked || captureMode

  useEffect(() => watchMediaPreferences(), [])

  useEffect(() => {
    const slug = location.pathname.replace(/^\//, '') || null
    const match = sections.find((s) => s.slug === slug)
    setActiveSlug(match ? match.slug : null)
  }, [location.pathname, setActiveSlug])

  useEffect(() => {
    if ((deepLinked || captureMode) && !bootedStore) finishBoot()
  }, [deepLinked, captureMode, bootedStore, finishBoot])

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

      <div className="console__grid" aria-hidden="true" />
      <div className="console__vignette" aria-hidden="true" />

      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            className="boot-layer"
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35 }}
          >
            <Boot onDone={finishBoot} />
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
