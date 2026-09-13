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

// Note: a plain substring check would also match Vite's __vite__mapDeps
// preload array, which legitimately lists "vendor-three-*.js" as a
// dependency of the lazily `import()`-ed Scene chunk -- that reference is
// only used at runtime when the dynamic import actually fires, not an
// eager load. So we only fail on an actual static `import ... from` of a
// vendor-three chunk, which is what caused the original regression.
if (/\bfrom\s*["'][^"']*vendor-three[^"']*["']/.test(source)) {
  console.error(`check-bundle: index chunk imports vendor-three (${entry})`)
  process.exit(1)
}
console.log('check-bundle: ok -- index does not import vendor-three')

const html = readFileSync('dist/index.html', 'utf8')
const modulepreloadVendorThree = /<link[^>]*rel=["']modulepreload["'][^>]*href=["'][^"']*vendor-three[^"']*["']/.test(
  html,
)
if (modulepreloadVendorThree) {
  console.error('check-bundle: index.html preloads vendor-three')
  process.exit(1)
}
console.log('check-bundle: ok -- index.html does not preload vendor-three')
