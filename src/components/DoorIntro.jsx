import { useEffect, useState } from 'react'
import { useRoomStore } from '../store/useRoomStore.js'

const OPEN_DURATION = 1700

function DoorLeaf() {
  return (
    <svg className="door__leaf" viewBox="0 0 200 430" aria-hidden="true">
      <defs>
        <filter id="door-grain" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves="3" seed="7" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.16" />
          </feComponentTransfer>
        </filter>
        <filter id="door-wear" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="3" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 0 0.35 0.7" />
          </feComponentTransfer>
        </filter>
        <linearGradient id="door-paint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2ede3" />
          <stop offset="0.55" stopColor="#e2dccf" />
          <stop offset="1" stopColor="#cfc7b6" />
        </linearGradient>
        <linearGradient id="panel-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece6d9" />
          <stop offset="1" stopColor="#d8d1c1" />
        </linearGradient>
        <linearGradient id="bevel-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf8f1" />
          <stop offset="1" stopColor="#b8b0a0" />
        </linearGradient>
        <radialGradient id="knob" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffe9b0" />
          <stop offset="0.6" stopColor="#c59a3c" />
          <stop offset="1" stopColor="#6d4f16" />
        </radialGradient>
      </defs>

      <rect width="200" height="430" fill="url(#door-paint)" />
      <rect width="200" height="430" fill="#5a4a36" filter="url(#door-wear)" opacity="0.55" />
      <rect width="200" height="430" fill="#000" filter="url(#door-grain)" />

      {[
        [18, 18, 74, 78],
        [108, 18, 74, 78],
        [18, 118, 74, 118],
        [108, 118, 74, 118],
        [18, 258, 74, 150],
        [108, 258, 74, 150],
      ].map(([px, py, pw, ph]) => (
        <g key={`${px}-${py}`}>
          <rect x={px} y={py} width={pw} height={ph} fill="url(#bevel-light)" />
          <rect x={px + 7} y={py + 7} width={pw - 14} height={ph - 14} fill="#a89f8e" />
          <rect x={px + 9} y={py + 9} width={pw - 18} height={ph - 18} fill="url(#panel-face)" />
        </g>
      ))}

      <rect x="0" y="0" width="200" height="430" fill="none" stroke="#9f9583" strokeWidth="3" />
      <rect x="6" y="18" width="5" height="34" rx="1" fill="#4b4238" />
      <rect x="6" y="378" width="5" height="34" rx="1" fill="#4b4238" />
      <circle cx="180" cy="228" r="9" fill="url(#knob)" />
      <circle cx="180" cy="228" r="13" fill="none" stroke="#7a5a1c" strokeWidth="1.5" opacity="0.7" />
      <rect x="170" y="244" width="20" height="12" rx="2" fill="#4a3a1a" opacity="0.5" />
    </svg>
  )
}

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
      <span className="door-intro__dust" aria-hidden="true" />
      <button
        type="button"
        className="door"
        aria-label="Open the door and enter"
        onClick={() => setOpening(true)}
      >
        <span className="door__scene" aria-hidden="true">
          <span className="door__rays" />
          <span className="door__frame">
            <span className="door__light" />
            <span className="door__hinge-side">
              <DoorLeaf />
            </span>
          </span>
          <span className="door__sill" />
          <span className="door__reflection">
            <DoorLeaf />
          </span>
        </span>
      </button>
      <p className={`door-intro__hint${hintVisible ? ' door-intro__hint--visible' : ''}`}>
        click to enter
      </p>
    </div>
  )
}
