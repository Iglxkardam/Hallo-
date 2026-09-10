/**
 * Content audit.
 *
 * Checks the German in the course for the kinds of mistake that would actually
 * teach something wrong: articles that disagree with themselves, plurals that
 * are not plurals, exercises whose "correct" answer is not correct, and the
 * same word given two different meanings on two different days.
 *
 *   npm run check
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const tmp = path.join(ROOT, 'node_modules', '.cache-check.mjs')
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src', 'data', 'curriculum.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: tmp,
  alias: { '@': path.join(ROOT, 'src') }, logLevel: 'silent',
})
const { DAYS } = await import('file://' + tmp.replace(/\\/g, '/'))

const problems = []
const warn = (day, kind, msg) => problems.push({ day, kind, msg })

const norm = (s) =>
  String(s).toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[.,!?;:"'’]/g, '').replace(/\s+/g, ' ')

const ART = { der: 'm', die: 'f', das: 'n' }

/* ── per-day checks ──────────────────────────────────────────────────── */
for (const d of DAYS) {
  const D = `Tag ${d.id}`

  for (const v of d.vocab) {
    const first = v.de.trim().split(/\s+/)[0].toLowerCase()

    if (v.type === 'noun') {
      // a noun should carry its article, unless it is a proper noun / plural-only
      if (!(first in ART) && v.gender !== 'pl' && !/^[A-ZÄÖÜ]/.test(v.de)) {
        warn(D, 'noun-no-article', `"${v.de}" is typed noun but has no der/die/das`)
      }
      // the stated gender must match the article actually written
      if (first in ART && v.gender && v.gender !== ART[first]) {
        warn(D, 'gender-mismatch', `"${v.de}" is written with "${first}" but gender is "${v.gender}"`)
      }
      // every plural takes the article die
      if (v.pl && !/^die\s/.test(v.pl.trim())) {
        warn(D, 'plural-article', `"${v.de}" plural is "${v.pl}" — a plural must start with "die"`)
      }
    }

    if (v.type === 'verb' && v.ex) {
      const stem = v.de.replace(/e?n$/, '').toLowerCase()
      const shown = norm(v.ex).includes(stem.slice(0, Math.max(3, stem.length - 1)))
      if (!shown && !v.forms) {
        warn(D, 'verb-form-hidden', `"${v.de}": the example "${v.ex}" never shows a recognisable form of the verb, and no forms are given`)
      }
    }

    if (!v.en?.trim()) warn(D, 'no-english', `"${v.de}" has no English meaning`)
    if (v.ex && !/[.!?]$/.test(v.ex.trim())) warn(D, 'example-punctuation', `example for "${v.de}" does not end in . ! or ?`)
  }

  // the same word listed twice on one day would show as two identical cards
  const onDay = new Map()
  for (const v of d.vocab) {
    const k = norm(v.de)
    if (onDay.has(k)) warn(D, 'duplicate-vocab', `"${v.de}" appears twice in the same day`)
    onDay.set(k, v)
  }

  for (const [i, e] of d.exercises.entries()) {
    const at = `exercise ${i + 1} (${e.k})`

    if (e.k === 'mcq') {
      if (!(e.a >= 0 && e.a < e.options.length)) warn(D, 'mcq-index', `${at}: answer index ${e.a} is out of range`)
      if (new Set(e.options.map(norm)).size !== e.options.length) warn(D, 'mcq-duplicate', `${at}: duplicate options`)
    }

    if (e.k === 'artikel') {
      if (!(e.a in ART)) warn(D, 'artikel-answer', `${at}: "${e.a}" is not der/die/das`)
      // the reason line should name the same article as the answer
      if (e.why && !new RegExp(`\\b${e.a}\\b`).test(e.why)) {
        warn(D, 'artikel-why', `${at}: answer is "${e.a} ${e.noun}" but the explanation never says "${e.a}"`)
      }
    }

    if (e.k === 'order') {
      const given = [...e.words].map(norm).sort().join('|')
      const built = e.a.split(/\s+/).map(norm).sort().join('|')
      if (given !== built) {
        warn(D, 'order-mismatch', `${at}: the answer "${e.a}" cannot be built from the given words`)
      }
    }

    if (e.k === 'listen') {
      if (!e.a.some((x) => norm(x) === norm(e.text))) {
        warn(D, 'listen-answer', `${at}: spoken text "${e.text}" is not among the accepted answers`)
      }
    }

    if (e.k === 'fill' && (!e.a?.length || e.a.some((x) => !x.trim()))) {
      warn(D, 'fill-answer', `${at}: empty accepted answer`)
    }

    if (!e.why?.trim()) warn(D, 'no-explanation', `${at}: no explanation`)
  }

  for (const b of d.notes) {
    if (b.t === 'table') {
      const w = b.head.length
      b.rows.forEach((r, i) => {
        if (r.length !== w) warn(D, 'table-width', `"${b.caption}" row ${i + 1} has ${r.length} cells, header has ${w}`)
      })
      if (b.say && b.say.length !== b.rows.length) {
        warn(D, 'table-say', `"${b.caption}" has ${b.say.length} audio entries for ${b.rows.length} rows`)
      }
      // the clip on a row must be a phrase from THAT row, not a neighbour's
      b.say?.forEach((phrase, i) => {
        if (!phrase || !b.rows[i]) return
        const row = norm(b.rows[i].join(' '))
        const words = norm(phrase).split(' ').filter((w) => w.length > 2 && !['der', 'die', 'das'].includes(w))
        if (words.length && !words.some((w) => row.includes(w))) {
          warn(D, 'table-say-mismatch', `"${b.caption}" row ${i + 1} plays "${phrase}", which does not appear in that row`)
        }
      })
    }
  }
}

