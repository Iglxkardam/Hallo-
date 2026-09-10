import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { PageHead, Segmented, Pill } from '@/components/ui'
import { speak, germanBrowserVoice } from '@/lib/audio'
import { DAYS, TOTAL_DAYS, totalWords, totalExercises } from '@/data/curriculum'

const VOICES = [
  { id: 'German_FriendlyMan', label: 'Jonas — male' },
  { id: 'German_SweetLady', label: 'Clara — female' },
  { id: 'German_PlayfulMan', label: 'Max — lively' },
]

export default function Settings() {
  const s = useStore((st) => st.settings)
  const set = useStore((st) => st.set)
  const resetAll = useStore((st) => st.resetAll)
  const [confirm, setConfirm] = useState(false)
  const [tts, setTts] = useState<'checking' | 'minimax' | 'browser'>('checking')
  const [hasDeVoice, setHasDeVoice] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((j) => setTts(j?.minimax ? 'minimax' : 'browser'))
      .catch(() => setTts('browser'))
    // voice list loads asynchronously in some browsers
    const check = () => setHasDeVoice(Boolean(germanBrowserVoice()))
    check()
    speechSynthesis?.addEventListener?.('voiceschanged', check)
    return () => speechSynthesis?.removeEventListener?.('voiceschanged', check)
  }, [])

  return (
    <div className="page">
      <PageHead eyebrow="More" title="Settings" />

      <div className="col" style={{ gap: 'var(--s4)' }}>
        <Row label="Theme" note="Sketch paper, or charcoal sketchbook at night.">
          <Segmented
            value={s.theme}
            onChange={(v) => set('theme', v)}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
          />
        </Row>

        <Row label="Show Hindi meanings" note="Display the Hindi translation next to the English one.">
          <Toggle on={s.showHindi} onChange={(v) => set('showHindi', v)} />
        </Row>

        <Row label="Speak automatically" note="Read the German word aloud when a flashcard appears.">
          <Toggle on={s.autoplay} onChange={(v) => set('autoplay', v)} />
        </Row>

        <Row label="Speech speed" note="Both are recorded by a German speaker — slow is a real slow reading, not a stretched one.">
          <div className="row" style={{ gap: 10 }}>
            <Segmented
              value={s.speed < 0.95 ? 'slow' : 'normal'}
              onChange={(v) => set('speed', v === 'slow' ? 0.75 : 1)}
              options={[{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }]}
            />
            <button className="btn btn-sm" onClick={() => speak('Guten Tag! Ich heiße Krish und ich lerne Deutsch.', s.speed, s.voice)}>
              Test
            </button>
          </div>
        </Row>

        <Row label="Daily goal" note="New words per day. At 25 a day you pass the ~650-word Goethe A1 list inside the 30 days.">
          <div className="row" style={{ gap: 10 }}>
            <input
              type="range" min={8} max={30} step={1}
              value={s.dailyGoal}
              onChange={(e) => set('dailyGoal', Number(e.target.value))}
              style={{ width: 150 }}
            />
            <span className="mono small" style={{ fontWeight: 700, width: 28 }}>{s.dailyGoal}</span>
          </div>
        </Row>

        <Row label="Voice" note="Native German voices from MiniMax speech-2.6-hd, the newest high-definition model.">
          <div className="row wrap" style={{ gap: 6, justifyContent: 'flex-end' }}>
            {VOICES.map((v) => (
              <button
                key={v.id}
                className={`chip${s.voice === v.id ? ' picked' : ''}`}
                onClick={() => { set('voice', v.id); speak('Guten Tag! Ich lerne Deutsch.', s.speed, v.id) }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </Row>

        <Row
          label="Speech engine"
          note={
            tts === 'minimax'
              ? 'Recorded German voices, served from your own machine.'
              : hasDeVoice
                ? 'Falling back to the German voice installed in your browser.'
                : 'No German voice is installed in this browser, so nothing will be spoken rather than reading German with an English voice.'
          }
        >
          <Pill color={tts === 'minimax' ? 'var(--green)' : hasDeVoice ? 'var(--orange)' : 'var(--pink)'}>
            {tts === 'checking' ? 'Checking …' : tts === 'minimax' ? 'German voices ready' : hasDeVoice ? 'Browser German voice' : 'No German voice'}
          </Pill>
        </Row>
      </div>

      {/* course info */}
      <div className="card card-pad col" style={{ marginTop: 'var(--s6)', gap: 10 }}>
        <span className="eyebrow">Course content</span>
        <div className="row wrap" style={{ gap: 8 }}>
          <Pill>{DAYS.length} of {TOTAL_DAYS} days written</Pill>
          <Pill>{totalWords} words</Pill>
          <Pill>{totalExercises} exercises</Pill>
        </div>
        <p className="small muted">
          The plan follows the chapters of Netzwerk neu A1 and covers all four Goethe A1 (Start Deutsch 1) modules.
          To add a new day, create a file in <code className="mono">src/data/days/</code> and add it to the DAYS
          array in <code className="mono">curriculum.ts</code> — everything else updates itself.
        </p>
      </div>

      {/* danger zone */}
      <div className="card card-pad between wrap" style={{ marginTop: 'var(--s5)', gap: 'var(--s4)', borderColor: 'color-mix(in srgb, var(--pink) 30%, transparent)' }}>
        <div className="col" style={{ gap: 2 }}>
          <span className="h3">Delete progress</span>
          <span className="small muted">XP, streak, badges and every flashcard will be erased. This cannot be undone.</span>
        </div>
        {confirm ? (
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--pink)', color: '#fff', borderColor: 'transparent' }}
              onClick={() => { resetAll(); setConfirm(false) }}
            >
              Yes, delete everything
            </button>
          </div>
        ) : (
          <button className="btn btn-sm" onClick={() => setConfirm(true)}>Reset</button>
        )}
      </div>
    </div>
  )
}

const Row = ({ label, note, children }: { label: string; note: string; children: React.ReactNode }) => (
  <div className="card card-pad between wrap" style={{ gap: 'var(--s4)' }}>
    <div className="col" style={{ gap: 2 }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <span className="small muted" style={{ maxWidth: '44ch' }}>{note}</span>
    </div>
    {children}
  </div>
)

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 50, height: 30, borderRadius: 999, flex: 'none',
        background: on ? 'var(--green)' : 'var(--line-strong)',
        transition: 'background 200ms var(--ease-out)',
        padding: 3, display: 'flex',
        justifyContent: on ? 'flex-end' : 'flex-start',
      }}
    >
      <span
        style={{
          width: 24, height: 24, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'transform 200ms var(--ease-out)',
        }}
      />
    </button>
  )
}
