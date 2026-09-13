export const SUN_RADIUS = 1.4

const BASE_ORBIT = 3.6
const ORBIT_GAP = 1.15

export function getOrbit(index, total, { narrow = false, size = 0.3 } = {}) {
  const scale = narrow ? 0.72 : 1
  const sign = index % 2 === 0 ? 1 : -1
  return {
    radius: (BASE_ORBIT + index * ORBIT_GAP) * scale,
    inclination: sign * (0.04 + index * 0.02),
    startAngle: (index * Math.PI * 2 * 0.61) + Math.PI * 0.25,
    speed: 0.14 / (1 + index * 0.45),
    size,
  }
}

// Circle in the xz-plane rotated about the x-axis by the orbit's inclination.
export function orbitPosition(orbit, angle) {
  const x = Math.cos(angle) * orbit.radius
  const z = Math.sin(angle) * orbit.radius
  return [x, -z * Math.sin(orbit.inclination), z * Math.cos(orbit.inclination)]
}

// Parks the camera beside the planet on its sun-lit side: mostly along the
// orbit tangent, pulled a little toward the sun, and raised, so the lit face
// is what the visitor sees. The look-at point is then nudged so the planet
// lands in the half of the screen the content card leaves free (right of it
// on desktop, above the bottom sheet on narrow viewports).
export function getCameraTarget(planetPosition, orbit, { narrow = false } = {}) {
  const [x, y, z] = planetPosition
  const outward = Math.hypot(x, z) || 1
  const ox = x / outward
  const oz = z / outward
  const tx = -oz
  const tz = ox
  const back = orbit.size * 5 + 1.4
  const position = [
    x + tx * back * 0.85 - ox * back * 0.45,
    y + back * 0.35,
    z + tz * back * 0.85 - oz * back * 0.45,
  ]

  if (narrow) {
    return { position, lookAt: [x, y - back * 0.28, z] }
  }
  // Camera-right = forward × up, flattened to the ground plane.
  const fx = x - position[0]
  const fz = z - position[2]
  const flen = Math.hypot(fx, fz) || 1
  const rx = -fz / flen
  const rz = fx / flen
  const shift = back * 0.42
  return { position, lookAt: [x - rx * shift, y, z - rz * shift] }
}

export function getHomeCamera({ narrow = false } = {}, total = 8) {
  const far = BASE_ORBIT + Math.max(total - 1, 0) * ORBIT_GAP
  if (narrow) {
    // Bottom-sheet layout: the system stays centred above the sheet.
    return { position: [0, far * 0.7, far * 1.9], lookAt: [0, 0, 0] }
  }
  // Desktop: the content card is pinned to the left, so the camera sits to
  // the right and aims left so the whole system lands in the free half.
  return {
    position: [far * 0.8, far * 0.66, far * 1.6],
    lookAt: [-far * 0.6, 0, 0],
  }
}
