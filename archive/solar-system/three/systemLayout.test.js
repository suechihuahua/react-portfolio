import { describe, it, expect } from 'vitest'
import {
  SUN_RADIUS,
  getOrbit,
  orbitPosition,
  getCameraTarget,
  getHomeCamera,
} from './systemLayout.js'

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

describe('getOrbit', () => {
  it('gives every planet a distinct radius outside the sun', () => {
    const radii = [...Array(8).keys()].map((i) => getOrbit(i, 8).radius)
    expect(new Set(radii).size).toBe(8)
    radii.forEach((r) => expect(r).toBeGreaterThan(SUN_RADIUS * 2))
  })

  it('works with a single page', () => {
    const orbit = getOrbit(0, 1)
    expect(orbit.radius).toBeGreaterThan(0)
    expect(Number.isFinite(orbit.startAngle)).toBe(true)
  })

  it('takes the planet size from the caller', () => {
    expect(getOrbit(4, 8, { size: 0.85 }).size).toBe(0.85)
  })

  it('tightens orbits on narrow viewports', () => {
    expect(getOrbit(2, 8, { narrow: true }).radius).toBeLessThan(getOrbit(2, 8).radius)
  })
})

describe('orbitPosition', () => {
  it('stays at the orbit radius all the way round', () => {
    const orbit = getOrbit(1, 8)
    for (let k = 0; k < 8; k += 1) {
      const p = orbitPosition(orbit, (k / 8) * Math.PI * 2)
      expect(dist(p, [0, 0, 0])).toBeCloseTo(orbit.radius, 5)
    }
  })
})

describe('cameras', () => {
  it.each([
    [0, 0.22],
    [4, 0.85],
    [7, 0.48],
  ])('parks the camera outside planet %i on its sun-lit side', (index, size) => {
    const orbit = getOrbit(index, 8, { size })
    const planet = orbitPosition(orbit, 1.2)
    const cam = getCameraTarget(planet, orbit)
    // Aimed just beside the planet so it lands clear of the content card.
    expect(dist(cam.lookAt, planet)).toBeLessThan(dist(cam.position, planet))
    expect(dist(cam.position, planet)).toBeGreaterThan(size * 3)
    // Closer to the sun than the planet is, so the lit face points at us,
    // but never inside the sun itself.
    expect(dist(cam.position, [0, 0, 0])).toBeLessThan(dist(planet, [0, 0, 0]))
    expect(dist(cam.position, [0, 0, 0])).toBeGreaterThan(SUN_RADIUS * 1.6)
  })

  it('aims below the planet on narrow viewports so it sits above the sheet', () => {
    const orbit = getOrbit(2, 8, { size: 0.36 })
    const planet = orbitPosition(orbit, 0.7)
    const cam = getCameraTarget(planet, orbit, { narrow: true })
    expect(cam.lookAt[1]).toBeLessThan(planet[1])
    expect(cam.lookAt[0]).toBeCloseTo(planet[0], 5)
  })

  it('pulls the home camera back on narrow viewports', () => {
    expect(getHomeCamera({ narrow: true }, 8).position[2]).toBeGreaterThan(
      getHomeCamera({ narrow: false }, 8).position[2],
    )
  })
})
