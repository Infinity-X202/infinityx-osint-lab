import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, GlassCard, PrimaryButton } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { formatDate } from '@/lib/utils'

export function InvestigationsPage() {
  const { investigations, addInvestigation, getRecord, updateInvestigation } = useIntel()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">WORKSPACE</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Investigations</h1>
      </div>
      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">NEW CASE</p>
        <form
          className="mt-3 grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            addInvestigation(name.trim(), desc.trim())
            setName('')
            setDesc('')
          }}
        >
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Investigation name"
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
          />
          <PrimaryButton type="submit">Create investigation</PrimaryButton>
        </form>
      </GlassCard>
      {investigations.map((inv) => (
        <GlassCard key={inv.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[#7f93a3]">{inv.id}</p>
              <h2 className="text-2xl">{inv.name}</h2>
              <p className="text-sm text-[#9bb0c0]">{inv.description}</p>
            </div>
            <Badge tone={inv.status === 'Closed' ? 'amber' : 'mint'}>{inv.status}</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <p>Created {formatDate(inv.createdAt)}</p>
            <p>Investigator {inv.investigator}</p>
            <p>{inv.recordIds.length} pinned records</p>
          </div>
          <div className="mt-4">
            <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">TIMELINE</p>
            <ol className="mt-2 space-y-1 text-sm text-[#9bb0c0]">
              {inv.timeline.map((t) => (
                <li key={t.id}>
                  {formatDate(t.at)} — {t.label}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {inv.recordIds.map((rid) => {
              const rec = getRecord(rid)
              return rec ? (
                <Link key={rid} to={`/app/profile/${rid}`} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                  {rec.name}
                </Link>
              ) : null
            })}
          </div>
          <button
            type="button"
            className="mt-4 text-xs text-[#e8c07a]"
            onClick={() =>
              updateInvestigation(inv.id, { status: inv.status === 'Closed' ? 'Active' : 'Closed' })
            }
          >
            Toggle status
          </button>
        </GlassCard>
      ))}
    </div>
  )
}
