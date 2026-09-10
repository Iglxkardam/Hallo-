import type { Day, Vocab, Week } from '@/types'
import { d01 } from './days/d01'
import { d02 } from './days/d02'
import { d03 } from './days/d03'
import { d04 } from './days/d04'
import { d05 } from './days/d05'
import { d06 } from './days/d06'
import { d07 } from './days/d07'

/**
 * Days that are actually written. To add Day 8, create `days/d08.ts` and add it
 * to this array — weeks, vocabulary, games, stats and routing all derive from
 * here automatically.
 */
export const DAYS: Day[] = [d01, d02, d03, d04, d05, d06, d07]

export const TOTAL_DAYS = 30

export const dayById = (id: number): Day | undefined => DAYS.find((d) => d.id === id)

export const isReady = (id: number) => DAYS.some((d) => d.id === id)

/** Every vocabulary item across the written days. */
export const ALL_VOCAB: Vocab[] = DAYS.flatMap((d) => d.vocab)

export const vocabForDays = (ids: number[]): Vocab[] =>
  DAYS.filter((d) => ids.includes(d.id)).flatMap((d) => d.vocab)

export const WEEKS: Week[] = [
  { n: 1, title: 'Erste Kontakte', subtitle: 'Netzwerk Kapitel 1–2 · introducing yourself, numbers, nouns', days: [1, 2, 3, 4, 5, 6], color: 'var(--blue)' },
  { n: 2, title: 'Stadt und Essen', subtitle: 'Kapitel 2–4 · jobs, getting around Hamburg, food', days: [7, 8, 9, 10, 11, 12], color: 'var(--green)' },
  { n: 3, title: 'Zeit und Familie', subtitle: 'Kapitel 4–6 · accusative, the clock, family, modal verbs', days: [13, 14, 15, 16, 17, 18], color: 'var(--orange)' },
  { n: 4, title: 'Arbeit und Gesundheit', subtitle: 'Kapitel 6–8 · separable verbs, dative, the doctor', days: [19, 20, 21, 22, 23, 24], color: 'var(--purple)' },
  { n: 5, title: 'Wohnen, Reisen, Prüfung', subtitle: 'Kapitel 9–12 · flats, the past tense, travel, full mock exam', days: [25, 26, 27, 28, 29, 30], color: 'var(--pink)' },
]

export const weekOf = (dayId: number) => WEEKS.find((w) => w.days.includes(dayId))

/**
 * The syllabus for days not yet written, so the whole road is visible from day
 * one. Chapter numbers follow the Netzwerk neu A1 Kursbuch contents exactly:
 *
 *   1 Guten Tag! · 2 Freunde, Kollegen und ich · 3 In Hamburg · Plattform 1
 *   4 Guten Appetit! · 5 Alltag und Familie · 6 Zeit mit Freunden · Plattform 2
 *   7 Arbeitsalltag · 8 Fit und gesund · 9 Meine Wohnung · Plattform 3
 *   10 Studium und Beruf · 11 Die Jacke gefällt mir! · 12 Ab in den Urlaub!
 */
export const PLANNED: Record<number, { title: string; focus: string; kapitel: number }> = {
  8:  { kapitel: 3,  title: 'In Hamburg: places and buildings', focus: 'Indefinite article ein/ein/eine · asking about things' },
  9:  { kapitel: 3,  title: 'Saying there is none', focus: 'Negation kein/kein/keine · adjective with sein' },
  10: { kapitel: 3,  title: 'Getting around and asking the way', focus: 'Transport · directions · imperative with Sie · months and seasons' },
  11: { kapitel: 3,  title: 'Plattform 1 — review of chapters 1–3', focus: 'Consolidation + first exam-style practice' },
  12: { kapitel: 4,  title: 'Guten Appetit! Food and meals', focus: 'Meals · groceries · drinks · shops' },
  13: { kapitel: 4,  title: 'The accusative', focus: 'der → den, ein → einen · verbs that take an accusative' },
  14: { kapitel: 4,  title: 'Shopping and preferences', focus: 'mögen and möchten · word order in the sentence' },
  15: { kapitel: 5,  title: 'Telling the time', focus: 'Clock times · am, um, von … bis' },
  16: { kapitel: 5,  title: 'My day and my family', focus: 'Daily routine · family · possessive articles' },
  17: { kapitel: 5,  title: 'Modal verbs', focus: 'müssen, können, wollen · the sentence bracket' },
  18: { kapitel: 6,  title: 'Dates and birthdays', focus: 'Ordinal numbers · am 3. Mai · invitations' },
  19: { kapitel: 6,  title: 'Separable verbs', focus: 'aufstehen, einkaufen, anfangen · free-time activities' },
  20: { kapitel: 6,  title: 'Ordering and talking about the past', focus: 'Accusative pronouns · für + accusative · war and hatte' },
  21: { kapitel: 6,  title: 'Plattform 2 — review of chapters 4–6', focus: 'Consolidation + listening and reading practice' },
  22: { kapitel: 7,  title: 'A day at work', focus: 'Office vocabulary · the dative article · mit + dative' },
  23: { kapitel: 7,  title: 'Saying where things are', focus: 'Prepositions with the dative · joining sentences with und, oder, aber' },
  24: { kapitel: 8,  title: 'The body and being ill', focus: 'Body parts · illnesses · imperative with du, ihr and Sie' },
  25: { kapitel: 8,  title: 'At the doctor', focus: 'Modal verbs sollen, dürfen · giving and understanding instructions' },
  26: { kapitel: 9,  title: 'My flat', focus: 'Rooms · furniture · colours · describing a home' },
  27: { kapitel: 9,  title: 'Where things stand', focus: 'Two-way prepositions with the dative · in + accusative' },
  28: { kapitel: 10, title: 'Talking about the past', focus: 'The perfect tense · Partizip II · perfect with haben and sein' },
  29: { kapitel: 11, title: 'Clothes, travel and weather', focus: 'Dative pronouns · welcher/dieser · travel and weather vocabulary' },
  30: { kapitel: 12, title: 'Full Goethe A1 mock exam', focus: 'All four modules under exam conditions + final review' },
}

export const planFor = (id: number) => PLANNED[id]

/* ── derived stats ───────────────────────────────────────────────────── */
export const totalWords = ALL_VOCAB.length
export const totalMinutes = DAYS.reduce((s, d) => s + d.minutes, 0)
export const totalExercises = DAYS.reduce((s, d) => s + d.exercises.length, 0)
