import { Link } from 'react-router-dom'
import { person, sections } from '../content/site.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const pad = (n) => String(n).padStart(2, '0')

export default function Home() {
  useDocumentTitle(`${person.name} — portfolio`)

  return (
    <section className="home">
      <p className="entry__eyebrow">Portfolio</p>
      <h1 className="home__name">{person.name}</h1>
      <p className="home__tagline">{person.tagline}</p>

      <div className="home__actions">
        <a className="button button--primary" href={person.resume} download>
          Download résumé
        </a>
        <a className="button" href={person.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>

      <nav className="index" aria-label="Sections">
        {sections.map((section, i) => (
          <Link className="index__row" to={section.slug} key={section.slug} style={{ '--i': i }}>
            <span className="index__num">{pad(i + 1)}</span>
            <span className="index__label">{section.label}</span>
            <span className="index__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </nav>
    </section>
  )
}
