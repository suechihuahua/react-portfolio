import { person } from '../content/site.js'

// The path line at the top of every screen -- the console's address bar.
export default function Prompt({ path }) {
  return (
    <p className="prompt">
      <span className="prompt__user">{person.handle}</span>
      <span className="prompt__at">@</span>
      <span className="prompt__host">portfolio</span>
      <span className="prompt__path">:~{path}</span>
      <span className="prompt__sign">$</span>
      <span className="prompt__caret" aria-hidden="true" />
    </p>
  )
}
