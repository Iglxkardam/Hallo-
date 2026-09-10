// Shared MiniMax call for the Vercel functions.
// The local dev server (server/index.mjs) keeps its own disk cache; on Vercel
// the filesystem is read-only, so these just proxy the request.
const BASE = (process.env.MINIMAX_BASE_URL || 'https://api.minimax.io').replace(/\/$/, '')

export async function minimax(endpoint, payload) {
  const key = process.env.MINIMAX_API_KEY
  if (!key) throw new Error('MINIMAX_API_KEY is not configured')

  const group = process.env.MINIMAX_GROUP_ID || ''
  const qs = group ? `?GroupId=${encodeURIComponent(group)}` : ''

  const r = await fetch(`${BASE}${endpoint}${qs}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json().catch(() => ({}))
  const status = data?.base_resp?.status_code
  if (!r.ok || (status !== undefined && status !== 0)) {
    throw new Error(data?.base_resp?.status_msg || `MiniMax HTTP ${r.status}`)
  }
  return data
}

export const readJson = (req) =>
  typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
