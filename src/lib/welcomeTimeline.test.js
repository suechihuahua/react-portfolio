import { describe, it, expect } from 'vitest'
import {
  WELCOME_DURATION_MS,
  COMMAND,
  BEATS,
  LINE_COUNT,
  beatProgress,
  welcomeState,
  resolvedCount,
} from './welcomeTimeline.js'

describe('beatProgress', () => {
  it('is 0 before, 1 after, and rises in between', () => {
    expect(beatProgress(0, 'name')).toBe(0)
    expect(beatProgress(BEATS.name[0], 'name')).toBe(0)
    expect(beatProgress(BEATS.name[1], 'name')).toBe(1)
    const mid = beatProgress((BEATS.name[0] + BEATS.name[1]) / 2, 'name')
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })
})

describe('welcomeState', () => {
  it('starts with nothing typed and nothing printed', () => {
    const s = welcomeState(0)
    expect(s.commandChars).toBe(0)
    expect(s.lines).toBe(0)
    expect(s.name).toBe(0)
    expect(s.done).toBe(false)
  })

  it('types the command before printing any lines', () => {
    expect(welcomeState(BEATS.command[1]).commandChars).toBe(COMMAND.length)
    expect(welcomeState(BEATS.command[1]).lines).toBe(0)
  })

  it('prints every status line by the end of its beat', () => {
    expect(welcomeState(BEATS.lines[1]).lines).toBe(LINE_COUNT)
    expect(welcomeState(BEATS.lines[0] + 1).lines).toBeLessThan(LINE_COUNT)
  })

  it('runs the beats in order: command, lines, name, role, launch', () => {
    // Mid-beat, because a millisecond in nothing has visibly happened yet.
    const mid = (beat) => welcomeState((BEATS[beat][0] + BEATS[beat][1]) / 2)
    const startOf = (beat) => welcomeState(BEATS[beat][0])

    expect(mid('command').commandChars).toBeGreaterThan(0)
    expect(startOf('command').lines).toBe(0)

    expect(mid('lines').lines).toBeGreaterThan(0)
    expect(startOf('lines').name).toBe(0)

    expect(mid('name').name).toBeGreaterThan(0)
    expect(startOf('name').role).toBe(0)

    expect(mid('role').role).toBeGreaterThan(0)
    expect(startOf('role').launch).toBe(0)

    expect(mid('launch').launch).toBeGreaterThan(0)
  })

  it('fades everything out at the end', () => {
    const end = welcomeState(WELCOME_DURATION_MS)
    expect(end.fade).toBe(1)
    expect(end.alive).toBe(0)
    expect(end.role).toBe(0)
    expect(end.launch).toBe(0)
    expect(end.done).toBe(true)
  })

  it('clamps out-of-range times', () => {
    expect(welcomeState(-800).commandChars).toBe(0)
    expect(welcomeState(WELCOME_DURATION_MS + 9000).done).toBe(true)
    expect(welcomeState(WELCOME_DURATION_MS - 1).done).toBe(false)
  })
})

describe('resolvedCount', () => {
  it('settles no characters at the start and all of them at the end', () => {
    expect(resolvedCount(0, 13)).toBe(0)
    expect(resolvedCount(1, 13)).toBe(13)
  })

  it('never exceeds the length, and grows with progress', () => {
    const counts = [0, 0.25, 0.5, 0.75, 1].map((p) => resolvedCount(p, 13))
    expect(counts).toEqual([...counts].sort((a, b) => a - b))
    counts.forEach((c) => expect(c).toBeLessThanOrEqual(13))
  })
})
