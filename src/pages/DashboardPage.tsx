import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TerminalPanel } from '@/components/TerminalPanel'
import { AnimatedCounter, GlassCard, PrimaryButton } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { bytesLabel } from '@/lib/utils'

export function DashboardPage() {
  const { records, datasets, investigations, queryCount } = useIntel()
  const datasetSize = useMemo(() => bytesLabel(JSON.stringify(records).length), [records])
  const stats = [
    { label: 'Total Records', value: records.length },
    { label: 'Indexed Records', value: records.length },
    { label: 'Available Sources', value: datasets.length },
    { label: 'Active Investigations', value: investigations.filter((i) => i.status !== 'Closed').length },
    { label: 'Search Queries', value: queryCount },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">COMMAND SURFACE</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Intelligence Dashboard</h1>
        <p className="text-[#9bb0c0]">Live counts from the authorized synthetic index.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard>
              <p className="text-xs tracking-[0.2em] text-[#7f93a3]">{s.label}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[#e8f8ff]">
                <AnimatedCounter value={s.value} />
              </p>
            </GlassCard>
          </motion.div>
        ))}
        <GlassCard>
          <p className="text-xs tracking-[0.2em] text-[#7f93a3]">Dataset Size</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[#e8f8ff]">{datasetSize}</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">QUICK ACTIONS</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/app/search">
              <PrimaryButton>Open Search</PrimaryButton>
            </Link>
            <Link to="/app/graph" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm">
              Intelligence Graph
            </Link>
            <Link to="/app/investigations" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm">
              Investigations
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#9bb0c0]">
            Try queries such as <span className="text-[#7ee8ff]">MUHAMMAD ASLAM</span>,{' '}
            <span className="text-[#7ee8ff]">Metro Pakistan</span>, or invoice{' '}
            <span className="text-[#7ee8ff]">131480220109174042733</span>.
          </p>
        </GlassCard>
        <TerminalPanel />
      </div>
    </div>
  )
}
