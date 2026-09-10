export const cn = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ')

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export const shuffle = <T,>(arr: readonly T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const sample = <T,>(arr: readonly T[], n: number): T[] => shuffle(arr).slice(0, n)

/** Local YYYY-MM-DD — used as the streak key so timezones don't skip a day. */
export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + 'T00:00').getTime() - new Date(a + 'T00:00').getTime()) / 86400000)

/**
 * Forgiving comparison for typed German. Accepts ue/oe/ae/ss for umlauts and
 * ß, ignores case, surrounding punctuation and doubled spaces — but NOT
 * missing words, so word order and articles still have to be right.
 */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[.,!?;:"'’]/g, '')
    .replace(/\s+/g, ' ')

export const matches = (input: string, accepted: string[]) =>
  accepted.some((a) => normalize(a) === normalize(input))

/** "der Tisch" -> "m" */
export const genderOf = (de: string): 'm' | 'f' | 'n' | 'pl' | null => {
  const w = de.trim().split(/\s+/)[0].toLowerCase()
  if (w === 'der') return 'm'
  if (w === 'die') return 'f'
  if (w === 'das') return 'n'
  return null
}

export const genderColor = (g: string | null | undefined) =>
  g === 'm' ? 'var(--blue)' : g === 'f' ? 'var(--pink)' : g === 'n' ? 'var(--green)' : 'var(--ink-3)'

/** "der Tisch" -> "Tisch" */
export const bareNoun = (de: string) => de.replace(/^(der|die|das)\s+/i, '')

export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100))
