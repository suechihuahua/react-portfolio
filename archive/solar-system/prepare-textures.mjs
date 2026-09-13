// Downloads the Solar System Scope texture set (CC BY 4.0) and downsizes each
// map so the whole set stays around 1 MB. Run with: npm run textures
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const SOURCE = 'https://www.solarsystemscope.com/textures/download/'
const OUT_DIR = 'public/textures'

// 2k for the bodies the camera parks close to (sun, Earth, Jupiter, Saturn);
// 1k is plenty for the rest, which stay small on screen.
const TEXTURES = [
  { file: '2k_sun.jpg', out: 'sun.jpg', width: 2048 },
  { file: '2k_mercury.jpg', out: 'mercury.jpg', width: 1024 },
  { file: '2k_venus_atmosphere.jpg', out: 'venus.jpg', width: 1024 },
  { file: '2k_earth_daymap.jpg', out: 'earth.jpg', width: 2048 },
  { file: '2k_moon.jpg', out: 'moon.jpg', width: 512 },
  { file: '2k_mars.jpg', out: 'mars.jpg', width: 1024 },
  { file: '2k_jupiter.jpg', out: 'jupiter.jpg', width: 2048 },
  { file: '2k_saturn.jpg', out: 'saturn.jpg', width: 2048 },
  { file: '2k_saturn_ring_alpha.png', out: 'saturn-ring.png', width: 1024, png: true },
  { file: '2k_uranus.jpg', out: 'uranus.jpg', width: 1024 },
  { file: '2k_neptune.jpg', out: 'neptune.jpg', width: 1024 },
  { file: '2k_stars_milky_way.jpg', out: 'milky-way.jpg', width: 2048 },
]

mkdirSync(OUT_DIR, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const tex of TEXTURES) {
    const response = await fetch(SOURCE + tex.file, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!response.ok) throw new Error(`${tex.file}: HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const mime = tex.png ? 'image/png' : 'image/jpeg'
    const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`

    const resized = await page.evaluate(
      async ({ dataUrl, width, png }) => {
        const img = new Image()
        img.src = dataUrl
        await img.decode()
        const scale = Math.min(1, width / img.naturalWidth)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.naturalWidth * scale)
        canvas.height = Math.round(img.naturalHeight * scale)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return png ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82)
      },
      { dataUrl, width: tex.width, png: Boolean(tex.png) },
    )

    const outBytes = Buffer.from(resized.split(',')[1], 'base64')
    writeFileSync(`${OUT_DIR}/${tex.out}`, outBytes)
    console.log(`${tex.out.padEnd(16)} ${(bytes.length / 1024).toFixed(0).padStart(5)} kB -> ${(outBytes.length / 1024).toFixed(0).padStart(4)} kB`)
  }
} finally {
  await browser.close()
}
