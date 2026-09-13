import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { person, sections, routeOrder } from '../content/site.js'
import { useRoomStore, watchMediaPreferences } from '../store/useRoomStore.js'
import { useScrollNavigation } from '../hooks/useScrollNavigation.js'
import DoorIntro from './DoorIntro.jsx'
import RoomStage from './RoomStage.jsx'
import Dialogue from './Dialogue.jsx'
import HUD from './HUD.jsx'

// Mounts once and persists across every route change; the room stage never
// remounts, only `activeSlug` changes and the camera follows.
export default function Layout() {
  const location = useLocation()
  const captureMode = new URLSearchParams(location.search).has('capture')
  const reducedMotion = useReducedMotion()

  const enteredStore = useRoomStore((s) => s.entered)
  const enter = useRoomStore((s) => s.enter)
  const setActiveSlug = useRoomStore((s) => s.setActiveSlug)
  const dialogueDone = useRoomStore((s) => s.dialogueDone)
  const finishDialogue = useRoomStore((s) => s.finishDialogue)

  // Derived from the URL directly so the very first render already knows the
  // section (the store copy below is for the stage and menu).
  const current = sections.find((s) => `/${s.slug}` === location.pathname)
  const deepLinked = location.pathname !== '/'
  // Deep links and capture runs never show the door, not even for a frame.
  const entered = enteredStore || deepLinked || captureMode

  useEffect(() => watchMediaPreferences(), [])

  useEffect(() => {
    const slug = location.pathname.replace(/^\//, '') || null
    const match = sections.find((s) => s.slug === slug)
    setActiveSlug(match ? match.slug : null)
  }, [location.pathname, setActiveSlug])

  // Deep links and capture runs skip the door.
  useEffect(() => {
    if ((deepLinked || captureMode) && !entered) enter()
  }, [deepLinked, captureMode, entered, enter])

  useScrollNavigation(routeOrder, entered && !captureMode)

  const showDialogue = Boolean(current?.lines?.length) && !dialogueDone
  const showCard = !current || dialogueDone

  return (
    <div className="experience">
      <a className="skip-link" href="#overlay-content">
        Skip to content
      </a>

      {entered && <RoomStage />}

      <AnimatePresence>
        {!entered && (
          <motion.div
            key="door"
            className="door-layer"
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.8 }}
          >
            <DoorIntro />
          </motion.div>
        )}
      </AnimatePresence>

      {entered && !captureMode && (
        <>
          <HUD />

          {showDialogue && (
            <Dialogue
              key={current.slug}
              speaker={person.name}
              lines={current.lines}
              onDone={finishDialogue}
            />
          )}

          <AnimatePresence mode="wait">
            {showCard && (
              <motion.main
                key={location.pathname}
                className="overlay-pane"
                id="overlay-content"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
              >
                <div className="overlay-pane__inner section-card">
                  <Outlet />
                </div>
              </motion.main>
            )}
          </AnimatePresence>

          <footer className="colophon">
            <span>{person.name}</span>
            <a href={`mailto:${person.email}`}>{person.email}</a>
            <a href={`mailto:${person.ntuEmail}`}>{person.ntuEmail}</a>
            <a href={person.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={person.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </footer>
        </>
      )}
    </div>
  )
}
