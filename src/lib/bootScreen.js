// The boot animation, as pure maths plus one Canvas 2D painter. The painter
// draws at a low internal resolution; the CRT shader scales it up, which is
// what gives the chunky phosphor look.

export const SCREEN = { width: 512, height: 384 }

// Seconds, at bootSpeed 1. The logo drops in like a console boot, settles,
// then the prompt starts blinking and waits for a click.
export const BOOT = {
  blank: 0.35,
  dropStart: 0.35,
  dropEnd: 1.55,
  chimeAt: 1.55,
  subtitleStart: 1.95,
  subtitleEnd: 2.45,
  promptAt: 2.8,
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeOutBack = (p) => {
  const c = 1.2
  return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2
}

export function bootState(seconds, bootSpeed = 1) {
  const t = Math.max(0, seconds) * (bootSpeed || 1)
  const drop = clamp01((t - BOOT.dropStart) / (BOOT.dropEnd - BOOT.dropStart))
  const sinceChime = t - BOOT.chimeAt

  return {
    t,
    // 0 at the top of the screen, 1 settled in the middle.
    logo: drop === 0 ? 0 : easeOutBack(drop),
    logoVisible: t >= BOOT.dropStart,
    // A brief flash as the logo lands.
    flash: sinceChime >= 0 && sinceChime < 0.32 ? 1 - sinceChime / 0.32 : 0,
    subtitle: clamp01((t - BOOT.subtitleStart) / (BOOT.subtitleEnd - BOOT.subtitleStart)),
    // Blinks once the boot has settled; the screen then waits for a click.
    prompt: t >= BOOT.promptAt && Math.floor((t - BOOT.promptAt) * 1.6) % 2 === 0 ? 1 : 0,
    settled: t >= BOOT.promptAt,
  }
}

// Paints one frame of the screen content. `config` supplies the variant's
// screen/ink/accent colours.
export function paintScreen(ctx, state, config, text) {
  const { width, height } = SCREEN
  ctx.save()
  ctx.imageSmoothingEnabled = false

  ctx.fillStyle = config.screen
  ctx.fillRect(0, 0, width, height)

  // Faint horizontal bands in the panel itself, before the shader's scanlines.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1)

  if (state.logoVisible) {
    const settleY = height * 0.44
    const y = -40 + (settleY + 40) * state.logo
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = config.ink
    ctx.font = 'bold 34px "IBM Plex Mono", ui-monospace, monospace'
    ctx.fillText(text.title, width / 2, y)

    ctx.fillStyle = config.accent
    ctx.fillRect(width / 2 - 110, y + 30, 220, 2)
  }

  if (state.subtitle > 0) {
    ctx.globalAlpha = state.subtitle
    ctx.fillStyle = config.ink
    ctx.font = '15px "IBM Plex Mono", ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(text.subtitle, width / 2, height * 0.62)
    ctx.globalAlpha = 1
  }

  if (state.prompt > 0) {
    ctx.fillStyle = config.accent
    ctx.font = '13px "IBM Plex Mono", ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(text.prompt, width / 2, height * 0.84)
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flash * 0.5})`
    ctx.fillRect(0, 0, width, height)
  }

  ctx.restore()
}
