// Writes a valid one-page PDF with two lines of text. Offsets are computed,
// not hand-typed, so the xref table is always correct.
import { writeFileSync } from 'node:fs'

const lines = ['Natsuo Fujita', 'Resume coming soon. This file is a placeholder.']
const content = [
  'BT',
  '/F1 24 Tf 72 720 Td',
  `(${lines[0]}) Tj`,
  '/F1 12 Tf 0 -32 Td',
  `(${lines[1]}) Tj`,
  'ET',
].join('\n')

const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
]

let pdf = '%PDF-1.4\n'
const offsets = []
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf))
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
})
const xref = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
offsets.forEach((o) => {
  pdf += `${String(o).padStart(10, '0')} 00000 n \n`
})
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

writeFileSync('public/resume.pdf', pdf)
console.log('wrote public/resume.pdf')
