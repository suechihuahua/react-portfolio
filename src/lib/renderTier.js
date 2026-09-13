export function detectRenderTier(env) {
  if (!env.webgl2 || env.reducedMotion || env.simpleView) return 'static'
  if (env.viewportWidth <= 768 || env.cores <= 4 || env.deviceMemory <= 4 || env.saveData) {
    return 'lite'
  }
  return 'full'
}

let webgl2Support = null

function supportsWebGL2(win) {
  if (webgl2Support !== null) return webgl2Support
  try {
    const canvas = win.document.createElement('canvas')
    webgl2Support = Boolean(canvas.getContext('webgl2'))
  } catch {
    webgl2Support = false
  }
  return webgl2Support
}

export function readEnvironment(win) {
  const nav = win.navigator
  return {
    webgl2: supportsWebGL2(win),
    reducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    simpleView: false,
    viewportWidth: win.innerWidth,
    cores: nav.hardwareConcurrency ?? 8,
    deviceMemory: nav.deviceMemory ?? 8,
    saveData: nav.connection?.saveData ?? false,
  }
}
