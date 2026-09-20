export type SourceKind =
  | 'Public Web'
  | 'Synthetic Dataset'
  | 'Training Dataset'
  | 'Research Dataset'
  | 'Imported CSV'
  | 'Imported JSON'

export type DatasetStatus = 'Indexed' | 'Verified' | 'Quarantined' | 'Preview'

export interface DatasetMeta {
  id: string
  name: string
  fileType: 'JSON' | 'CSV' | 'SYNTHETIC'
  importDate: string
  status: DatasetStatus
  schema: string[]
  description: string
  sourceKind: SourceKind
  synthetic: true
}

export interface IntelRecord {
  id: string
  name: string
  username: string
  email: string
  phone: string
  cnic?: string
  invoiceNumber?: string
  businessName?: string
  prize?: string
  prizeAmount?: string
  suffixKeys?: string
  organization: string
  address: string
  permanentAddress?: string
  province?: string
  fatherName?: string
  gender?: string
  birthDate?: string
  sourceRepo?: string
  city: string
  country: string
  datasetId: string
  datasetName: string
  source: SourceKind
  lastIndexed: string
  domains: string[]
  profiles: string[]
  relatedIds: string[]
  notes: string
}

export interface InvestigationEvent {
  id: string
  at: string
  label: string
}

export interface Investigation {
  id: string
  name: string
  description: string
  createdAt: string
  investigator: string
  status: 'Open' | 'Active' | 'Closed'
  recordIds: string[]
  query: string
  notes: string
  timeline: InvestigationEvent[]
}

export interface SearchHit {
  record: IntelRecord
  score: number
  matchedFields: string[]
}

export interface AppSettings {
  maskSensitive: boolean
  investigatorName: string
  adminImportEnabled: boolean
  apiEnabled: boolean
  apiUrl: string
  apiKey: string
}

export const ALLOWED_IMPORT_FIELDS = [
  'id',
  'name',
  'username',
  'email',
  'phone',
  'organization',
  'address',
  'city',
  'country',
  'domains',
  'profiles',
  'notes',
] as const

export const BLOCKED_SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'secret',
  'token',
  'auth',
  'ssn',
  'passport',
  'credit',
  'card',
  'cvv',
  'pin',
  'hash',
  'otp',
  'iban',
  'nationalid',
  'national_id',
]
