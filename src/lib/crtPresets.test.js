import { describe, it, expect } from 'vitest'
import {
  RANGES,
  VARIANTS,
  VARIANT_NAMES,
  DEFAULT_VARIANT,
  clamp,
  clampSettings,
  resolveConfig,
  hexToRgb,
} from './crtPresets.js'

describe('variants', () => {
  it('defaults to nintendo and offers more than one variant', () => {
    expect(DEFAULT_VARIANT).toBe('nintendo')
    expect(VARIANT_NAMES.length).toBeGreaterThan(1)
    expect(VARIANT_NAMES[0]).toBe('nintendo')
  })

  it('gives every variant the full set of shader fields', () => {
    const required = [
      'label', 'screen', 'ink', 'accent', 'curve', 'scanline',
      'mask', 'aberration', 'noise', 'vignette', 'mono', 'settings',
    ]
    for (const [name, variant] of Object.entries(VARIANTS)) {
      for (const key of required) {
        expect(variant, `${name}.${key}`).toHaveProperty(key)
      }
    }
  })
})

describe('clamp', () => {
  it('holds a value inside its range', () => {
    expect(clamp(5, [0, 3])).toBe(3)
    expect(clamp(-2, [0, 3])).toBe(0)
    expect(clamp(1.5, [0, 3])).toBe(1.5)
  })

  it('falls back to the minimum for values that are not numbers', () => {
    expect(clamp(Number.NaN, [0.4, 1.6])).toBe(0.4)
    expect(clamp(Infinity, [0, 1])).toBe(0)
  })
})

describe('clampSettings', () => {
  it('keeps only known keys, clamped', () => {
    const out = clampSettings({ speed: 99, hue: -900, nonsense: 5 })
    expect(out).toEqual({ speed: RANGES.speed[1], hue: RANGES.hue[0] })
    expect(out).not.toHaveProperty('nonsense')
  })

  it('returns nothing for an empty input', () => {
    expect(clampSettings()).toEqual({})
  })
})

describe('resolveConfig', () => {
  it('resolves the named variant with its own settings', () => {
    const config = resolveConfig('gameboy')
    expect(config.variant).toBe('gameboy')
    expect(config.mono).toBe(1)
    expect(config.speed).toBe(VARIANTS.gameboy.settings.speed)
  })

  it('falls back to the default for an unknown variant', () => {
    expect(resolveConfig('nope').variant).toBe(DEFAULT_VARIANT)
    expect(resolveConfig(undefined).variant).toBe(DEFAULT_VARIANT)
  })

  it('lets overrides win, still clamped', () => {
    const config = resolveConfig('nintendo', { speed: 99, saturation: 0.2 })
    expect(config.speed).toBe(RANGES.speed[1])
    expect(config.saturation).toBe(0.2)
  })

  it('always supplies a boot speed', () => {
    expect(resolveConfig('arcade').bootSpeed).toBe(1)
    expect(resolveConfig('arcade', { bootSpeed: 2 }).bootSpeed).toBe(2)
  })
})

describe('hexToRgb', () => {
  it('converts long and short hex', () => {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#fff')).toEqual([1, 1, 1])
  })

  it('reads the channels in the right order', () => {
    const [r, g, b] = hexToRgb('#804020')
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
  })
})
