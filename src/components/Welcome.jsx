import { useEffect, useRef } from 'react'
import { person, sections } from '../content/site.js'
import { useConsoleStore } from '../store/useConsoleStore.js'
import Ambient from './Ambient.jsx'
import {
  COMMAND,
  SCRAMBLE_CHARS,
  WELCOME_DURATION_MS,
  resolvedCount,
  welcomeState,
} from '../lib/welcomeTimeline.js'

const NAME = person.name.toUpperCase()
const LINES = [
  { label: 'profile', value: person.name },
  { label: 'sections', value: `${sections.length} mounted` },
  { label: 'ready', value: 'press ⌘K for commands' },
]
// Re-roll the unsettled characters every few frames, not every one -- any
// faster just reads as noise.
const SCRAMBLE_EVERY = 3

// A five-second welcome. One rAF loop writes CSS variables and the scrambling
// characters straight to the DOM, so React never re-renders during playback.
// Click anywhere, or press any key, to skip.
export default function Welcome({ onDone }) {
  const rootRef = useRef(null)
  const letterRefs = useRef([])
  const doneRef = useRef(false)
  const reducedMotion = useConsoleStore((s) => s.prefersReducedMotion)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    if (reducedMotion) {
      const root = rootRef.current
      if (root) {
        root.style.setProperty('--command', String(COMMAND.length))
        root.style.setProperty('--lines', String(LINES.length))
        root.style.setProperty('--role', '1')
        root.style.setProperty('--launch', '1')
        root.style.setProperty('--alive', '1')
      }
      letterRefs.current.forEach((el, i) => {
        if (el) el.textContent = NAME[i]
      })
      const timer = window.setTimeout(finish, 1200)
      return () => window.clearTimeout(timer)
    }

    let frame = 0
    let start = 0
    let tick = 0
    const step = (now) => {
      if (!start) start = now
      const elapsed = now - start
      const s = welcomeState(elapsed)
      const root = rootRef.current

      if (root) {
        root.style.setProperty('--command', String(s.commandChars))
        root.style.setProperty('--lines', String(s.lines))
        root.style.setProperty('--role', String(s.role))
        root.style.setProperty('--launch', String(s.launch))
        root.style.setProperty('--alive', String(s.alive))
      }

      const settled = resolvedCount(s.name, NAME.length)
      const reroll = tick % SCRAMBLE_EVERY === 0
      letterRefs.current.forEach((el, i) => {
        if (!el) return
        if (i < settled || NAME[i] === ' ') {
          if (el.textContent !== NAME[i]) el.textContent = NAME[i]
          el.dataset.settled = 'true'
        } else if (s.name > 0 && reroll) {
          el.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          el.dataset.settled = 'false'
        }
      })
      tick += 1

      if (elapsed >= WELCOME_DURATION_MS) {
        finish()
        return
      }
      frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
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

  return (
    <div className="welcome" ref={rootRef} onClick={finish} role="status" aria-label="Welcome">
      <Ambient />

      <div className="welcome__inner">
        <p className="welcome__cmd">
          <span className="welcome__user">
            {person.handle}@portfolio
          </span>
          <span className="welcome__sep">:~$</span>{' '}
          <span className="welcome__typed" aria-hidden="true">
            {[...COMMAND].map((char, i) => (
              <span className="welcome__char" key={i} style={{ '--i': i }}>
                {char}
              </span>
            ))}
          </span>
        </p>

        <ul className="welcome__lines">
          {LINES.map((line, i) => (
            <li className="welcome__line" key={line.label} style={{ '--i': i }}>
              <span className="welcome__ok">ok</span>
              <span className="welcome__label">{line.label}</span>
              <span className="welcome__value">{line.value}</span>
            </li>
          ))}
        </ul>

        <h1 className="welcome__name">
          <span className="sr-only">{person.name}</span>
          {[...NAME].map((char, i) => (
            <span
              className="welcome__letter"
              key={i}
              aria-hidden="true"
              ref={(el) => {
                letterRefs.current[i] = el
              }}
            >
              {char === ' ' ? ' ' : ''}
            </span>
          ))}
        </h1>

        <p className="welcome__role">
          {person.role} · {person.location}
        </p>

        <p className="welcome__launch">
          <span className="welcome__sep">$</span> launching console
          <span className="welcome__dots" aria-hidden="true" />
        </p>
      </div>

      <button type="button" className="welcome__skip" onClick={finish}>
        Skip <kbd>esc</kbd>
      </button>
    </div>
  )
}
