import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Exercise } from '@/types'
import { matches, shuffle, cn } from '@/lib/utils'
import { useSpeak } from '@/lib/audio'
import { ProgressRing, SpeakButton } from '@/components/ui'

interface Props {
  exercises: Exercise[]
  onDone: (score: number, total: number) => void
}

const prompt = (ex: Exercise) => {
  switch (ex.k) {
    case 'mcq': return ex.q
    case 'fill': return ex.q
    case 'order': return `Build this sentence in German: ${ex.hi}`
    case 'artikel': return `Which article? ___ ${ex.noun}`
    case 'listen': return 'Listen, then type exactly what you hear'
  }
}

export function Quiz({ exercises, onDone }: Props) {
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [right, setRight] = useState(false)
  const [typed, setTyped] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  const [order, setOrder] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  const { say } = useSpeak()

  const ex = exercises[i]
  const last = i === exercises.length - 1

  // shuffled word bank for the sentence-building task
  const bank = useMemo(() => (ex?.k === 'order' ? shuffle(ex.words) : []), [ex])

  useEffect(() => {
    setAnswered(false)
    setRight(false)
    setTyped('')
    setPicked(null)
    setOrder([])
    if (ex?.k === 'listen') setTimeout(() => say(ex.text), 350)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  if (!ex) return null

  const resolve = (ok: boolean) => {
    setRight(ok)
    setAnswered(true)
    if (ok) setScore((s) => s + 1)
  }

  const check = () => {
    if (answered) return
    switch (ex.k) {
      case 'fill':
        return resolve(matches(typed, ex.a))
      case 'listen':
        return resolve(matches(typed, ex.a))
      case 'order':
        return resolve(matches(order.join(' '), [ex.a]))
      default:
        return
    }
  }

  const next = () => {
    if (!last) return setI((n) => n + 1)
    if (finished) return // the last card stays on screen; do not report twice
    setFinished(true)
    onDone(score, exercises.length)
  }

  const canCheck =
    (ex.k === 'fill' && typed.trim().length > 0) ||
    (ex.k === 'listen' && typed.trim().length > 0) ||
    (ex.k === 'order' && order.length === ex.words.length)

  return (
    <div className="col" style={{ gap: 'var(--s5)' }}>
      {/* progress */}
      <div className="row" style={{ gap: 'var(--s4)' }}>
        <ProgressRing value={(i + (answered ? 1 : 0)) / exercises.length} size={46} stroke={4.5}>
          <span className="mono tiny" style={{ fontWeight: 800 }}>{i + 1}</span>
        </ProgressRing>
        <div className="col grow" style={{ gap: 3 }}>
          <span className="eyebrow">Exercise {i + 1} of {exercises.length}</span>
          <div className="bar"><i style={{ width: `${((i + (answered ? 1 : 0)) / exercises.length) * 100}%` }} /></div>
        </div>
        <span className="mono small" style={{ fontWeight: 700, color: 'var(--green)' }}>{score} ✓</span>
      </div>

      <motion.div
        key={i}
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="card card-pad col"
        style={{ gap: 'var(--s4)' }}
      >
          {/* question */}
          <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
            <h3 className="h3 grow" style={{ fontSize: 18, lineHeight: 1.4 }}>{prompt(ex)}</h3>
            {ex.k === 'listen' && <SpeakButton text={ex.text} label="Play again" />}
          </div>

          {/* ── multiple choice ── */}
          {ex.k === 'mcq' && (
            <div className="col" style={{ gap: 8 }}>
              {ex.options.map((o, n) => (
                <button
                  key={n}
                  disabled={answered}
                  onClick={() => { setPicked(n); resolve(n === ex.a) }}
                  className={cn('opt', answered && n === ex.a && 'right', answered && picked === n && n !== ex.a && 'wrong')}
                >
                  <span className="opt-key">{'ABCD'[n]}</span>
                  <span className="grow">{o}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── der / die / das ── */}
          {ex.k === 'artikel' && (
            <div className="grid g3" style={{ gap: 10 }}>
              {(['der', 'die', 'das'] as const).map((art, n) => (
                <button
                  key={art}
                  disabled={answered}
                  onClick={() => { setPicked(n); resolve(art === ex.a) }}
                  className={cn('opt', answered && art === ex.a && 'right', answered && picked === n && art !== ex.a && 'wrong')}
                  style={{
                    justifyContent: 'center',
                    fontSize: 19,
                    fontWeight: 750,
                    color: art === 'der' ? 'var(--blue)' : art === 'die' ? 'var(--pink)' : 'var(--green)',
                  }}
                >
                  {art}
                </button>
              ))}
            </div>
          )}

          {/* ── type the answer ── */}
          {(ex.k === 'fill' || ex.k === 'listen') && (
            <input
              autoFocus
              className={cn('answer-input', answered && (right ? 'right' : 'wrong'))}
              placeholder="Your answer …"
              value={typed}
              disabled={answered}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') (answered ? next() : check()) }}
            />
          )}

          {/* ── build the sentence ── */}
          {ex.k === 'order' && (
            <div className="col" style={{ gap: 12 }}>
              <div
                className="row wrap"
                style={{
                  gap: 8, minHeight: 54, padding: 12,
                  border: '1.5px dashed var(--line-strong)', borderRadius: 'var(--r-md)',
                  background: 'var(--paper-2)',
                }}
              >
                {order.length === 0 && <span className="small dim">Tap the words to build the sentence…</span>}
                {order.map((w, n) => (
                  <motion.button
                    key={`${w}-${n}`}
                    layout
                    className="chip picked"
                    disabled={answered}
                    onClick={() => setOrder((o) => o.filter((_, k) => k !== n))}
                  >
                    {w}
                  </motion.button>
                ))}
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                {bank.map((w, n) => {
                  // a word may legitimately appear twice — allow it exactly as often as it occurs
                  const spent = order.filter((x) => x === w).length >= bank.filter((x) => x === w).length
                  return (
                    <button
                      key={`${w}-${n}`}
                      className="chip"
                      disabled={answered || spent}
                      style={spent ? { opacity: 0.3, pointerEvents: 'none' } : undefined}
                      onClick={() => setOrder((o) => [...o, w])}
                    >
                      {w}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── feedback ── */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={cn('feedback', right ? 'right' : 'wrong')}
              >
                <b style={{ display: 'block', marginBottom: 3 }}>
                  {right ? '✓ Correct!' : '✗ Not quite'}
                </b>
                {!right && ex.k !== 'mcq' && ex.k !== 'artikel' && (
                  <div style={{ marginBottom: 4 }}>
                    Correct answer: <b>{ex.k === 'order' ? ex.a : ex.a[0]}</b>
                  </div>
                )}
                {!right && ex.k === 'artikel' && (
                  <div style={{ marginBottom: 4 }}>Correct answer: <b>{ex.a} {ex.noun}</b></div>
                )}
                {ex.why}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── actions ── */}
          <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
            {!answered && canCheck && (
              <button className="btn btn-primary" onClick={check}>Check</button>
            )}
            {answered && (
              <button className="btn btn-primary" onClick={next} disabled={last && finished}>
                {last ? (finished ? '✓ Saved' : 'Finish') : 'Next'} →
              </button>
            )}
          </div>
      </motion.div>
    </div>
  )
}
