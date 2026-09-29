import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { person, sections, routeOrder } from '../content/site.js'
import { useRoomStore, watchMediaPreferences } from '../store/useRoomStore.js'
import { useScrollNavigation } from '../hooks/useScrollNavigation.js'
import TitleSequence from './TitleSequence.jsx'
import DoorIntro from './DoorIntro.jsx'
import RoomStage from './RoomStage.jsx'
import Dialogue from './Dialogue.jsx'
import ChapterRail from './ChapterRail.jsx'

// Mounts once and persists across every route change; the room stage never
// remounts, only `activeSlug` changes and the camera follows.
//
// First visit runs title sequence -> door -> room. Deep links and capture
// runs land straight in the room.
export default function Layout() {
  const location = useLocation()
  const captureMode = new URLSearchParams(location.search).has('capture')
  const reducedMotion = useReducedMotion()

  const introSeenStore = useRoomStore((s) => s.introSeen)
  const finishIntro = useRoomStore((s) => s.finishIntro)
  const enteredStore = useRoomStore((s) => s.entered)
  const enter = useRoomStore((s) => s.enter)
  const setActiveSlug = useRoomStore((s) => s.setActiveSlug)
  const dialogueDone = useRoomStore((s) => s.dialogueDone)
  const finishDialogue = useRoomStore((s) => s.finishDialogue)

  // Derived from the URL directly so the very first render already knows the
  // section (the store copy below is for the stage and rail).
  const current = sections.find((s) => `/${s.slug}` === location.pathname)
  const deepLinked = location.pathname !== '/'
  const skipGates = deepLinked || captureMode
  const introSeen = introSeenStore || skipGates
  const entered = enteredStore || skipGates

  useEffect(() => watchMediaPreferences(), [])

  useEffect(() => {
    const slug = location.pathname.replace(/^\//, '') || null
    const match = sections.find((s) => s.slug === slug)
    setActiveSlug(match ? match.slug : null)
  }, [location.pathname, setActiveSlug])

  useEffect(() => {
    if (!skipGates) return
    if (!introSeenStore) finishIntro()
    if (!enteredStore) enter()
  }, [skipGates, introSeenStore, enteredStore, finishIntro, enter])

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
        {!introSeen && (
          <motion.div
            key="intro"
            className="gate-layer"
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.5 }}
          >
            <TitleSequence onDone={finishIntro} />
          </motion.div>
        )}

        {introSeen && !entered && (
          <motion.div
            key="door"
            className="gate-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.8 }}
          >
            <DoorIntro />
          </motion.div>
        )}
      </AnimatePresence>

      {entered && !captureMode && (
        <>
          <ChapterRail />

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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.2, 0.7, 0.3, 1] }}
              >
                <div className="overlay-pane__inner">
                  <Outlet />
                </div>
              </motion.main>
            )}
          </AnimatePresence>

          <footer className="colophon">
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
