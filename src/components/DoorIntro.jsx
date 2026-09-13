import { useEffect, useState } from 'react'
import { useRoomStore } from '../store/useRoomStore.js'

const OPEN_DURATION = 1500

// A lone weathered door on black. Click, tap, or press Enter to open it; the
// light spills out and the layout cross-fades into the room.
export default function DoorIntro() {
  const enter = useRoomStore((s) => s.enter)
  const reducedMotion = useRoomStore((s) => s.prefersReducedMotion)
  const [opening, setOpening] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setHintVisible(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!opening) return undefined
    if (reducedMotion) {
      enter()
      return undefined
    }
    const timer = window.setTimeout(enter, OPEN_DURATION)
    return () => window.clearTimeout(timer)
  }, [opening, reducedMotion, enter])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') setOpening(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`door-intro${opening ? ' door-intro--opening' : ''}`}>
      <button
        type="button"
        className="door"
        aria-label="Open the door and enter"
        onClick={() => setOpening(true)}
      >
        <span className="door__frame" aria-hidden="true">
          <span className="door__light" />
          <span className="door__leaf">
            <span className="door__panel door__panel--a" />
            <span className="door__panel door__panel--b" />
            <span className="door__panel door__panel--c" />
            <span className="door__panel door__panel--d" />
            <span className="door__panel door__panel--e" />
            <span className="door__panel door__panel--f" />
            <span className="door__knob" />
          </span>
          <span className="door__step" />
        </span>
      </button>
      <p className={`door-intro__hint${hintVisible ? ' door-intro__hint--visible' : ''}`}>
        click to enter
      </p>
    </div>
  )
}
