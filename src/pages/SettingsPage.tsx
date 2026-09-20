import { useState } from 'react'
import { ErrorBanner, GlassCard, PrimaryButton } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { parseImportFile } from '@/lib/importFile'

export function SettingsPage() {
  const { settings, updateSettings, importRows } = useIntel()
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; fileName: string } | null>(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  async function onFile(file: File | undefined) {
    setErr('')
    setOk('')
    setPreview(null)
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseImportFile(file, text)
      setPreview({ ...parsed, fileName: file.name })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.35em] text-[#4de1c1]">SETTINGS</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Workstation Controls</h1>
      </div>
      <GlassCard>
        <p className="text-[11px] tracking-[0.3em] text-[#7ee8ff]">PAKISTAN DATABASE API</p>
        <label className="mt-4 flex items-center justify-between gap-4 text-sm">
          Enable API search (local /api/search + optional external)
          <input
            type="checkbox"
            checked={settings.apiEnabled}
            onChange={(e) => updateSettings({ apiEnabled: e.target.checked })}
          />
        </label>
        <label className="mt-4 block text-sm">
          External API URL (leave empty for Netlify /api/search)
          <input
            value={settings.apiUrl}
            onChange={(e) => updateSettings({ apiUrl: e.target.value.slice(0, 240) })}
            placeholder="https://your-api.com/search"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs"
          />
        </label>
        <label className="mt-4 block text-sm">
          API key (Bearer token, optional)
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => updateSettings({ apiKey: e.target.value.slice(0, 120) })}
            placeholder="sk-..."
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs"
          />
        </label>
        <p className="mt-3 text-xs text-[#7f93a3]">
          Default endpoint: <code className="text-[#4de1c1]">/api/search?q=NAME</code> · Configure upstream on Netlify with{' '}
          <code className="text-[#4de1c1]">PAKISTAN_DB_API_URL</code>
        </p>
      </GlassCard>

      <GlassCard>
        <label className="flex items-center justify-between gap-4 text-sm">
          Mask emails only (CNIC/mobile always full for OSINT)
          <input
            type="checkbox"
            checked={settings.maskSensitive}
            onChange={(e) => updateSettings({ maskSensitive: e.target.checked })}
          />
        </label>
        <label className="mt-4 block text-sm">
          Investigator name
          <input
            value={settings.investigatorName}
            onChange={(e) => updateSettings({ investigatorName: e.target.value.slice(0, 40) })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
          />
        </label>
        <label className="mt-4 flex items-center justify-between gap-4 text-sm">
          Enable administrator import
          <input
            type="checkbox"
            checked={settings.adminImportEnabled}
            onChange={(e) => updateSettings({ adminImportEnabled: e.target.checked })}
          />
        </label>
      </GlassCard>

      {settings.adminImportEnabled ? (
        <GlassCard>
          <p className="text-[11px] tracking-[0.3em] text-[#e8c07a]">ADMIN DATASET IMPORT</p>
          <p className="mt-2 text-sm text-[#9bb0c0]">
            CSV/JSON up to 5000 rows. Supports Pakistani fields: name, CNIC, mobile, invoice, business, city, province,
            father name. Passwords/tokens/cards are rejected.
          </p>
          <p className="mt-2 text-xs text-[#7f93a3]">
            Bulk data: add rows to <code>public/pakistan-database.csv</code> and redeploy, or import here.
          </p>
          <input
            className="mt-4 text-sm"
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {err ? <div className="mt-3"><ErrorBanner title="IMPORT ERROR" body={err} /></div> : null}
          {preview ? (
            <div className="mt-4 text-sm">
              <p>
                Preview · {preview.rows.length} records · schema {preview.headers.join(', ')}
              </p>
              <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 p-2 font-mono text-xs">
                {preview.rows.slice(0, 5).map((r, i) => (
                  <p key={i}>{JSON.stringify(r)}</p>
                ))}
              </div>
              <PrimaryButton
                className="mt-4"
                onClick={() => {
                  const result = importRows(preview.rows, preview.fileName)
                  setOk(`Imported ${result.count} sanitized records into ${result.dataset.id}.`)
                  setPreview(null)
                }}
              >
                Confirm sanitize & index
              </PrimaryButton>
            </div>
          ) : null}
          {ok ? <p className="mt-3 text-sm text-[#4de1c1]">{ok}</p> : null}
        </GlassCard>
      ) : (
        <GlassCard>
          <p className="text-sm text-[#9bb0c0]">Import stays locked until an administrator enables it. The default index is the synthetic training corpus.</p>
        </GlassCard>
      )}
    </div>
  )
}
