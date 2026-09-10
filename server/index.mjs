/**
 * Zero-dependency MiniMax proxy.
 *  POST /api/tts    { text, voice?, speed? }  -> audio/mpeg   (disk-cached)
 *  POST /api/image  { prompt, ratio? }        -> { url } | { b64 }  (disk-cached)
 *  POST /api/prewarm{ texts[], voice?, speed? } -> { queued }   (fills the cache)
 *  GET  /api/health                           -> { ok, minimax }
 *
 * The API key never reaches the browser. If MiniMax is unreachable or
 * unconfigured, endpoints return 503 and the client falls back to the
 * browser's built-in German speech synthesis.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(ROOT, 'server', '.cache')
fs.mkdirSync(CACHE, { recursive: true })

// --- tiny .env loader (.env.local wins over .env) -------------------------
for (const file of ['.env', '.env.local']) {
  const p = path.join(ROOT, file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const KEY = process.env.MINIMAX_API_KEY || ''
const GROUP = process.env.MINIMAX_GROUP_ID || ''
const BASE = (process.env.MINIMAX_BASE_URL || 'https://api.minimax.io').replace(/\/$/, '')
const TTS_MODEL = process.env.MINIMAX_TTS_MODEL || 'speech-2.6-hd'
const TTS_VOICE = process.env.MINIMAX_TTS_VOICE || 'German_FriendlyMan'
const IMG_MODEL = process.env.MINIMAX_IMAGE_MODEL || 'image-01'
const PORT = Number(process.env.PORT || 8787)

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 32)
const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}
const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => {
      raw += c
      if (raw.length > 1e6) req.destroy()
    })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })

async function minimax(endpoint, payload) {
  const qs = GROUP ? `?GroupId=${encodeURIComponent(GROUP)}` : ''
  const r = await fetch(`${BASE}${endpoint}${qs}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json().catch(() => ({}))
  const status = data?.base_resp?.status_code
  if (!r.ok || (status !== undefined && status !== 0)) {
    throw new Error(data?.base_resp?.status_msg || `MiniMax HTTP ${r.status}`)
  }
  return data
}

const clipPath = (text, voice, speed) =>
  path.join(CACHE, `${hash([text, voice, speed, TTS_MODEL].join('|'))}.mp3`)

/** Generate one clip and put it in the disk cache. Returns the buffer. */
async function generate(text, voice, speed) {
  const data = await minimax('/v1/t2a_v2', {
    model: TTS_MODEL,
    text,
    stream: false,
    language_boost: 'German',
    voice_setting: { voice_id: voice, speed, vol: 1, pitch: 0 },
    audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
  })
  const hex = data?.data?.audio
  if (!hex) throw new Error('no audio in MiniMax response')
  const buf = Buffer.from(hex, 'hex')
  fs.writeFileSync(clipPath(text, voice, speed), buf)
  return buf
}

/**
 * Warm the cache for a whole lesson in the background so the first click on a
 * word is instant. Answers immediately; generation continues after the reply.
 */
const warming = new Set()

async function prewarm(req, res, body) {
  const texts = (Array.isArray(body.texts) ? body.texts : []).slice(0, 120).map(String)
  const voice = String(body.voice || TTS_VOICE)
  const speed = Math.min(1.4, Math.max(0.6, Number(body.speed) || 1))

  const todo = texts.filter((t) => {
    const p = clipPath(t, voice, speed)
    return t.trim() && !fs.existsSync(p) && !warming.has(p)
  })
  json(res, 200, { queued: todo.length, cached: texts.length - todo.length })

  if (!KEY) return
  // three at a time keeps us well inside MiniMax rate limits
  const queue = [...todo]
  const worker = async () => {
    while (queue.length) {
      const text = queue.shift()
      const p = clipPath(text, voice, speed)
      if (warming.has(p)) continue
      warming.add(p)
      try { await generate(text, voice, speed) } catch { /* skipped; fetched on demand later */ }
      warming.delete(p)
    }
  }
  await Promise.all([worker(), worker(), worker()])
  console.log(`  prewarmed ${todo.length} clips`)
}

// --- text to speech -------------------------------------------------------
async function tts(req, res, body) {
  const text = String(body.text || '').slice(0, 900).trim()
  if (!text) return json(res, 400, { error: 'text required' })

  const voice = String(body.voice || TTS_VOICE)
  const speed = Math.min(1.4, Math.max(0.6, Number(body.speed) || 1))
  const file = clipPath(text, voice, speed)

  if (fs.existsSync(file)) {
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000', 'x-cache': 'hit' })
    return fs.createReadStream(file).pipe(res)
  }
  if (!KEY) return json(res, 503, { error: 'MINIMAX_API_KEY not set' })

  try {
    const buf = await generate(text, voice, speed)
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000', 'x-cache': 'miss' })
    res.end(buf)
  } catch (e) {
    json(res, 503, { error: String(e.message || e) })
  }
}

// --- image generation -----------------------------------------------------
async function image(req, res, body) {
  const prompt = String(body.prompt || '').slice(0, 1200).trim()
  if (!prompt) return json(res, 400, { error: 'prompt required' })

  const ratio = String(body.ratio || '16:9')
  const file = path.join(CACHE, `${hash([prompt, ratio, IMG_MODEL].join('|'))}.img.json`)

  if (fs.existsSync(file)) {
    res.writeHead(200, { 'content-type': 'application/json', 'x-cache': 'hit' })
    return res.end(fs.readFileSync(file))
  }
  if (!KEY) return json(res, 503, { error: 'MINIMAX_API_KEY not set' })

  try {
    const data = await minimax('/v1/image_generation', {
      model: IMG_MODEL,
      prompt,
      aspect_ratio: ratio,
      response_format: 'base64',
      n: 1,
      prompt_optimizer: true,
    })
    const b64 = data?.data?.image_base64?.[0]
    const url = data?.data?.image_urls?.[0]
    if (!b64 && !url) throw new Error('no image in MiniMax response')
    const out = JSON.stringify(b64 ? { b64: `data:image/jpeg;base64,${b64}` } : { url })
    fs.writeFileSync(file, out)
    res.writeHead(200, { 'content-type': 'application/json', 'x-cache': 'miss' })
    res.end(out)
  } catch (e) {
    json(res, 503, { error: String(e.message || e) })
  }
}

// --- router ---------------------------------------------------------------
const routes = { '/api/tts': tts, '/api/image': image, '/api/prewarm': prewarm }

http
  .createServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-allow-headers', 'content-type')
    if (req.method === 'OPTIONS') return res.writeHead(204).end()

    const url = (req.url || '').split('?')[0]
    if (url === '/api/health') return json(res, 200, { ok: true, minimax: Boolean(KEY), model: TTS_MODEL })

    const handler = routes[url]
    if (!handler || req.method !== 'POST') return json(res, 404, { error: 'not found' })

    try {
      handler(req, res, await readBody(req))
    } catch {
      json(res, 400, { error: 'bad request' })
    }
  })
  .listen(PORT, () => {
    console.log(`\n  ⚡ MiniMax proxy  →  http://localhost:${PORT}`)
    console.log(`     key: ${KEY ? KEY.slice(0, 10) + '…' : 'MISSING (browser TTS fallback)'}`)
    console.log(`     cache: server/.cache\n`)
  })