/* ── the same word must not mean two things ──────────────────────────── */
const seen = new Map()
for (const d of DAYS) {
  for (const v of d.vocab) {
    const k = norm(v.de)
    const prev = seen.get(k)
    if (!prev) { seen.set(k, { ...v, day: d.id }); continue }
    if (prev.pl && v.pl && prev.pl !== v.pl)
      warn(`Tag ${d.id}`, 'conflict-plural', `"${v.de}" plural "${v.pl}" contradicts Tag ${prev.day} "${prev.pl}"`)
    if (prev.gender && v.gender && prev.gender !== v.gender)
      warn(`Tag ${d.id}`, 'conflict-gender', `"${v.de}" gender differs from Tag ${prev.day}`)
  }
}

/* ── every audio phrase must exist in the manifest ───────────────────── */
const MAN = path.join(ROOT, 'public', 'audio', 'manifest.json')
if (fs.existsSync(MAN)) {
  const man = JSON.parse(fs.readFileSync(MAN, 'utf8'))
  const need = new Set()
  for (const d of DAYS) {
    for (const v of d.vocab) { need.add(v.de); if (v.ex) need.add(v.ex) }
    for (const l of d.dialogue?.lines ?? []) need.add(l.de)
    for (const b of d.notes) {
      if (b.t === 'ex') for (const i of b.items) need.add(i.de.split('(')[0].trim())
      if (b.t === 'table' && b.say) for (const t of b.say) need.add(t)
    }
  }
  const missing = [...need].filter((t) => t && !man.files[t])
  if (missing.length) warn('audio', 'missing-clip', `${missing.length} phrases have no audio: ${missing.slice(0, 5).join(' · ')}`)
}

/* ── report ──────────────────────────────────────────────────────────── */
const counts = {}
for (const p of problems) counts[p.kind] = (counts[p.kind] ?? 0) + 1

const words = DAYS.reduce((s, d) => s + d.vocab.length, 0)
const ex = DAYS.reduce((s, d) => s + d.exercises.length, 0)
console.log(`\n  checked ${DAYS.length} days · ${words} vocabulary entries · ${ex} exercises\n`)

if (!problems.length) {
  console.log('  no problems found\n')
} else {
  for (const p of problems) console.log(`  [${p.kind}] ${p.day}: ${p.msg}`)
  console.log(`\n  ${problems.length} problem(s):`, counts, '\n')
}
process.exit(problems.length ? 1 : 0)
