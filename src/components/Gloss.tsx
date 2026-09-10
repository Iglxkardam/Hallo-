import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { lookup } from '@/lib/glossary'
import { speak } from '@/lib/audio'

/**
 * Forms that are also ordinary English words. Inside mixed English/German text
 * (`strict`) they are left alone, because glossing "in", "man" or "hat" in an
 * English sentence would show a confidently wrong meaning.
 */
const AMBIGUOUS = new Set(['in', 'an', 'man', 'also', 'was', 'hat', 'die', 'bald', 'mal', 'hier', 'boot'])

/**
 * Marks up German words so hovering shows the English meaning.
 *
 * Performance matters here: one lesson can hold a few thousand words, so a
 * glossed word is a plain <span> carrying data attributes — no state, no hooks,
 * no store subscription. A single listener in <GlossLayer/> serves the whole
 * page.
 */
export function Gloss({
  children,
  className,
  strict = false,
  mark,
}: {
  children: string
  className?: string
  /** true when the text mixes English and German — skips ambiguous words */
  strict?: boolean
  /** lower-cased words to visually emphasise, e.g. the verb form in an example */
  mark?: Set<string>
}) {
  const parts = useMemo(() => {
    const tokens = children.split(/([^\p{L}\p{M}ß-]+)/u)
    const out: ReactNode[] = []
    tokens.forEach((tok, i) => {
      const g = strict && AMBIGUOUS.has(tok.toLowerCase()) ? null : lookup(tok)
      if (!g) {
        out.push(tok)
        return
      }
      const hit = mark?.has(tok.toLowerCase())
      out.push(
        <span
          key={i}
          className={hit ? 'gloss-word gloss-mark' : 'gloss-word'}
          data-gw={tok}
          data-ge={g.en}
          data-gn={g.note ?? ''}
        >
          {tok}
        </span>,
      )
    })
    return out
  }, [children, strict, mark])

  return <span className={className}>{parts}</span>
}

interface Pop {
  word: string
  en: string
  note: string
  x: number
  y: number
  above: boolean
}

/** Mounted once. Owns the only state the whole glossing system needs. */
export function GlossLayer() {
  const [pop, setPop] = useState<Pop | null>(null)

  useEffect(() => {
    const hit = (e: Event) => (e.target as HTMLElement | null)?.closest?.('[data-ge]') as HTMLElement | null

    const onOver = (e: MouseEvent) => {
      const el = hit(e)
      if (!el) return
      const r = el.getBoundingClientRect()
      setPop({
        word: el.dataset.gw ?? el.textContent ?? '',
        en: el.dataset.ge ?? '',
        note: el.dataset.gn ?? '',
        x: r.left + r.width / 2,
        y: r.top > 120 ? r.top - 8 : r.bottom + 8,
        above: r.top > 120,
      })
    }
    const onOut = (e: MouseEvent) => {
      if (hit(e)) setPop(null)
    }
    const onClick = (e: MouseEvent) => {
      const el = hit(e)
      if (el?.dataset.gw) speak(el.dataset.gw)
    }
    const clear = () => setPop(null)

    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('click', onClick)
    window.addEventListener('scroll', clear, true)
    return () => {
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('click', onClick)
      window.removeEventListener('scroll', clear, true)
    }
  }, [])

  if (!pop) return null

  return (
    <span
      className="gloss-pop"
      style={{
        left: Math.min(Math.max(80, pop.x), window.innerWidth - 80),
        top: pop.y,
        transform: `translate(-50%, ${pop.above ? '-100%' : '0'})`,
      }}
    >
      <span className="gloss-de">{pop.word}</span>
      <span className="gloss-en">{pop.en}</span>
      {pop.note && <span className="gloss-note">{pop.note}</span>}
    </span>
  )
}
