import { describe, it, expect } from 'vitest'
import { coverSize, getCameraTransform } from './camera.js'

const room = { width: 3072, height: 880 }

describe('coverSize', () => {
  it('fills a widescreen viewport by height', () => {
    const size = coverSize(room, { width: 1440, height: 900 })
    expect(size.height).toBeCloseTo(900)
    expect(size.width).toBeGreaterThan(1440)
  })

  it('fills a portrait viewport by height too', () => {
    const size = coverSize(room, { width: 375, height: 812 })
    expect(size.height).toBeCloseTo(812)
  })
})

describe('getCameraTransform', () => {
  const spot = { x: 60, y: 55, zoom: 1.8 }

  it.each([
    [1440, 900, false],
    [768, 1024, true],
    [375, 812, true],
  ])('keeps the stage covering a %ix%i viewport', (width, height, narrow) => {
    const t = getCameraTransform(spot, room, { width, height }, { narrow })
    expect(t.x).toBeLessThanOrEqual(0)
    expect(t.y).toBeLessThanOrEqual(0)
    expect(t.x + t.width * t.zoom).toBeGreaterThanOrEqual(width)
    expect(t.y + t.height * t.zoom).toBeGreaterThanOrEqual(height)
  })

  it('lands the spot on the focus point when there is room to pan', () => {
    const viewport = { width: 1440, height: 900 }
    const t = getCameraTransform(spot, room, viewport)
    const spotX = t.x + (spot.x / 100) * t.width * t.zoom
    const spotY = t.y + (spot.y / 100) * t.height * t.zoom
    expect(spotX).toBeCloseTo(viewport.width * 0.7, 5)
    expect(spotY).toBeCloseTo(viewport.height * 0.48, 5)
    const narrowViewport = { width: 375, height: 812 }
    const n = getCameraTransform({ x: 50, y: 50, zoom: 1.4 }, room, narrowViewport, { narrow: true })
    expect(n.y + 0.5 * n.height * n.zoom).toBeCloseTo(narrowViewport.height * 0.42, 5)
  })

  it('zooms less on narrow viewports', () => {
    const wide = getCameraTransform(spot, room, { width: 1440, height: 900 })
    const narrow = getCameraTransform(spot, room, { width: 375, height: 812 }, { narrow: true })
    expect(narrow.zoom).toBeLessThan(wide.zoom)
  })
})
