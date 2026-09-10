import type { SrsCard } from '@/types'

/** Leitner boxes, compressed for a 30-day sprint (milliseconds). */
const INTERVALS = [
  0,               // box 0 — same session
  10 * 60_000,     // box 1 — 10 minutes
  24 * 3600_000,   // box 2 — tomorrow
  3 * 86_400_000,  // box 3 — 3 days
  7 * 86_400_000,  // box 4 — 1 week
  16 * 86_400_000, // box 5 — retired for this course
]

export const MAX_BOX = INTERVALS.length - 1

export const newCard = (key: string): SrsCard => ({
  key, box: 0, due: Date.now(), seen: 0, correct: 0, lapses: 0,
})

/** Grade a review. Correct promotes one box; a miss drops two (floor 0). */
export function grade(card: SrsCard, correct: boolean, now = Date.now()): SrsCard {
  const box = correct ? Math.min(MAX_BOX, card.box + 1) : Math.max(0, card.box - 2)
  return {
    ...card,
    box,
    due: now + INTERVALS[box],
    seen: card.seen + 1,
    correct: card.correct + (correct ? 1 : 0),
    lapses: card.lapses + (correct ? 0 : 1),
  }
}

export const isDue = (c: SrsCard, now = Date.now()) => c.due <= now && c.box < MAX_BOX

/** Weakest-first: overdue cards, then low boxes, then worst accuracy. */
export function reviewQueue(cards: SrsCard[], limit = 20, now = Date.now()): SrsCard[] {
  return cards
    .filter((c) => isDue(c, now))
    .sort((a, b) => a.box - b.box || a.due - b.due || a.correct / (a.seen || 1) - b.correct / (b.seen || 1))
    .slice(0, limit)
}

export const mastered = (c: SrsCard) => c.box >= 4
