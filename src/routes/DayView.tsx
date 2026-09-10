import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { dayById, isReady, planFor, weekOf } from '@/data/curriculum'
import { useStore } from '@/lib/store'
import { NoteRenderer } from '@/components/notes/NoteRenderer'
import { VocabCard } from '@/components/vocab/VocabCard'
import { Quiz } from '@/components/games/Quiz'
import { Segmented, Pill, SpeakButton, Empty, ProgressRing } from '@/components/ui'
import { generateImage, scenePrompt } from '@/lib/image'
import { speak, prewarm } from '@/lib/audio'
import { Gloss } from '@/components/Gloss'

type Tab = 'notes' | 'vocab' | 'dialog' | 'quiz'

export default function DayView() {
  const { id } = useParams()
  const nav = useNavigate()
  const dayId = Number(id)
  const day = dayById(dayId)

  const [tab, setTab] = useState<Tab>('notes')
  const progress = useStore((s) => s.progress[dayId])
  const markNotes = useStore((s) => s.markNotes)
  const markVocab = useStore((s) => s.markVocab)
  const setQuiz = useStore((s) => s.setQuiz)
  const completeDay = useStore((s) => s.completeDay)
  const seedCards = useStore((s) => s.seedCards)

  useEffect(() => setTab('notes'), [dayId])

  // generate this lesson's audio in the background while the notes are being read
  useEffect(() => {
    if (!day) return
    const words = day.vocab.flatMap((v) => [v.de, v.ex].filter(Boolean) as string[])
    const lines = day.dialogue?.lines.map((l) => l.de) ?? []
    const examples = day.notes.flatMap((b) => (b.t === 'ex' ? b.items.map((i) => i.de) : []))
    prewarm([...words, ...lines, ...examples])
  }, [day])

  if (!day) {
    const plan = planFor(dayId)
    return (
      <div className="page">
        <Empty
          icon="🔒"
          title={plan ? `Day ${dayId}: ${plan.title}` : 'This day does not exist yet'}
          note={
            plan
              ? `${plan.focus} — this day has not been written yet. Finish the first seven days; the rest are on the way.`
              : 'The course plan has 30 days.'
          }
        />
        <div className="row center" style={{ marginTop: 'var(--s5)' }}>
          <Link to="/kurs" className="btn">← Back to the plan</Link>
        </div>
      </div>
    )
  }

  const week = weekOf(day.id)
  const color = week?.color ?? 'var(--blue)'
  const steps = [progress?.notesRead, progress?.vocabDone, (progress?.quizTotal ?? 0) > 0].filter(Boolean).length

  return (
    <div className="page">
      {/* header */}
      <div className="between wrap" style={{ gap: 'var(--s4)', marginBottom: 'var(--s5)' }}>
        <div className="col" style={{ gap: 8 }}>
          <Link to="/kurs" className="small dim" style={{ width: 'fit-content' }}>← Course plan</Link>
          <div className="row wrap" style={{ gap: 6 }}>
            <Pill solid color={color}>Day {day.id}</Pill>
            <Pill>Netzwerk chapter {day.kapitel}</Pill>
            <Pill>{day.minutes} min</Pill>
            <Pill color="var(--purple)">{day.examSkill}</Pill>
          </div>
          <h1 className="h1">{day.title}</h1>
          <p className="muted" style={{ maxWidth: '58ch' }}>{day.goal}</p>
          <p className="small dim mono">{day.focus}</p>
        </div>
        <ProgressRing value={steps / 3} size={76} stroke={6} color={color}>
          <span className="mono small" style={{ fontWeight: 800 }}>{steps}/3</span>
        </ProgressRing>
      </div>

      <DayHero title={day.title} />

      <div style={{ marginBottom: 'var(--s5)' }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'notes', label: 'Notes' },
            { value: 'vocab', label: `Words ${day.vocab.length}` },
            { value: 'dialog', label: 'Dialogue' },
            { value: 'quiz', label: `Exercises ${day.exercises.length}` },
          ]}
        />
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
          {/* ── NOTES ── */}
          {tab === 'notes' && (
            <>
              <NoteRenderer blocks={day.notes} />
              <div className="card card-pad between wrap" style={{ marginTop: 'var(--s5)', gap: 'var(--s4)' }}>
                <div className="col" style={{ gap: 2 }}>
                  <span className="h3">Copied the notes?</span>
                  <span className="small muted">Written them into your notebook? Tick it off and take +20 XP.</span>
                </div>
                <button
                  className={`btn ${progress?.notesRead ? '' : 'btn-primary'}`}
                  disabled={progress?.notesRead}
                  onClick={() => markNotes(day.id)}
                >
                  {progress?.notesRead ? '✓ Done' : 'Done — continue'}
                </button>
              </div>
            </>
          )}

          {/* ── VOCAB ── */}
          {tab === 'vocab' && (
            <>
              <div className="card card-pad row wrap between" style={{ marginBottom: 'var(--s4)', gap: 'var(--s3)' }}>
                <div className="row wrap" style={{ gap: 'var(--s4)' }}>
                  <Legend color="var(--blue)" label="der" />
                  <Legend color="var(--pink)" label="die" />
                  <Legend color="var(--green)" label="das" />
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => speak(day.vocab.map((v) => v.de).join('. '), 0.9)}
                >
                  ▶ Play all
                </button>
              </div>

              <div className="grid auto-md">
                {day.vocab.map((v, i) => (
                  <VocabCard key={v.de} v={v} index={i} />
                ))}
              </div>

              <div className="card card-pad between wrap" style={{ marginTop: 'var(--s5)', gap: 'var(--s4)' }}>
                <div className="col" style={{ gap: 2 }}>
                  <span className="h3">Add {day.vocab.length} words to your list?</span>
                  <span className="small muted">They go into your flashcard deck and come back for review on a schedule.</span>
                </div>
                <button
                  className={`btn ${progress?.vocabDone ? '' : 'btn-primary'}`}
                  disabled={progress?.vocabDone}
                  onClick={() => {
                    seedCards(day.vocab.map((v) => v.de))
                    markVocab(day.id, day.vocab.length)
                  }}
                >
                  {progress?.vocabDone ? '✓ Added' : 'Add to my list'}
                </button>
              </div>
            </>
          )}

          {/* ── DIALOG ── */}
          {tab === 'dialog' && day.dialogue && (
            <div className="card card-pad col" style={{ gap: 'var(--s4)' }}>
              <div className="between wrap" style={{ gap: 'var(--s3)' }}>
                <div className="col" style={{ gap: 2 }}>
                  <h2 className="h3">{day.dialogue.title}</h2>
                  <span className="small muted">{day.dialogue.situation}</span>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => speak(day.dialogue!.lines.map((l) => l.de).join(' … '), 0.95)}
                >
                  ▶ Play whole dialogue
                </button>
              </div>

              <div className="col" style={{ gap: 10 }}>
                {day.dialogue.lines.map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: i % 2 ? 14 : -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="row"
                    style={{
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--r-md)',
                      background: i % 2 ? 'var(--paper-2)' : 'transparent',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <span
                      className="tiny"
                      style={{
                        flex: 'none', width: 76, fontWeight: 750,
                        color: i % 2 ? 'var(--purple)' : 'var(--blue)',
                        paddingTop: 2,
                      }}
                    >
                      {l.who}
                    </span>
                    <div className="grow">
                      <div className="serif" style={{ fontSize: 16.5, fontWeight: 550 }}><Gloss>{l.de}</Gloss></div>
                      <div className="tiny dim" style={{ marginTop: 2 }}>{l.hi}</div>
                    </div>
                    <SpeakButton text={l.de} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUIZ ── */}
          {tab === 'quiz' && (
            <Quiz
              key={dayId}
              exercises={day.exercises}
              onDone={(score, total) => {
                setQuiz(day.id, score, total)
                completeDay(day.id)
              }}
            />
          )}
      </motion.div>

      {/* exam tip */}
      <div className="card card-pad row" style={{ marginTop: 'var(--s6)', gap: 'var(--s4)', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, lineHeight: 1.1 }}>🎓</span>
        <div className="col" style={{ gap: 3 }}>
          <span className="eyebrow" style={{ color: 'var(--purple)' }}>Goethe A1 — {day.examSkill}</span>
          <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>{day.examTip}</p>
        </div>
      </div>

      {/* prev / next */}
      <div className="between" style={{ marginTop: 'var(--s5)' }}>
        <button className="btn" disabled={!isReady(dayId - 1)} onClick={() => nav(`/tag/${dayId - 1}`)}>
          ← Day {dayId - 1}
        </button>
        <button className="btn btn-primary" disabled={!isReady(dayId + 1)} onClick={() => nav(`/tag/${dayId + 1}`)}>
          {isReady(dayId + 1) ? `Day ${dayId + 1} →` : 'More soon'}
        </button>
      </div>
    </div>
  )
}

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="row small" style={{ gap: 6 }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
    <b style={{ color }}>{label}</b>
  </span>
)

/** Optional MiniMax illustration — generated on demand so credits aren't burned. */
function DayHero({ title }: { title: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle')

  useEffect(() => {
    setSrc(null)
    setState('idle')
  }, [title])

  if (src) {
    return (
      <motion.img
        src={src}
        alt=""
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', aspectRatio: '16/9', objectFit: 'cover',
          borderRadius: 'var(--r-lg)', marginBottom: 'var(--s5)',
          boxShadow: 'var(--shadow-md)',
        }}
      />
    )
  }

  return (
    <div className="card card-pad between wrap" style={{ marginBottom: 'var(--s5)', gap: 'var(--s3)' }}>
      <span className="small muted">
        {state === 'failed'
          ? 'Could not generate the image — check your MiniMax key or quota.'
          : 'Generate an illustration for this lesson (MiniMax).'}
      </span>
      <button
        className="btn btn-sm"
        disabled={state === 'loading'}
        onClick={async () => {
          setState('loading')
          const img = await generateImage(scenePrompt(title))
          if (img) { setSrc(img); setState('idle') } else setState('failed')
        }}
      >
        {state === 'loading' ? 'Generating …' : '✨ Generate image'}
      </button>
    </div>
  )
}
