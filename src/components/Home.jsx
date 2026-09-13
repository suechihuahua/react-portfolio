import { Link } from 'react-router-dom'
import { pages, person } from '../content/site.js'
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

      <nav className="contents" aria-label="Contents">
        <p className="contents__title">Explore</p>
        <ul className="contents__list">
          {pages
            .filter((page) => page.sections.length > 0)
            .map((page, i) => (
              <li className="contents__item" key={page.slug} style={{ '--i': i }}>
                <Link to={page.slug} className="contents__link">
                  <span className="contents__label">{page.label}</span>
                  <span className="contents__leader" aria-hidden="true" />
                  <span className="contents__blurb">{page.planetName}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </section>
  )
}
