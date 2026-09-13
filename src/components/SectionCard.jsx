import { person } from '../content/site.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function Prose({ block }) {
  return (
    <>
      {block.heading && <h2 className="block__heading">{block.heading}</h2>}
      {block.paragraphs.map((text, i) => (
        <p className="block__prose" key={i}>
          {text}
        </p>
      ))}
    </>
  )
}

function ListBlock({ block }) {
  return (
    <>
      {block.heading && <h2 className="block__heading">{block.heading}</h2>}
      <div className="grouplist">
        {block.groups.map((group) => (
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

function Timeline({ block }) {
  return (
    <ol className="timeline">
      {block.items.map((item) => (
        <li className="timeline__item" key={item.title}>
          <p className="timeline__period">{item.period}</p>
          <h3 className="timeline__title">{item.title}</h3>
          {item.subtitle && <p className="timeline__subtitle">{item.subtitle}</p>}
          {item.points && (
            <ul className="timeline__points">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}

function Projects({ block }) {
  return (
    <ul className="projects">
      {block.items.map((item) => (
        <li className="projects__item" key={item.title}>
          <div className="projects__head">
            <h3 className="projects__title">{item.title}</h3>
            {item.year && <span className="projects__year">{item.year}</span>}
          </div>
          <p className="projects__desc">{item.description}</p>
          {item.link && (
            <a className="projects__link" href={item.link} target="_blank" rel="noreferrer">
              View source
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

const RENDERERS = { prose: Prose, list: ListBlock, timeline: Timeline, projects: Projects }

export default function SectionCard({ section }) {
  useDocumentTitle(`${person.name} — ${section.label}`)

  return (
    <article className="entry">
      <header className="entry__header">
        <h1 className="entry__title">{section.label}</h1>
      </header>
      {section.blocks.map((block, i) => {
        const Renderer = RENDERERS[block.kind] || Prose
        return (
          <section className="block" key={i}>
            <Renderer block={block} />
          </section>
        )
      })}
    </article>
  )
}
