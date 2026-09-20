import { useMemo, useState } from 'react'
import { Badge, GlassCard, PrimaryButton } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { searchRecords } from '@/lib/search'
import { formatDate, nowIso } from '@/lib/utils'
import { maskEmail } from '@/lib/privacy'

export function ReportsPage() {
  const { investigations, records, settings } = useIntel()
  const [invId, setInvId] = useState(investigations[0]?.id ?? '')
  const [query, setQuery] = useState('Alex Morgan')
  const [notes, setNotes] = useState('Training correlation complete. No live collection performed.')
  const inv = investigations.find((i) => i.id === invId)
  const hits = useMemo(() => searchRecords(records, query).slice(0, 8), [query, records])
  const confidence = hits[0]?.score ?? 0

  function download() {
    const body = [
      'TRAINING / AUTHORIZED USE ONLY',
      'DATABASE HACKED BY INFINITY X',
      `Investigation ID: ${inv?.id ?? 'N/A'}`,
      `Query: ${query}`,
      `Generated: ${nowIso()}`,
      `Analyst: ${settings.investigatorName}`,
      `Confidence: ${confidence}%`,
      `Notes: ${notes}`,
      '',
      'Matching records:',
      ...hits.map((h) => `- ${h.record.id} | ${h.record.name} | ${maskEmail(h.record.email)} | ${h.record.datasetName} | ${h.score}%`),
      '',
      'Timeline:',
      ...(inv?.timeline.map((t) => `${formatDate(t.at)} — ${t.label}`) ?? []),
      '',
      'Created by Infinity X — OSINT Intelligence & Cybersecurity Research Laboratory',
    ].join('\n')
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `infinityx-report-${inv?.id ?? 'draft'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">REPORT GENERATOR</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Intelligence Report</h1>
      </div>
      <GlassCard>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            aria-label="Investigation for report"
            value={invId}
            onChange={(e) => setInvId(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#071018] px-3 py-2 text-sm"
          >
            {investigations.map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} · {i.name}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            placeholder="Query"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="md:col-span-2 min-h-24 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
          />
        </div>
        <div className="mt-4">
          <PrimaryButton onClick={download}>Generate Intelligence Report</PrimaryButton>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Preview</h2>
          <Badge tone="amber">TRAINING / AUTHORIZED USE ONLY</Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm text-[#9bb0c0]">
          <p>Investigation ID: {inv?.id}</p>
          <p>Query: {query}</p>
          <p>Confidence score: {confidence}%</p>
          <p>Analyst notes: {notes}</p>
          <p>Sources: {[...new Set(hits.map((h) => h.record.datasetName))].join(', ') || '—'}</p>
        </div>
        <ul className="mt-4 space-y-1 text-sm">
          {hits.map((h) => (
            <li key={h.record.id}>
              {h.record.id} · {h.record.name} · {maskEmail(h.record.email)} · {h.record.datasetName}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}
