// Regenerates the static-tier poster, the OG image, and PNG favicons from the
// live scene. Run with: npm run capture
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const server = await createServer({ server: { port: 4174, strictPort: true }, logLevel: 'error' })
await server.listen()
const base = 'http://localhost:4174'

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(`${base}/?tier=full&capture`)
  await page.waitForTimeout(4500)
  await page.screenshot({ path: 'public/hero-poster.jpg', type: 'jpeg', quality: 82 })
  console.log('wrote public/hero-poster.jpg')

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await og.route('**/og-template', (route) =>
    route.fulfill({ contentType: 'text/html', body: readFileSync('scripts/og-template.html', 'utf8') }),
  )
  await og.goto(`${base}/og-template`)
  await og.waitForTimeout(1500)
  await og.screenshot({ path: 'public/og.png', type: 'png' })
  console.log('wrote public/og.png')

  for (const [size, file] of [
    [32, 'public/favicon-32.png'],
    [180, 'public/apple-touch-icon.png'],
  ]) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } })
    await icon.setContent(
      `<body style="margin:0;background:#06040c"><img src="${base}/favicon.svg" style="width:${size}px;height:${size}px;display:block"></body>`,
    )
    await icon.waitForTimeout(300)
    await icon.screenshot({ path: file, type: 'png', omitBackground: false })
    console.log(`wrote ${file}`)
  }
} finally {
  await browser.close()
  await server.close()
}
