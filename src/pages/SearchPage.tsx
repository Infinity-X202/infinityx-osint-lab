import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ResultDossier } from '@/components/ResultDossier'
import { SearchScanner } from '@/components/SearchScanner'
import { SearchSuggest } from '@/components/SearchSuggest'
import { Badge, EmptyState, GlassCard } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { mergeSearchHits, searchPakistanApi, type ApiSearchStatus } from '@/lib/apiSearch'
import { searchRecords, suggestionsFor } from '@/lib/search'
import type { SearchSuggestion } from '@/lib/search'
import type { SearchHit } from '@/types'

const PAGE = 8

export function SearchPage() {
  const { records, bumpQuery, settings } = useIntel()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const [page, setPage] = useState(0)
  const [openSuggest, setOpenSuggest] = useState(false)
  const [searching, setSearching] = useState(false)
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [apiStatus, setApiStatus] = useState<ApiSearchStatus>('idle')
  const [apiMessage, setApiMessage] = useState('')
  const [source, setSource] = useState<'all' | 'pdf' | 'nadra' | 'api'>('all')
  const counted = useRef('')
  const timer = useRef<number | undefined>(undefined)
  const apiAbort = useRef<AbortController | null>(null)

  const suggestions = useMemo(() => suggestionsFor(records, draft, 10), [records, draft])

  useEffect(() => {
    if (q) setDraft(q)
  }, [q])

  useEffect(() => {
    const query = draft.trim()
    window.clearTimeout(timer.current)
    apiAbort.current?.abort()

    if (!query) {
      setSearching(false)
      setHits(null)
      setApiStatus('idle')
      setApiMessage('')
      setParams({})
      return
    }

    setSearching(true)
    setHits(null)

    timer.current = window.setTimeout(async () => {
      let local = searchRecords(records, query)
      if (source === 'pdf') local = local.filter((h) => h.record.datasetId === 'PRIZE_WINNERS_PDF')
      if (source === 'nadra') local = local.filter((h) => h.record.datasetId === 'NADRA_GITHUB_DEMO')

      let merged = local
      if (settings.apiEnabled && source !== 'pdf' && source !== 'nadra') {
        const controller = new AbortController()
        apiAbort.current = controller
        setApiStatus('loading')
        const api = await searchPakistanApi(
          query,
          { apiEnabled: settings.apiEnabled, apiUrl: settings.apiUrl, apiKey: settings.apiKey },
          controller.signal,
        )
        setApiStatus(api.status)
        setApiMessage(api.message ?? '')
        if (source === 'api') merged = api.hits
        else merged = mergeSearchHits(local, api.hits)
      } else {
        setApiStatus(settings.apiEnabled ? 'disabled' : 'disabled')
        setApiMessage('')
      }

      setHits(merged)
      setSearching(false)
      setPage(0)
      setParams({ q: query })
      if (counted.current !== query) {
        counted.current = query
        bumpQuery()
      }
    }, 1200)

    return () => {
      window.clearTimeout(timer.current)
      apiAbort.current?.abort()
    }
  }, [draft, records, setParams, bumpQuery, source, settings.apiEnabled, settings.apiUrl, settings.apiKey])

  function pick(item: SearchSuggestion) {
    setDraft(item.value)
    setOpenSuggest(false)
  }

  const sliced = hits?.slice(page * PAGE, page * PAGE + PAGE) ?? []
  const pages = hits ? Math.max(1, Math.ceil(hits.length / PAGE)) : 1
  const pdfCount = hits?.filter((h) => h.record.datasetId === 'PRIZE_WINNERS_PDF').length ?? 0
  const nadraCount = hits?.filter((h) => h.record.datasetId === 'NADRA_GITHUB_DEMO').length ?? 0
  const apiCount = hits?.filter((h) => h.record.datasetId === 'PAKISTAN_API').length ?? 0

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">OSINT LOOKUP</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Search all sources</h1>
        <p className="text-sm text-[#9bb0c0]">
          Local index + Pakistan Database API · my files.pdf · NADRA GitHub · bundled CSV
        </p>
      </div>

      <div className="glass relative rounded-2xl p-4">
        <input
          id="q"
          value={draft}
          autoComplete="off"
          autoFocus
          onFocus={() => setOpenSuggest(true)}
          onBlur={() => window.setTimeout(() => setOpenSuggest(false), 120)}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Name, CNIC, mobile, invoice, city, father name, business..."
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-base outline-none focus:border-[#7ee8ff]/40"
        />
        {openSuggest && draft.trim() && !searching ? (
          <SearchSuggest items={suggestions} query={draft} onPick={pick} />
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['all', 'All sources'],
              ['pdf', 'my files.pdf'],
              ['nadra', 'NADRA GitHub'],
              ['api', 'API only'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSource(id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                source === id ? 'border-[#4de1c1]/50 bg-[#4de1c1]/10 text-[#4de1c1]' : 'border-white/10 text-[#9bb0c0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {settings.apiEnabled ? (
          <p className="mt-3 text-xs text-[#7f93a3]">
            API:{' '}
            {apiStatus === 'loading' ? 'querying…' : apiStatus === 'ok' ? apiMessage || 'connected' : apiStatus === 'error' ? apiMessage : 'ready (/api/search)'}
          </p>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {searching ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SearchScanner query={draft.trim()} />
          </motion.div>
        ) : null}

        {!searching && hits ? (
          <motion.div key="results" className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {hits.length === 0 ? (
              <EmptyState
                title="NOT FOUND IN DATABASE"
                body={`No match for "${draft.trim()}" in local index or API. Try name, CNIC, mobile, city or business.`}
                action={
                  <button type="button" className="rounded-xl border border-white/15 px-4 py-2" onClick={() => setDraft('')}>
                    Clear
                  </button>
                }
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[#9bb0c0]">
                    <span className="text-[#4de1c1] font-semibold">{hits.length} found</span>
                    {' · '}
                    PDF {pdfCount} · NADRA {nadraCount} · API {apiCount}
                  </p>
                  <Badge tone="mint">IN DATABASE</Badge>
                </div>
                {sliced.map((hit, i) => (
                  <motion.div key={`${hit.record.id}-${hit.record.datasetId}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ResultDossier hit={hit} query={draft} />
                  </motion.div>
                ))}
                {pages > 1 ? (
                  <div className="flex items-center justify-between pt-2">
                    <button type="button" disabled={page === 0} className="rounded-lg border border-white/10 px-3 py-1 text-sm disabled:opacity-40" onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </button>
                    <p className="text-sm text-[#7f93a3]">
                      Page {page + 1} / {pages}
                    </p>
                    <button type="button" disabled={page + 1 >= pages} className="rounded-lg border border-white/10 px-3 py-1 text-sm disabled:opacity-40" onClick={() => setPage((p) => p + 1)}>
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!searching && !draft.trim() ? (
        <GlassCard className="text-center py-10">
          <p className="text-[#9bb0c0]">Search across local index + API</p>
          <p className="mt-2 text-xs text-[#7f93a3]">
            my files.pdf · NADRA GitHub · pakistan-database.csv · /api/search
          </p>
          <a href="/pakistan-database.csv" className="mt-4 inline-block text-xs text-[#4de1c1] underline">
            Download full CSV (99 records)
          </a>
        </GlassCard>
      ) : null}
    </div>
  )
}
