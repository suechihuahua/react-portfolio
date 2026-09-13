// Captures /, /about, /projects at 375, 768, and 1440 px wide into
// ./screenshots (gitignored). Run with: npm run screenshots
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const WIDTHS = [375, 768, 1440]
const ROUTES = ['/', '/about', '/projects']

mkdirSync('screenshots', { recursive: true })
const server = await createServer({ server: { port: 4175, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

try {
  for (const width of WIDTHS) {
    const tier = width <= 768 ? 'lite' : 'full'
    const page = await browser.newPage({ viewport: { width, height: width <= 768 ? 812 : 900 } })
    for (const route of ROUTES) {
      await page.goto(`http://localhost:4175${route}?tier=${tier}`)
      await page.waitForTimeout(3000)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(2500)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      if (scrollWidth > width) {
        console.error(`horizontal overflow at ${width}px on ${route}: scrollWidth=${scrollWidth}`)
        process.exitCode = 1
      }
      const name = `${width}${route === '/' ? '-home' : route.replace('/', '-')}.png`
      await page.screenshot({ path: `screenshots/${name}` })
      console.log(`wrote screenshots/${name}`)
    }
    await page.close()
  }
} finally {
  await browser.close()
  await server.close()
}
