import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadBundledCsvRecords } from '@/lib/bundledLoader'
import { DATASETS, SYNTHETIC_RECORDS } from '@/data/synthetic'
import { rowsToRecords } from '@/lib/importFile'
import { nowIso, newId } from '@/lib/utils'
import type { AppSettings, DatasetMeta, IntelRecord, Investigation, InvestigationEvent } from '@/types'

const STORAGE_KEY = 'infinityx-osint-lab-v1'

interface PersistShape {
  importedRecords: IntelRecord[]
  importedDatasets: DatasetMeta[]
  investigations: Investigation[]
  queryCount: number
  settings: AppSettings
}

function load(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('empty')
    const parsed = JSON.parse(raw) as PersistShape
    return {
      importedRecords: parsed.importedRecords ?? [],
      importedDatasets: parsed.importedDatasets ?? [],
      investigations: parsed.investigations ?? defaultInvestigations(),
      queryCount: parsed.queryCount ?? 0,
      settings: {
        maskSensitive: parsed.settings?.maskSensitive ?? false,
        investigatorName: parsed.settings?.investigatorName ?? 'Analyst IX-01',
        adminImportEnabled: parsed.settings?.adminImportEnabled ?? false,
        apiEnabled: parsed.settings?.apiEnabled ?? true,
        apiUrl: parsed.settings?.apiUrl ?? '',
        apiKey: parsed.settings?.apiKey ?? '',
      },
    }
  } catch {
    return {
      importedRecords: [],
      importedDatasets: [],
      investigations: defaultInvestigations(),
      queryCount: 24,
      settings: {
        maskSensitive: false,
        investigatorName: 'Analyst IX-01',
        adminImportEnabled: false,
        apiEnabled: true,
        apiUrl: '',
        apiKey: '',
      },
    }
  }
}

function defaultInvestigations(): Investigation[] {
  return [
    {
      id: 'INV-0042',
      name: 'Aurora username correlation',
      description: 'Training case linking Aurora Systems Lab identities across demo datasets.',
      createdAt: '2026-09-10T08:42:00.000Z',
      investigator: 'Analyst IX-01',
      status: 'Active',
      recordIds: ['IX-0001', 'IX-0009', 'IX-0017'],
      query: 'Alex Morgan',
      notes: 'Exercise: correlate usernames to organization domains without leaving the lab.',
      timeline: [
        { id: 'e1', at: '2026-09-10T08:42:00.000Z', label: 'Investigation created' },
        { id: 'e2', at: '2026-09-10T08:45:00.000Z', label: 'Search performed: Alex Morgan' },
        { id: 'e3', at: '2026-09-10T08:47:00.000Z', label: '14 records matched in training index' },
        { id: 'e4', at: '2026-09-10T08:51:00.000Z', label: 'Relationship discovered: Aurora Systems Lab' },
      ],
    },
  ]
}

interface IntelContextValue {
  records: IntelRecord[]
  datasets: DatasetMeta[]
  investigations: Investigation[]
  queryCount: number
  settings: AppSettings
  notifications: { id: string; title: string; body: string; at: string }[]
  bumpQuery: () => void
  updateSettings: (p: Partial<AppSettings>) => void
  addInvestigation: (name: string, description: string) => Investigation
  addRecordToInvestigation: (investigationId: string, recordId: string) => void
  appendTimeline: (investigationId: string, label: string) => void
  updateInvestigation: (id: string, patch: Partial<Investigation>) => void
  importRows: (rows: Record<string, string>[], fileName: string) => { dataset: DatasetMeta; count: number }
  getRecord: (id: string) => IntelRecord | undefined
}

const IntelContext = createContext<IntelContextValue | null>(null)

