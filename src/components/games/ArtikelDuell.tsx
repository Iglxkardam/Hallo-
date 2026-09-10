import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ALL_VOCAB } from '@/data/curriculum'
import { useStore } from '@/lib/store'
import { XP } from '@/lib/gamify'
import { bareNoun, genderOf, shuffle, cn } from '@/lib/utils'
import { speak } from '@/lib/audio'

const ROUND = 60 // seconds

type Card = { noun: string; answer: 'der' | 'die' | 'das' }

/** 60-second rapid-fire der/die/das. Three lives, streak multiplier. */
export function ArtikelDuell() {
  const nouns = useMemo<Card[]>(() => {
    const seen = new Set<string>()
    return shuffle(
      ALL_VOCAB.filter((v) => {
        const g = v.gender ?? genderOf(v.de)
        if (!g || g === 'pl' || seen.has(v.de)) return false
        seen.add(v.de)
        return true
      }).map((v) => ({
        noun: bareNoun(v.de),
        answer: (v.gender ?? genderOf(v.de)) === 'm' ? 'der' : (v.gender ?? genderOf(v.de)) === 'f' ? 'die' : 'das',
      })) as Card[],
    )
  }, [])

  const [running, setRunning] = useState(false)
  const [i, setI] = useState(0)
  const [time, setTime] = useState(ROUND)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)

  const addXp = useStore((s) => s.addXp)
  const setArtikelBest = useStore((s) => s.setArtikelBest)
  const saved = useRef(false)

  const card = nouns[i % nouns.length]
  const over = !running && (time === 0 || lives === 0) && i > 0

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTime((s) => (s <= 1 ? (setRunning(false), 0) : s - 1)), 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (lives === 0) setRunning(false)
  }, [lives])

  // bank the result exactly once per round
  useEffect(() => {
    if (!over || saved.current) return
    saved.current = true
    setArtikelBest(best)
    addXp(score * 2 + (best >= 10 ? XP.gameWin : 0))
  }, [over, best, score, addXp, setArtikelBest])

  const start = () => {
    saved.current = false
    setRunning(true)
    setI(0); setTime(ROUND); setLives(3); setScore(0); setStreak(0); setBest(0)
  }

  const answer = (a: 'der' | 'die' | 'das') => {
    if (!running) return
    const ok = a === card.answer
    setFlash(ok ? 'right' : 'wrong')
    setTimeout(() => setFlash(null), 220)

    if (ok) {
      setScore((s) => s + 1)
      setStreak((s) => {
        const n = s + 1
        setBest((b) => Math.max(b, n))
        return n
      })
    } else {
      setStreak(0)
      setLives((l) => l - 1)
      speak(`${card.answer} ${card.noun}`)
    }
    setI((n) => n + 1)
  }

  if (!running && !over) {
    return (
      <div className="card card-pad col center" style={{ gap: 14, padding: 'var(--s8) var(--s5)', textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🎲</div>
        <h2 className="h2">Article Duel</h2>
        <p className="muted" style={{ maxWidth: 420 }}>
          Sixty seconds. Three lives. Pick the right article — der, die or das — for as many nouns as you can.
          When you get one wrong, the correct answer is read aloud.
        </p>
        <div className="row wrap center" style={{ gap: 8 }}>
          <span className="pill">⏱ 60 seconds</span>
          <span className="pill">❤️ 3 lives</span>
          <span className="pill">{nouns.length} nouns</span>
        </div>
        <button className="btn btn-primary btn-lg" onClick={start}>Start</button>
      </div>
    )
  }

  if (over) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card card-pad col center"
        style={{ gap: 12, padding: 'var(--s8) var(--s5)', textAlign: 'center' }}
      >
        <div style={{ fontSize: 44 }}>{best >= 20 ? '🏆' : best >= 10 ? '🎉' : '💪'}</div>
        <h2 className="h2">{score} correct</h2>
        <p className="muted">Best streak: <b>{best}</b> · +{score * 2 + (best >= 10 ? XP.gameWin : 0)} XP</p>
        {best < 20 && <p className="small dim">A streak of 20 earns the Article Master badge.</p>}
        <button className="btn btn-primary btn-lg" onClick={start}>Play again</button>
      </motion.div>
    )
  }

  return (
    <div className="col" style={{ gap: 'var(--s4)' }}>
      <div className="row between">
        <span className="row" style={{ gap: 4 }}>
          {[0, 1, 2].map((n) => (
            <span key={n} style={{ fontSize: 17, opacity: n < lives ? 1 : 0.22 }}>❤️</span>
          ))}
        </span>
        <span className="mono" style={{ fontWeight: 800, fontSize: 19, color: time <= 10 ? 'var(--pink)' : 'var(--ink)' }}>
          {time}s
        </span>
        <span className="row small" style={{ gap: 10 }}>
          <b className="mono">{score}</b>
          {streak >= 3 && <span style={{ color: 'var(--orange)', fontWeight: 750 }}>🔥{streak}</span>}
        </span>
      </div>
      <div className="bar"><i style={{ width: `${(time / ROUND) * 100}%`, background: time <= 10 ? 'var(--pink)' : undefined }} /></div>

      <motion.div
          key={i}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16 }}
          className={cn('card', flash === 'right' && 'flash-right', flash === 'wrong' && 'flash-wrong')}
          style={{
            display: 'grid', placeItems: 'center', minHeight: 190, padding: 'var(--s6)',
            borderColor: flash === 'right' ? 'var(--green)' : flash === 'wrong' ? 'var(--pink)' : undefined,
            transition: 'border-color 140ms',
          }}
        >
          <span style={{ fontSize: 'clamp(30px, 7vw, 46px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
            {card.noun}
          </span>
        </motion.div>

      <div className="grid g3" style={{ gap: 10 }}>
        {(['der', 'die', 'das'] as const).map((a) => (
          <button
            key={a}
            className="opt"
            onClick={() => answer(a)}
            style={{
              justifyContent: 'center', fontSize: 21, fontWeight: 750, padding: '18px 12px',
              color: a === 'der' ? 'var(--blue)' : a === 'die' ? 'var(--pink)' : 'var(--green)',
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
