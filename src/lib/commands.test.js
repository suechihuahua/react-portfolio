import { describe, it, expect } from 'vitest'
import { buildCommands, filterCommands, fuzzyScore, COMMAND_KINDS } from './commands.js'
import { sections, person } from '../content/site.js'

const commands = buildCommands(sections, person)

describe('buildCommands', () => {
  it('offers every section, numbered in order', () => {
    const sectionCommands = commands.filter((c) => c.kind === COMMAND_KINDS.section)
    expect(sectionCommands.map((c) => c.label)).toEqual(sections.map((s) => s.label))
    expect(sectionCommands.map((c) => c.badge)).toEqual(['01', '02', '03', '04', '05', '06'])
    expect(sectionCommands.map((c) => c.to)).toEqual(sections.map((s) => `/${s.slug}`))
  })

  it('includes the résumé, a copy-email action and the external links', () => {
    const byId = Object.fromEntries(commands.map((c) => [c.id, c]))
    expect(byId['action:resume'].href).toBe(person.resume)
    expect(byId['action:resume'].download).toBe(true)
    expect(byId['action:email'].copy).toBe(person.email)
    expect(byId['link:github'].href).toBe(person.github)
    expect(byId['link:linkedin'].external).toBe(true)
  })

  it('gives every command a unique id', () => {
    const ids = commands.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('fuzzyScore', () => {
  it('matches characters in order, anywhere in the text', () => {
    expect(fuzzyScore('Projects', 'prj')).not.toBeNull()
    expect(fuzzyScore('Projects', 'pts')).not.toBeNull()
  })

  it('rejects text missing a character or having them out of order', () => {
    expect(fuzzyScore('Projects', 'prz')).toBeNull()
    expect(fuzzyScore('Projects', 'sp')).toBeNull()
  })

  it('scores an earlier, tighter match better than a later, scattered one', () => {
    expect(fuzzyScore('Education', 'edu')).toBeLessThan(fuzzyScore('Grounded units', 'edu'))
  })

  it('is case-insensitive and treats an empty query as a match', () => {
    expect(fuzzyScore('Skills', 'SKI')).not.toBeNull()
    expect(fuzzyScore('anything', '   ')).toBe(0)
  })
})

describe('filterCommands', () => {
  it('returns everything for an empty query', () => {
    expect(filterCommands(commands, '')).toHaveLength(commands.length)
    expect(filterCommands(commands, '  ')).toHaveLength(commands.length)
  })

  it('puts the best label match first', () => {
    expect(filterCommands(commands, 'proj')[0].label).toBe('Projects')
    expect(filterCommands(commands, 'edu')[0].label).toBe('Education')
    expect(filterCommands(commands, 'git')[0].label).toBe('GitHub')
  })

  it('still finds a command through its keywords', () => {
    const labels = filterCommands(commands, 'cv').map((c) => c.label)
    expect(labels).toContain('Download résumé')
  })

  it('ranks a label match above a keyword-only match', () => {
    const results = filterCommands(commands, 'skills')
    expect(results[0].label).toBe('Skills')
  })

  it('returns nothing when no command matches', () => {
    expect(filterCommands(commands, 'zzzqqq')).toEqual([])
  })
})
