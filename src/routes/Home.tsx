import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore, useLevel, useMasteredCount, useDaysDone } from '@/lib/store'
import { DAYS, TOTAL_DAYS, WEEKS, ALL_VOCAB, isReady, planFor } from '@/data/curriculum'
import { reviewQueue } from '@/lib/srs'
import { ProgressRing, Stat, PageHead, Pill } from '@/components/ui'

const greet = () => {
  const h = new Date().getHours()
  if (h < 11) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const progress = useStore((s) => s.progress)
  const srs = useStore((s) => s.srs)
  const streak = useStore((s) => s.streak)
  const best = useStore((s) => s.bestStreak)
  const goal = useStore((s) => s.settings.dailyGoal)
  const lvl = useLevel()
  const words = useMasteredCount()
  const done = useDaysDone()

  // next day to study = lowest written day that isn't complete
  const next = DAYS.find((d) => !progress[d.id]?.completedAt) ?? DAYS[DAYS.length - 1]
  const due = reviewQueue(Object.values(srs), 999).length
  const plan = planFor(DAYS.length + 1)

  return (
    <div className="page">
      <PageHead
        eyebrow={`${greet()}!`}
        title="Today you learn German"
        sub={`Day ${next.id} of ${TOTAL_DAYS} — around an hour a day. Alongside your classes this covers the whole A1 syllabus and builds toward the Goethe A1 exam.`}
      />

      {/* hero: today's lesson */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <Link to={`/tag/${next.id}`} className="card" style={{ display: 'block', overflow: 'hidden', position: 'relative' }}>
          <div className="card-pad col" style={{ gap: 'var(--s4)' }}>
            <div className="between wrap" style={{ gap: 'var(--s4)' }}>
              <div className="col" style={{ gap: 6 }}>
                <div className="row wrap" style={{ gap: 6 }}>
                  <Pill color="var(--blue)">Day {next.id}</Pill>
                  <Pill>Netzwerk chapter {next.kapitel}</Pill>
                  <Pill>{next.minutes} min</Pill>
                  <Pill color="var(--purple)">{next.examSkill}</Pill>
                </div>
                <h2 className="h2" style={{ marginTop: 4 }}>{next.title}</h2>
                <p className="muted" style={{ maxWidth: '52ch' }}>{next.goal}</p>
                <p className="small dim mono">{next.focus}</p>
              </div>
              <ProgressRing value={done / TOTAL_DAYS} size={92} stroke={7}>
                <div className="col center" style={{ gap: 0 }}>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{done}</span>
                  <span className="tiny dim">/ {TOTAL_DAYS}</span>
                </div>
              </ProgressRing>
            </div>
            <div className="row wrap" style={{ gap: 10 }}>
              <span className="btn btn-primary btn-lg">Continue learning →</span>
              <span className="small dim">{next.vocab.length} new words · {next.exercises.length} exercises</span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* stats */}
      <div className="grid g4" style={{ marginTop: 'var(--s5)' }}>
        <Stat label="Streak" value={<>🔥 {streak}</>} sub={streak === 0 ? 'Start today' : `Best: ${best} days`} color="var(--orange)" />
        <Stat label="Level" value={lvl.level} sub={lvl.rank} color="var(--blue)" />
        <Stat label="Words mastered" value={words} sub={`of ${ALL_VOCAB.length} in the course`} color="var(--green)" />
        <Stat label="XP" value={lvl.into} sub={`${lvl.toNext} to level ${lvl.level + 1}`} color="var(--purple)" />
      </div>

      {/* review nudge */}
      {due > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card card-pad between wrap" style={{ marginTop: 'var(--s5)', gap: 'var(--s4)' }}>
          <div className="col" style={{ gap: 3 }}>
            <span className="eyebrow" style={{ color: 'var(--orange)' }}>Review due</span>
            <span className="h3">{due} {due === 1 ? 'word is' : 'words are'} waiting for you</span>
            <span className="small muted">A five-minute review, before you forget them. This is what makes A1 stick.</span>
          </div>
          <Link to="/vokabeln" className="btn btn-primary">Review now</Link>
        </motion.div>
      )}

      {/* daily goal */}
      <div className="card card-pad col" style={{ marginTop: 'var(--s5)', gap: 12 }}>
        <div className="between">
          <span className="eyebrow">Daily goal</span>
          <span className="mono small">{Math.min(next.vocab.length, goal)} / {goal} words</span>
        </div>
        <div className="bar"><i style={{ width: `${Math.min(100, (next.vocab.length / goal) * 100)}%` }} /></div>
        <span className="tiny dim">
          Today's lesson has {next.vocab.length} new words. At {goal} words a day you cover the whole A1 word list in 30 days.
        </span>
      </div>

      {/* week overview */}
      <h2 className="h2" style={{ margin: 'var(--s7) 0 var(--s4)' }}>Your plan</h2>
      <div className="grid auto-md">
        {WEEKS.map((w) => {
          const ready = w.days.filter(isReady).length
          const complete = w.days.filter((d) => progress[d]?.completedAt).length
          return (
            <Link key={w.n} to="/kurs" className="day-card">
              <div className="between">
                <span className="day-num">WEEK {w.n}</span>
                <span className="mono tiny dim">{complete}/{w.days.length}</span>
              </div>
              <span className="h3">{w.title}</span>
              <span className="small muted grow">{w.subtitle}</span>
              <div className="bar" style={{ height: 6 }}>
                <i style={{ width: `${(complete / w.days.length) * 100}%`, background: w.color }} />
              </div>
              <span className="tiny dim">
                {ready === 0 ? 'Coming soon' : ready < w.days.length ? `${ready} of ${w.days.length} days written` : 'All days ready'}
              </span>
            </Link>
          )
        })}
      </div>

      {plan && (
        <p className="small dim" style={{ marginTop: 'var(--s5)', textAlign: 'center' }}>
          Up next — day {DAYS.length + 1}: <b>{plan.title}</b> ({plan.focus})
        </p>
      )}
    </div>
  )
}
