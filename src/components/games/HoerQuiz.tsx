import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Vocab } from '@/types'
import { ALL_VOCAB } from '@/data/curriculum'
import { useStore } from '@/lib/store'
import { XP } from '@/lib/gamify'
import { sample, shuffle, cn } from '@/lib/utils'
import { speak } from '@/lib/audio'

const ROUNDS = 10

/** Hear a German word, pick the meaning — trains the Hören module directly. */
export function HoerQuiz() {
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [seed, setSeed] = useState(0)

  const addXp = useStore((s) => s.addXp)
  const review = useStore((s) => s.review)
  const speed = useStore((s) => s.settings.speed)

  const rounds = useMemo(() => {
    const pool = ALL_VOCAB.filter((v) => v.en)
    return sample(pool, ROUNDS).map((answer) => {
      const distractors = sample(pool.filter((v) => v.de !== answer.de), 3)
      return { answer, options: shuffle([answer, ...distractors]) as Vocab[] }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const round = rounds[n]
  const done = n >= ROUNDS

  useEffect(() => {
    if (round) setTimeout(() => speak(round.answer.de, speed), 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, seed])

  useEffect(() => {
    if (done) addXp(score * XP.quizCorrect + (score === ROUNDS ? XP.quizPerfect : 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card card-pad col center"
        style={{ gap: 12, padding: 'var(--s8) var(--s5)', textAlign: 'center' }}
      >
        <div style={{ fontSize: 44 }}>{score >= 9 ? '🏆' : score >= 7 ? '🎧' : '💪'}</div>
        <h2 className="h2">{score} / {ROUNDS}</h2>
        <p className="muted">
          {score >= 9
            ? 'Excellent — your ear is ready for the listening module.'
            : 'Keep going. Ten words a day of listening moves your listening score directly.'}
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => { setSeed((s) => s + 1); setN(0); setScore(0); setPicked(null) }}
        >
          Play again
        </button>
      </motion.div>
    )
  }

  const answered = picked !== null

  return (
    <div className="col" style={{ gap: 'var(--s4)' }}>
      <div className="row between">
        <span className="small dim">Word {n + 1} of {ROUNDS}</span>
        <span className="mono small" style={{ fontWeight: 700, color: 'var(--green)' }}>{score} ✓</span>
      </div>
      <div className="bar"><i style={{ width: `${(n / ROUNDS) * 100}%` }} /></div>

      <div className="card card-pad col center" style={{ gap: 14, padding: 'var(--s7) var(--s5)' }}>
        <span className="eyebrow">What do you hear?</span>
        <button
          className="btn btn-lg btn-primary"
          onClick={() => speak(round.answer.de, speed)}
          style={{ borderRadius: '50%', width: 82, height: 82, padding: 0, fontSize: 30 }}
          aria-label="Play again"
        >
          🔊
        </button>
        <span className="tiny dim">Click to hear it again</span>
      </div>

      <div className="grid g2" style={{ gap: 10 }}>
        {round.options.map((o, i) => (
          <button
            key={o.de}
            disabled={answered}
            className={cn(
              'opt',
              answered && o.de === round.answer.de && 'right',
              answered && picked === i && o.de !== round.answer.de && 'wrong',
            )}
            onClick={() => {
              setPicked(i)
              const ok = o.de === round.answer.de
              if (ok) setScore((s) => s + 1)
              review(round.answer.de, ok)
              setTimeout(() => { setPicked(null); setN((x) => x + 1) }, 1150)
            }}
          >
            <span className="col" style={{ gap: 1 }}>
              <b>{o.en}</b>
              <span className="tiny dim">{o.hi}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="feedback right">
            <b>{round.answer.de}</b> — {round.answer.en}
            {round.answer.ex && <div className="small dim" style={{ marginTop: 3 }}>{round.answer.ex}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
