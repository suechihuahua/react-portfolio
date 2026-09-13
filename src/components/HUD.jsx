import { NavLink, Link } from 'react-router-dom'
import { pages, person } from '../content/site.js'
import { useSceneStore } from '../store/useSceneStore.js'

const navClass = ({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')

// Persistent plain-HTML console. Lives beside the canvas, never inside it, so
// every control is keyboard-reachable and visible to assistive tech.
export default function HUD() {
  const activeSlug = useSceneStore((s) => s.activeSlug)
  const simpleView = useSceneStore((s) => s.simpleView)
  const setSimpleView = useSceneStore((s) => s.setSimpleView)
  const current = pages.find((p) => p.slug === activeSlug)

  return (
    <header className="hud">
      <div className="hud__row">
        <Link to="/" className="hud__brand">
          <span className="hud__brand-name">{person.name}</span>
          <span className="hud__breadcrumb">
            sector // {current ? current.label.toLowerCase() : 'home'}
          </span>
        </Link>

        <div className="hud__controls">
          <a className="hud__button" href={person.resume} download>
            résumé
          </a>
          <button
            type="button"
            className="hud__button"
            onClick={() => setSimpleView(!simpleView)}
            aria-pressed={simpleView}
          >
            {simpleView ? 'simple view: on' : 'simple view'}
          </button>
        </div>
      </div>

      <nav className="hud__nav" aria-label="Sections">
        <NavLink to="/" end className={navClass}>
          home
        </NavLink>
        {pages.map((page) => (
          <NavLink key={page.slug} to={`/${page.slug}`} className={navClass}>
            {page.label.toLowerCase()}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
