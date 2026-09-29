// Camera math for the illustrated room. The room image is laid out to *cover*
// the viewport (like `object-fit: cover`), then a spot is framed by scaling the
// stage by `zoom` and translating it so the spot lands on the focus point --
// the part of the screen the content card leaves free.

export function coverSize(room, viewport) {
  const scale = Math.max(viewport.width / room.width, viewport.height / room.height)
  return { width: room.width * scale, height: room.height * scale }
}

// Desktop keeps the chapter rail and the content card down the left, so the
// free half starts further right than the midpoint.
export const FOCUS_X_WIDE = 0.76
export const FOCUS_X_NARROW = 0.5

export function focusPoint(viewport, { narrow = false } = {}) {
  return narrow
    ? { x: viewport.width * FOCUS_X_NARROW, y: viewport.height * 0.42 }
    : { x: viewport.width * FOCUS_X_WIDE, y: viewport.height * 0.48 }
}

export function getCameraTransform(spot, room, viewport, { narrow = false } = {}) {
  const stage = coverSize(room, viewport)
  const zoom = narrow ? spot.zoom * 0.85 : spot.zoom
  const focus = focusPoint(viewport, { narrow })
  const scaledWidth = stage.width * zoom
  const scaledHeight = stage.height * zoom

  let x = focus.x - (spot.x / 100) * scaledWidth
  let y = focus.y - (spot.y / 100) * scaledHeight
  // Never reveal the stage edges.
  x = Math.min(0, Math.max(viewport.width - scaledWidth, x))
  y = Math.min(0, Math.max(viewport.height - scaledHeight, y))

  return { width: stage.width, height: stage.height, zoom, x, y }
}
