// Slices art/sheet.png (room panel on top, six pose panels on painted
// checkerboards below) into public/room/. Run with: npm run art
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const SHEET = 'art/sheet.png'
const OUT = 'public/room'
const ROOM = { x: 0, y: 0, w: 1536, h: 440, scale: 2 }
const POSES = {
  pc: { x: 14, y: 446, w: 282, h: 490 },
  about: { x: 302, y: 446, w: 216, h: 490 },
  education: { x: 520, y: 446, w: 262, h: 490 },
  work: { x: 788, y: 446, w: 226, h: 490 },
  skills: { x: 1022, y: 446, w: 212, h: 490 },
  hobbies: { x: 1248, y: 446, w: 274, h: 490 },
}

const keyingSource = readFileSync('scripts/keying.mjs', 'utf8').replace(/^export /gm, '')
const sheetDataUrl = `data:image/png;base64,${readFileSync(SHEET).toString('base64')}`

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.setContent('<canvas id="c"></canvas>')
  await page.evaluate(
    ({ src, keying }) =>
      new Promise((resolve, reject) => {
        const fns = new Function(
          `${keying}; return { keyOutCheckerboard, keyOutEnclosedCheckers, defringe, opaqueBounds }`,
        )()
        Object.assign(window, fns)
        const img = new Image()
        img.onload = () => {
          window.sheet = img
          resolve()
        }
        img.onerror = reject
        img.src = src
      }),
    { src: sheetDataUrl, keying: keyingSource },
  )

  const room = await page.evaluate(({ x, y, w, h, scale }) => {
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = h * scale
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(window.sheet, x, y, w, h, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.88)
  }, ROOM)
  writeFileSync(`${OUT}/room.jpg`, Buffer.from(room.split(',')[1], 'base64'))
  console.log(`room.jpg ${ROOM.w * ROOM.scale}x${ROOM.h * ROOM.scale}`)

  const manifest = {}
  for (const [name, rect] of Object.entries(POSES)) {
    const result = await page.evaluate((r) => {
      const canvas = document.createElement('canvas')
      canvas.width = r.w
      canvas.height = r.h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(window.sheet, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
      const image = ctx.getImageData(0, 0, r.w, r.h)
      window.keyOutCheckerboard(image.data, r.w, r.h)
      window.keyOutEnclosedCheckers(image.data, r.w, r.h)
      window.defringe(image.data, r.w, r.h)
      window.defringe(image.data, r.w, r.h)
      const bounds = window.opaqueBounds(image.data, r.w, r.h)
      if (!bounds) return null
      const trimmed = document.createElement('canvas')
      trimmed.width = bounds.width
      trimmed.height = bounds.height
      ctx.putImageData(image, 0, 0)
      trimmed
        .getContext('2d')
        .drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height)
      return { bounds, png: trimmed.toDataURL('image/png') }
    }, rect)
    if (!result) throw new Error(`${name}: nothing left after keying`)
    writeFileSync(`${OUT}/pose-${name}.png`, Buffer.from(result.png.split(',')[1], 'base64'))
    manifest[name] = { src: `/room/pose-${name}.png`, ...result.bounds, panel: rect }
    console.log(`pose-${name}.png ${result.bounds.width}x${result.bounds.height}`)
  }
  writeFileSync(`${OUT}/poses.json`, `${JSON.stringify(manifest, null, 2)}\n`)
} finally {
  await browser.close()
}
