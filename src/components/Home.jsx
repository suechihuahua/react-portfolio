import { Link } from 'react-router-dom'
import { pages, person } from '../content/site.js'

export default function Home() {
  return (
    <section className="home">
      <h1 className="home__name">{person.name}</h1>
      <p className="home__tagline">{person.tagline}</p>

      <nav className="contents" aria-label="Contents">
        <p className="contents__title">Contents</p>
        <ul className="contents__list">
          {pages.map((page, i) => (
            <li
              className="contents__item"
              key={page.slug}
              style={{ '--i': i }}
            >
              <Link to={page.slug} className="contents__link">
                <span className="contents__label">{page.label}</span>
                <span className="contents__leader" aria-hidden="true" />
                <span className="contents__blurb">{page.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
