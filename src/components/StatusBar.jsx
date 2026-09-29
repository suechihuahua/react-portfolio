import { useEffect, useState } from 'react'
import { person, sections } from '../content/site.js'
import { useConsoleStore } from '../store/useConsoleStore.js'

function useLocalTime(timeZone) {
  const read = () =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())

  const [time, setTime] = useState(read)
  useEffect(() => {
    const id = window.setInterval(() => setTime(read()), 30000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone])
  return time
}

// The strip along the bottom: where you are, how to move, and the time where
// he actually is.
export default function StatusBar() {
  const activeSlug = useConsoleStore((s) => s.activeSlug)
  const time = useLocalTime(person.timezone)
  const index = sections.findIndex((s) => s.slug === activeSlug)
  const current = index < 0 ? null : sections[index]

  return (
    <footer className="status">
      <span className="status__cell status__cell--mode">{current ? 'SECTION' : 'HOME'}</span>
      <span className="status__cell">
        {current ? `${String(index + 1).padStart(2, '0')}/${String(sections.length).padStart(2, '0')}` : '––'}
        <span className="status__dim">{current ? current.label : 'overview'}</span>
      </span>
      <span className="status__cell status__keys">
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        <span className="status__dim">navigate</span>
        <kbd>⌘K</kbd>
        <span className="status__dim">search</span>
      </span>
      <span className="status__cell status__cell--right">
        <span className="status__dim">{person.location}</span>
        <span className="status__time">{time}</span>
      </span>
    </footer>
  )
}
