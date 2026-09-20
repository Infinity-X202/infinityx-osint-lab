import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line)
    const row = {}
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    return row
  })
}

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (ch === ',' && !quoted) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

function rowToApiRecord(row, source) {
  const name = row.name?.trim()
  if (!name) return null
  return {
    id: row.id || `${source}-${name.slice(0, 8)}`,
    name,
    cnic: row.cnic || '',
    mobile: row.mobile || row.phone || '',
    phone: row.mobile || row.phone || '',
    invoiceNumber: row.invoiceNumber || row.invoice || '',
    businessName: row.businessName || row.business || row.organization || '',
    organization: row.businessName || row.business || row.organization || '',
    prize: row.prize || '',
    prizeAmount: row.prizeAmount || row.amount || '',
    city: row.city || '',
    province: row.province || '',
    currentAddress: row.currentAddress || row.address || '',
    permanentAddress: row.permanentAddress || '',
    fatherName: row.fatherName || row.father || '',
    gender: row.gender || '',
    birthDate: row.birthDate || row.dob || '',
    country: row.country || 'Pakistan',
    source_name: source,
    dataset: source,
  }
}

const prizeRows = parseCsv(readFileSync(join(publicDir, 'prize-winners.csv'), 'utf8'))
const nadraRows = parseCsv(readFileSync(join(publicDir, 'nadra-demo.csv'), 'utf8'))

const records = [
  ...prizeRows.map((r) => rowToApiRecord(r, 'my files.pdf')).filter(Boolean),
  ...nadraRows.map((r) => rowToApiRecord(r, 'NADRA GitHub demo')).filter(Boolean),
]

const payload = {
  version: 1,
  updatedAt: new Date().toISOString(),
  total: records.length,
  records,
}

writeFileSync(join(publicDir, 'pakistan-database.json'), JSON.stringify(payload, null, 2))
writeFileSync(join(publicDir, 'bundled-manifest.json'), JSON.stringify({
  csv: ['prize-winners.csv', 'nadra-demo.csv', 'pakistan-database.csv'],
  json: ['pakistan-database.json'],
}, null, 2))

console.log(`API JSON: ${records.length} records → public/pakistan-database.json`)
