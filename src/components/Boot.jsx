import { useEffect, useState } from 'react'
import { person, sections } from '../content/site.js'
import { useConsoleStore } from '../store/useConsoleStore.js'

const LINE_MS = 260

const LINES = [
  { label: 'profile', value: person.name },
  { label: 'sections', value: `${sections.length} mounted` },
  { label: 'ready', value: 'press ⌘K for commands' },
]

// A short boot, not a gate: three status lines, then the console. Runs once
// per session, skips on any key or click, and is instant under reduced motion.
export default function Boot({ onDone }) {
  const reducedMotion = useConsoleStore((s) => s.prefersReducedMotion)
  const [shown, setShown] = useState(reducedMotion ? LINES.length : 0)

  useEffect(() => {
    if (reducedMotion) {
      const timer = window.setTimeout(onDone, 200)
      return () => window.clearTimeout(timer)
    }
    if (shown >= LINES.length) {
      const timer = window.setTimeout(onDone, LINE_MS)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setShown((n) => n + 1), LINE_MS)
    return () => window.clearTimeout(timer)
  }, [shown, reducedMotion, onDone])

  useEffect(() => {
    const skip = (e) => {
      if (e.type === 'keydown' && e.key === 'Tab') return
      onDone()
    }
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <div className="boot" role="status" aria-label="Loading">
      <div className="boot__lines">
        <p className="boot__cmd">
          <span className="boot__prompt">{person.handle}@portfolio</span>
          <span className="boot__sep">:~$</span> ./init
        </p>
        {LINES.slice(0, shown).map((line) => (
          <p className="boot__line" key={line.label}>
            <span className="boot__ok">ok</span>
            <span className="boot__label">{line.label}</span>
            <span className="boot__value">{line.value}</span>
          </p>
        ))}
        <span className="boot__caret" aria-hidden="true" />
      </div>
    </div>
  )
}
