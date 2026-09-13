import { describe, it, expect } from 'vitest'
import {
  keyOutCheckerboard,
  keyOutEnclosedCheckers,
  defringe,
  opaqueBounds,
  isCheckerPixel,
} from './keying.mjs'

function makeImage(width, height, paint) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const checker = ((x >> 2) + (y >> 2)) % 2 === 0 ? 255 : 236
      const [r, g, b] = paint(x, y) ?? [checker, checker, checker]
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  return data
}

describe('isCheckerPixel', () => {
  it('accepts white and light grey, rejects colour and dark pixels', () => {
    expect(isCheckerPixel([255, 255, 255, 255], 0)).toBe(true)
    expect(isCheckerPixel([236, 236, 236, 255], 0)).toBe(true)
    expect(isCheckerPixel([80, 80, 80, 255], 0)).toBe(false)
    expect(isCheckerPixel([230, 200, 180, 255], 0)).toBe(false)
  })
})

describe('keyOutCheckerboard', () => {
  const W = 40
  const H = 40
  // A dark blob in the middle wearing a pure-white "shirt" square.
  const blob = (x, y) => {
    if (x >= 10 && x < 30 && y >= 8 && y < 34) {
      return x >= 16 && x < 24 && y >= 14 && y < 20 ? [255, 255, 255] : [40, 30, 30]
    }
    return null
  }

  it('clears the checkerboard around the character', () => {
    const data = keyOutCheckerboard(makeImage(W, H, blob), W, H)
    expect(data[(2 * W + 2) * 4 + 3]).toBe(0)
    expect(data[(37 * W + 37) * 4 + 3]).toBe(0)
  })

  it('keeps white pixels enclosed by the character', () => {
    const data = keyOutCheckerboard(makeImage(W, H, blob), W, H)
    expect(data[(16 * W + 18) * 4 + 3]).toBe(255)
    expect(data[(20 * W + 12) * 4 + 3]).toBe(255)
  })

  it('reports the character bounding box', () => {
    const data = keyOutCheckerboard(makeImage(W, H, blob), W, H)
    expect(opaqueBounds(data, W, H)).toEqual({ x: 10, y: 8, width: 20, height: 26 })
  })

  it('clears a checkerboard pocket enclosed by the character', () => {
    // Dark ring (x 4..36) with a checkerboard hole in the middle (x 14..26).
    const ring = (x, y) => {
      const inOuter = x >= 4 && x < 36 && y >= 4 && y < 36
      const inHole = x >= 14 && x < 26 && y >= 14 && y < 26
      if (inOuter && !inHole) return [40, 30, 30]
      return null
    }
    const data = keyOutCheckerboard(makeImage(W, H, ring), W, H)
    expect(data[(20 * W + 20) * 4 + 3]).toBe(255)
    keyOutEnclosedCheckers(data, W, H, { minSize: 20 })
    expect(data[(20 * W + 20) * 4 + 3]).toBe(0)
    expect(data[(10 * W + 10) * 4 + 3]).toBe(255)
  })

  it('keeps a shaded white patch enclosed by the character', () => {
    const shirt = (x, y) => {
      const inOuter = x >= 4 && x < 36 && y >= 4 && y < 36
      const inPatch = x >= 14 && x < 26 && y >= 14 && y < 26
      if (inOuter && !inPatch) return [40, 30, 30]
      if (inPatch) {
        const v = 255 - (y - 14) * 5 // smooth shading ramp 255 → 200
        return [v, v, v]
      }
      return null
    }
    const data = keyOutCheckerboard(makeImage(W, H, shirt), W, H)
    keyOutEnclosedCheckers(data, W, H, { minSize: 20 })
    expect(data[(20 * W + 20) * 4 + 3]).toBe(255)
  })

  it('defringe drops light edge pixels but keeps dark ones and light interiors', () => {
    // Dark blob with a one-pixel light halo (the anti-aliased checker edge).
    const halo = (x, y) => {
      if (x >= 10 && x < 30 && y >= 10 && y < 30) return [40, 30, 30]
      if (x >= 9 && x < 31 && y >= 9 && y < 31) return [230, 230, 230]
      return null
    }
    const data = keyOutCheckerboard(makeImage(W, H, halo), W, H)
    defringe(data, W, H)
    expect(data[(9 * W + 15) * 4 + 3]).toBe(0) // halo gone
    expect(data[(10 * W + 15) * 4 + 3]).toBe(255) // dark edge kept
  })

  it('returns null bounds for a fully keyed image', () => {
    const data = keyOutCheckerboard(makeImage(W, H, () => null), W, H)
    expect(opaqueBounds(data, W, H)).toBeNull()
  })
})
