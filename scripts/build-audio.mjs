/**
 * One-time offline audio build.
 *
 * Renders every German phrase in the course to public/audio/*.mp3 and writes a
 * manifest the app loads at startup. After this runs, tapping a word plays a
 * local file instantly — no network round-trip, and it keeps working with the
 * API server switched off.
 *
 *   npm run audio          # only what is missing
 *   npm run audio -- --force   # regenerate everything
 *
 * Each phrase is rendered TWICE: once at normal speed and once slow (0.75),
 * both natively by MiniMax. Browser time-stretching (playbackRate) smears the
 * consonants and makes German very hard to follow, so we never use it.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'public', 'audio')
const MANIFEST = path.join(OUT, 'manifest.json')
const FORCE = process.argv.includes('--force')
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0

fs.mkdirSync(OUT, { recursive: true })

for (const file of ['.env', '.env.local']) {
  const p = path.join(ROOT, file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const KEY = process.env.MINIMAX_API_KEY
const BASE = (process.env.MINIMAX_BASE_URL || 'https://api.minimax.io').replace(/\/$/, '')
const MODEL = process.env.MINIMAX_TTS_MODEL || 'speech-2.6-hd'
const VOICE = process.env.MINIMAX_TTS_VOICE || 'German_SweetLady'
const GROUP = process.env.MINIMAX_GROUP_ID || ''

if (!KEY) {
  console.error('MINIMAX_API_KEY missing — add it to .env.local')
  process.exit(1)
}

/* ── load the curriculum (TypeScript → temp bundle) ──────────────────── */
const tmp = path.join(ROOT, 'node_modules', '.cache-curriculum.mjs')
fs.mkdirSync(path.dirname(tmp), { recursive: true })
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src', 'data', 'curriculum.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: tmp,
  alias: { '@': path.join(ROOT, 'src') },
  logLevel: 'silent',
})
const { DAYS } = await import('file://' + tmp.replace(/\\/g, '/'))

/* ── collect every phrase worth caching ──────────────────────────────── */
const texts = new Set()
const add = (t) => {
  const s = String(t || '').trim()
  if (s && s.length < 400) texts.add(s)
}

for (const day of DAYS) {
  for (const v of day.vocab) {
    add(v.de)
    add(v.ex)
  }
  for (const l of day.dialogue?.lines ?? []) add(l.de)
  for (const b of day.notes) {
    if (b.t === 'ex') for (const i of b.items) add(i.de.split('(')[0].trim())
    if (b.t === 'table' && b.say) for (const t of b.say) add(t)
  }
  for (const e of day.exercises) {
    if (e.k === 'listen') add(e.text)
    if (e.k === 'artikel') add(`${e.a} ${e.noun}`)
    if (e.k === 'order') add(e.a)
  }
}

const all = [...texts]
const SPEEDS = { n: 1.0, s: 0.75 }
// the voice is part of the key, so switching voices never reuses stale clips
const nameOf = (t, tag) =>
  crypto.createHash('sha1').update(`${t}|${SPEEDS[tag]}|${VOICE}`).digest('hex').slice(0, 20) + '.mp3'

const manifest = fs.existsSync(MANIFEST) && !FORCE ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { voice: VOICE, model: MODEL, files: {} }
if (manifest.voice !== VOICE || manifest.model !== MODEL) {
  manifest.voice = VOICE
  manifest.model = MODEL
  if (!FORCE) console.log('voice or model changed — existing clips will be reused where present')
}

/** one job per (phrase, speed) that is not already on disk */
const todo = []
for (const t of all) {
  for (const tag of Object.keys(SPEEDS)) {
    const f = nameOf(t, tag)
    if (FORCE || !manifest.files[t]?.[tag] || !fs.existsSync(path.join(OUT, f))) todo.push({ t, tag })
  }
}

console.log(`\n  ${all.length} phrases in the course · ${todo.length} to generate`)
console.log(`  model ${MODEL} · voice ${VOICE}\n`)

if (!todo.length) {
  console.log('  everything is already cached\n')
  process.exit(0)
}

/* ── generate ────────────────────────────────────────────────────────── */
async function render(text, speed) {
  const qs = GROUP ? `?GroupId=${encodeURIComponent(GROUP)}` : ''
  const r = await fetch(`${BASE}/v1/t2a_v2${qs}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      text,
      stream: false,
      language_boost: 'German',
      voice_setting: { voice_id: VOICE, speed, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
    }),
  })
  const d = await r.json()
  const hex = d?.data?.audio
  if (!hex) {
    const msg = d?.base_resp?.status_msg || 'no audio returned'
    const err = new Error(msg)
    err.rateLimited = /rate limit/i.test(msg)
    throw err
  }
  return Buffer.from(hex, 'hex')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** MiniMax enforces a requests-per-minute cap, so back off and try again. */
async function renderWithRetry(text, speed, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      return await render(text, speed)
    } catch (e) {
      if (!e.rateLimited || i === tries - 1) throw e
      await sleep(2000 * 2 ** i + Math.random() * 800)
    }
  }
}

let done = 0
let failed = 0
const queue = [...todo]

const worker = async () => {
  while (queue.length) {
    const { t: text, tag } = queue.shift()
    const file = nameOf(text, tag)
    try {
      const buf = await renderWithRetry(text, SPEEDS[tag])
      fs.writeFileSync(path.join(OUT, file), buf)
      // each phrase keeps both renderings: { n: normal, s: slow }
      manifest.files[text] = { ...manifest.files[text], [tag]: file }
      done++
    } catch (e) {
      failed++
      process.stderr.write(`\n  ! ${String(text).slice(0, 40)} [${tag}] — ${e?.message ?? e}\n`)
    }
    const n = done + failed
    if (n % 20 === 0 || !queue.length) {
      process.stdout.write(`\r  ${n}/${todo.length} …`)
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0))
    }
  }
}

await Promise.all([worker(), worker()])
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0))

const bytes = fs.readdirSync(OUT).filter((f) => f.endsWith('.mp3'))
  .reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0)

console.log(`\n\n  done — ${done} generated, ${failed} failed`)
console.log(`  ${bytes ? (bytes / 1048576).toFixed(1) : 0} MB in public/audio\n`)
