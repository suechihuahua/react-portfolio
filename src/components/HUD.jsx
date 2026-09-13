import { NavLink, Link } from 'react-router-dom'
import { pages, person } from '../content/site.js'
import { useSceneStore } from '../store/useSceneStore.js'
import { useAmbientHum } from '../hooks/useAmbientHum.js'

// Persistent, plain-HTML heads-up display. Lives as a sibling to the canvas
// (never inside it), so every control here is a normal, keyboard-reachable,
// screen-reader-visible element -- the arrow/button-based alternative to
// dragging the camera around, per the accessibility requirements.
export default function HUD() {
  const activeSlug = useSceneStore((s) => s.activeSlug)
  const muted = useSceneStore((s) => s.muted)
  const toggleMuted = useSceneStore((s) => s.toggleMuted)
  const simpleView = useSceneStore((s) => s.simpleView)
  const setSimpleView = useSceneStore((s) => s.setSimpleView)

  useAmbientHum(muted)

  const current = pages.find((p) => p.slug === activeSlug)

  return (
    <div className="hud">
      <div className="hud__top">
        <Link to="/" className="hud__brand">
          <span className="hud__brand-name">{person.name}</span>
          <span className="hud__breadcrumb">// {current ? current.label : 'hub'}</span>
        </Link>

        <div className="hud__controls">
          <button
            type="button"
            className="hud__toggle"
            onClick={toggleMuted}
            aria-pressed={!muted}
          >
            {muted ? 'sound: off' : 'sound: on'}
          </button>
          <button
            type="button"
            className="hud__toggle"
            onClick={() => setSimpleView(!simpleView)}
            aria-pressed={simpleView}
          >
            {simpleView ? 'exit simple view' : 'reduce motion / simple view'}
          </button>
        </div>
      </div>

      <nav className="hud__nav" aria-label="Zones">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}>
          Hub
        </NavLink>
        {pages.map((page) => (
          <NavLink
            key={page.slug}
            to={`/${page.slug}`}
            className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
          >
            {page.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
