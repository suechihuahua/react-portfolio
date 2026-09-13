// Captures /, /about, /hobbies at 375, 768, and 1440 px wide into
// ./screenshots (gitignored). Run with: npm run screenshots
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const WIDTHS = [375, 768, 1440]
const ROUTES = ['/', '/about', '/hobbies']

mkdirSync('screenshots', { recursive: true })
const server = await createServer({ server: { port: 4175, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: width <= 768 ? 812 : 900 } })
    for (const route of ROUTES) {
      await page.goto(`http://localhost:4175${route}`)
      await page.waitForTimeout(800)
      if (route === '/') {
        await page.keyboard.press('Enter') // open the door
        await page.waitForTimeout(2600)
      } else {
        await page.click('.dialogue__skip').catch(() => {})
        await page.waitForTimeout(1600)
      }
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
