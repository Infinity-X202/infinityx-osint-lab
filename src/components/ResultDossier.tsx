import { Link } from 'react-router-dom'
import { Badge, GlassCard } from '@/components/ui'
import { highlight } from '@/lib/search'
import type { SearchHit } from '@/types'

function Row({ label, html }: { label: string; html?: string | null }) {
  if (!html) return null
  return (
    <div className="border-b border-white/5 py-2 last:border-0">
      <p className="text-[10px] tracking-[0.2em] text-[#7f93a3]">{label}</p>
      <p className="mt-0.5 text-sm text-[#e8f8ff]" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

export function ResultDossier({ hit, query }: { hit: SearchHit; query: string }) {
  const r = hit.record
  const isNadra = r.datasetId === 'NADRA_GITHUB_DEMO'
  const isApi = r.datasetId === 'PAKISTAN_API'
  const isPdf = r.datasetId === 'PRIZE_WINNERS_PDF'
  const sourceLabel = isApi ? 'PAKISTAN API' : isNadra ? 'NADRA / GITHUB' : isPdf ? 'MY FILES.PDF' : r.datasetName.toUpperCase()
  const sourceTone = isApi ? 'cyan' : isNadra ? 'cyan' : 'amber'
  const h = (v?: string) => (v ? highlight(v, query) : '')

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/25 px-5 py-3">
        <div>
          <p className="text-[11px] tracking-[0.25em] text-[#7ee8ff]">OSINT DOSSIER</p>
          <h2 className="text-2xl" dangerouslySetInnerHTML={{ __html: h(r.name) }} />
          <p className="text-xs text-[#7f93a3]">
            {r.id} · {r.datasetName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={sourceTone}>{sourceLabel}</Badge>
          <Badge tone={hit.score > 80 ? 'mint' : 'amber'}>MATCH {hit.score}%</Badge>
          <Badge>IN DATABASE</Badge>
        </div>
      </div>
      <div className="grid gap-x-8 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <Row label="FULL NAME" html={h(r.name)} />
        <Row label="CNIC" html={r.cnic ? h(r.cnic) : ''} />
        <Row label="MOBILE" html={r.phone ? h(r.phone) : ''} />
        <Row label="INVOICE NUMBER" html={r.invoiceNumber ? h(r.invoiceNumber) : ''} />
        <Row label="BUSINESS / ORG" html={h(r.businessName || r.organization)} />
        {!isNadra ? <Row label="PRIZE" html={r.prize ? h(`${r.prize} · PKR ${r.prizeAmount ?? ''}`) : ''} /> : null}
        {isNadra ? <Row label="FATHER NAME" html={r.fatherName ? h(r.fatherName) : ''} /> : null}
        {isNadra ? <Row label="GENDER" html={r.gender ? h(r.gender) : ''} /> : null}
        {isNadra ? <Row label="DATE OF BIRTH" html={r.birthDate ? h(r.birthDate) : ''} /> : null}
        <Row label="CITY" html={h(r.city)} />
        <Row label="PROVINCE / COUNTRY" html={h([r.province, r.country].filter(Boolean).join(' · '))} />
        <Row label="CURRENT ADDRESS" html={h(r.address)} />
        <Row label="PERMANENT ADDRESS" html={r.permanentAddress ? h(r.permanentAddress) : ''} />
        {isNadra ? <Row label="VACCINE" html={r.prize ? h(`${r.prize} · ${r.prizeAmount ?? ''}`) : ''} /> : null}
        <Row label="SOURCE" html={highlight(r.source, query)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
        <div className="flex flex-wrap gap-1">
          {hit.matchedFields.map((f) => (
            <span key={f} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#7ee8ff]">
              {f}
            </span>
          ))}
        </div>
        <Link to={`/app/profile/${r.id}`} className="text-sm text-[#4de1c1]">
          Open full OSINT profile →
        </Link>
      </div>
    </GlassCard>
  )
}
