import { describe, it, expect } from 'vitest'
import { detectRenderTier } from './renderTier.js'

const strong = {
  webgl2: true,
  reducedMotion: false,
  simpleView: false,
  viewportWidth: 1440,
  cores: 8,
  deviceMemory: 8,
  saveData: false,
}

describe('detectRenderTier', () => {
  it('returns full for a strong desktop', () => {
    expect(detectRenderTier(strong)).toBe('full')
  })

  it.each([
    ['no webgl2', { webgl2: false }],
    ['reduced motion', { reducedMotion: true }],
    ['simple view toggle', { simpleView: true }],
  ])('returns static for %s', (_, override) => {
    expect(detectRenderTier({ ...strong, ...override })).toBe('static')
  })

  it.each([
    ['narrow viewport', { viewportWidth: 768 }],
    ['few cores', { cores: 4 }],
    ['low memory', { deviceMemory: 4 }],
    ['save-data', { saveData: true }],
  ])('returns lite for %s', (_, override) => {
    expect(detectRenderTier({ ...strong, ...override })).toBe('lite')
  })

  it('static beats lite when both apply', () => {
    expect(detectRenderTier({ ...strong, viewportWidth: 375, reducedMotion: true })).toBe('static')
  })
})
