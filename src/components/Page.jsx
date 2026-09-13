// Renders a page from its config. Add a new `kind` here and it's available to
// every page in src/content/site.js.
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { person } from '../content/site.js'

function Prose({ section }) {
  return (
    <>
      {section.heading && <h2 className="section__heading">{section.heading}</h2>}
      {section.paragraphs.map((text, i) => (
        <p className="section__prose" key={i}>
          {text}
        </p>
      ))}
    </>
  )
}

function ListSection({ section }) {
  return (
    <>
      {section.heading && <h2 className="section__heading">{section.heading}</h2>}
      <div className="grouplist">
        {section.groups.map((group) => (
          <div className="grouplist__group" key={group.name}>
            <p className="grouplist__name">{group.name}</p>
            <ul className="grouplist__items">
              {group.items.map((item) => (
                <li key={item}>
                  <span className="chip">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function Courses({ section }) {
  return (
    <>
      {section.heading && <h2 className="section__heading">{section.heading}</h2>}
      <div className="courses">
        {section.terms.map((term) => (
          <div className="courses__term" key={term.name} id={`term-${slugify(term.name)}`}>
            <p className="courses__termname">{term.name}</p>
            <ul className="courses__rows">
              {term.courses.map((course) => (
                <li className="courses__row" key={course.code}>
                  <span className="courses__code">{course.code}</span>
                  <span className="courses__title">{course.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}

function Projects({ section }) {
  return (
    <>
      {section.heading && <h2 className="section__heading">{section.heading}</h2>}
      <ul className="projects">
        {section.items.map((item) => (
          <li className="projects__item" key={item.title}>
            <div className="projects__head">
              <h3 className="projects__title">{item.title}</h3>
              {item.year && <span className="projects__year">{item.year}</span>}
            </div>
            <p className="projects__desc">{item.description}</p>
            {item.link && (
              <a
                className="projects__link"
                href={item.link}
                target="_blank"
                rel="noreferrer"
              >
                View source
              </a>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

const RENDERERS = {
  prose: Prose,
  list: ListSection,
  courses: Courses,
  projects: Projects,
}

export default function Page({ page }) {
  useDocumentTitle(`${person.name} — ${page.label}`)

  if (page.sections.length === 0) {
    return (
      <article className="entry entry--placeholder">
        <p className="entry__planet">Planet</p>
        <h1 className="entry__title">{page.planetName}</h1>
        <p className="entry__status">in development...</p>
        <p className="entry__note">
          Nothing here yet. Scroll, swipe, or use the menu to visit another planet.
        </p>
      </article>
    )
  }

  return (
    <article className="entry">
      <header className="entry__header">
        <p className="entry__planet">{page.planetName}</p>
        <h1 className="entry__title">{page.label}</h1>
        {page.blurb && <p className="entry__blurb">{page.blurb}</p>}
      </header>

      {page.sections.map((section, i) => {
        const Renderer = RENDERERS[section.kind] || Prose
        return (
          <section className="section" key={i}>
            <Renderer section={section} />
          </section>
        )
      })}
    </article>
  )
}
