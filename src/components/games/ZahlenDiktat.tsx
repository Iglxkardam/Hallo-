import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { XP } from '@/lib/gamify'
import { speak } from '@/lib/audio'
import { cn } from '@/lib/utils'

const ROUNDS = 10

type Kind = 'zahl' | 'telefon' | 'plz'

interface Round {
  kind: Kind
  digits: string
  spoken: string
  label: string
}

const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun']
const TEENS = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn']
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig']

/** 47 -> "siebenundvierzig" — units first, exactly as Germans say it. */
function germanNumber(n: number): string {
  if (n < 10) return ONES[n]
  if (n < 20) return TEENS[n - 10]
  if (n === 100) return 'einhundert'
  const t = Math.floor(n / 10)
  const u = n % 10
  if (!u) return TENS[t]
  return `${u === 1 ? 'ein' : ONES[u]}und${TENS[t]}`
}

/** Digit by digit, the way phone numbers and postcodes are actually read. */
const digitByDigit = (s: string) => s.split('').map((d) => ONES[Number(d)]).join(' ')

function makeRound(): Round {
  const kind: Kind = (['zahl', 'zahl', 'telefon', 'plz'] as Kind[])[Math.floor(Math.random() * 4)]

  if (kind === 'zahl') {
    const n = Math.floor(Math.random() * 100)
    return { kind, digits: String(n), spoken: germanNumber(n), label: 'Write the number in digits' }
  }
  if (kind === 'plz') {
    const d = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('')
    return { kind, digits: d, spoken: digitByDigit(d), label: 'Postleitzahl — write the five digits' }
  }
  const d = '01' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')
  return { kind, digits: d, spoken: digitByDigit(d), label: 'Telefonnummer — write every digit' }
}

/**
 * Number dictation — the single most valuable drill for Hören Teil 2, where a
 * phone number, postcode or price decides the mark. Numbers are generated, not
 * taken from the lesson, so it never runs out of material.
 */
export function ZahlenDiktat() {
  const [rounds, setRounds] = useState<Round[]>(() => Array.from({ length: ROUNDS }, makeRound))
  const [n, setN] = useState(0)
  const [typed, setTyped] = useState('')
  const [state, setState] = useState<'input' | 'right' | 'wrong'>('input')
  const [score, setScore] = useState(0)

  const addXp = useStore((s) => s.addXp)
  const speed = useStore((s) => s.settings.speed)
  const round = rounds[n]
  const done = n >= ROUNDS

  const play = useMemo(() => () => round && speak(round.spoken, speed), [round, speed])

  useEffect(() => {
    if (round) setTimeout(play, 350)
  }, [n, play, round])

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
        <div style={{ fontSize: 44 }}>{score >= 9 ? '🏆' : score >= 7 ? '🔢' : '💪'}</div>
        <h2 className="h2">{score} / {ROUNDS}</h2>
        <p className="muted" style={{ maxWidth: 420 }}>
          {score >= 9
            ? 'Numbers are no longer the thing that will cost you marks.'
            : 'Keep at it — numbers are where most people lose the listening module.'}
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            setRounds(Array.from({ length: ROUNDS }, makeRound))
            setN(0); setScore(0); setTyped(''); setState('input')
          }}
        >
          Play again
        </button>
      </motion.div>
    )
  }

  const check = () => {
    if (state !== 'input' || !typed.trim()) return
    const ok = typed.replace(/\D/g, '') === round.digits
    setState(ok ? 'right' : 'wrong')
    if (ok) setScore((s) => s + 1)
    setTimeout(() => { setN((x) => x + 1); setTyped(''); setState('input') }, ok ? 900 : 2200)
  }

  return (
    <div className="col" style={{ gap: 'var(--s4)' }}>
      <div className="row between">
        <span className="small dim">Diktat {n + 1} of {ROUNDS}</span>
        <span className="mono small" style={{ fontWeight: 700, color: 'var(--green)' }}>{score} ✓</span>
      </div>
      <div className="bar"><i style={{ width: `${(n / ROUNDS) * 100}%` }} /></div>

      <div className="card card-pad col center" style={{ gap: 14, padding: 'var(--s7) var(--s5)' }}>
        <span className="eyebrow">{round.label}</span>
        <button
          className="btn btn-lg btn-primary"
          onClick={play}
          style={{ borderRadius: '50%', width: 82, height: 82, padding: 0, fontSize: 30 }}
          aria-label="Play again"
        >
          🔊
        </button>
        <span className="tiny dim">Click to hear it again</span>
      </div>

      <input
        autoFocus
        inputMode="numeric"
        className={cn('answer-input mono', state === 'right' && 'right', state === 'wrong' && 'wrong')}
        style={{ fontSize: 24, textAlign: 'center', letterSpacing: '0.12em' }}
        placeholder="…"
        value={typed}
        disabled={state !== 'input'}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && check()}
      />

      {state === 'input' ? (
        <button className="btn btn-primary" onClick={check} disabled={!typed.trim()}>Prüfen</button>
      ) : (
        <div className={cn('feedback', state)}>
          {state === 'right' ? (
            <b>✓ Richtig!</b>
          ) : (
            <>
              <b style={{ display: 'block', marginBottom: 3 }}>✗ It was {round.digits}</b>
              <span className="mono">{round.spoken}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
