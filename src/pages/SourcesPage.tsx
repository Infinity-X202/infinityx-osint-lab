import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, GlassCard } from '@/components/ui'
import { NADRA_REPO_URL } from '@/data/nadraRecords'
import { PRIZE_PDF_URL } from '@/data/prizeWinners'
import { useIntel } from '@/context/IntelContext'

export function SourcesPage() {
  const { datasets, records } = useIntel()
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">SOURCE INTELLIGENCE</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Provenance</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {datasets.map((d) => {
          const count = records.filter((r) => r.datasetId === d.id).length
          return (
            <GlassCard key={d.id}>
              <div className="flex items-start justify-between">
                <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">SOURCE</p>
                <Badge>{d.status}</Badge>
              </div>
              <h2 className="mt-2 text-xl">{d.sourceKind}</h2>
              <p className="text-sm text-[#9bb0c0]">{d.name}</p>
              <p className="mt-3 text-sm">STATUS · Verified training origin</p>
              <p className="text-2xl mt-2">{count.toLocaleString('en-US')} records</p>
              <p className="mt-3 text-xs text-[#7f93a3]">{d.description}</p>
            </GlassCard>
          )
        })}
        <GlassCard>
          <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">SOURCE</p>
          <h2 className="mt-2 text-xl">my files.pdf</h2>
          <p className="text-sm text-[#9bb0c0]">Prize winner list · 83 records · full CNIC & mobile for OSINT.</p>
          <a href={PRIZE_PDF_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-[#7ee8ff]">
            Open PDF <ExternalLink size={12} />
          </a>
          <Link to="/app/my-files-pdf" className="mt-2 block text-sm text-[#4de1c1]">
            Open my files.pdf module →
          </Link>
        </GlassCard>
        <GlassCard>
          <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">SOURCE</p>
          <h2 className="mt-2 text-xl">GitHub — NADRA Demo</h2>
          <p className="text-sm text-[#9bb0c0]">Rayan-Rasheed/Project-Nadra_management_System · nadra_data.txt indexed locally.</p>
          <a href={NADRA_REPO_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-[#7ee8ff]">
            View repository <ExternalLink size={12} />
          </a>
          <Link to="/app/nadra" className="mt-2 block text-sm text-[#4de1c1]">
            Open NADRA module →
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
