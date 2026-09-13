import { NavLink, Link } from 'react-router-dom'
import { person, sections } from '../content/site.js'
import { useRoomStore } from '../store/useRoomStore.js'

const navClass = ({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')

// Persistent plain-HTML menu over the room, so every section is reachable by
// keyboard and screen reader without touching the illustrated stage.
export default function HUD() {
  const activeSlug = useRoomStore((s) => s.activeSlug)
  const voiceOn = useRoomStore((s) => s.voiceOn)
  const setVoiceOn = useRoomStore((s) => s.setVoiceOn)
  const current = sections.find((s) => s.slug === activeSlug)

  return (
    <header className="hud">
      <div className="hud__row">
        <Link to="/" className="hud__brand">
          <span className="hud__brand-name">{person.name}</span>
          <span className="hud__breadcrumb">{current ? current.label : 'My room'}</span>
        </Link>

        <div className="hud__controls">
          <a className="hud__button" href={person.resume} download>
            Résumé
          </a>
          <button
            type="button"
            className="hud__button"
            onClick={() => setVoiceOn(!voiceOn)}
            aria-pressed={voiceOn}
          >
            {voiceOn ? 'Voice: on' : 'Voice: off'}
          </button>
        </div>
      </div>

      <nav className="hud__nav" aria-label="Sections">
        <NavLink to="/" end className={navClass}>
          Room
        </NavLink>
        {sections.map((section) => (
          <NavLink key={section.slug} to={`/${section.slug}`} className={navClass}>
            {section.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
