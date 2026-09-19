import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PageHead, SpeakButton, Empty } from '@/components/ui'
import { Gloss } from '@/components/Gloss'

interface Turn {
  q: string
  de: string
  en: string
  note?: string
  error?: string
}

const PROMPTS = [
  'Translate: I live in Delhi with my family.',
  'Check: Ich habe zwanzig Jahre alt.',
  "Wie sagt man 'my mother tongue' auf Deutsch?",
  'Ich komme aus Indien — is aus or in correct here?',
]

function Spinner() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </motion.svg>
  )
}

async function askApi(question: string, history: Turn[]): Promise<Turn> {
  try {
    const r = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question,
        history: history.flatMap((t) => [
          { role: 'user', content: t.q },
          { role: 'assistant', content: JSON.stringify({ de: t.de, en: t.en }) },
        ]),
      }),
    })
    if (!r.ok) {
      const body = await r.json().catch(() => ({}))
      return { q: question, de: '', en: '', error: body.error || 'The AI tutor is offline right now — try again shortly.' }
    }
    const data = await r.json()
    return { q: question, de: data.de || '', en: data.en || '', note: data.note }
  } catch {
    return { q: question, de: '', en: '', error: 'Network error — please try again.' }
  }
}

export default function Ask() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const send = async (text?: string) => {
    const question = (text ?? input).trim()
    if (!question || busy) return
    setInput('')
    setBusy(true)
    const answer = await askApi(question, turns)
    setTurns((t) => [...t, answer])
    setBusy(false)
    requestAnimationFrame(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' }))
  }

  return (
    <div className="page">
      <PageHead
        eyebrow="Always available"
        title="Frag mich"
        sub="Ask anything — a translation, a grammar check, or a doubt about a sentence. Answers are always correct German, kept within A1 level wherever possible."
      />

      <div className="card card-pad col" style={{ gap: 'var(--s4)', minHeight: 420 }}>
        <div ref={boxRef} className="col" style={{ gap: 4, maxHeight: 480, overflowY: 'auto' }}>
          {turns.length === 0 && (
            <Empty icon="💬" title="Ask anything" note="Tap an example below, or type your own question." />
          )}

          {turns.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="col"
              style={{ gap: 6, padding: '10px 4px', borderBottom: i < turns.length - 1 ? '1px solid var(--line)' : undefined }}
            >
              <span className="small dim">{t.q}</span>
              {t.error ? (
                <span className="small" style={{ color: 'var(--orange)' }}>{t.error}</span>
              ) : (
                <>
                  <div className="ex-list">
                    <div className="ex">
                      <div>
                        <div className="ex-de"><Gloss>{t.de}</Gloss></div>
                        <span className="ex-hi">{t.en}</span>
                      </div>
                      <SpeakButton text={t.de} className="ex-play" />
                    </div>
                  </div>
                  {t.note && (
                    <div className="tip" style={{ fontSize: 13 }}>
                      <span>📝</span>
                      <div>{t.note}</div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}

          {busy && (
            <span className="small dim row" style={{ padding: '4px', gap: 6 }}>
              <Spinner /> Thinking…
            </span>
          )}
        </div>

        {turns.length === 0 && (
          <div className="row wrap" style={{ gap: 8 }}>
            {PROMPTS.map((p) => (
              <button key={p} className="btn btn-sm" onClick={() => send(p)}>{p}</button>
            ))}
          </div>
        )}

        <div className="row" style={{ gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Type your question…"
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              padding: '11px 14px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--line-strong)',
              background: 'var(--paper)',
              fontSize: 14.5,
            }}
          />
          <button className="btn btn-primary" disabled={busy || !input.trim()} onClick={() => send()} style={{ minWidth: 88 }}>
            {busy ? <Spinner /> : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  )
}
