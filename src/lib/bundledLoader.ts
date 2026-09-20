import { parseCsv, rowsToRecords } from '@/lib/importFile'
import type { DatasetMeta, IntelRecord } from '@/types'

type Manifest = { csv?: string[]; json?: string[] }

export async function loadBundledCsvRecords(existingIds: Set<string>) {
  const records: IntelRecord[] = []
  const datasets: DatasetMeta[] = []
  const files = new Set<string>(['pakistan-database.csv'])

  try {
    const manifestRes = await fetch('/bundled-manifest.json', { cache: 'no-cache' })
    if (manifestRes.ok) {
      const manifest = (await manifestRes.json()) as Manifest
      for (const file of manifest.csv ?? []) files.add(file)
    }
  } catch {
    // manifest optional
  }

  for (const file of files) {
    try {
      const res = await fetch(`/${file}`, { cache: 'no-cache' })
      if (!res.ok) continue
      const rows = parseCsv(await res.text())
      if (!rows.length) continue

      const datasetId = `BND_${file.replace(/[^a-z0-9]/gi, '_').toUpperCase()}`
      const recs = rowsToRecords(rows, datasetId, file).filter((r) => !existingIds.has(r.id))
      if (!recs.length) continue

      for (const r of recs) existingIds.add(r.id)
      records.push(...recs)
      datasets.push({
        id: datasetId,
        name: file,
        fileType: 'CSV',
        importDate: new Date().toISOString(),
        status: 'Verified',
        schema: Object.keys(rows[0] ?? {}),
        description: `Auto-indexed from /${file}. Add rows and redeploy to expand the index.`,
        sourceKind: 'Training Dataset',
        synthetic: true,
      })
    } catch {
      // optional bundled file
    }
  }

  return { records, datasets }
}
