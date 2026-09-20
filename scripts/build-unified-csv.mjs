import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { headers: [], rows: [] }
  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cols = splitCsvLine(line)
    const row = {}
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    return row
  })
  return { headers, rows }
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
      } else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

function esc(v) {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
}

const prize = parseCsv(readFileSync(join(publicDir, 'prize-winners.csv'), 'utf8'))
const nadra = parseCsv(readFileSync(join(publicDir, 'nadra-demo.csv'), 'utf8'))

const headers = [
  'id', 'name', 'cnic', 'mobile', 'phone', 'invoiceNumber', 'businessName',
  'prize', 'prizeAmount', 'city', 'province', 'address', 'permanentAddress',
  'fatherName', 'gender', 'birthDate', 'country', 'source',
]

const unified = []

for (const row of prize.rows) {
  unified.push({
    id: row.id,
    name: row.name,
    cnic: row.cnic,
    mobile: row.mobile,
    phone: row.mobile,
    invoiceNumber: row.invoiceNumber,
    businessName: row.businessName,
    prize: row.prize,
    prizeAmount: row.prizeAmount,
    city: row.prize || '',
    province: '',
    address: row.businessName,
    permanentAddress: '',
    fatherName: '',
    gender: '',
    birthDate: '',
    country: 'Pakistan',
    source: 'my files.pdf',
  })
}

for (const row of nadra.rows) {
  unified.push({
    id: row.id,
    name: row.name,
    cnic: row.cnic,
    mobile: '',
    phone: '',
    invoiceNumber: '',
    businessName: '',
    prize: '',
    prizeAmount: '',
    city: row.city,
    province: row.province,
    address: row.currentAddress,
    permanentAddress: row.permanentAddress,
    fatherName: row.fatherName,
    gender: row.gender,
    birthDate: row.birthDate,
    country: 'Pakistan',
    source: 'NADRA GitHub demo',
  })
}

const csv = [
  headers.join(','),
  ...unified.map((row) => headers.map((h) => esc(row[h])).join(',')),
].join('\n')

writeFileSync(join(publicDir, 'pakistan-database.csv'), csv)
console.log(`Unified CSV: ${unified.length} records → public/pakistan-database.csv`)
