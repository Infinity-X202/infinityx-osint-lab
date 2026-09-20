import { ExternalLink, GitBranch, Search, Shield, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard, PrimaryButton } from '@/components/ui'
import { NADRA_REPO_URL } from '@/data/nadraRecords'
import { useIntel } from '@/context/IntelContext'

export function NadraModulePage() {
  const { records } = useIntel()
  const nadraCount = records.filter((r) => r.datasetId === 'NADRA_GITHUB_DEMO').length

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">INTEGRATED SOURCE</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">NADRA Management System</h1>
        <p className="mt-2 text-[#9bb0c0]">
          Educational citizen-record database demo — linked from GitHub and indexed in the Infinity X search engine.
        </p>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">GITHUB REPOSITORY</p>
            <h2 className="mt-2 text-2xl">Project-Nadra_management_System</h2>
            <p className="mt-2 text-sm text-[#9bb0c0]">Author: Rayan Rasheed · Language: C++</p>
          </div>
          <a
            href={NADRA_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7ee8ff]/30 px-4 py-2 text-sm text-[#7ee8ff] hover:bg-[#7ee8ff]/10"
          >
            Open on GitHub <ExternalLink size={14} />
          </a>
        </div>
        <p className="mt-4 text-sm leading-7 text-[#9bb0c0]">
          This open-source project is a <strong className="text-[#e8f8ff]">database management system</strong> for
          citizen records. It is designed for admin operators and includes an applicant portal for tracking applications,
          complaints, and certificate downloads (e.g. vaccination certificates).
        </p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, title: 'Citizen records', body: 'Manage names, CNIC, addresses, and family data in nadra_data.txt.' },
          { icon: Search, title: 'Record search', body: 'Search any citizen history — mirrored in our OSINT search module.' },
          { icon: GitBranch, title: 'Statistics', body: 'Population stats by city and age groups (demo graphs in C++ app).' },
          { icon: Shield, title: 'Applicant portal', body: 'Track applications, report complaints, download certificates.' },
        ].map(({ icon: Icon, title, body }) => (
          <GlassCard key={title}>
            <Icon size={18} className="text-[#4de1c1]" />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-[#9bb0c0]">{body}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#e8c07a]">INFINITY X LAB INTEGRATION</p>
        <ul className="mt-3 space-y-2 text-sm text-[#9bb0c0]">
          <li>• <strong className="text-[#e8f8ff]">{nadraCount} records</strong> imported from <code className="text-[#7ee8ff]">nadra_data.txt</code> in the repo.</li>
          <li>• Search by <strong className="text-[#e8f8ff]">name</strong>, <strong className="text-[#e8f8ff]">city</strong>, <strong className="text-[#e8f8ff]">province</strong>, <strong className="text-[#e8f8ff]">address</strong>, or <strong className="text-[#e8f8ff]">CNIC last 4 digits</strong>.</li>
          <li>• Full <strong className="text-[#e8f8ff]">CNIC numbers</strong> are visible for OSINT training (e.g. 3130258066437).</li>
          <li>• Dataset ID in search: <code className="text-[#7ee8ff]">NADRA_GITHUB_DEMO</code></li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/app/search?q=Rayan">
            <PrimaryButton>Search NADRA demo — Rayan</PrimaryButton>
          </Link>
          <Link to="/app/search?q=Lahore" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm">
            Search by city — Lahore
          </Link>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">FILE STRUCTURE (REPO)</p>
        <pre className="mt-3 overflow-auto rounded-xl bg-black/30 p-4 font-mono text-xs text-[#9be8d4]">
{`Project-Nadra_management_System/
├── Nadra_Project.cpp      # Main C++ application
├── Nadra_project.exe      # Compiled binary
├── nadra_data.txt         # Citizen records (indexed here)
├── sign_up.txt            # Sign-up data
└── header.txt             # ASCII banner`}
        </pre>
      </GlassCard>

      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#ff9b9b]">AUTHORIZED USE ONLY</p>
        <p className="mt-2 text-sm leading-7 text-[#9bb0c0]">
          This integration is for <strong className="text-[#e8f8ff]">ethical hacking & OSINT training</strong> only.
          Do not use against live NADRA systems. The GitHub project is an educational demo — Infinity X indexes it locally
          for investigation exercises inside this authorized lab.
        </p>
      </GlassCard>
    </div>
  )
}
