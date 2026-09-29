import { useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { person, sections } from '../content/site.js'
import { useRoomStore } from '../store/useRoomStore.js'

const navClass = ({ isActive }) => (isActive ? 'rail__link rail__link--active' : 'rail__link')
const pad = (n) => String(n).padStart(2, '0')

// The persistent index: plain HTML beside the illustrated stage, so every
// section is reachable by keyboard and screen reader. A numbered rail down
// the left on desktop; a chip scroller across the top on narrow screens.
export default function ChapterRail() {
  const activeSlug = useRoomStore((s) => s.activeSlug)
  const voiceOn = useRoomStore((s) => s.voiceOn)
  const setVoiceOn = useRoomStore((s) => s.setVoiceOn)
  const reducedMotion = useRoomStore((s) => s.prefersReducedMotion)

  const activeIndex = sections.findIndex((s) => s.slug === activeSlug)
  const progress = activeIndex < 0 ? 0 : (activeIndex + 1) / sections.length
  const navRef = useRef(null)

  // On narrow screens the rail is a horizontal scroller, so the current
  // section can sit off-screen. Bring it into view whenever it changes.
  useEffect(() => {
    const active = navRef.current?.querySelector('.rail__link--active')
    active?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeSlug, reducedMotion])

  return (
    <>
      <div className="progress" aria-hidden="true">
        <span className="progress__fill" style={{ '--progress': progress }} />
      </div>

      <header className="rail">
        <Link to="/" className="rail__brand">
          <span className="rail__name">{person.name}</span>
          <span className="rail__role">Computer Science · NTU</span>
        </Link>

        <nav className="rail__nav" aria-label="Sections" ref={navRef}>
          <NavLink to="/" end className={navClass}>
            <span className="rail__num">00</span>
            <span className="rail__label">The room</span>
          </NavLink>
          {sections.map((section, i) => (
            <NavLink key={section.slug} to={`/${section.slug}`} className={navClass}>
              <span className="rail__num">{pad(i + 1)}</span>
              <span className="rail__label">{section.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rail__actions">
          <a className="rail__button rail__button--primary" href={person.resume} download>
            Résumé
          </a>
          <button
            type="button"
            className="rail__button"
            onClick={() => setVoiceOn(!voiceOn)}
            aria-pressed={voiceOn}
          >
            {voiceOn ? 'Voice on' : 'Voice off'}
          </button>
        </div>
      </header>
    </>
  )
}
