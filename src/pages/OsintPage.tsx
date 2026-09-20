import { GlassCard } from '@/components/ui'

const CARDS = [
  {
    title: 'Reconnaissance',
    items: [
      'Passive reconnaissance: collect only what a target already published.',
      'Active reconnaissance: authorized probing inside a lab, never against live third parties without permission.',
      'Search engine intelligence: use operators on public pages you are allowed to query.',
      'Metadata analysis: filenames, timestamps, and document properties in sample files.',
      'Domain intelligence: WHOIS-style fields and DNS stories using example.test domains.',
      'Username correlation: the same handle appearing across training sources.',
      'Public-source research: newsrooms, registries, and corporate pages in the demo set.',
    ],
  },
]

export function OsintPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">OSINT MODULE</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Educational Playbook</h1>
      </div>
      {CARDS.map((c) => (
        <GlassCard key={c.title}>
          <h2 className="text-xl">{c.title}</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#9bb0c0]">
            {c.items.map((it) => (
              <li key={it}>• {it}</li>
            ))}
          </ul>
        </GlassCard>
      ))}
      <GlassCard>
        <h2 className="text-xl">Search Operators</h2>
        <p className="mt-2 text-sm text-[#9bb0c0]">Safe educational examples using fictional domains. Do not use these patterns to hunt leaked personal databases.</p>
        <pre className="mt-4 overflow-auto rounded-xl bg-black/30 p-4 font-mono text-sm text-[#9be8d4]">
{`site:example.com "fictional username"
site:aurora-systems.test "Alex Morgan"
intitle:"directory" site:northwind.lab
"Helix Analytics" site:helix-research.example`}
        </pre>
      </GlassCard>
      <GlassCard>
        <h2 className="text-xl">my files.pdf Integration</h2>
        <p className="mt-2 text-sm leading-7 text-[#9bb0c0]">
          Prize winner rows from <strong className="text-[#e8f8ff]">my files.pdf</strong> (Name, CNIC, Mobile, Invoice,
          Business, Prize) are indexed in the search engine. Use the dedicated module at{' '}
          <a href="/app/my-files-pdf" className="text-[#7ee8ff]">
            /app/my-files-pdf
          </a>{' '}
          for schema and quick searches.
        </p>
      </GlassCard>
      <GlassCard>
        <h2 className="text-xl">NADRA GitHub Integration</h2>
        <p className="mt-2 text-sm leading-7 text-[#9bb0c0]">
          The lab indexes the open-source{' '}
          <a
            href="https://github.com/Rayan-Rasheed/Project-Nadra_management_System"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7ee8ff]"
          >
            Project-Nadra_management_System
          </a>{' '}
          demo file. Search returns citizen names, cities, provinces, and full CNIC from that dataset alongside prize-winner records.
        </p>
      </GlassCard>
      <GlassCard>
        <h2 className="text-xl">Digital Footprint</h2>
        <p className="mt-2 text-sm leading-7 text-[#9bb0c0]">
          In this lab, a person node may share an organization with other identities, reuse a username style, and
          appear in more than one synthetic dataset. Correlation is the lesson — not collection of real civilians.
        </p>
      </GlassCard>
    </div>
  )
}
