import { BLOCKED_SENSITIVE_FIELDS, type IntelRecord } from '@/types'
import { sanitizePlain } from '@/lib/privacy'

export const MAX_IMPORT_BYTES = 5_000_000
export const MAX_IMPORT_ROWS = 5000

function pick(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const val = row[key]?.trim()
    if (val) return val
  }
  return ''
}

export function detectSensitiveHeaders(headers: string[]) {
  return headers.filter((h) => {
    const n = h.toLowerCase().replace(/[^a-z0-9_]/g, '')
    return BLOCKED_SENSITIVE_FIELDS.some((b) => n.includes(b))
  })
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length)
  if (!lines.length) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    return row
  })
}

function splitCsvLine(line: string) {
  const out: string[] = []
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

export function parseImportFile(file: File, text: string) {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error(`File exceeds ${MAX_IMPORT_BYTES} byte import limit.`)
  }
  const name = file.name.toLowerCase()
  let rows: Record<string, string>[] = []
  if (name.endsWith('.json')) {
    const parsed: unknown = JSON.parse(text)
    if (Array.isArray(parsed)) {
      rows = parsed.map((item) => {
        if (!item || typeof item !== 'object') throw new Error('Invalid JSON row.')
        const rec: Record<string, string> = {}
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          rec[k] = typeof v === 'string' ? v : Array.isArray(v) ? v.join('|') : String(v ?? '')
        }
        return rec
      })
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      const list = obj.records ?? obj.data ?? obj.results
      if (!Array.isArray(list)) throw new Error('JSON import must be an array or { records: [] }.')
      rows = list.map((item) => {
        const rec: Record<string, string> = {}
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          rec[k] = typeof v === 'string' ? v : Array.isArray(v) ? v.join('|') : String(v ?? '')
        }
        return rec
      })
    } else {
      throw new Error('Invalid JSON import format.')
    }
  } else if (name.endsWith('.csv')) {
    rows = parseCsv(text)
  } else {
    throw new Error('Only CSV and JSON files are supported.')
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Row count exceeds ${MAX_IMPORT_ROWS} record cap.`)
  }
  const headers = rows[0] ? Object.keys(rows[0]) : []
  const blocked = detectSensitiveHeaders(headers)
  if (blocked.length) {
    throw new Error(`Unsupported sensitive fields detected: ${blocked.join(', ')}`)
  }
  return { headers, rows }
}

export function rowsToRecords(
  rows: Record<string, string>[],
  datasetId: string,
  datasetName: string,
): IntelRecord[] {
  return rows.map((row, idx) => {
    const id = sanitizePlain(row.id || `IMP-${String(idx + 1).padStart(4, '0')}`, 32)
    const name = sanitizePlain(pick(row, ['name', 'full_name', 'fullName']) || 'Unknown Subject', 80)
    const phone = sanitizePlain(pick(row, ['mobile', 'phone', 'Mobile', 'Phone']) || '', 32)
    const cnic = pick(row, ['cnic', 'CNIC', 'national_id', 'nic'])
    const business = pick(row, ['businessName', 'business', 'business_name', 'organization', 'org'])
    const city = sanitizePlain(pick(row, ['city', 'City', 'town']) || 'Unknown', 40)
    const address = sanitizePlain(pick(row, ['address', 'currentAddress', 'current_address', 'location']) || business || city, 120)

    const domains = (row.domains || '')
      .split(/[|,]/)
      .map((d) => sanitizePlain(d, 80))
      .filter(Boolean)
    const profiles = (row.profiles || '')
      .split(/[|,]/)
      .map((d) => sanitizePlain(d, 120))
      .filter(Boolean)

    return {
      id,
      name,
      username: sanitizePlain(pick(row, ['username']) || name.toLowerCase().replace(/\s+/g, '.'), 40),
      email: sanitizePlain(pick(row, ['email']) || `${id.toLowerCase()}@import.example`, 80),
      phone,
      cnic: cnic ? sanitizePlain(cnic, 20) : undefined,
      invoiceNumber: pick(row, ['invoiceNumber', 'invoice', 'invoice_number']) || undefined,
      businessName: business || undefined,
      prize: pick(row, ['prize', 'Prize']) || undefined,
      prizeAmount: pick(row, ['prizeAmount', 'prize_amount', 'amount']) || undefined,
      organization: sanitizePlain(business || pick(row, ['organization']) || 'Imported Org', 80),
      address,
      permanentAddress: pick(row, ['permanentAddress', 'permanent_address']) || undefined,
      province: pick(row, ['province', 'Province', 'state']) || undefined,
      fatherName: pick(row, ['fatherName', 'father_name', 'father']) || undefined,
      gender: pick(row, ['gender', 'Gender']) || undefined,
      birthDate: pick(row, ['birthDate', 'birth_date', 'dob']) || undefined,
      city,
      country: sanitizePlain(pick(row, ['country']) || 'Pakistan', 40),
      datasetId,
      datasetName,
      source: datasetName.toLowerCase().endsWith('.json') ? 'Imported JSON' : 'Imported CSV',
      lastIndexed: new Date().toISOString(),
      domains: domains.length ? domains : ['imported.example'],
      profiles: profiles.length ? profiles : [`lab.social.example/${id}`],
      relatedIds: [],
      notes: sanitizePlain(pick(row, ['notes']) || `Imported from ${datasetName}.`, 200),
    }
  })
}
