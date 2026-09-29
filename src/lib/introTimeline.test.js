import { describe, it, expect } from 'vitest'
import { INTRO_DURATION_MS, BEATS, beatProgress, introState } from './introTimeline.js'

describe('beatProgress', () => {
  it('is 0 before the beat, 1 after, and rises in between', () => {
    expect(beatProgress(0, 'title')).toBe(0)
    expect(beatProgress(BEATS.title[0], 'title')).toBe(0)
    expect(beatProgress(BEATS.title[1], 'title')).toBe(1)
    expect(beatProgress(INTRO_DURATION_MS, 'title')).toBe(1)
    const mid = beatProgress((BEATS.title[0] + BEATS.title[1]) / 2, 'title')
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })
})

describe('introState', () => {
  it('starts fully closed with nothing showing', () => {
    const s = introState(0)
    expect(s.bar).toBe(50)
    expect(s.frameOpacity).toBe(0)
    expect(s.title).toBe(0)
    expect(s.done).toBe(false)
  })

  it('opens the letterbox to its widest mid-sequence, then closes again', () => {
    const open = introState(2500)
    expect(open.bar).toBeCloseTo(11, 5)
    expect(introState(INTRO_DURATION_MS).bar).toBeCloseTo(50, 5)
  })

  it('shows the frame only while the letterbox is open', () => {
    expect(introState(300).frameOpacity).toBe(0)
    expect(introState(2500).frameOpacity).toBeCloseTo(1, 5)
    expect(introState(INTRO_DURATION_MS).frameOpacity).toBeCloseTo(0, 5)
  })

  it('reveals title, then subtitle, then caption', () => {
    // The beats overlap on purpose -- each line crossfades into the next --
    // so assert the order they *start*, not that they are exclusive.
    expect(introState(BEATS.title[0] + 1).title).toBeGreaterThan(0)
    expect(introState(BEATS.title[0] + 1).subtitle).toBe(0)
    expect(introState(BEATS.subtitle[0] + 1).subtitle).toBeGreaterThan(0)
    expect(introState(BEATS.subtitle[0] + 1).caption).toBe(0)
    expect(introState(BEATS.caption[0] + 1).caption).toBeGreaterThan(0)

    expect(introState(BEATS.title[1]).title).toBe(1)
    expect(introState(BEATS.subtitle[1]).subtitle).toBeCloseTo(1, 5)
    // The caption's beat runs past the start of the closing fade, so it is
    // brightest just before that fade begins.
    expect(introState(BEATS.close[0]).caption).toBeCloseTo(1, 1)
  })

  it('fades everything out together on the closing beat', () => {
    const end = introState(INTRO_DURATION_MS)
    expect(end.title).toBeCloseTo(0, 5)
    expect(end.subtitle).toBeCloseTo(0, 5)
    expect(end.caption).toBeCloseTo(0, 5)
    expect(end.avatar).toBeCloseTo(0, 5)
  })

  it('pushes in continuously and never scales below 1', () => {
    const scales = [0, 1000, 2500, 4000, INTRO_DURATION_MS].map((t) => introState(t).frameScale)
    for (let i = 1; i < scales.length; i += 1) expect(scales[i]).toBeLessThan(scales[i - 1])
    expect(scales.at(-1)).toBeGreaterThan(1)
  })

  it('clamps out-of-range times and reports done at the end', () => {
    expect(introState(-500).bar).toBe(50)
    expect(introState(INTRO_DURATION_MS + 9000).done).toBe(true)
    expect(introState(INTRO_DURATION_MS - 1).done).toBe(false)
  })
})
