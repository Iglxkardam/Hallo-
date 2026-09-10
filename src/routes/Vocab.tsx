import { useMemo, useState } from 'react'
import type { Vocab as VocabItem } from '@/types'
import { ALL_VOCAB, DAYS } from '@/data/curriculum'
import { useStore } from '@/lib/store'
import { reviewQueue, mastered } from '@/lib/srs'
import { VocabCard } from '@/components/vocab/VocabCard'
import { Flashcards } from '@/components/vocab/Flashcards'
import { PageHead, Segmented, Stat, Empty, Pill, SpeakButton } from '@/components/ui'
import { shuffle } from '@/lib/utils'

type Mode = 'list' | 'cards' | 'due'

export default function Vocab() {
  const [mode, setMode] = useState<Mode>('list')
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all')
  const [q, setQ] = useState('')
  const [dense, setDense] = useState(false)

  const srs = useStore((s) => s.srs)
  const showHindi = useStore((s) => s.settings.showHindi)
  const seedCards = useStore((s) => s.seedCards)

  const known = Object.values(srs).filter(mastered).length
  const inDeck = Object.keys(srs).length
  const dueKeys = useMemo(() => new Set(reviewQueue(Object.values(srs), 25).map((c) => c.key)), [srs])

  const pool = dayFilter === 'all' ? ALL_VOCAB : (DAYS.find((d) => d.id === dayFilter)?.vocab ?? [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return pool
    return pool.filter(
      (v) => v.de.toLowerCase().includes(needle) || v.en.toLowerCase().includes(needle) || v.hi.includes(needle),
    )
  }, [pool, q])

  const dueDeck: VocabItem[] = useMemo(
    () => ALL_VOCAB.filter((v) => dueKeys.has(v.de)),
    [dueKeys],
  )

  const cardDeck = useMemo(() => shuffle(pool).slice(0, 30), [pool])

  return (
    <div className="page-wide">
      <PageHead
        eyebrow="Vocabulary"
        title="Words"
        sub="Every word with its article, plural, meaning and an example sentence. The flashcards use spaced repetition, so the words you keep forgetting come back more often."
        right={
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'list', label: 'List' },
              { value: 'cards', label: 'Cards' },
              { value: 'due', label: `Due ${dueDeck.length}` },
            ]}
          />
        }
      />

      <div className="grid g4" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="In the course" value={ALL_VOCAB.length} sub={`from ${DAYS.length} days`} />
        <Stat label="In my list" value={inDeck} sub="being reviewed" color="var(--blue)" />
        <Stat label="Mastered" value={known} sub="box 4 or higher" color="var(--green)" />
        <Stat label="Due now" value={dueDeck.length} sub="waiting for you" color="var(--orange)" />
      </div>

      {/* ── LIST ── */}
      {mode === 'list' && (
        <>
          <div className="row wrap" style={{ gap: 10, marginBottom: 'var(--s4)' }}>
            <input
              className="answer-input"
              style={{ maxWidth: 280, padding: '10px 14px', fontSize: 14 }}
              placeholder="Search — German or English"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className={`chip${dayFilter === 'all' ? ' picked' : ''}`} onClick={() => setDayFilter('all')}>
              All
            </button>
            {DAYS.map((d) => (
              <button
                key={d.id}
                className={`chip${dayFilter === d.id ? ' picked' : ''}`}
                onClick={() => setDayFilter(d.id)}
              >
                Day {d.id}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Empty icon="🔍" title="Nothing found" note="Try another word." />
          ) : (
            <>
              <div className="row between wrap" style={{ marginBottom: 'var(--s3)', gap: 10 }}>
                <span className="small dim">{filtered.length} words</span>
                <div className="row" style={{ gap: 10 }}>
                  <Segmented
                    value={dense ? 'table' : 'cards'}
                    onChange={(v) => setDense(v === 'table')}
                    options={[{ value: 'cards', label: 'Cards' }, { value: 'table', label: 'Table' }]}
                  />
                  <button className="btn btn-sm" onClick={() => seedCards(filtered.map((v) => v.de))}>
                    + Add all to my list
                  </button>
                </div>
              </div>
              {dense ? (
                <div className="gt-wrap">
                  <table className="gt">
                    <caption>Copy these columns straight into your vocabulary notebook</caption>
                    <thead>
                      <tr>
                        <th>Wort</th>
                        <th>Plural</th>
                        <th>English</th>
                        {showHindi && <th>Hindi</th>}
                        <th style={{ width: 44 }}>Hear</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((v) => (
                        <tr key={v.de}>
                          <td className="cell-de">{v.de}</td>
                          <td className="tiny dim mono">{v.pl ?? '—'}</td>
                          <td>{v.en}</td>
                          {showHindi && <td>{v.hi}</td>}
                          <td style={{ padding: '2px 6px' }}><SpeakButton text={v.de} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid auto-md">
                  {filtered.map((v, i) => (
                    <VocabCard key={v.de} v={v} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── FLASHCARDS ── */}
      {mode === 'cards' && (
        <div style={{ paddingTop: 'var(--s4)' }}>
          <div className="row wrap center" style={{ gap: 8, marginBottom: 'var(--s5)' }}>
            <Pill>Space = flip</Pill>
            <Pill>1 = again</Pill>
            <Pill>2 = knew it</Pill>
          </div>
          <Flashcards deck={cardDeck} />
        </div>
      )}

      {/* ── DUE REVIEW ── */}
      {mode === 'due' && (
        <div style={{ paddingTop: 'var(--s4)' }}>
          {dueDeck.length === 0 ? (
            <Empty
              icon="✅"
              title="Nothing due — nicely done!"
              note={
                inDeck === 0
                  ? 'No words in your list yet. Open any day, go to the Words tab and press "Add to my list".'
                  : 'All caught up. More words become due in a few hours — come back then.'
              }
            />
          ) : (
            <Flashcards deck={dueDeck} />
          )}
        </div>
      )}
    </div>
  )
}
