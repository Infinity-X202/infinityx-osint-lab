import { Badge, GlassCard } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { formatDate } from '@/lib/utils'

export function DatasetsPage() {
  const { datasets, records } = useIntel()
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">DATASET EXPLORER</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Indexed Collections</h1>
      </div>
      <div className="grid gap-4">
        {datasets.map((d) => {
          const count = records.filter((r) => r.datasetId === d.id).length
          return (
            <GlassCard key={d.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl">{d.name}</h2>
                  <p className="text-xs text-[#7f93a3]">{d.id}</p>
                </div>
                <Badge>SYNTHETIC TRAINING DATA</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <p>Records: {count}</p>
                <p>File type: {d.fileType}</p>
                <p>Import date: {formatDate(d.importDate)}</p>
                <p>Status: {d.status}</p>
              </div>
              <p className="mt-3 text-sm text-[#9bb0c0]">Schema: {d.schema.join(' · ')}</p>
              <p className="mt-2 text-sm text-[#9bb0c0]">{d.description}</p>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
