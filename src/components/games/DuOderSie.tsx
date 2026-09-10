import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { XP } from '@/lib/gamify'
import { shuffle, cn } from '@/lib/utils'

type Answer = 'du' | 'Sie'

interface Card {
  who: string
  answer: Answer
  why: string
}

/**
 * Register practice. The examiner in Sprechen listens for whether you address
 * people correctly, and getting it wrong is the mistake Germans actually
 * notice. Cases follow the age brackets in the course handout.
 */
const CARDS: Card[] = [
  { who: 'Your best friend', answer: 'du', why: 'Friends always take du.' },
  { who: 'Your grandmother', answer: 'du', why: 'Family always takes du, whatever their age.' },
  { who: 'Your younger brother', answer: 'du', why: 'Family takes du.' },
  { who: 'A four-year-old child', answer: 'du', why: 'Children under 6 always take du — a formal address is never used with them.' },
  { who: 'A ten-year-old in the park', answer: 'du', why: 'Children up to about 14 take du. Sie is possible with a child you do not know, but it is rare.' },
  { who: 'A classmate in your German course', answer: 'du', why: 'Classmates and fellow students use du among themselves.' },
  { who: 'Your teacher', answer: 'Sie', why: 'A teacher is someone you call Frau or Herr — that means Sie.' },
  { who: 'A stranger on the street', answer: 'Sie', why: 'Adults you do not know always take Sie.' },
  { who: 'A shop assistant', answer: 'Sie', why: 'Anyone serving you professionally takes Sie.' },
  { who: 'A waiter in a restaurant', answer: 'Sie', why: 'Sie — a restaurant is a formal situation with a stranger.' },
  { who: 'A doctor', answer: 'Sie', why: 'Sie. Doctors, officials and teachers are always addressed formally.' },
  { who: 'A police officer', answer: 'Sie', why: 'Sie — an official in a formal situation.' },
  { who: 'A colleague you met today', answer: 'Sie', why: 'At work it depends on the culture, but with a colleague you have just met, Sie is the safe start. Wait until they offer du.' },
  { who: 'Your boss', answer: 'Sie', why: 'Sie, unless the whole company uses du.' },
  { who: 'An elderly neighbour you do not know', answer: 'Sie', why: 'An adult stranger takes Sie, even next door.' },
  { who: 'Your cousin', answer: 'du', why: 'Family — du.' },
  { who: 'A baby', answer: 'du', why: 'Under 6, always du.' },
  { who: 'Someone interviewing you for a job', answer: 'Sie', why: 'A formal situation with a stranger — Sie throughout.' },
]

const ROUNDS = 12

export function DuOderSie() {
  const [deck, setDeck] = useState(() => shuffle(CARDS).slice(0, ROUNDS))
  const [n, setN] = useState(0)
  const [picked, setPicked] = useState<Answer | null>(null)
  const [score, setScore] = useState(0)

  const addXp = useStore((s) => s.addXp)
  const card = deck[n]
  const done = n >= deck.length

  useEffect(() => {
    if (done) addXp(score * XP.quizCorrect + (score === ROUNDS ? XP.quizPerfect : 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const restart = useMemo(
    () => () => { setDeck(shuffle(CARDS).slice(0, ROUNDS)); setN(0); setScore(0); setPicked(null) },
    [],
  )

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card card-pad col center"
        style={{ gap: 12, padding: 'var(--s8) var(--s5)', textAlign: 'center' }}
      >
        <div style={{ fontSize: 44 }}>{score >= 11 ? '🏆' : score >= 9 ? '🤝' : '💪'}</div>
        <h2 className="h2">{score} / {ROUNDS}</h2>
        <p className="muted" style={{ maxWidth: 420 }}>
          {score >= 11
            ? 'You will not embarrass yourself in a German shop.'
            : 'When you are unsure, use Sie — it is never rude, only a little distant.'}
        </p>
        <button className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
      </motion.div>
    )
  }

  const answered = picked !== null

  return (
    <div className="col" style={{ gap: 'var(--s4)' }}>
      <div className="row between">
        <span className="small dim">{n + 1} of {deck.length}</span>
        <span className="mono small" style={{ fontWeight: 700, color: 'var(--green)' }}>{score} ✓</span>
      </div>
      <div className="bar"><i style={{ width: `${(n / deck.length) * 100}%` }} /></div>

      <div className="card card-pad col center" style={{ gap: 8, minHeight: 150, padding: 'var(--s6)' }}>
        <span className="eyebrow">How do you address …</span>
        <span style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em' }}>
          {card.who}
        </span>
      </div>

      <div className="grid g2" style={{ gap: 10 }}>
        {(['du', 'Sie'] as Answer[]).map((a) => (
          <button
            key={a}
            disabled={answered}
            onClick={() => {
              setPicked(a)
              if (a === card.answer) setScore((s) => s + 1)
              setTimeout(() => { setPicked(null); setN((x) => x + 1) }, a === card.answer ? 1000 : 2600)
            }}
            className={cn(
              'opt',
              answered && a === card.answer && 'right',
              answered && picked === a && a !== card.answer && 'wrong',
            )}
            style={{ justifyContent: 'center', fontSize: 24, fontWeight: 750, padding: '20px 12px' }}
          >
            {a}
          </button>
        ))}
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn('feedback', picked === card.answer ? 'right' : 'wrong')}
        >
          <b style={{ display: 'block', marginBottom: 3 }}>
            {picked === card.answer ? '✓ Richtig!' : `✗ It is ${card.answer}`}
          </b>
          {card.why}
        </motion.div>
      )}
    </div>
  )
}
