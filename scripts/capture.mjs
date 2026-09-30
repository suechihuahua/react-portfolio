// Regenerates the social card and the PNG favicons from the live console.
// Run with: npm run capture
import { createServer } from 'vite'
import { chromium } from 'playwright'

const PORT = 4174
const base = `http://localhost:${PORT}`

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()

try {
  // The social card is the home screen at link-preview size. Every load opens
  // on the CRT page, so dismiss it with a key first.
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await og.goto(`${base}/`)
  // Let React hydrate before the key, then wait for the CRT layer to actually
  // unmount rather than guessing at a duration.
  await og.waitForTimeout(400)
  await og.keyboard.press('Enter')
  await og
    .waitForFunction(() => !document.querySelector('.crt-layer'), null, { timeout: 8000 })
    .catch(() => {})
  await og.waitForTimeout(700)
  await og.screenshot({ path: 'public/og.png', type: 'png' })
  console.log('wrote public/og.png')

  for (const [size, file] of [
    [32, 'public/favicon-32.png'],
    [180, 'public/apple-touch-icon.png'],
  ]) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } })
    await icon.setContent(
      `<body style="margin:0;background:#08090b"><img src="${base}/favicon.svg" style="width:${size}px;height:${size}px;display:block"></body>`,
    )
    await icon.waitForTimeout(300)
    await icon.screenshot({ path: file, type: 'png' })
    console.log(`wrote ${file}`)
  }
} finally {
  await browser.close()
  await server.close()
}
