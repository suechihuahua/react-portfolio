// CRT variants and their settings. Pure data plus clamping, so the shader and
// the controls agree on what a legal configuration looks like.

// Every value the fragment shader reads, and the range the controls allow.
export const RANGES = {
  speed: [0, 3],
  motion: [0, 1],
  hue: [-180, 180],
  saturation: [0, 2],
  brightness: [0.4, 1.6],
  opacity: [0.2, 1],
  bootSpeed: [0.4, 2.5],
}

export const VARIANTS = {
  nintendo: {
    label: 'Nintendo',
    blurb: 'Console on a living-room CRT',
    screen: '#0a0c14',
    ink: '#e9f1ff',
    accent: '#5eead4',
    curve: 0.12,
    scanline: 0.35,
    mask: 0.45,
    aberration: 0.5,
    noise: 0.05,
    vignette: 0.5,
    mono: 0,
    settings: { speed: 1, motion: 0.35, hue: 0, saturation: 1.05, brightness: 1, opacity: 1 },
  },
  gameboy: {
    label: 'Game Boy',
    blurb: 'Green monochrome dot-matrix',
    screen: '#0f2011',
    ink: '#9bbc0f',
    accent: '#8bac0f',
    curve: 0.05,
    scanline: 0.55,
    mask: 0.15,
    aberration: 0,
    noise: 0.03,
    vignette: 0.35,
    mono: 1,
    settings: { speed: 0.7, motion: 0.15, hue: 0, saturation: 0.9, brightness: 1.05, opacity: 1 },
  },
  arcade: {
    label: 'Arcade',
    blurb: 'Hot phosphor, heavy grille',
    screen: '#05060a',
    ink: '#fff4d6',
    accent: '#ff5f6d',
    curve: 0.2,
    scanline: 0.5,
    mask: 0.7,
    aberration: 0.9,
    noise: 0.08,
    vignette: 0.65,
    mono: 0,
    settings: { speed: 1.5, motion: 0.55, hue: 0, saturation: 1.35, brightness: 1.1, opacity: 1 },
  },
  amber: {
    label: 'Amber',
    blurb: 'Amber terminal phosphor',
    screen: '#120b03',
    ink: '#ffb000',
    accent: '#ffcf6b',
    curve: 0.14,
    scanline: 0.45,
    mask: 0.25,
    aberration: 0.2,
    noise: 0.06,
    vignette: 0.55,
    mono: 1,
    settings: { speed: 0.9, motion: 0.3, hue: 0, saturation: 1, brightness: 1, opacity: 1 },
  },
  broadcast: {
    label: 'Broadcast',
    blurb: 'Soft NTSC, rolling signal',
    screen: '#07090d',
    ink: '#dfe7f2',
    accent: '#7fb2ff',
    curve: 0.09,
    scanline: 0.25,
    mask: 0.2,
    aberration: 1.1,
    noise: 0.12,
    vignette: 0.45,
    mono: 0,
    settings: { speed: 0.6, motion: 0.75, hue: -8, saturation: 0.85, brightness: 0.95, opacity: 1 },
  },
}

export const DEFAULT_VARIANT = 'nintendo'
export const VARIANT_NAMES = Object.keys(VARIANTS)

export function clamp(value, [min, max]) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function clampSettings(settings = {}) {
  const out = {}
  for (const [key, range] of Object.entries(RANGES)) {
    if (settings[key] !== undefined) out[key] = clamp(Number(settings[key]), range)
  }
  return out
}

// A variant plus any user overrides, with everything the shader needs present.
export function resolveConfig(variantName, overrides = {}) {
  const variant = VARIANTS[variantName] ?? VARIANTS[DEFAULT_VARIANT]
  const name = VARIANTS[variantName] ? variantName : DEFAULT_VARIANT
  return {
    variant: name,
    label: variant.label,
    screen: variant.screen,
    ink: variant.ink,
    accent: variant.accent,
    curve: variant.curve,
    scanline: variant.scanline,
    mask: variant.mask,
    aberration: variant.aberration,
    noise: variant.noise,
    vignette: variant.vignette,
    mono: variant.mono,
    ...clampSettings({ bootSpeed: 1, ...variant.settings }),
    ...clampSettings(overrides),
  }
}

// #rrggbb -> [r, g, b] in 0..1, for shader uniforms.
export function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n)) return [0, 0, 0]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
