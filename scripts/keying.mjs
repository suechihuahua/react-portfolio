// Pixel helpers shared by slice-art.mjs and its test. Pure functions over
// RGBA byte arrays so they run in node without a canvas.

const CHECKER_MIN = 150 // checkerboard squares are white / light grey
const CHECKER_SPREAD = 22 // and nearly neutral (r ≈ g ≈ b)

export function isCheckerPixel(data, i) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return min >= CHECKER_MIN && max - min <= CHECKER_SPREAD
}

// Flood-fills alpha=0 from every edge pixel that looks like checkerboard, so
// white or grey areas *inside* the character (shirt, shoes) are kept.
export function keyOutCheckerboard(data, width, height) {
  const visited = new Uint8Array(width * height)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (visited[p]) return
    visited[p] = 1
    if (isCheckerPixel(data, p * 4)) stack.push(p)
  }
  for (let x = 0; x < width; x += 1) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y)
    push(width - 1, y)
  }
  while (stack.length) {
    const p = stack.pop()
    data[p * 4 + 3] = 0
    const x = p % width
    const y = (p - x) / width
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }
  return data
}

// Clears checkerboard pockets the edge fill could not reach (between an arm
// and the body, under a chair). A pocket is a connected run of checker-toned
// pixels whose brightness is bimodal -- two flat tones in similar amounts --
// which a shaded white shirt or shoe never is.
export function keyOutEnclosedCheckers(data, width, height, { minSize = 120 } = {}) {
  const seen = new Uint8Array(width * height)
  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || data[start * 4 + 3] === 0 || !isCheckerPixel(data, start * 4)) continue
    const component = []
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const p = stack.pop()
      component.push(p)
      const x = p % width
      const y = (p - x) / width
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const q = ny * width + nx
        if (seen[q] || data[q * 4 + 3] === 0 || !isCheckerPixel(data, q * 4)) continue
        seen[q] = 1
        stack.push(q)
      }
    }
    if (component.length >= minSize && isBimodal(data, component)) {
      for (const p of component) data[p * 4 + 3] = 0
    }
  }
  return data
}

// The sheet's checker squares are near-white (≥ 249) and light grey
// (222–246); a pocket is both tones in quantity. Shaded cloth is a smooth
// ramp, so it never holds a fifth of its pixels in each band at once.
function isBimodal(data, component) {
  let white = 0
  let grey = 0
  for (const p of component) {
    const g = data[p * 4 + 1]
    if (g >= 247) white += 1
    else if (g >= 218 && g <= 246) grey += 1
  }
  const n = component.length
  return white / n >= 0.2 && grey / n >= 0.2 && (white + grey) / n >= 0.75
}

// Softens the cut edge: opaque light-neutral pixels touching transparency are
// checkerboard anti-aliasing, not character, so fade them out.
export function defringe(data, width, height) {
  const alphaAt = (x, y) =>
    x < 0 || y < 0 || x >= width || y >= height ? 0 : data[(y * width + x) * 4 + 3]
  const fringe = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      if (data[i + 3] === 0) continue
      const min = Math.min(data[i], data[i + 1], data[i + 2])
      if (min < 165) continue
      const touchesClear =
        alphaAt(x + 1, y) === 0 || alphaAt(x - 1, y) === 0 || alphaAt(x, y + 1) === 0 || alphaAt(x, y - 1) === 0
      if (touchesClear) fringe.push(i)
    }
  }
  for (const i of fringe) data[i + 3] = 0
  return data
}

// Applies a lower-resolution alpha mask to a `factor`x larger image: light
// checker-toned pixels whose source pixel (or any of its 8 neighbours) was
// cleared in the mask are cleared here too. Lets pocket detection run on the
// crisp original and still govern the upscaled copy.
export function clearWhereMaskClear(data, width, height, mask, maskWidth, maskHeight, factor) {
  const maskClearNear = (mx, my) => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = mx + dx
        const y = my + dy
        if (x < 0 || y < 0 || x >= maskWidth || y >= maskHeight) continue
        if (mask[(y * maskWidth + x) * 4 + 3] === 0) return true
      }
    }
    return false
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      if (data[i + 3] === 0 || !isCheckerPixel(data, i)) continue
      if (maskClearNear(Math.floor(x / factor), Math.floor(y / factor))) data[i + 3] = 0
    }
  }
  return data
}

// Drops isolated opaque blobs much smaller than the largest one (upscaler
// noise, stray checker fragments); the character itself is one big component.
export function removeSpecks(data, width, height, { keepRatio = 0.01 } = {}) {
  const seen = new Uint8Array(width * height)
  const components = []
  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || data[start * 4 + 3] === 0) continue
    const component = []
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const p = stack.pop()
      component.push(p)
      const x = p % width
      const y = (p - x) / width
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const q = ny * width + nx
        if (seen[q] || data[q * 4 + 3] === 0) continue
        seen[q] = 1
        stack.push(q)
      }
    }
    components.push(component)
  }
  const largest = Math.max(0, ...components.map((c) => c.length))
  for (const component of components) {
    if (component.length < largest * keepRatio) {
      for (const p of component) data[p * 4 + 3] = 0
    }
  }
  return data
}

// Bounding box of pixels with alpha > 0, or null when everything is clear.
export function opaqueBounds(data, width, height) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] === 0) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}
