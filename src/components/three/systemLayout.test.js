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
  it('gives every page a distinct radius outside the sun', () => {
    const radii = [0, 1, 2].map((i) => getOrbit(i, 3).radius)
    expect(new Set(radii).size).toBe(3)
    radii.forEach((r) => expect(r).toBeGreaterThan(SUN_RADIUS * 2))
  })

  it('works with a single page', () => {
    const orbit = getOrbit(0, 1)
    expect(orbit.radius).toBeGreaterThan(0)
    expect(Number.isFinite(orbit.startAngle)).toBe(true)
  })

  it('cycles through the three materials', () => {
    expect([0, 1, 2, 3].map((i) => getOrbit(i, 4).material)).toEqual([
      'ice',
      'metal',
      'molten',
      'ice',
    ])
  })

  it('tightens orbits on narrow viewports', () => {
    expect(getOrbit(2, 3, { narrow: true }).radius).toBeLessThan(getOrbit(2, 3).radius)
  })
})

describe('orbitPosition', () => {
  it('stays at the orbit radius all the way round', () => {
    const orbit = getOrbit(1, 3)
    for (let k = 0; k < 8; k += 1) {
      const p = orbitPosition(orbit, (k / 8) * Math.PI * 2)
      expect(dist(p, [0, 0, 0])).toBeCloseTo(orbit.radius, 5)
    }
  })
})

describe('cameras', () => {
  it('parks the camera outside the planet, looking at it', () => {
    const orbit = getOrbit(0, 3)
    const planet = orbitPosition(orbit, 1.2)
    const cam = getCameraTarget(planet, orbit)
    expect(cam.lookAt).toEqual(planet)
    expect(dist(cam.position, planet)).toBeGreaterThan(orbit.size * 3)
  })

  it('pulls the home camera back on narrow viewports', () => {
    expect(getHomeCamera({ narrow: true }, 3).position[2]).toBeGreaterThan(
      getHomeCamera({ narrow: false }, 3).position[2],
    )
  })
})
