function scoreRecord(record, q) {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
  const blob = [
    record.name,
    record.cnic,
    record.mobile,
    record.phone,
    record.invoiceNumber,
    record.businessName,
    record.city,
    record.province,
    record.fatherName,
    record.currentAddress,
    record.address,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  let score = 0
  for (const t of tokens) {
    if (blob.includes(t)) score += 100
    else if (blob.includes(t.replace(/\D/g, ''))) score += 90
    else if (blob.split(/\s+/).some((w) => w.startsWith(t))) score += 80
    else if (blob.includes(t)) score += 70
  }
  return score
}

async function searchLocalJson(q) {
  const base = process.env.URL || 'https://infinityosint.netlify.app'
  const res = await fetch(`${base}/pakistan-database.json`)
  if (!res.ok) throw new Error(`Local index unavailable (${res.status})`)
  const payload = await res.json()
  const records = Array.isArray(payload.records) ? payload.records : []
  return records
    .map((record) => ({ record, score: scoreRecord(record, q) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((hit) => hit.record)
}

async function searchExternal(q) {
  const base = process.env.PAKISTAN_DB_API_URL
  const key = process.env.PAKISTAN_DB_API_KEY
  if (!base) return null

  const url = base.includes('?')
    ? `${base}&q=${encodeURIComponent(q)}`
    : `${base}?q=${encodeURIComponent(q)}`

  const headers = { Accept: 'application/json' }
  if (key) headers.Authorization = `Bearer ${key}`

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Upstream API ${res.status}`)
  return res.json()
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120)
  if (!q) {
    return new Response(JSON.stringify({ results: [], total: 0, query: q }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const external = await searchExternal(q)
    if (external) {
      return new Response(JSON.stringify(external), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-InfinityX-Source': 'external-api',
        },
      })
    }

    const results = await searchLocalJson(q)
    return new Response(
      JSON.stringify({
        query: q,
        total: results.length,
        source: 'infinityx-bundled-index',
        results,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-InfinityX-Source': 'bundled-json',
        },
      },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : 'Search failed',
        results: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
}
