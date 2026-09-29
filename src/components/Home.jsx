import { Link } from 'react-router-dom'
import { person, sections } from '../content/site.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useConsoleStore } from '../store/useConsoleStore.js'
import Prompt from './Prompt.jsx'

const pad = (n) => String(n).padStart(2, '0')

export default function Home() {
  useDocumentTitle(`${person.name} — portfolio`)
  const openPalette = useConsoleStore((s) => s.openPalette)

  return (
    <section className="screen">
      <Prompt path="/" />

      <header className="screen__head">
        <p className="screen__meta">
          <span className="screen__num">$</span>
          <span className="screen__of">whoami</span>
        </p>
        <h1 className="screen__title screen__title--name">{person.name}</h1>
        <p className="screen__summary">{person.tagline}</p>
      </header>

      <div className="home__actions">
        <button type="button" className="btn btn--primary" onClick={openPalette}>
          Search <kbd>⌘K</kbd>
        </button>
        <a className="btn" href={person.resume} download>
          Résumé <span aria-hidden="true">↓</span>
        </a>
      </div>

      <nav className="dir" aria-label="Sections">
        {sections.map((section, i) => (
          <Link className="dir__row" to={section.slug} key={section.slug} style={{ '--i': i }}>
            <span className="dir__num">{pad(i + 1)}</span>
            <span className="dir__label">{section.label}</span>
            <span className="dir__summary">{section.summary}</span>
            <span className="dir__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </nav>
    </section>
  )
}
