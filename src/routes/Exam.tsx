import { motion } from 'framer-motion'
import { PageHead, ProgressRing, Stat } from '@/components/ui'
import { BADGES } from '@/lib/gamify'
import { useStore, useMasteredCount, useDaysDone } from '@/lib/store'
import { ALL_VOCAB, TOTAL_DAYS } from '@/data/curriculum'

const MODULES = [
  {
    name: 'Hören',
    icon: '🎧',
    min: 20,
    pts: 25,
    color: 'var(--blue)',
    what: 'Three parts — short dialogues, announcements and phone messages.',
    tip: 'Numbers and clock times come up constantly. Play the listening quiz every day.',
  },
  {
    name: 'Lesen',
    icon: '📖',
    min: 25,
    pts: 25,
    color: 'var(--green)',
    what: 'Three parts — a short email, classified ads and public signs.',
    tip: 'Read the question first, then scan the text for that one keyword. Do not read every word.',
  },
  {
    name: 'Schreiben',
    icon: '✍️',
    min: 20,
    pts: 25,
    color: 'var(--orange)',
    what: 'Part 1: fill in a form. Part 2: write a short email of about 30 words.',
    tip: 'The easiest marks in the exam. Learn one email template by heart for part 2.',
  },
  {
    name: 'Sprechen',
    icon: '🗣️',
    min: 15,
    pts: 25,
    color: 'var(--purple)',
    what: 'Part 1: introduce yourself. Part 2: ask questions from a card. Part 3: make a request.',
    tip: 'Part 1 should be fully rehearsed — name, age, country, town, languages, job, hobby.',
  },
]

export default function Exam() {
  const badges = useStore((s) => s.badges)
  const streak = useStore((s) => s.bestStreak)
  const words = useMasteredCount()
  const done = useDaysDone()

  // rough readiness: course progress, vocabulary and consistency
  const readiness = Math.round(
    (Math.min(1, done / TOTAL_DAYS) * 0.5 +
      Math.min(1, words / 400) * 0.35 +
      Math.min(1, streak / 21) * 0.15) * 100,
  )

  return (
    <div className="page">
      <PageHead
        eyebrow="Goethe-Zertifikat A1"
        title="Start Deutsch 1"
        sub="Four modules, 100 points, 60 needed to pass. Listening, reading and writing are taken together in one 65-minute sitting; speaking is a separate session."
      />

      {/* readiness */}
      <div className="card card-pad between wrap" style={{ gap: 'var(--s5)' }}>
        <div className="col" style={{ gap: 6 }}>
          <span className="eyebrow">Your preparation</span>
          <h2 className="h2">
            {readiness < 30 ? 'Just getting started' : readiness < 60 ? 'Coming along well' : readiness < 85 ? 'Almost ready' : 'Exam ready!'}
          </h2>
          <p className="small muted" style={{ maxWidth: '46ch' }}>
            This estimate combines three things: how many days you have finished, how many words you have
            mastered, and your longest daily streak.
          </p>
        </div>
        <ProgressRing value={readiness / 100} size={110} stroke={9} color="var(--purple)">
          <div className="col center">
            <span className="mono" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{readiness}</span>
            <span className="tiny dim">percent</span>
          </div>
        </ProgressRing>
      </div>

      <div className="grid g3" style={{ marginTop: 'var(--s4)' }}>
        <Stat label="Days" value={`${done}/${TOTAL_DAYS}`} sub="of the course done" color="var(--blue)" />
        <Stat label="Words mastered" value={words} sub={`of ${ALL_VOCAB.length} in the course`} color="var(--green)" />
        <Stat label="Best streak" value={`${streak}`} sub="days in a row" color="var(--orange)" />
      </div>

      {/* modules */}
      <h2 className="h2" style={{ margin: 'var(--s7) 0 var(--s4)' }}>The four modules</h2>
      <div className="grid g2">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="day-card"
            style={{ cursor: 'default' }}
          >
            <div className="between">
              <span className="row" style={{ gap: 8 }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <span className="h3">{m.name}</span>
              </span>
              <span className="mono tiny dim">{m.min} min · {m.pts} pts</span>
            </div>
            <span className="small muted">{m.what}</span>
            <div className="tip" style={{ fontSize: 13.5 }}>
              <span>🎯</span>
              <div>{m.tip}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* badges */}
      <h2 className="h2" style={{ margin: 'var(--s7) 0 var(--s4)' }}>
        Badges <span className="dim mono" style={{ fontSize: 16 }}>{badges.length}/{BADGES.length}</span>
      </h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 10 }}>
        {BADGES.map((b) => {
          const has = badges.includes(b.id)
          return (
            <motion.div
              key={b.id}
              className={`badge-tile${has ? '' : ' locked'}`}
              whileHover={has ? { y: -3 } : undefined}
              title={b.desc}
            >
              <span className="ico">{b.icon}</span>
              <span className="tiny" style={{ fontWeight: 700 }}>{b.name}</span>
              <span className="tiny dim" style={{ fontSize: 10, lineHeight: 1.3 }}>{b.desc}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
