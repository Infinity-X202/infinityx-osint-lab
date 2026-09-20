import { FileText, Search, Trophy, Building2, Hash } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard, PrimaryButton } from '@/components/ui'
import { PRIZE_DATASET, PRIZE_PDF_URL } from '@/data/prizeWinners'
import { useIntel } from '@/context/IntelContext'

export function MyFilesPdfPage() {
  const { records } = useIntel()
  const prizeRecords = records.filter((r) => r.datasetId === 'PRIZE_WINNERS_PDF')
  const bumper = prizeRecords.filter((r) => r.prize?.includes('Bumper')).length
  const second = prizeRecords.filter((r) => r.prize?.includes('Second')).length
  const third = prizeRecords.filter((r) => r.prize?.includes('Third')).length
  const general = prizeRecords.filter((r) => r.prize?.includes('General')).length

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">INTEGRATED SOURCE</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">my files.pdf</h1>
        <p className="mt-2 text-[#9bb0c0]">
          Prize-winner intelligence sheet — indexed locally and searchable from the Infinity X engine.
        </p>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">SOURCE DOCUMENT</p>
            <h2 className="mt-2 text-2xl">my files.pdf</h2>
            <p className="mt-2 text-sm text-[#9bb0c0]">
              Local path: <code className="text-[#7ee8ff]">C:\Users\adilf\Desktop\my files.pdf</code>
            </p>
          </div>
          <a
            href={PRIZE_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7ee8ff]/30 px-4 py-2 text-sm text-[#7ee8ff] hover:bg-[#7ee8ff]/10"
          >
            <FileText size={14} /> Open PDF
          </a>
        </div>
        <p className="mt-4 text-sm leading-7 text-[#9bb0c0]">
          This PDF contains a <strong className="text-[#e8f8ff]">prize draw winner list</strong> with name, CNIC, mobile
          number, invoice number, business name, prize category, and prize amount. Infinity X indexes every row for OSINT
          training search — full CNIC and mobile visible for OSINT correlation exercises.
        </p>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Hash, label: 'Total records', value: prizeRecords.length },
          { icon: Trophy, label: 'Bumper / 2nd / 3rd', value: `${bumper} / ${second} / ${third}` },
          { icon: Building2, label: 'General prizes', value: general },
          { icon: FileText, label: 'Dataset ID', value: PRIZE_DATASET.id },
        ].map(({ icon: Icon, label, value }) => (
          <GlassCard key={label}>
            <Icon size={18} className="text-[#4de1c1]" />
            <p className="mt-2 text-xs text-[#7f93a3]">{label}</p>
            <p className="mt-1 text-lg font-semibold text-[#e8f8ff]">{value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#e8c07a]">PDF SCHEMA (INDEXED FIELDS)</p>
        <div className="mt-3 overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/30 text-[#7ee8ff]">
              <tr>
                {['Field', 'Search', 'Example'].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[#9bb0c0]">
              {[
                ['Name', 'Yes', 'MUHAMMAD ASLAM'],
                ['CNIC', 'Yes — full', '3320213987869'],
                ['Mobile No', 'Yes — full', '00923212423862'],
                ['Invoice Number', 'Yes', '131480220109174042733'],
                ['Business Name', 'Yes', 'Metro Pakistan'],
                ['Prize', 'Yes', 'Bumper Prize'],
                ['Prize Amount', 'Yes', '1,000,000'],
              ].map(([field, search, ex]) => (
                <tr key={field} className="border-t border-white/5">
                  <td className="px-4 py-2">{field}</td>
                  <td className="px-4 py-2">{search}</td>
                  <td className="px-4 py-2 text-[#7ee8ff]">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">SEARCH ENGINE</p>
        <div className="mt-3 flex items-start gap-3">
          <Search size={18} className="mt-1 text-[#4de1c1]" />
          <p className="text-sm leading-7 text-[#9bb0c0]">
            Type in <strong className="text-[#e8f8ff]">Search</strong> — results from{' '}
            <code className="text-[#7ee8ff]">my files.pdf</code> appear with dataset badge{' '}
            <code className="text-[#7ee8ff]">PRIZE_WINNERS_PDF</code>. Autocomplete shows names, businesses, invoices,
            and prize tiers as you type.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/app/search?q=MUHAMMAD%20ASLAM">
            <PrimaryButton>Search — MUHAMMAD ASLAM</PrimaryButton>
          </Link>
          <Link to="/app/search?q=Metro%20Pakistan" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm">
            Search — Metro Pakistan
          </Link>
          <Link to="/app/search?q=Bumper%20Prize" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm">
            Search — Bumper Prize
          </Link>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#ff9b9b]">AUTHORIZED TRAINING ONLY</p>
        <p className="mt-2 text-sm leading-7 text-[#9bb0c0]">
          Indexed for ethical hacking & OSINT exercises inside Infinity X. Full identifiers shown for authorized training only.
        </p>
      </GlassCard>
    </div>
  )
}
