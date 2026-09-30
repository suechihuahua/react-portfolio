import { describe, it, expect } from 'vitest'
import { BOOT, SCREEN, bootState, paintScreen } from './bootScreen.js'
import { resolveConfig } from './crtPresets.js'

describe('bootState', () => {
  it('shows nothing during the blank lead-in', () => {
    const s = bootState(0)
    expect(s.logoVisible).toBe(false)
    expect(s.subtitle).toBe(0)
    expect(s.prompt).toBe(0)
    expect(s.settled).toBe(false)
  })

  it('drops the logo from the top and settles it', () => {
    expect(bootState(BOOT.dropStart).logo).toBe(0)
    expect(bootState(BOOT.dropEnd).logo).toBeCloseTo(1, 5)
    expect(bootState(BOOT.dropEnd + 2).logo).toBeCloseTo(1, 5)
  })

  it('flashes only just after the logo lands', () => {
    expect(bootState(BOOT.chimeAt - 0.1).flash).toBe(0)
    expect(bootState(BOOT.chimeAt + 0.05).flash).toBeGreaterThan(0)
    expect(bootState(BOOT.chimeAt + 1).flash).toBe(0)
  })

  it('brings the subtitle up after the logo, fully', () => {
    expect(bootState(BOOT.subtitleStart).subtitle).toBe(0)
    expect(bootState(BOOT.subtitleEnd).subtitle).toBe(1)
  })

  it('blinks the prompt once settled, and stays settled', () => {
    expect(bootState(BOOT.promptAt - 0.1).settled).toBe(false)
    expect(bootState(BOOT.promptAt).settled).toBe(true)
    expect(bootState(99).settled).toBe(true)
    const blinks = [0, 0.4, 0.8, 1.2].map((d) => bootState(BOOT.promptAt + d).prompt)
    expect(new Set(blinks).size).toBe(2)
  })

  it('overshoots slightly as it lands, then settles exactly', () => {
    // easeOutBack: the logo dips past its resting place and comes back.
    const peak = Math.max(
      ...[0.5, 0.6, 0.7, 0.8].map((p) => bootState(BOOT.dropStart + p * 1.2).logo),
    )
    expect(peak).toBeGreaterThan(1)
    expect(bootState(BOOT.dropEnd).logo).toBeCloseTo(1, 5)
  })

  it('runs faster at a higher boot speed', () => {
    expect(bootState(1, 2).t).toBe(2)
    // Same wall-clock moment, further along the drop.
    expect(bootState(0.5, 2).logo).toBeGreaterThan(bootState(0.5, 1).logo)
    expect(bootState(1.5, 2).settled).toBe(true)
    expect(bootState(1.5, 1).settled).toBe(false)
  })

  it('clamps negative time', () => {
    expect(bootState(-5).logoVisible).toBe(false)
  })
})

describe('paintScreen', () => {
  // A minimal 2D-context recorder: enough to prove the painter draws the
  // right things in the right order without needing a real canvas.
  function fakeContext() {
    const calls = []
    const ctx = {
      calls,
      canvas: { width: SCREEN.width, height: SCREEN.height },
      save: () => calls.push(['save']),
      restore: () => calls.push(['restore']),
      fillRect: (...a) => calls.push(['fillRect', ...a]),
      fillText: (...a) => calls.push(['fillText', ...a]),
    }
    for (const prop of ['fillStyle', 'font', 'textAlign', 'textBaseline', 'globalAlpha', 'imageSmoothingEnabled']) {
      let value
      Object.defineProperty(ctx, prop, {
        get: () => value,
        set: (v) => {
          value = v
          calls.push(['set', prop, v])
        },
      })
    }
    return ctx
  }

  const config = resolveConfig('nintendo')
  const text = { title: 'NATSUO', subtitle: 'CS · NTU', prompt: 'CLICK TO START' }
  const drawn = (ctx) => ctx.calls.filter((c) => c[0] === 'fillText').map((c) => c[1])

  it('paints the screen background before anything else', () => {
    const ctx = fakeContext()
    paintScreen(ctx, bootState(0), config, text)
    const firstFill = ctx.calls.find((c) => c[0] === 'fillRect')
    expect(firstFill).toEqual(['fillRect', 0, 0, SCREEN.width, SCREEN.height])
    expect(drawn(ctx)).toEqual([])
  })

  it('draws the title once the logo is dropping', () => {
    const ctx = fakeContext()
    paintScreen(ctx, bootState(BOOT.dropEnd), config, text)
    expect(drawn(ctx)).toContain(text.title)
    expect(drawn(ctx)).not.toContain(text.prompt)
  })

  it('draws title, subtitle and prompt once settled', () => {
    const ctx = fakeContext()
    paintScreen(ctx, { ...bootState(99), prompt: 1 }, config, text)
    expect(drawn(ctx)).toEqual([text.title, text.subtitle, text.prompt])
  })

  it('balances save and restore', () => {
    const ctx = fakeContext()
    paintScreen(ctx, bootState(1), config, text)
    expect(ctx.calls.filter((c) => c[0] === 'save')).toHaveLength(1)
    expect(ctx.calls.filter((c) => c[0] === 'restore')).toHaveLength(1)
  })
})
