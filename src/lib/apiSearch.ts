import type { IntelRecord, SearchHit } from '@/types'
import { searchRecords, normalizeQuery } from '@/lib/search'
import { sanitizePlain } from '@/lib/privacy'

export type ApiSearchStatus = 'idle' | 'loading' | 'ok' | 'error' | 'disabled'

export interface ApiSearchSettings {
  apiEnabled: boolean
  apiUrl: string
  apiKey: string
}

export interface ApiSearchResult {
  hits: SearchHit[]
  status: ApiSearchStatus
  message?: string
  source: 'external' | 'netlify' | 'none'
}

function apiEndpoint(settings: ApiSearchSettings) {
  const custom = settings.apiUrl.trim()
  if (custom) return custom
  return import.meta.env.VITE_API_SEARCH_PATH || '/api/search'
}

function pickString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const val = obj[key]
    if (typeof val === 'string' && val.trim()) return val.trim()
    if (typeof val === 'number' && Number.isFinite(val)) return String(val)
  }
  return ''
}

function normalizeApiRecord(raw: Record<string, unknown>, index: number): IntelRecord | null {
  const name = pickString(raw, ['name', 'full_name', 'fullName', 'person_name'])
  if (!name) return null

  const id = sanitizePlain(pickString(raw, ['id', 'record_id', 'recordId']) || `API-${index + 1}`, 32)
  const cnic = pickString(raw, ['cnic', 'CNIC', 'national_id', 'nationalId', 'nic'])
  const phone = pickString(raw, ['mobile', 'phone', 'Mobile', 'Phone', 'contact'])
  const business = pickString(raw, ['businessName', 'business', 'business_name', 'organization', 'org'])
  const city = pickString(raw, ['city', 'City', 'town'])
  const province = pickString(raw, ['province', 'Province', 'state'])
  const address = pickString(raw, ['address', 'currentAddress', 'current_address', 'location']) || city

  return {
    id,
    name: sanitizePlain(name, 80),
    username: sanitizePlain(pickString(raw, ['username']) || name.toLowerCase().replace(/\s+/g, '.'), 40),
    email: sanitizePlain(pickString(raw, ['email']) || `${id.toLowerCase()}@api-index.example`, 80),
    phone: sanitizePlain(phone, 32),
    cnic: cnic ? sanitizePlain(cnic, 20) : undefined,
    invoiceNumber: pickString(raw, ['invoiceNumber', 'invoice', 'invoice_number']) || undefined,
    businessName: business || undefined,
    prize: pickString(raw, ['prize', 'Prize']) || undefined,
    prizeAmount: pickString(raw, ['prizeAmount', 'prize_amount', 'amount']) || undefined,
    organization: sanitizePlain(business || pickString(raw, ['organization']) || 'API Source', 80),
    address: sanitizePlain(address, 120),
    permanentAddress: pickString(raw, ['permanentAddress', 'permanent_address']) || undefined,
    province: province || undefined,
    fatherName: pickString(raw, ['fatherName', 'father_name', 'father']) || undefined,
    gender: pickString(raw, ['gender', 'Gender']) || undefined,
    birthDate: pickString(raw, ['birthDate', 'birth_date', 'dob']) || undefined,
    city: sanitizePlain(city || 'Unknown', 40),
    country: sanitizePlain(pickString(raw, ['country']) || 'Pakistan', 40),
    datasetId: 'PAKISTAN_API',
    datasetName: pickString(raw, ['dataset', 'source_name']) || 'Pakistan Database API',
    source: 'Research Dataset',
    lastIndexed: new Date().toISOString(),
    domains: ['api.infinityx.local'],
    profiles: [],
    relatedIds: [],
    notes: sanitizePlain(pickString(raw, ['notes']) || 'Returned by external Pakistan database API.', 200),
  }
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === 'object') as Record<string, unknown>[]
  if (!payload || typeof payload !== 'object') return []
  const obj = payload as Record<string, unknown>
  for (const key of ['results', 'data', 'records', 'hits', 'items']) {
    const val = obj[key]
    if (Array.isArray(val)) return val.filter((r) => r && typeof r === 'object') as Record<string, unknown>[]
  }
  return []
}

export function mergeSearchHits(local: SearchHit[], api: SearchHit[]): SearchHit[] {
  const seen = new Set<string>()
  const merged: SearchHit[] = []

  for (const hit of [...local, ...api]) {
    const key = hit.record.cnic
      ? `cnic:${hit.record.cnic}`
      : `${hit.record.name}:${hit.record.phone}:${hit.record.id}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(hit)
  }

  merged.sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name))
  return merged
}

export async function searchPakistanApi(
  query: string,
  settings: ApiSearchSettings,
  signal?: AbortSignal,
): Promise<ApiSearchResult> {
  const q = normalizeQuery(query)
  if (!q) return { hits: [], status: 'idle', source: 'none' }
  if (!settings.apiEnabled) return { hits: [], status: 'disabled', source: 'none' }

  const endpoint = apiEndpoint(settings)
  const url = endpoint.includes('?')
    ? `${endpoint}&q=${encodeURIComponent(q)}`
    : `${endpoint}?q=${encodeURIComponent(q)}`

  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (settings.apiKey.trim()) headers.Authorization = `Bearer ${settings.apiKey.trim()}`

    const res = await fetch(url, { headers, signal })
    if (!res.ok) {
      return {
        hits: [],
        status: 'error',
        source: endpoint.startsWith('http') ? 'external' : 'netlify',
        message: `API ${res.status}: ${res.statusText}`,
      }
    }

    const payload: unknown = await res.json()
    const rows = extractRows(payload)
    const records = rows
      .map((row, i) => normalizeApiRecord(row, i))
      .filter((r): r is IntelRecord => Boolean(r))

    const hits = searchRecords(records, q).map((hit) => ({
      ...hit,
      record: { ...hit.record, datasetId: 'PAKISTAN_API', datasetName: hit.record.datasetName || 'Pakistan Database API' },
    }))

    return {
      hits,
      status: 'ok',
      source: endpoint.startsWith('http') ? 'external' : 'netlify',
      message: hits.length ? `${hits.length} from API` : 'API connected — no matches',
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { hits: [], status: 'idle', source: 'none' }
    }
    return {
      hits: [],
      status: 'error',
      source: endpoint.startsWith('http') ? 'external' : 'netlify',
      message: e instanceof Error ? e.message : 'API request failed',
    }
  }
}
