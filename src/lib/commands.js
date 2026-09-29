// Everything the command palette can do, and how a query narrows it down.
// Pure: no React, no DOM, so the matching is unit-tested on its own.

export const COMMAND_KINDS = { section: 'section', action: 'action', link: 'link' }

const pad = (n) => String(n).padStart(2, '0')

export function buildCommands(sections, person) {
  const sectionCommands = sections.map((section, i) => ({
    id: `section:${section.slug}`,
    kind: COMMAND_KINDS.section,
    label: section.label,
    hint: section.summary,
    badge: pad(i + 1),
    to: `/${section.slug}`,
    keywords: section.slug,
  }))

  const actions = [
    {
      id: 'action:home',
      kind: COMMAND_KINDS.action,
      label: 'Home',
      hint: 'Back to the overview',
      badge: '00',
      to: '/',
      keywords: 'start overview root',
    },
    {
      id: 'action:resume',
      kind: COMMAND_KINDS.action,
      label: 'Download résumé',
      hint: 'PDF',
      badge: '↓',
      href: person.resume,
      download: true,
      keywords: 'cv resume pdf',
    },
    {
      id: 'action:email',
      kind: COMMAND_KINDS.action,
      label: 'Copy email address',
      hint: person.email,
      badge: '⧉',
      copy: person.email,
      keywords: 'mail contact clipboard',
    },
  ]

  const links = [
    {
      id: 'link:github',
      kind: COMMAND_KINDS.link,
      label: 'GitHub',
      hint: person.github.replace('https://', ''),
      badge: '↗',
      href: person.github,
      external: true,
      keywords: 'code repos source',
    },
    {
      id: 'link:linkedin',
      kind: COMMAND_KINDS.link,
      label: 'LinkedIn',
      hint: person.linkedin.replace('https://', ''),
      badge: '↗',
      href: person.linkedin,
      external: true,
      keywords: 'profile work network',
    },
    {
      id: 'link:ntu-email',
      kind: COMMAND_KINDS.link,
      label: 'Email (NTU)',
      hint: person.ntuEmail,
      badge: '↗',
      href: `mailto:${person.ntuEmail}`,
      keywords: 'school university mail contact',
    },
  ]

  return [...sectionCommands, ...actions, ...links]
}

// Subsequence match: every query character must appear in order. Returns a
// score where lower is better -- earlier and tighter matches win -- or null
// when the text does not match at all.
export function fuzzyScore(text, query) {
  const haystack = text.toLowerCase()
  const needle = query.toLowerCase().trim()
  if (!needle) return 0

  let at = 0
  let score = 0
  let previous = -1
  for (const char of needle) {
    const found = haystack.indexOf(char, at)
    if (found === -1) return null
    // Distance from the start, plus any gap since the last matched character.
    score += found + (previous === -1 ? 0 : found - previous - 1)
    previous = found
    at = found + 1
  }
  return score
}

export function filterCommands(commands, query) {
  const trimmed = query.trim()
  if (!trimmed) return commands

  return commands
    .map((command) => {
      // Label matches beat keyword or hint matches, so weight them.
      const onLabel = fuzzyScore(command.label, trimmed)
      const onRest = fuzzyScore(`${command.keywords ?? ''} ${command.hint ?? ''}`, trimmed)
      if (onLabel === null && onRest === null) return null
      const score = onLabel === null ? onRest + 1000 : onLabel
      return { command, score }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.command.label.localeCompare(b.command.label))
    .map(({ command }) => command)
}
