// Pure geometry helpers shared between the panels that render in the hub and
// the camera rig that flies to them, so they always agree on where things are.

const RADIUS = 5.6
const PANEL_Y = 1.55
const SPREAD = Math.PI * 0.5 // total angular spread across all panels

export function getPanelPosition(slug, allSlugs) {
  const index = allSlugs.indexOf(slug)
  const total = allSlugs.length
  if (index === -1 || total === 0) return [0, PANEL_Y, -RADIUS]

  const start = -SPREAD / 2
  const angle = total === 1 ? 0 : start + (SPREAD * index) / (total - 1)

  return [Math.sin(angle) * RADIUS, PANEL_Y, -Math.cos(angle) * RADIUS]
}

export function getPanelCameraTarget(slug, allSlugs) {
  const [x, y, z] = getPanelPosition(slug, allSlugs)
  return {
    position: [x * 0.55, y + 0.15, z + 4.6],
    lookAt: [x, y, z],
  }
}

export const HOME_CAMERA = {
  position: [0, 1.7, 9.5],
  lookAt: [0, 1.3, 0],
}
