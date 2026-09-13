import { Link } from 'react-router-dom'
import { person, sections } from '../content/site.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function Home() {
  useDocumentTitle(`${person.name} — portfolio`)

  return (
    <section className="home">
      <p className="home__kicker">Portfolio</p>
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

      <nav className="contents" aria-label="Sections">
        <p className="contents__title">Look around</p>
        <ul className="contents__list">
          {sections.map((section, i) => (
            <li className="contents__item" key={section.slug} style={{ '--i': i }}>
              <Link to={section.slug} className="contents__link">
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
