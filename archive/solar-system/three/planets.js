// Visual facts per planet. Sizes are scene units chosen to read well on
// screen, not to scale; tilts are the real axial tilts in radians.
export const PLANETS = {
  mercury: { texture: '/textures/mercury.jpg', size: 0.22, tilt: 0.0, spin: 0.08 },
  venus: { texture: '/textures/venus.jpg', size: 0.34, tilt: 3.09, spin: 0.05 },
  earth: { texture: '/textures/earth.jpg', size: 0.36, tilt: 0.41, spin: 0.3, moon: true },
  mars: { texture: '/textures/mars.jpg', size: 0.28, tilt: 0.44, spin: 0.28 },
  jupiter: { texture: '/textures/jupiter.jpg', size: 0.85, tilt: 0.05, spin: 0.5 },
  saturn: { texture: '/textures/saturn.jpg', size: 0.72, tilt: 0.47, spin: 0.45, ring: true },
  uranus: { texture: '/textures/uranus.jpg', size: 0.5, tilt: 1.71, spin: 0.35 },
  neptune: { texture: '/textures/neptune.jpg', size: 0.48, tilt: 0.49, spin: 0.36 },
}

export const SATURN_RING_TEXTURE = '/textures/saturn-ring.png'
export const MOON_TEXTURE = '/textures/moon.jpg'
export const SUN_TEXTURE = '/textures/sun.jpg'
export const SKY_TEXTURE = '/textures/milky-way.jpg'
