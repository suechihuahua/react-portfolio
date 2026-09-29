// Regenerates the room poster and PNG favicons from the live room.
// Run with: npm run capture
//
// The social card (public/og.png) is a frame of the title sequence instead --
// see scripts/record-intro.mjs.
import { createServer } from 'vite'
import { chromium } from 'playwright'

const server = await createServer({ server: { port: 4174, strictPort: true }, logLevel: 'error' })
await server.listen()
const base = 'http://localhost:4174'

const browser = await chromium.launch()

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(`${base}/?capture`)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'public/room-poster.jpg', type: 'jpeg', quality: 82 })
  console.log('wrote public/room-poster.jpg')

  for (const [size, file] of [
    [32, 'public/favicon-32.png'],
    [180, 'public/apple-touch-icon.png'],
  ]) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } })
    await icon.setContent(
      `<body style="margin:0;background:#0a0710"><img src="${base}/favicon.svg" style="width:${size}px;height:${size}px;display:block"></body>`,
    )
    await icon.waitForTimeout(300)
    await icon.screenshot({ path: file, type: 'png', omitBackground: false })
    console.log(`wrote ${file}`)
  }
} finally {
  await browser.close()
  await server.close()
}
