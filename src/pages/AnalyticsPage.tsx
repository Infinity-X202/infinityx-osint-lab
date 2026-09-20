import { useMemo } from 'react'
import { AnimatedCounter, GlassCard } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'

export function AnalyticsPage() {
  const { records, datasets, queryCount, investigations } = useIntel()
  const byOrg = useMemo(() => {
    const map = new Map<string, number>()
    records.forEach((r) => map.set(r.organization, (map.get(r.organization) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [records])
  const byDataset = useMemo(() => {
    return datasets.map((d) => [d.name, records.filter((r) => r.datasetId === d.id).length] as const)
  }, [datasets, records])

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">ANALYTICS</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Index Health</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard>
          <p className="text-xs text-[#7f93a3]">Queries</p>
          <p className="text-3xl"><AnimatedCounter value={queryCount} /></p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[#7f93a3]">Cases</p>
          <p className="text-3xl"><AnimatedCounter value={investigations.length} /></p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[#7f93a3]">Orgs in index</p>
          <p className="text-3xl"><AnimatedCounter value={byOrg.length} /></p>
        </GlassCard>
      </div>
      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">RECORDS BY ORGANIZATION</p>
        <div className="mt-4 space-y-3">
          {byOrg.map(([org, n]) => (
            <div key={org}>
              <div className="flex justify-between text-sm">
                <span>{org}</span>
                <span>{n}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-[#4de1c1] to-[#7ee8ff]" style={{ width: `${(n / records.length) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">RECORDS BY DATASET</p>
        <div className="mt-4 space-y-3">
          {byDataset.map(([name, n]) => (
            <div key={name} className="flex justify-between text-sm">
              <span>{name}</span>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
