import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { NoteBlock } from '@/types'
import { SpeakButton } from '@/components/ui'
import { Gloss } from '@/components/Gloss'

/** Renders **bold** segments; everything else stays plain text. */
function rich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <span key={i} className="hl">
        <Gloss strict>{part.slice(2, -2)}</Gloss>
      </span>
    ) : (
      <Gloss key={i} strict>{part}</Gloss>
    ),
  )
}

function Block({ b }: { b: NoteBlock }) {
  switch (b.t) {
    case 'h':
      return <h3 className="nb-h">{b.text}</h3>

    case 'p':
      return <p className="nb-text">{rich(b.text)}</p>

    case 'rule':
      return (
        <div className="rulebox">
          <div className="rulebox-title">{b.title}</div>
          <div className="rulebox-body">{rich(b.body)}</div>
        </div>
      )

    case 'table':
      return (
        <div className="gt-wrap">
          <table className="gt">
            <caption>{b.caption}</caption>
            <thead>
              <tr>
                {b.head.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
                {b.say && <th style={{ width: 44 }}>Hear</th>}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}><Gloss strict>{cell}</Gloss></td>
                  ))}
                  {b.say && (
                    <td style={{ padding: '2px 6px' }}>
                      {b.say[i] ? <SpeakButton text={b.say[i]} /> : null}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'ex':
      return (
        <div className="ex-list">
          {b.items.map((it, i) => (
            <div className="ex" key={i}>
              <div>
                <div className="ex-de"><Gloss>{it.de}</Gloss></div>
                <span className="ex-hi">{it.hi}</span>
              </div>
              <SpeakButton text={it.de.split('(')[0].trim()} className="ex-play" />
            </div>
          ))}
        </div>
      )

    case 'tip':
      return (
        <div className="tip">
          <span style={{ fontSize: 17, lineHeight: 1.3 }}>💡</span>
          <div>
            <b>Tip</b>
            {rich(b.text)}
          </div>
        </div>
      )

    case 'warn':
      return (
        <div className="warn">
          <span style={{ fontSize: 17, lineHeight: 1.3 }}>⚠️</span>
          <div>
            <b>Watch out — this is where mistakes happen</b>
            {rich(b.text)}
          </div>
        </div>
      )

    case 'sticky':
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div className="sticky" style={{ maxWidth: 460 }}>
            {b.text}
          </div>
        </div>
      )
  }
}

export function NoteRenderer({ blocks }: { blocks: NoteBlock[] }) {
  return (
    <article className="notebook">
      <div className="nb-body">
        {blocks.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Block b={b} />
          </motion.div>
        ))}
      </div>
    </article>
  )
}