export function IntelProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => load(), [])
  const [importedRecords, setImportedRecords] = useState(initial.importedRecords)
  const [importedDatasets, setImportedDatasets] = useState(initial.importedDatasets)
  const [investigations, setInvestigations] = useState(initial.investigations)
  const [queryCount, setQueryCount] = useState(initial.queryCount)
  const [settings, setSettings] = useState(initial.settings)
  const [bundledRecords, setBundledRecords] = useState<IntelRecord[]>([])
  const [bundledDatasets, setBundledDatasets] = useState<DatasetMeta[]>([])
  const [notifications] = useState([
    {
      id: 'n1',
      title: 'Index verified',
      body: 'Synthetic training datasets passed integrity checks.',
      at: nowIso(),
    },
    {
      id: 'n2',
      title: 'Authorized environment',
      body: 'This workstation is configured for OSINT training only.',
      at: nowIso(),
    },
  ])

  const persist = useCallback(
    (next: Partial<PersistShape>) => {
      const payload: PersistShape = {
        importedRecords,
        importedDatasets,
        investigations,
        queryCount,
        settings,
        ...next,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
    [importedDatasets, importedRecords, investigations, queryCount, settings],
  )

  useEffect(() => {
    const ids = new Set([...SYNTHETIC_RECORDS, ...importedRecords].map((r) => r.id))
    loadBundledCsvRecords(ids).then(({ records, datasets }) => {
      setBundledRecords(records)
      setBundledDatasets(datasets)
    })
  }, [importedRecords])

  const records = useMemo(
    () => [...SYNTHETIC_RECORDS, ...bundledRecords, ...importedRecords],
    [importedRecords, bundledRecords],
  )
  const datasets = useMemo(
    () => [...DATASETS, ...bundledDatasets, ...importedDatasets],
    [importedDatasets, bundledDatasets],
  )

  const bumpQuery = useCallback(() => {
    setQueryCount((c) => {
      const next = c + 1
      persist({ queryCount: next })
      return next
    })
  }, [persist])

  const updateSettings = useCallback(
    (p: Partial<AppSettings>) => {
      setSettings((s) => {
        const next = { ...s, ...p }
        persist({ settings: next })
        return next
      })
    },
    [persist],
  )

  const addInvestigation = useCallback(
    (name: string, description: string) => {
      const inv: Investigation = {
        id: `INV-${newId('').slice(1, 5)}`,
        name,
        description,
        createdAt: nowIso(),
        investigator: settings.investigatorName,
        status: 'Open',
        recordIds: [],
        query: '',
        notes: '',
        timeline: [{ id: newId('t'), at: nowIso(), label: 'Investigation created' }],
      }
      setInvestigations((list) => {
        const next = [inv, ...list]
        persist({ investigations: next })
        return next
      })
      return inv
    },
    [persist, settings.investigatorName],
  )

  const appendTimeline = useCallback(
    (investigationId: string, label: string) => {
      setInvestigations((list) => {
        const next = list.map((inv) => {
          if (inv.id !== investigationId) return inv
          const ev: InvestigationEvent = { id: newId('t'), at: nowIso(), label }
          return { ...inv, timeline: [...inv.timeline, ev] }
        })
        persist({ investigations: next })
        return next
      })
    },
    [persist],
  )

  const addRecordToInvestigation = useCallback(
    (investigationId: string, recordId: string) => {
      setInvestigations((list) => {
        const next = list.map((inv) => {
          if (inv.id !== investigationId) return inv
          if (inv.recordIds.includes(recordId)) return inv
          return {
            ...inv,
            recordIds: [...inv.recordIds, recordId],
            timeline: [
              ...inv.timeline,
              { id: newId('t'), at: nowIso(), label: `Record ${recordId} pinned to case` },
            ],
          }
        })
        persist({ investigations: next })
        return next
      })
    },
    [persist],
  )

  const updateInvestigation = useCallback(
    (id: string, patch: Partial<Investigation>) => {
      setInvestigations((list) => {
        const next = list.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv))
        persist({ investigations: next })
        return next
      })
    },
    [persist],
  )

  const importRows = useCallback(
    (rows: Record<string, string>[], fileName: string) => {
      const datasetId = `IMP_${newId('D').replace('-', '')}`
      const datasetName = fileName.slice(0, 48)
      const recs = rowsToRecords(rows, datasetId, datasetName)
      const dataset: DatasetMeta = {
        id: datasetId,
        name: datasetName,
        fileType: fileName.toLowerCase().endsWith('.json') ? 'JSON' : 'CSV',
        importDate: nowIso(),
        status: 'Preview',
        schema: ['id', 'name', 'username', 'email', 'organization'],
        description: 'Sanitized operator import. Labeled synthetic/training until verified.',
        sourceKind: fileName.toLowerCase().endsWith('.json') ? 'Imported JSON' : 'Imported CSV',
        synthetic: true,
      }
      setImportedRecords((r) => {
        const next = [...r, ...recs]
        persist({ importedRecords: next })
        return next
      })
      setImportedDatasets((d) => {
        const next = [...d, dataset]
        persist({ importedDatasets: next })
        return next
      })
      return { dataset, count: recs.length }
    },
    [persist],
  )

  const getRecord = useCallback((id: string) => records.find((r) => r.id === id), [records])

  const value = useMemo(
    () => ({
      records,
      datasets,
      investigations,
      queryCount,
      settings,
      notifications,
      bumpQuery,
      updateSettings,
      addInvestigation,
      addRecordToInvestigation,
      appendTimeline,
      updateInvestigation,
      importRows,
      getRecord,
    }),
    [
      records,
      datasets,
      investigations,
      queryCount,
      settings,
      notifications,
      bumpQuery,
      updateSettings,
      addInvestigation,
      addRecordToInvestigation,
      appendTimeline,
      updateInvestigation,
      importRows,
      getRecord,
    ],
  )

  return <IntelContext.Provider value={value}>{children}</IntelContext.Provider>
}

export function useIntel() {
  const ctx = useContext(IntelContext)
  if (!ctx) throw new Error('useIntel must be used within IntelProvider')
  return ctx
}
