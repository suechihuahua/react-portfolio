// Records the live title sequence to a video file in public/, so the same
// five seconds can be posted anywhere. Run with: npm run intro:video
//
// Playwright captures the page as webm. Encoding then depends on what ffmpeg
// is available:
//   * a full ffmpeg (FFMPEG env var, or `ffmpeg` on PATH) -> public/intro.mp4
//   * otherwise Playwright's bundled build, which only speaks VP8/WebM,
//     -> public/intro.webm
// The poster frame is a Playwright screenshot, so it never needs ffmpeg.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { INTRO_DURATION_MS } from '../src/lib/introTimeline.js'

const SIZE = { width: 1920, height: 1080 }
const OG_SIZE = { width: 1200, height: 630 }
const RAW_DIR = 'screenshots/intro-raw'
const POSTER = 'public/intro-poster.jpg'
const OG = 'public/og.png'
const POSTER_AT_MS = 3600 // the beat where the full title card is up
const PORT = 4181
const HIDE_SKIP = '.intro__skip { display: none !important }'

const BUNDLED = join(
  process.env.LOCALAPPDATA ?? `${process.env.HOME}/.cache`,
  'ms-playwright/ffmpeg-1011/ffmpeg-win64.exe',
)

function canEncodeH264(bin) {
  try {
    const out = execFileSync(bin, ['-hide_banner', '-encoders'], { encoding: 'utf8' })
    return out.includes('libx264')
  } catch {
    return false
  }
}

// Prefer a full build; fall back to the one Playwright ships.
function pickFfmpeg() {
  for (const candidate of [process.env.FFMPEG, 'ffmpeg']) {
    if (candidate && canEncodeH264(candidate)) return { bin: candidate, h264: true }
  }
  if (existsSync(BUNDLED)) return { bin: BUNDLED, h264: canEncodeH264(BUNDLED) }
  return null
}

const ffmpeg = pickFfmpeg()
if (!ffmpeg) {
  console.error('record-intro: no ffmpeg found. Run "npx playwright install ffmpeg".')
  process.exit(1)
}

rmSync(RAW_DIR, { recursive: true, force: true })
mkdirSync(RAW_DIR, { recursive: true })

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()

let leadMs = 0
try {
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW_DIR, size: SIZE },
  })
  const page = await context.newPage()

  const t0 = Date.now()
  await page.goto(`http://localhost:${PORT}/`)
  // The skip control is an affordance for visitors, not part of the film.
  await page.addStyleTag({ content: HIDE_SKIP })
  // The component stamps this the moment its clock starts, so the lead-in
  // (navigation + artwork decode) is measured rather than guessed.
  await page.waitForSelector('.intro[data-playing]', { timeout: 15000 })
  const startedAt = Date.now()
  leadMs = startedAt - t0

  const untilPoster = POSTER_AT_MS - (Date.now() - startedAt)
  if (untilPoster > 0) await page.waitForTimeout(untilPoster)
  await page.screenshot({ path: POSTER, type: 'jpeg', quality: 88 })

  const untilEnd = INTRO_DURATION_MS + 400 - (Date.now() - startedAt)
  if (untilEnd > 0) await page.waitForTimeout(untilEnd)
  await page.close()
  await context.close()
  console.log(`recorded ${(INTRO_DURATION_MS / 1000).toFixed(1)}s (lead-in ${leadMs} ms)`)

  // The social card is the same title card, composed at link-preview size.
  const ogPage = await browser.newPage({ viewport: OG_SIZE })
  await ogPage.goto(`http://localhost:${PORT}/`)
  await ogPage.addStyleTag({ content: HIDE_SKIP })
  await ogPage.waitForSelector('.intro[data-playing]', { timeout: 15000 })
  await ogPage.waitForTimeout(POSTER_AT_MS)
  await ogPage.screenshot({ path: OG, type: 'png' })
  console.log(`wrote ${OG}`)
} finally {
  await browser.close()
  await server.close()
}

const raw = readdirSync(RAW_DIR).find((f) => f.endsWith('.webm'))
if (!raw) {
  console.error('record-intro: playwright wrote no video')
  process.exit(1)
}

const rawPath = join(RAW_DIR, raw)
const start = (leadMs / 1000).toFixed(3)
const duration = (INTRO_DURATION_MS / 1000).toFixed(3)
const out = ffmpeg.h264 ? 'public/intro.mp4' : 'public/intro.webm'

const encodeArgs = ffmpeg.h264
  ? [
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
      // yuv420p and even dimensions keep it playable on phones and social sites.
      '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30',
      '-movflags', '+faststart',
    ]
  : ['-c:v', 'libvpx', '-b:v', '2M', '-vf', 'fps=30']

execFileSync(ffmpeg.bin, ['-y', '-ss', start, '-i', rawPath, '-t', duration, ...encodeArgs, out], {
  stdio: ['ignore', 'ignore', 'inherit'],
})
rmSync(RAW_DIR, { recursive: true, force: true })

const kb = (p) => `${(statSync(p).size / 1024).toFixed(0)} kB`
console.log(`wrote ${out} (${kb(out)})`)
console.log(`wrote ${POSTER} (${kb(POSTER)})`)
if (!ffmpeg.h264) {
  console.log('note: only VP8/WebM available. Install a full ffmpeg (or set FFMPEG=) for mp4.')
}
