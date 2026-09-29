// The 5-second title sequence, as pure maths. `introState(elapsed)` returns
// every number the DOM needs; TitleSequence.jsx writes them to CSS variables
// from one rAF loop, so no React render happens per frame.

export const INTRO_DURATION_MS = 5000
export const TITLE_TEXT = 'NATSUO FUJITA'
// Never hold the visitor on black waiting for artwork that may not arrive.
export const ART_TIMEOUT_MS = 2500

// [start, end] in ms.
export const BEATS = {
  hairline: [0, 700],
  open: [500, 1800],
  avatar: [1500, 2700],
  title: [1900, 3100],
  subtitle: [2900, 3800],
  caption: [3500, 4300],
  close: [4200, 5000],
}

// Letterbox bars, as a percentage of viewport height each.
const BAR_CLOSED = 50
const BAR_OPEN = 11

export function beatProgress(elapsed, beat) {
  const [start, end] = BEATS[beat]
  if (elapsed <= start) return 0
  if (elapsed >= end) return 1
  return (elapsed - start) / (end - start)
}

const easeOutCubic = (p) => 1 - (1 - p) ** 3
const easeInOutCubic = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)

export function introState(elapsed) {
  const t = Math.max(0, Math.min(elapsed, INTRO_DURATION_MS))
  const open = easeInOutCubic(beatProgress(t, 'open'))
  const close = easeInOutCubic(beatProgress(t, 'close'))
  // Open then close again: the bars travel down and back up.
  const bar = BAR_CLOSED - (BAR_CLOSED - BAR_OPEN) * (open - close)
  // One continuous slow push-in across the whole sequence (Ken Burns).
  const drift = t / INTRO_DURATION_MS

  return {
    bar,
    // The hairline is only visible before the bars part.
    hairline: beatProgress(t, 'hairline') * (1 - open),
    frameOpacity: open * (1 - close),
    frameScale: 1.16 - 0.14 * drift,
    frameShift: -2.5 * drift,
    avatar: easeOutCubic(beatProgress(t, 'avatar')) * (1 - close),
    title: beatProgress(t, 'title') * (1 - close),
    rule: easeOutCubic(Math.max(0, (beatProgress(t, 'title') - 0.55) / 0.45)) * (1 - close),
    subtitle: easeOutCubic(beatProgress(t, 'subtitle')) * (1 - close),
    caption: easeOutCubic(beatProgress(t, 'caption')) * (1 - close),
    done: t >= INTRO_DURATION_MS,
  }
}
