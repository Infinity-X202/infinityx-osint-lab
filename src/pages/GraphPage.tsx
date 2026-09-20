import { useState } from 'react'
import { FullGraph } from '@/components/MiniGraph'
import { GlassCard } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'

export function GraphPage() {
  const { datasets } = useIntel()
  const [filter, setFilter] = useState('all')
  const [full, setFull] = useState(false)
  const [panel, setPanel] = useState({ title: 'Select a node', body: 'Hover and click nodes to inspect relationships.' })

  return (
    <div className={full ? 'fixed inset-0 z-50 bg-[#05080d] p-4' : 'space-y-4'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">INTELLIGENCE GRAPH</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Entity Correlation</h1>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Graph filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#071018] px-3 py-2 text-sm"
          >
            <option value="all">All demo clusters</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-sm" onClick={() => setFull((v) => !v)}>
            {full ? 'Exit fullscreen' : 'Fullscreen mode'}
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="glass h-[62vh] overflow-hidden rounded-2xl">
          <FullGraph filter={filter} onSelect={(title, body) => setPanel({ title, body })} />
        </div>
        <GlassCard>
          <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">INTEL PANEL</p>
          <h2 className="mt-3 text-xl">{panel.title}</h2>
          <p className="mt-2 text-sm text-[#9bb0c0]">{panel.body}</p>
          <p className="mt-6 text-xs text-[#7f93a3]">
            Path example: Person → Username → Organization → Domain → Dataset
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
