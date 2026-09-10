import { motion } from 'framer-motion'
import type { Vocab } from '@/types'
import { genderColor, genderOf } from '@/lib/utils'
import { SpeakButton } from '@/components/ui'
import { Gloss } from '@/components/Gloss'
import { useStore } from '@/lib/store'

const TYPE_LABEL: Record<string, string> = {
  noun: 'Nomen', verb: 'Verb', adj: 'Adjektiv', adv: 'Adverb',
  phrase: 'Wendung', num: 'Zahl', prep: 'Präposition', pron: 'Pronomen', other: 'Wort',
}

/**
 * Which word in the example sentence is actually this verb?
 *
 * "sein" never appears literally in an A1 sentence — you only ever meet bin,
 * bist, ist. So we highlight the form that IS the headword, otherwise the
 * learner cannot see the connection at all.
 */
function formsInExample(v: Vocab): Set<string> | undefined {
  if (v.type !== 'verb' || !v.ex) return undefined
  const targets = new Set<string>()
  for (const chunk of (v.forms ?? '').split('·')) {
    const w = chunk.trim().split(/\s+/).pop()
    if (w) targets.add(w.toLowerCase())
  }
  const stem = v.de.replace(/e?n$/, '').toLowerCase()
  const hits = new Set<string>()
  for (const raw of v.ex.split(/[^\p{L}\p{M}ß-]+/u)) {
    const w = raw.toLowerCase()
    if (!w) continue
    if (targets.has(w) || (stem.length > 2 && w.startsWith(stem))) hits.add(w)
  }
  return hits.size ? hits : undefined
}

export function VocabCard({ v, index = 0 }: { v: Vocab; index?: number }) {
  const showHindi = useStore((s) => s.settings.showHindi)
  const g = v.gender ?? genderOf(v.de)

  return (
    <motion.div
      className="vcard"
      style={{ ['--gender' as string]: genderColor(g) }}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="between" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div className="col" style={{ gap: 1, minWidth: 0 }}>
          <span className="vcard-de">{v.de}</span>
          {v.pl && (
            <span className="tiny dim mono">Plural: <Gloss>{v.pl}</Gloss></span>
          )}
          {v.forms && (
            <span className="tiny dim mono"><Gloss>{v.forms}</Gloss></span>
          )}
        </div>
        <SpeakButton text={v.de} />
      </div>

      <div className="col" style={{ gap: 1, marginTop: 8 }}>
        <span className="vcard-hi">{v.en}</span>
        {showHindi && <span className="vcard-en">{v.hi}</span>}
      </div>

      {v.ex && (
        <div
          style={{
            marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--line)',
            fontSize: 13.5, lineHeight: 1.5,
          }}
        >
          <div className="serif" style={{ fontWeight: 550 }}>
            <Gloss mark={formsInExample(v)}>{v.ex}</Gloss>
          </div>
          {showHindi && v.exHi && <div className="tiny dim" style={{ marginTop: 2 }}>{v.exHi}</div>}
        </div>
      )}

      <span className="tiny dim" style={{ position: 'absolute', top: 10, right: 44, fontSize: 10 }}>
        {TYPE_LABEL[v.type]}
      </span>
    </motion.div>
  )
}
