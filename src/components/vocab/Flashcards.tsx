import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Vocab } from '@/types'
import { useStore } from '@/lib/store'
import { speak } from '@/lib/audio'
import { genderColor, genderOf } from '@/lib/utils'
import { SpeakButton, ProgressRing, Empty } from '@/components/ui'

/**
 * Flip-card drill wired to the SRS store: "Gewusst" promotes the card,
 * "Nochmal" sends it back down two boxes and re-queues it in this session.
 */
export function Flashcards({ deck, onFinish }: { deck: Vocab[]; onFinish?: (right: number, total: number) => void }) {
  const [queue, setQueue] = useState<Vocab[]>(deck)
  const [i, setI] = useState(0)
  const [back, setBack] = useState(false)
  const [right, setRight] = useState(0)
  const [seen, setSeen] = useState(0)

  const review = useStore((s) => s.review)
  const autoplay = useStore((s) => s.settings.autoplay)
  const speed = useStore((s) => s.settings.speed)
  const showHindi = useStore((s) => s.settings.showHindi)

  const card = queue[i]

  useEffect(() => setQueue(deck), [deck])

  useEffect(() => {
    if (card && autoplay) speak(card.de, speed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, queue])

  // keyboard: space flips, 1/2 grade
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setBack((b) => !b) }
      if (back && (e.key === '1' || e.key === '2')) answer(e.key === '2')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!card) {
    return (
      <Empty
        icon="🎉"
        title="Deck finished!"
        note={`${right} of ${seen} right first time. These words come back tomorrow — that is how spaced repetition works.`}
      />
    )
  }

  function answer(ok: boolean) {
    review(card.de, ok)
    setSeen((s) => s + 1)
    if (ok) setRight((r) => r + 1)

    setBack(false)
    // wrong cards come back at the end of this session
    const rest = ok ? queue : [...queue, card]
    const nextIndex = i + 1

    if (nextIndex >= rest.length) {
      setQueue([])
      onFinish?.(ok ? right + 1 : right, seen + 1)
    } else {
      setQueue(rest)
      setI(nextIndex)
    }
  }

  const g = card.gender ?? genderOf(card.de)
  const remaining = queue.length - i

  return (
    <div className="col" style={{ gap: 'var(--s5)', alignItems: 'center' }}>
      <div className="row" style={{ width: '100%', maxWidth: 560, gap: 'var(--s4)' }}>
        <ProgressRing value={seen / Math.max(1, seen + remaining)} size={44} stroke={4.5}>
          <span className="mono tiny" style={{ fontWeight: 800 }}>{remaining}</span>
        </ProgressRing>
        <div className="col grow" style={{ gap: 3 }}>
          <span className="eyebrow">{remaining} cards left</span>
          <div className="bar"><i style={{ width: `${(seen / Math.max(1, seen + remaining)) * 100}%` }} /></div>
        </div>
        <span className="mono small" style={{ fontWeight: 700, color: 'var(--green)' }}>{right} ✓</span>
      </div>

      {/* card */}
      <div
        className={`flip${back ? ' is-back' : ''}`}
        style={{ width: '100%', maxWidth: 560, height: 320, cursor: 'pointer' }}
        onClick={() => setBack((b) => !b)}
      >
        <motion.div
            key={card.de}
            className="flip-inner"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* front */}
            <div className="flip-face" style={{ borderTop: `4px solid ${genderColor(g)}` }}>
              <div className="col center" style={{ gap: 14 }}>
                <span className="eyebrow">What does this mean?</span>
                <span style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
                  {card.de}
                </span>
                <SpeakButton text={card.de} />
                <span className="tiny dim">Flip: click or press space</span>
              </div>
            </div>

            {/* back */}
            <div className="flip-face flip-back" style={{ borderTop: `4px solid ${genderColor(g)}` }}>
              <div className="col center" style={{ gap: 8 }}>
                <span style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700 }}>{card.en}</span>
                {showHindi && <span className="muted" style={{ fontSize: 16 }}>{card.hi}</span>}
                {card.pl && <span className="tiny dim mono">Plural: {card.pl}</span>}
                {card.ex && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', maxWidth: 400 }}>
                    <div className="serif" style={{ fontSize: 15.5 }}>{card.ex}</div>
                    {card.exHi && <div className="tiny dim" style={{ marginTop: 3 }}>{card.exHi}</div>}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
      </div>

      {/* grading */}
      <AnimatePresence>
        {back && (
          <motion.div
            className="row"
            style={{ gap: 12 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <button className="btn btn-lg" onClick={() => answer(false)} style={{ borderColor: 'var(--pink)', color: 'var(--pink)' }}>
              Again <span className="tiny dim mono">1</span>
            </button>
            <button className="btn btn-lg btn-primary" onClick={() => answer(true)}>
              Knew it <span className="tiny mono" style={{ opacity: 0.7 }}>2</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
