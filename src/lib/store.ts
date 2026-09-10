import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayProgress, SrsCard } from '@/types'
import { grade, newCard, mastered } from './srs'
import { XP, streakBonus, levelOf } from './gamify'
import { dayKey, daysBetween } from './utils'

interface Settings {
  theme: 'light' | 'dark'
  speed: number        // TTS playback speed
  showHindi: boolean   // show Hindi meanings inline
  autoplay: boolean    // speak German automatically on card flip
  dailyGoal: number    // words/day target
  voice: string        // MiniMax German voice id
  miniSidebar: boolean // collapse the sidebar to icons only
}

interface State {
  xp: number
  streak: number
  bestStreak: number
  lastStudied: string | null
  studiedDays: string[]
  progress: Record<number, DayProgress>
  srs: Record<string, SrsCard>
  badges: string[]
  artikelBest: number
  settings: Settings

  addXp: (n: number) => void
  touchStreak: () => void
  markNotes: (day: number) => void
  markVocab: (day: number, words: number) => void
  setQuiz: (day: number, score: number, total: number) => void
  completeDay: (day: number) => void
  seedCards: (keys: string[]) => void
  review: (key: string, correct: boolean) => void
  setArtikelBest: (n: number) => void
  award: (id: string) => void
  set: <K extends keyof Settings>(k: K, v: Settings[K]) => void
  resetAll: () => void
}

const emptyDay = (): DayProgress => ({ notesRead: false, vocabDone: false, quizScore: 0, quizTotal: 0 })

const initial = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastStudied: null as string | null,
  studiedDays: [] as string[],
  progress: {} as Record<number, DayProgress>,
  srs: {} as Record<string, SrsCard>,
  badges: [] as string[],
  artikelBest: 0,
  settings: {
    theme: 'light', speed: 0.75, showHindi: true, autoplay: true,
    dailyGoal: 25, voice: 'German_FriendlyMan', miniSidebar: false,
  } as Settings,
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      /** Re-evaluate every badge rule against current state; award new ones. */
      const checkBadges = () => {
        const s = get()
        const done = Object.values(s.progress).filter((p) => p.completedAt).length
        const words = Object.values(s.srs).filter(mastered).length
        const perfect = Object.values(s.progress).some((p) => p.quizTotal > 0 && p.quizScore === p.quizTotal)
        const weekDone = (from: number, to: number) =>
          Array.from({ length: to - from + 1 }, (_, i) => from + i).every((d) => s.progress[d]?.completedAt)

        const earned: string[] = []
        if (done >= 1) earned.push('first-step')
        if (s.bestStreak >= 3) earned.push('streak-3')
        if (s.bestStreak >= 7) earned.push('streak-7')
        if (s.bestStreak >= 14) earned.push('streak-14')
        if (s.bestStreak >= 30) earned.push('streak-30')
        if (words >= 50) earned.push('vocab-50')
        if (words >= 150) earned.push('vocab-150')
        if (words >= 300) earned.push('vocab-300')
        if (words >= 500) earned.push('vocab-500')
        if (perfect) earned.push('perfect')
        if (s.artikelBest >= 20) earned.push('artikel')
        if (weekDone(1, 6)) earned.push('week-1')
        if (weekDone(7, 12)) earned.push('week-2')
        if (weekDone(13, 18)) earned.push('week-3')
        if (weekDone(19, 24)) earned.push('week-4')
        if (weekDone(25, 30)) earned.push('week-5')
        if (done >= 30) earned.push('exam-ready')

        const fresh = earned.filter((b) => !s.badges.includes(b))
        if (fresh.length) set({ badges: [...s.badges, ...fresh] })
      }

      const patchDay = (day: number, patch: Partial<DayProgress>) =>
        set((s) => ({ progress: { ...s.progress, [day]: { ...emptyDay(), ...s.progress[day], ...patch } } }))

      return {
        ...initial,

        addXp: (n) => set((s) => ({ xp: s.xp + Math.max(0, Math.round(n)) })),

        touchStreak: () => {
          const today = dayKey()
          const s = get()
          if (s.lastStudied === today) return
          // consecutive if yesterday; otherwise the streak restarts at 1
          const streak = s.lastStudied && daysBetween(s.lastStudied, today) === 1 ? s.streak + 1 : 1
          set({
            streak,
            bestStreak: Math.max(s.bestStreak, streak),
            lastStudied: today,
            studiedDays: [...new Set([...s.studiedDays, today])],
            xp: s.xp + streakBonus(streak),
          })
          checkBadges()
        },

        markNotes: (day) => {
          if (get().progress[day]?.notesRead) return
          patchDay(day, { notesRead: true })
          get().addXp(XP.notesRead)
          get().touchStreak()
        },

        markVocab: (day, words) => {
          if (get().progress[day]?.vocabDone) return
          patchDay(day, { vocabDone: true })
          get().addXp(XP.vocabWord * words)
          get().touchStreak()
        },

        setQuiz: (day, score, total) => {
          const prev = get().progress[day]?.quizScore ?? 0
          patchDay(day, { quizScore: Math.max(prev, score), quizTotal: total })
          get().addXp(XP.quizCorrect * score + (score === total ? XP.quizPerfect : 0))
          get().touchStreak()
          checkBadges()
        },

        completeDay: (day) => {
          if (get().progress[day]?.completedAt) return
          patchDay(day, { completedAt: Date.now() })
          get().addXp(XP.dayComplete)
          get().touchStreak()
          checkBadges()
        },

        seedCards: (keys) =>
          set((s) => {
            const srs = { ...s.srs }
            let added = false
            for (const k of keys) if (!srs[k]) { srs[k] = newCard(k); added = true }
            return added ? { srs } : {}
          }),

        review: (key, correct) => {
          set((s) => {
            const card = s.srs[key] ?? newCard(key)
            return { srs: { ...s.srs, [key]: grade(card, correct) } }
          })
          if (correct) get().addXp(XP.reviewCorrect)
          get().touchStreak()
          checkBadges()
        },

        setArtikelBest: (n) => {
          if (n <= get().artikelBest) return
          set({ artikelBest: n })
          checkBadges()
        },

        award: (id) => {
          if (get().badges.includes(id)) return
          set((s) => ({ badges: [...s.badges, id] }))
        },

        set: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),

        resetAll: () => set({ ...initial }),
      }
    },
    { name: 'deutsch-quest-v1', version: 1 },
  ),
)

/* ── selectors ───────────────────────────────────────────────────────── */
export const useLevel = () => levelOf(useStore((s) => s.xp))
export const useMasteredCount = () =>
  useStore((s) => Object.values(s.srs).filter(mastered).length)
export const useDaysDone = () =>
  useStore((s) => Object.values(s.progress).filter((p) => p.completedAt).length)
