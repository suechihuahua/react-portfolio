import { useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { person, sections } from '../content/site.js'
import { useConsoleStore } from '../store/useConsoleStore.js'

const navClass = ({ isActive }) => (isActive ? 'nav__item nav__item--active' : 'nav__item')
const pad = (n) => String(n).padStart(2, '0')

export default function Sidebar() {
  const activeSlug = useConsoleStore((s) => s.activeSlug)
  const openPalette = useConsoleStore((s) => s.openPalette)
  const reducedMotion = useConsoleStore((s) => s.prefersReducedMotion)
  const navRef = useRef(null)

  // The sidebar becomes a horizontal scroller on narrow screens, where the
  // current section can sit off-frame.
  useEffect(() => {
    navRef.current?.querySelector('.nav__item--active')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeSlug, reducedMotion])

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar__brand">
        <span className="sidebar__name">{person.name}</span>
        <span className="sidebar__role">{person.role}</span>
      </Link>

      <nav className="nav" aria-label="Sections" ref={navRef}>
        {sections.map((section, i) => (
          <NavLink key={section.slug} to={`/${section.slug}`} className={navClass}>
            <span className="nav__num">{pad(i + 1)}</span>
            <span className="nav__label">{section.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__foot">
        <button type="button" className="sidebar__search" onClick={openPalette}>
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
        <a className="sidebar__link" href={person.resume} download>
          Résumé
          <span aria-hidden="true">↓</span>
        </a>
        <a className="sidebar__link" href={person.github} target="_blank" rel="noreferrer">
          GitHub
          <span aria-hidden="true">↗</span>
        </a>
        <a className="sidebar__link" href={person.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </aside>
  )
}
