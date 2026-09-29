import { useEffect, useMemo, useRef, useState } from 'react'
import { person, ROOM_IMAGE } from '../content/site.js'
import { useRoomStore } from '../store/useRoomStore.js'
import {
  ART_TIMEOUT_MS,
  INTRO_DURATION_MS,
  TITLE_TEXT,
  introState,
} from '../lib/introTimeline.js'

const SUBTITLE = 'Computer Science · Nanyang Technological University'
const CAPTION = 'Portfolio — 2026'
const AVATAR_SRC = '/room/pose-about.png'

// Resolves once both plates are decoded, or after the timeout, whichever is
// first -- so the sequence never opens the letterbox on an empty frame.
function whenArtReady() {
  const load = (src) =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = resolve
      img.src = src
    })
  return Promise.race([
    Promise.all([load(ROOM_IMAGE.src), load(AVATAR_SRC)]),
    new Promise((resolve) => window.setTimeout(resolve, ART_TIMEOUT_MS)),
  ])
}

// A five-second title sequence: letterbox opens on the room, the avatar and
// name resolve, then everything dissolves and hands off to the door.
//
// One rAF loop writes CSS variables straight onto the root node; React never
// re-renders during playback, so nothing stutters behind the 4096px artwork.
export default function TitleSequence({ onDone }) {
  const rootRef = useRef(null)
  const doneRef = useRef(false)
  const reducedMotion = useRoomStore((s) => s.prefersReducedMotion)
  // Reduced motion shows the static card, so its skip is available at once.
  const [skipVisible, setSkipVisible] = useState(reducedMotion)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    if (reducedMotion) {
      // Show the finished title card briefly, then move on.
      const root = rootRef.current
      if (root) {
        const s = introState(2500)
        for (const [key, value] of Object.entries(s)) {
          if (typeof value === 'number') root.style.setProperty(`--${key}`, String(value))
        }
      }
      const timer = window.setTimeout(finish, 1400)
      return () => window.clearTimeout(timer)
    }

    let frame = 0
    let start = 0
    let cancelled = false
    const tick = (now) => {
      if (!start) start = now
      const elapsed = now - start
      const root = rootRef.current
      if (root) {
        const s = introState(elapsed)
        root.style.setProperty('--bar', `${s.bar}%`)
        root.style.setProperty('--hairline', String(s.hairline))
        root.style.setProperty('--frame-opacity', String(s.frameOpacity))
        root.style.setProperty('--frame-scale', String(s.frameScale))
        root.style.setProperty('--frame-shift', `${s.frameShift}%`)
        root.style.setProperty('--avatar', String(s.avatar))
        root.style.setProperty('--title', String(s.title))
        root.style.setProperty('--rule', String(s.rule))
        root.style.setProperty('--subtitle', String(s.subtitle))
        root.style.setProperty('--caption', String(s.caption))
      }
      if (elapsed >= INTRO_DURATION_MS) {
        finish()
        return
      }
      frame = window.requestAnimationFrame(tick)
    }

    let skipTimer = 0
    whenArtReady().then(() => {
      if (cancelled) return
      // Marks the exact moment playback begins -- the recorder waits on this.
      if (rootRef.current) rootRef.current.dataset.playing = 'true'
      frame = window.requestAnimationFrame(tick)
      skipTimer = window.setTimeout(() => setSkipVisible(true), 900)
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.clearTimeout(skipTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab') return
      finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Grouped by word so the name never breaks mid-word, with one running
  // index across the whole title so the reveal staggers continuously.
  const words = useMemo(() => {
    let index = 0
    return TITLE_TEXT.split(' ').map((word) => ({
      word,
      letters: [...word].map((char) => ({ char, index: index++ })),
    }))
  }, [])

  return (
    <div className="intro" ref={rootRef} onClick={finish} role="presentation">
      <div className="intro__frame" aria-hidden="true">
        <img className="intro__room" src={ROOM_IMAGE.src} alt="" decoding="async" />
        <span className="intro__wash" />
        <img className="intro__avatar" src={AVATAR_SRC} alt="" decoding="async" />
      </div>

      <div className="intro__grain" aria-hidden="true" />
      <span className="intro__hairline" aria-hidden="true" />

      <div className="intro__type">
        <h1 className="intro__title">
          <span className="sr-only">{person.name}</span>
          {words.map(({ word, letters }) => (
            <span className="intro__word" key={word} aria-hidden="true">
              {letters.map(({ char, index }) => (
                <span className="intro__letter" key={`${char}-${index}`} style={{ '--i': index }}>
                  {char}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <span className="intro__rule" aria-hidden="true" />
        <p className="intro__subtitle">{SUBTITLE}</p>
        <p className="intro__caption">{CAPTION}</p>
      </div>

      <span className="intro__bar intro__bar--top" aria-hidden="true" />
      <span className="intro__bar intro__bar--bottom" aria-hidden="true" />

      <button
        type="button"
        className={`intro__skip${skipVisible ? ' intro__skip--visible' : ''}`}
        onClick={finish}
      >
        Skip intro
      </button>
    </div>
  )
}
