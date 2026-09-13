import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'dist/assets'
const entry = readdirSync(dir).find((f) => /^index-.*\.js$/.test(f))
if (!entry) {
  console.error('check-bundle: no index-*.js chunk found in dist/assets')
  process.exit(1)
}
const source = readFileSync(join(dir, entry), 'utf8')
if (source.includes('WebGLRenderer')) {
  console.error(`check-bundle: three.js leaked into the initial chunk (${entry})`)
  process.exit(1)
}
const kb = (statSync(join(dir, entry)).size / 1024).toFixed(0)
console.log(`check-bundle: ok -- ${entry} is ${kb} kB and contains no three.js`)
