import type { IntelRecord, SearchHit } from '@/types'

export type SuggestionKind =
  | 'Name'
  | 'CNIC'
  | 'Phone'
  | 'Invoice'
  | 'Business'
  | 'Prize'
  | 'Address'
  | 'Email'
  | 'Username'
  | 'Organization'
  | 'Location'
  | 'Record ID'

export interface SearchSuggestion {
  value: string
  kind: SuggestionKind
  recordId: string
  subtitle: string
}

export function normalizeQuery(q: string) {
  return q.replace(/[<>]/g, '').slice(0, 120).trim()
}

function digits(s: string) {
  return s.replace(/\D/g, '')
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const m = [] as number[]
  for (let j = 0; j <= b.length; j += 1) m[j] = j
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1
    m[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = m[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      m[j] = Math.min(m[j] + 1, m[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return m[b.length]
}

function fieldScore(value: string, token: string) {
  const v = value.toLowerCase()
  const t = token.toLowerCase()
  if (!t || !v) return 0
  if (v === t) return 100
  if (v.startsWith(t)) return 92
  const words = v.split(/[\s,./@_-]+/).filter(Boolean)
  if (words.some((w) => w.startsWith(t))) return 88
  if (v.includes(t)) return 74
  if (t.length >= 3) {
    const dist = levenshtein(v.slice(0, Math.max(t.length + 2, 12)), t)
    if (dist <= 1) return 60
    if (dist <= 2 && t.length > 4) return 46
  }
  return 0
}

function phoneScore(phone: string, token: string) {
  const td = digits(token)
  const pd = digits(phone)
  if (td && pd) {
    if (pd === td) return 100
    if (pd.endsWith(td)) return 94
    if (pd.includes(td)) return 80
    if (td.includes(pd)) return 72
  }
  return fieldScore(phone, token)
}

function recordFields(record: IntelRecord): Array<{ key: string; value: string; phone?: boolean }> {
  const rows: Array<{ key: string; value: string; phone?: boolean }> = [
    { key: 'name', value: record.name },
    { key: 'username', value: record.username },
    { key: 'email', value: record.email },
    { key: 'phone', value: record.phone, phone: true },
    { key: 'organization', value: record.organization },
    { key: 'address', value: record.address },
    { key: 'city', value: record.city },
    { key: 'country', value: record.country },
    { key: 'location', value: `${record.address}, ${record.city}, ${record.country}` },
    { key: 'id', value: record.id },
    { key: 'datasetId', value: record.datasetId },
    { key: 'datasetName', value: record.datasetName },
  ]
  if (record.cnic) rows.push({ key: 'cnic', value: record.cnic, phone: true })
  if (record.invoiceNumber) rows.push({ key: 'invoiceNumber', value: record.invoiceNumber })
  if (record.businessName) rows.push({ key: 'businessName', value: record.businessName })
  if (record.prize) rows.push({ key: 'prize', value: record.prize })
  if (record.prizeAmount) rows.push({ key: 'prizeAmount', value: record.prizeAmount })
  if (record.suffixKeys) rows.push({ key: 'suffixKeys', value: record.suffixKeys, phone: true })
  if (record.fatherName) rows.push({ key: 'fatherName', value: record.fatherName })
  if (record.province) rows.push({ key: 'province', value: record.province })
  if (record.permanentAddress) rows.push({ key: 'permanentAddress', value: record.permanentAddress })
  if (record.gender) rows.push({ key: 'gender', value: record.gender })
  if (record.birthDate) rows.push({ key: 'birthDate', value: record.birthDate })
  return rows
}

export function searchRecords(
  records: IntelRecord[],
  query: string,
  filters?: { datasetId?: string; organization?: string; country?: string },
): SearchHit[] {
  const q = normalizeQuery(query)
  const digitBlob = digits(q)
  const tokens = [...new Set([
    ...q.toLowerCase().split(/\s+/).filter(Boolean),
    ...(digitBlob.length >= 4 ? [digitBlob] : []),
  ])]
  const hits: SearchHit[] = []

  for (const record of records) {
    if (filters?.datasetId && record.datasetId !== filters.datasetId) continue
    if (filters?.organization && record.organization !== filters.organization) continue
    if (filters?.country && record.country !== filters.country) continue
    if (!tokens.length) continue

    const matchedFields: string[] = []
    let score = 0
    for (const token of tokens) {
      let best = 0
      let bestField = ''
      for (const field of recordFields(record)) {
        const s = field.phone ? phoneScore(field.value, token) : fieldScore(field.value, token)
        if (s > best) {
          best = s
          bestField = field.key
        }
      }
      if (best > 0) {
        score += best
        if (!matchedFields.includes(bestField)) matchedFields.push(bestField)
      }
    }
    if (score > 0) {
      const avg = Math.min(99, Math.round(score / tokens.length))
      hits.push({ record, score: avg, matchedFields })
    }
  }

  hits.sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name))
  return hits
}

export function highlight(text: string, query: string) {
  const q = normalizeQuery(query)
  if (!q) return escapeHtml(text)
  const tokens = [...new Set(q.split(/\s+/).filter((t) => t.length > 0))]
  let out = escapeHtml(text)
  for (const t of tokens) {
    const re = new RegExp(`(${escapeRegExp(escapeHtml(t))})`, 'ig')
    out = out.replace(re, '<mark>$1</mark>')
  }
  return out
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function suggestionsFor(records: IntelRecord[], q: string, limit = 12): SearchSuggestion[] {
  const n = normalizeQuery(q)
  if (n.length < 1) return []
  const token = n.toLowerCase()
  const ranked: Array<SearchSuggestion & { score: number }> = []
  const seen = new Set<string>()

  const push = (item: SearchSuggestion, score: number) => {
    const key = `${item.kind}:${item.value}`
    if (seen.has(key) || score <= 0) return
    seen.add(key)
    ranked.push({ ...item, score })
  }

  for (const r of records) {
    push(
      { value: r.name, kind: 'Name', recordId: r.id, subtitle: `${r.organization} · ${r.phone}` },
      fieldScore(r.name, token),
    )
    if (r.fatherName) {
      push({ value: r.fatherName, kind: 'Name', recordId: r.id, subtitle: `Father of ${r.name}` }, fieldScore(r.fatherName, token))
    }
    push(
      { value: r.cnic ?? '', kind: 'CNIC', recordId: r.id, subtitle: r.name },
      r.cnic ? phoneScore(r.cnic, token) : 0,
    )
    push(
      { value: r.phone, kind: 'Phone', recordId: r.id, subtitle: r.name },
      phoneScore(r.phone, token),
    )
    if (r.invoiceNumber) {
      push(
        { value: r.invoiceNumber, kind: 'Invoice', recordId: r.id, subtitle: r.name },
        fieldScore(r.invoiceNumber, token),
      )
    }
    if (r.businessName) {
      push(
        { value: r.businessName, kind: 'Business', recordId: r.id, subtitle: r.name },
        fieldScore(r.businessName, token),
      )
    }
    if (r.prize) {
      push(
        { value: r.prize, kind: 'Prize', recordId: r.id, subtitle: `${r.prizeAmount ?? ''} PKR` },
        fieldScore(r.prize, token),
      )
    }
    push(
      {
        value: r.address,
        kind: 'Address',
        recordId: r.id,
        subtitle: `${r.name} · ${r.city}, ${r.country}`,
      },
      Math.max(fieldScore(r.address, token), fieldScore(r.city, token)),
    )
    push({ value: r.email, kind: 'Email', recordId: r.id, subtitle: r.name }, fieldScore(r.email, token))
    push(
      { value: r.username, kind: 'Username', recordId: r.id, subtitle: r.name },
      fieldScore(r.username, token),
    )
    push(
      { value: r.organization, kind: 'Organization', recordId: r.id, subtitle: r.city },
      fieldScore(r.organization, token),
    )
    push(
      {
        value: `${r.city}, ${r.country}`,
        kind: 'Location',
        recordId: r.id,
        subtitle: r.name,
      },
      Math.max(fieldScore(r.city, token), fieldScore(r.country, token)),
    )
    push({ value: r.id, kind: 'Record ID', recordId: r.id, subtitle: r.name }, fieldScore(r.id, token))
  }

  ranked.sort((a, b) => b.score - a.score || a.value.localeCompare(b.value))
  return ranked.slice(0, limit).map((row) => ({
    value: row.value,
    kind: row.kind,
    recordId: row.recordId,
    subtitle: row.subtitle,
  }))
}
