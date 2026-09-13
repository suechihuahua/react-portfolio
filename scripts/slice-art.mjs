// Slices the generated art sheet (room panel on top, six pose panels on
// painted checkerboards below) into public/room/. Run with: npm run art
//
// Uses art/sheet-4x.png (the sheet upscaled 4x with Real-ESRGAN's anime model,
// see README) when it exists, otherwise the original art/sheet.png. Panel
// rectangles are given in the original 1536x1024 coordinates and scaled.
// Checkerboard pockets are detected on the crisp original (where the two
// tones are flat) and projected onto the upscaled copy.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const ORIGINAL = 'art/sheet.png'
const ORIGINAL_WIDTH = 1536
const UPSCALED = 'art/sheet-4x.png'
const SHEET = existsSync(UPSCALED) ? UPSCALED : ORIGINAL
const OUT = 'public/room'
const ROOM = { x: 0, y: 0, w: 1536, h: 440, outWidth: 4096 }
const POSE_OUT_SCALE = 3 // pose files are 3x the original panel size
// pc is cut before its drawn monitor/desk (the room supplies those) and
// skills after its drawn wall, so the figures sit on the real furniture.
// `erase` rectangles (panel coordinates) remove drawn furniture that would
// clash with the room: the pc pose's desk edge below and right of his hands.
const POSES = {
  pc: {
    x: 14,
    y: 446,
    w: 232,
    h: 490,
    erase: [{ x: 222, y: 196, w: 10, h: 294 }],
  },
  about: { x: 302, y: 446, w: 216, h: 490 },
  education: { x: 520, y: 446, w: 262, h: 490 },
  work: { x: 788, y: 446, w: 226, h: 490 },
  skills: { x: 1086, y: 446, w: 148, h: 490 },
  hobbies: { x: 1248, y: 446, w: 274, h: 490 },
}

const toDataUrl = (file) => `data:image/png;base64,${readFileSync(file).toString('base64')}`
const sheetBytes = readFileSync(SHEET)
const factor = sheetBytes.readUInt32BE(16) / ORIGINAL_WIDTH
console.log(`slicing ${SHEET} (${factor}x)`)

const keyingSource = readFileSync('scripts/keying.mjs', 'utf8').replace(/^export /gm, '')

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.setContent('<canvas id="c"></canvas>')
  await page.evaluate(
    ({ big, original, keying }) => {
      const fns = new Function(
        `${keying}; return { keyOutCheckerboard, keyOutEnclosedCheckers, defringe, removeSpecks, clearWhereMaskClear, opaqueBounds }`,
      )()
      Object.assign(window, fns)
      const load = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      return Promise.all([load(big), load(original)]).then(([sheet, sheetOriginal]) => {
        window.sheet = sheet
        window.sheetOriginal = sheetOriginal
      })
    },
    { big: toDataUrl(SHEET), original: toDataUrl(ORIGINAL), keying: keyingSource },
  )

  const room = await page.evaluate(
    ({ x, y, w, h, outWidth, factor }) => {
      const canvas = document.createElement('canvas')
      canvas.width = outWidth
      canvas.height = Math.round((h / w) * outWidth)
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(window.sheet, x * factor, y * factor, w * factor, h * factor, 0, 0, canvas.width, canvas.height)
      return { jpg: canvas.toDataURL('image/jpeg', 0.86), width: canvas.width, height: canvas.height }
    },
    { ...ROOM, factor },
  )
  writeFileSync(`${OUT}/room.jpg`, Buffer.from(room.jpg.split(',')[1], 'base64'))
  console.log(`room.jpg ${room.width}x${room.height}`)

  const manifest = { room: { width: room.width, height: room.height } }
  for (const [name, rect] of Object.entries(POSES)) {
    const result = await page.evaluate(
      ({ r, factor, outScale }) => {
        // 1x mask: edge fill + pocket detection on the crisp original.
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = r.w
        maskCanvas.height = r.h
        const mctx = maskCanvas.getContext('2d')
        mctx.drawImage(window.sheetOriginal, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
        const mask = mctx.getImageData(0, 0, r.w, r.h).data
        window.keyOutCheckerboard(mask, r.w, r.h)
        window.keyOutEnclosedCheckers(mask, r.w, r.h)

        const w = Math.round(r.w * factor)
        const h = Math.round(r.h * factor)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(window.sheet, r.x * factor, r.y * factor, w, h, 0, 0, w, h)
        for (const e of r.erase ?? []) {
          ctx.clearRect(e.x * factor, e.y * factor, e.w * factor, e.h * factor)
        }
        const image = ctx.getImageData(0, 0, w, h)
        window.keyOutCheckerboard(image.data, w, h)
        if (factor > 1) window.clearWhereMaskClear(image.data, w, h, mask, r.w, r.h, factor)
        else window.keyOutEnclosedCheckers(image.data, w, h)
        for (let i = 0; i < Math.ceil(factor / 2); i += 1) window.defringe(image.data, w, h)
        window.removeSpecks(image.data, w, h)
        const bounds = window.opaqueBounds(image.data, w, h)
        if (!bounds) return null
        ctx.putImageData(image, 0, 0)

        const scale = outScale / factor
        const trimmed = document.createElement('canvas')
        trimmed.width = Math.round(bounds.width * scale)
        trimmed.height = Math.round(bounds.height * scale)
        const tctx = trimmed.getContext('2d')
        tctx.imageSmoothingQuality = 'high'
        tctx.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, trimmed.width, trimmed.height)
        return { width: trimmed.width, height: trimmed.height, png: trimmed.toDataURL('image/png') }
      },
      { r: rect, factor, outScale: POSE_OUT_SCALE },
    )
    if (!result) throw new Error(`${name}: nothing left after keying`)
    writeFileSync(`${OUT}/pose-${name}.png`, Buffer.from(result.png.split(',')[1], 'base64'))
    manifest[name] = { src: `/room/pose-${name}.png`, width: result.width, height: result.height }
    console.log(`pose-${name}.png ${result.width}x${result.height}`)
  }
  writeFileSync(`${OUT}/poses.json`, `${JSON.stringify(manifest, null, 2)}\n`)
} finally {
  await browser.close()
}
