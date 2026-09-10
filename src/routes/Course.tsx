import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { WEEKS, dayById, planFor, TOTAL_DAYS } from '@/data/curriculum'
import { PageHead, Pill } from '@/components/ui'

export default function Course() {
  const progress = useStore((s) => s.progress)
  const done = Object.values(progress).filter((p) => p.completedAt).length

  return (
    <div className="page-wide">
      <PageHead
        eyebrow="The plan"
        title="30 days to A1"
        sub="One theme, a set of new words and one grammar point per day. The plan follows the chapters of your Netzwerk neu A1 book and covers all four Goethe A1 modules — plus the everyday situations you actually need."
        right={<Pill color="var(--green)">{done} of {TOTAL_DAYS} done</Pill>}
      />

      {WEEKS.map((w) => (
        <section key={w.n} style={{ marginBottom: 'var(--s7)' }}>
          <div className="row" style={{ gap: 10, marginBottom: 'var(--s4)' }}>
            <span
              style={{
                width: 28, height: 28, borderRadius: 9, flex: 'none',
                display: 'grid', placeItems: 'center',
                background: w.color, color: '#fff',
                fontWeight: 800, fontSize: 13,
              }}
            >
              {w.n}
            </span>
            <div className="col" style={{ gap: 0 }}>
              <h2 className="h3">{w.title}</h2>
              <span className="small dim">{w.subtitle}</span>
            </div>
          </div>

          <div className="grid auto-md">
            {w.days.map((id, n) => {
              const day = dayById(id)
              const p = progress[id]
              const plan = planFor(id)

              if (!day) {
                return (
                  <div key={id} className="day-card locked">
                    <div className="between">
                      <span className="day-num">DAY {id}</span>
                      <span className="tiny dim">🔒</span>
                    </div>
                    <span className="h3" style={{ fontSize: 16 }}>{plan?.title ?? 'Coming soon'}</span>
                    <span className="small muted grow">{plan?.focus}</span>
                    <span className="tiny dim">Not written yet</span>
                  </div>
                )
              }

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.35, delay: Math.min(n * 0.04, 0.25), ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link to={`/tag/${id}`} className={`day-card${p?.completedAt ? ' done' : ''}`}>
                    <div className="between">
                      <span className="day-num">DAY {id}</span>
                      {p?.completedAt ? (
                        <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: 13 }}>✓</span>
                      ) : (
                        <span className="tiny dim mono">{day.minutes} min</span>
                      )}
                    </div>

                    <span className="h3" style={{ fontSize: 16 }}>{day.title}</span>
                    <span className="small muted grow">{day.goal}</span>

                    <div className="row wrap" style={{ gap: 5 }}>
                      <Pill>Ch. {day.kapitel}</Pill>
                      <Pill>{day.vocab.length} words</Pill>
                      <Pill color={w.color}>{day.examSkill}</Pill>
                    </div>

                    {p && (p.notesRead || p.vocabDone || p.quizTotal > 0) && (
                      <div className="row" style={{ gap: 5, marginTop: 2 }}>
                        <Dot on={p.notesRead} label="Notes" />
                        <Dot on={p.vocabDone} label="Words" />
                        <Dot on={p.quizTotal > 0 && p.quizScore === p.quizTotal} label="Quiz" />
                        {p.quizTotal > 0 && (
                          <span className="tiny dim mono" style={{ marginLeft: 'auto' }}>
                            {p.quizScore}/{p.quizTotal}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

const Dot = ({ on, label }: { on: boolean; label: string }) => (
  <span
    title={label}
    style={{
      width: 7, height: 7, borderRadius: '50%',
      background: on ? 'var(--green)' : 'var(--line-strong)',
    }}
  />
)
