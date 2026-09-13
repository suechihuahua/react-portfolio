// Fails the build if the JavaScript on the initial load path grows past the
// budget. The room is plain HTML/CSS + React, so there is no reason for it to.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = 160
const dir = 'dist/assets'
const chunks = readdirSync(dir).filter((f) => /^(index|vendor)-.*\.js$/.test(f))
if (chunks.length === 0) {
  console.error('check-bundle: no index/vendor chunks found in dist/assets')
  process.exit(1)
}
let total = 0
for (const file of chunks) {
  const gz = gzipSync(readFileSync(join(dir, file))).length
  total += gz
  console.log(`check-bundle: ${file} ${(gz / 1024).toFixed(0)} kB gzip`)
}
if (total / 1024 > BUDGET_KB) {
  console.error(`check-bundle: initial JS is ${(total / 1024).toFixed(0)} kB gzip, over the ${BUDGET_KB} kB budget`)
  process.exit(1)
}
console.log(`check-bundle: ok -- ${(total / 1024).toFixed(0)} kB gzip on the initial path`)
