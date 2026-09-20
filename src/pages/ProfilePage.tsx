import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, EmptyState, GlassCard, PrimaryButton } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { maskEmail } from '@/lib/privacy'
import { formatDate } from '@/lib/utils'
import { MiniGraph } from '@/components/MiniGraph'

export function ProfilePage() {
  const { id } = useParams()
  const { getRecord, investigations, addRecordToInvestigation, records, settings } = useIntel()
  const rec = id ? getRecord(id) : undefined
  const [invId, setInvId] = useState(investigations[0]?.id ?? '')

  if (!rec) {
    return (
      <EmptyState
        title="Unknown record"
        body="That identifier is not present in the authorized training index."
        action={
          <Link to="/app/search" className="rounded-xl border border-white/15 px-4 py-2">
            Back to search
          </Link>
        }
      />
    )
  }

  const related = records.filter((r) => rec.relatedIds.includes(r.id))
  const email = settings.maskSensitive ? maskEmail(rec.email) : rec.email

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">INVESTIGATION PROFILE</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">{rec.name}</h1>
          <p className="text-[#9bb0c0]">{rec.id} · SYNTHETIC TRAINING DATA</p>
        </div>
        <Badge>MATCH SUBJECT</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">IDENTITY</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
            <p>Name: {rec.name}</p>
            {rec.cnic ? <p>CNIC: {rec.cnic}</p> : null}
            <p>Mobile: {rec.phone}</p>
            {rec.invoiceNumber ? <p>Invoice: {rec.invoiceNumber}</p> : null}
            <p>Business: {rec.businessName ?? rec.organization}</p>
            {rec.prize ? <p>Prize: {rec.prize}</p> : null}
            {rec.prizeAmount ? <p>Amount: PKR {rec.prizeAmount}</p> : null}
            {rec.fatherName ? <p>Father name: {rec.fatherName}</p> : null}
            {rec.province ? <p>Province: {rec.province}</p> : null}
            {rec.permanentAddress ? <p>Permanent address: {rec.permanentAddress}</p> : null}
            {rec.gender ? <p>Gender: {rec.gender}</p> : null}
            {rec.birthDate ? <p>Date of birth: {rec.birthDate}</p> : null}
            {rec.sourceRepo ? (
              <p>
                Source:{' '}
                <a href={rec.sourceRepo} target="_blank" rel="noopener noreferrer" className="text-[#7ee8ff]">
                  GitHub NADRA Project
                </a>
              </p>
            ) : null}
            <p>Username: {rec.username}</p>
            <p>Email: {email}</p>
          </div>
        </GlassCard>
        <GlassCard>
          <p className="text-[11px] tracking-[0.3em] text-[#e8c07a]">DATASET SOURCES</p>
          <p className="mt-3 text-lg">{rec.datasetName}</p>
          <p className="text-sm text-[#9bb0c0]">{rec.source}</p>
          <p className="mt-2 text-xs text-[#7f93a3]">Indexed {formatDate(rec.lastIndexed)}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">DIGITAL FOOTPRINT</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {rec.profiles.map((p) => (
            <li key={p} className="rounded-lg border border-white/10 px-3 py-2">
              {p}
            </li>
          ))}
          {rec.domains.map((d) => (
            <li key={d} className="rounded-lg border border-white/10 px-3 py-2">
              Domain · {d}
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">RELATIONSHIPS</p>
        <p className="mt-2 text-sm text-[#9bb0c0]">People, usernames, organizations, domains, and datasets in this cluster.</p>
        <div className="mt-4 h-[320px]">
          <MiniGraph focusId={rec.id} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {related.map((r) => (
            <Link key={r.id} to={`/app/profile/${r.id}`} className="rounded-full border border-white/10 px-3 py-1 text-xs">
              {r.name}
            </Link>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">PIN TO INVESTIGATION</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            aria-label="Investigation"
            value={invId}
            onChange={(e) => setInvId(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#071018] px-3 py-2 text-sm"
          >
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.id} · {inv.name}
              </option>
            ))}
          </select>
          <PrimaryButton
            onClick={() => {
              if (invId) addRecordToInvestigation(invId, rec.id)
            }}
          >
            Add to case
          </PrimaryButton>
        </div>
      </GlassCard>
    </div>
  )
}
