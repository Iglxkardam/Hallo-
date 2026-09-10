import type { Badge } from '@/types'

/* ── XP economy ──────────────────────────────────────────────────────── */
export const XP = {
  notesRead: 20,
  vocabWord: 3,
  quizCorrect: 8,
  quizPerfect: 40,
  dayComplete: 60,
  reviewCorrect: 4,
  gameWin: 25,
  streakBonus: 15, // per consecutive day, capped below
} as const

export const streakBonus = (streak: number) => Math.min(streak, 10) * XP.streakBonus

/* ── Levels ──────────────────────────────────────────────────────────── */
const RANKS = [
  'Neuling', 'Anfänger', 'Entdecker', 'Schüler', 'Sammler',
  'Kenner', 'Sprecher', 'Profi', 'Meister', 'Champion',
]

/** XP needed to finish level L (1-indexed): grows gently so it never stalls. */
const need = (level: number) => 180 + (level - 1) * 110

export function levelOf(xp: number) {
  let level = 1
  let rest = xp
  while (rest >= need(level) && level < 40) {
    rest -= need(level)
    level++
  }
  const span = need(level)
  return {
    level,
    rank: RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 2))],
    into: rest,
    span,
    progress: rest / span,
    toNext: span - rest,
  }
}

/* ── Badges ──────────────────────────────────────────────────────────── */
export const BADGES: Badge[] = [
  { id: 'first-step', name: 'Erster Schritt', desc: 'Tag 1 poora kiya', icon: '🌱' },
  { id: 'streak-3', name: 'Dreier', desc: '3 din ka streak', icon: '🔥' },
  { id: 'streak-7', name: 'Woche', desc: '7 din ka streak', icon: '⚡' },
  { id: 'streak-14', name: 'Zwei Wochen', desc: '14 din ka streak', icon: '💫' },
  { id: 'streak-30', name: 'Unaufhaltsam', desc: '30 din ka streak — perfect run', icon: '👑' },
  { id: 'vocab-50', name: 'Wortsammler', desc: '50 words mastered', icon: '📖' },
  { id: 'vocab-150', name: 'Wortschatz', desc: '150 words mastered', icon: '📚' },
  { id: 'vocab-300', name: 'Wörterbuch', desc: '300 words mastered', icon: '🧠' },
  { id: 'vocab-500', name: 'A1 Komplett', desc: '500 words mastered', icon: '🏆' },
  { id: 'perfect', name: 'Fehlerfrei', desc: 'Ek din ka quiz 100%', icon: '🎯' },
  { id: 'artikel', name: 'Artikel-Meister', desc: 'Artikel Duell: 20 sahi lagatar', icon: '🎲' },
  { id: 'week-1', name: 'Woche 1', desc: 'Tage 1–6 fertig', icon: '1️⃣' },
  { id: 'week-2', name: 'Woche 2', desc: 'Tage 7–12 fertig', icon: '2️⃣' },
  { id: 'week-3', name: 'Woche 3', desc: 'Tage 13–18 fertig', icon: '3️⃣' },
  { id: 'week-4', name: 'Woche 4', desc: 'Tage 19–24 fertig', icon: '4️⃣' },
  { id: 'week-5', name: 'Woche 5', desc: 'Tage 25–30 fertig', icon: '5️⃣' },
  { id: 'exam-ready', name: 'Prüfungsbereit', desc: 'Poora 30-din course khatam', icon: '🎓' },
]

export const badgeById = (id: string) => BADGES.find((b) => b.id === id)
