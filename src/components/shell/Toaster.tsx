import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, useLevel } from '@/lib/store'
import { badgeById } from '@/lib/gamify'

interface Toast {
  id: number
  kind: 'xp' | 'badge' | 'level'
  text: string
  icon: string
}

let seq = 0

/** Watches the store and announces XP gains, new badges and level-ups. */
export function Toaster() {
  const xp = useStore((s) => s.xp)
  const badges = useStore((s) => s.badges)
  const level = useLevel().level

  const [toasts, setToasts] = useState<Toast[]>([])
  const prev = useRef({ xp, badges, level, ready: false })

  const push = (t: Omit<Toast, 'id'>) => {
    const toast = { ...t, id: ++seq }
    setToasts((all) => [...all.slice(-3), toast])
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== toast.id)), 2600)
  }

  useEffect(() => {
    const p = prev.current
    // skip the very first render so a reload doesn't replay old progress
    if (!p.ready) {
      prev.current = { xp, badges, level, ready: true }
      return
    }
    if (xp > p.xp) push({ kind: 'xp', text: `+${xp - p.xp} XP`, icon: '⚡' })
    if (level > p.level) push({ kind: 'level', text: `Level ${level} reached!`, icon: '🎉' })
    for (const id of badges) {
      if (p.badges.includes(id)) continue
      const b = badgeById(id)
      if (b) push({ kind: 'badge', text: b.name, icon: b.icon })
    }
    prev.current = { xp, badges, level, ready: true }
  }, [xp, badges, level])

  return (
    <div className="toast-wrap">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
            className={`toast ${t.kind === 'xp' ? 'toast-xp' : t.kind !== 'level' ? 'toast-badge' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
