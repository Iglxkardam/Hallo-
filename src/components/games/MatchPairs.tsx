import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ALL_VOCAB } from '@/data/curriculum'
import { useStore } from '@/lib/store'
import { XP } from '@/lib/gamify'
import { shuffle, sample, cn } from '@/lib/utils'
import { speak } from '@/lib/audio'

const PAIRS = 8

type Tile = { id: string; key: string; label: string; side: 'de' | 'en' }

/** Tap a German word, then its English meaning. Wrong pairs shake and reset. */
export function MatchPairs() {
  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState<Tile | null>(null)
  const [solved, setSolved] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<string | null>(null)
  const [misses, setMisses] = useState(0)
  const [start] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  const addXp = useStore((s) => s.addXp)
  const review = useStore((s) => s.review)

  const tiles = useMemo<Tile[]>(() => {
    const picks = sample(ALL_VOCAB.filter((v) => v.en), PAIRS)
    return shuffle([
      ...picks.map((v) => ({ id: `de-${v.de}`, key: v.de, label: v.de, side: 'de' as const })),
      ...picks.map((v) => ({ id: `en-${v.de}`, key: v.de, label: v.en, side: 'en' as const })),
    ])
  }, [round])

  const done = solved.size === PAIRS

  useEffect(() => {
    if (done) return
    const t = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 500)
    return () => clearInterval(t)
  }, [done, start, round])

  useEffect(() => {
    if (!done) return
    addXp(XP.gameWin + Math.max(0, 40 - misses * 4))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const tap = (t: Tile) => {
    if (solved.has(t.key) || wrong) return
    if (t.side === 'de') speak(t.label)

    if (!picked) return setPicked(t)
    if (picked.id === t.id) return setPicked(null)

    if (picked.key === t.key && picked.side !== t.side) {
      setSolved((s) => new Set([...s, t.key]))
      review(t.key, true)
      setPicked(null)
    } else {
      setMisses((m) => m + 1)
      review(picked.key, false)
      setWrong(t.id)
      setTimeout(() => { setWrong(null); setPicked(null) }, 480)
    }
  }

  const next = () => {
    setRound((r) => r + 1)
    setSolved(new Set()); setPicked(null); setMisses(0); setElapsed(0)
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card card-pad col center"
        style={{ gap: 12, padding: 'var(--s8) var(--s5)', textAlign: 'center' }}
      >
        <div style={{ fontSize: 44 }}>🧩</div>
        <h2 className="h2">All pairs found!</h2>
        <p className="muted">{elapsed} seconds · {misses} mistakes · +{XP.gameWin + Math.max(0, 40 - misses * 4)} XP</p>
        <button className="btn btn-primary btn-lg" onClick={next}>New round</button>
      </motion.div>
    )
  }

  return (
    <div className="col" style={{ gap: 'var(--s4)' }}>
      <div className="row between">
        <span className="small dim">{solved.size} / {PAIRS} pairs</span>
        <span className="mono small">{elapsed}s · {misses} mistakes</span>
      </div>
      <div className="bar"><i style={{ width: `${(solved.size / PAIRS) * 100}%` }} /></div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {tiles.map((t) => {
          const isSolved = solved.has(t.key)
          const isPicked = picked?.id === t.id
          const isWrong = wrong === t.id || (wrong && picked?.id === t.id)
          return (
            <motion.button
              key={t.id}
              layout
              onClick={() => tap(t)}
              disabled={isSolved}
              animate={isWrong ? { x: [0, -7, 7, -5, 0] } : {}}
              transition={{ duration: 0.34 }}
              className={cn('opt', isPicked && 'right', isWrong && 'wrong')}
              style={{
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: 74,
                fontSize: t.side === 'de' ? 15 : 14.5,
                fontWeight: t.side === 'de' ? 700 : 550,
                opacity: isSolved ? 0.25 : 1,
                pointerEvents: isSolved ? 'none' : 'auto',
              }}
            >
              {t.label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
