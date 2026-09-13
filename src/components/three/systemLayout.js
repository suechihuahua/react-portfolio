export const SUN_RADIUS = 1.1

const BASE_ORBIT = 3.4
const ORBIT_GAP = 1.5
const MATERIALS = ['ice', 'metal', 'molten']

export function getOrbit(index, total, { narrow = false } = {}) {
  const scale = narrow ? 0.72 : 1
  const sign = index % 2 === 0 ? 1 : -1
  return {
    radius: (BASE_ORBIT + index * ORBIT_GAP) * scale,
    inclination: sign * (0.06 + index * 0.04),
    startAngle: (index * Math.PI * 2) / Math.max(total, 1) + Math.PI * 0.25,
    speed: 0.16 / (1 + index * 0.55),
    size: 0.32 + (index % 3) * 0.08,
    material: MATERIALS[index % MATERIALS.length],
  }
}

// Circle in the xz-plane rotated about the x-axis by the orbit's inclination.
export function orbitPosition(orbit, angle) {
  const x = Math.cos(angle) * orbit.radius
  const z = Math.sin(angle) * orbit.radius
  return [x, -z * Math.sin(orbit.inclination), z * Math.cos(orbit.inclination)]
}

export function getCameraTarget(planetPosition, orbit) {
  const [x, y, z] = planetPosition
  const outward = Math.hypot(x, z) || 1
  const ox = x / outward
  const oz = z / outward
  const back = orbit.size * 6 + 1.6
  return {
    position: [x + ox * back + oz * 0.8, y + 0.6 + orbit.size, z + oz * back - ox * 0.8],
    lookAt: [x, y, z],
  }
}

export function getHomeCamera({ narrow = false } = {}, total = 3) {
  const far = BASE_ORBIT + Math.max(total - 1, 0) * ORBIT_GAP
  if (narrow) {
    // Bottom-sheet layout: the system stays centred above the sheet.
    return { position: [0, far * 0.75, far * 2.3], lookAt: [0, 0, 0] }
  }
  // Desktop: the console pane is pinned to the left, so swing the camera left
  // and aim right of the sun to push the whole system into the free half.
  return {
    position: [far * 0.9, far * 0.75, far * 1.9],
    lookAt: [-far * 0.95, 0, 0],
  }
}
