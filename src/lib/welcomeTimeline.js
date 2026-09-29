// The five-second welcome, as pure maths. `welcomeState(elapsed)` returns
// every number the DOM needs; Welcome.jsx drives it from one rAF loop, so no
// React render happens per frame.

export const WELCOME_DURATION_MS = 5000
export const COMMAND = './welcome'
export const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#$%&*'

// [start, end] in ms.
export const BEATS = {
  command: [350, 1050],
  lines: [1150, 2350],
  name: [2250, 3550],
  role: [3450, 4150],
  launch: [4150, 4600],
  fade: [4500, 5000],
}

export const LINE_COUNT = 3

export function beatProgress(elapsed, beat) {
  const [start, end] = BEATS[beat]
  if (elapsed <= start) return 0
  if (elapsed >= end) return 1
  return (elapsed - start) / (end - start)
}

const easeOut = (p) => 1 - (1 - p) ** 3

export function welcomeState(elapsed) {
  const t = Math.max(0, Math.min(elapsed, WELCOME_DURATION_MS))
  const fade = beatProgress(t, 'fade')
  const alive = 1 - fade

  return {
    // How many characters of the typed command are on screen.
    commandChars: Math.round(beatProgress(t, 'command') * COMMAND.length),
    // How many status lines have printed.
    lines: Math.floor(beatProgress(t, 'lines') * (LINE_COUNT + 0.999)),
    // 0..1 across the name; Welcome.jsx turns this into resolved characters.
    name: beatProgress(t, 'name'),
    role: easeOut(beatProgress(t, 'role')) * alive,
    launch: beatProgress(t, 'launch') * alive,
    fade,
    alive,
    done: t >= WELCOME_DURATION_MS,
  }
}

// How many characters of `name` have settled, given the beat's progress.
export function resolvedCount(nameProgress, length) {
  return Math.min(length, Math.floor(nameProgress * (length + 0.999)))
}
