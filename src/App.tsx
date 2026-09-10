import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/shell/Sidebar'
import { Toaster } from '@/components/shell/Toaster'
import { GlossLayer } from '@/components/Gloss'
import { useStore } from '@/lib/store'
import Home from '@/routes/Home'
import Course from '@/routes/Course'
import DayView from '@/routes/DayView'
import Vocab from '@/routes/Vocab'
import Games from '@/routes/Games'
import Exam from '@/routes/Exam'
import Settings from '@/routes/Settings'

export default function App() {
  const theme = useStore((s) => s.settings.theme)
  const mini = useStore((s) => s.settings.miniSidebar)
  const loc = useLocation()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0E0F13' : '#FDFBF7')
  }, [theme])

  // Ctrl/Cmd+B collapses the sidebar, like an editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        const s = useStore.getState()
        s.set('miniSidebar', !s.settings.miniSidebar)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // new page → back to the top, otherwise deep pages open mid-scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [loc.pathname])

  return (
    <div className={`app${mini ? ' app-mini' : ''}`}>
      <Sidebar />
      <main className="main">
        {/*
          A keyed fade-in, deliberately without AnimatePresence: an exit
          animation in "wait" mode can leave the outgoing page unresolved and
          the panel renders empty. A plain remount is also cheaper.
        */}
        <motion.div
          key={loc.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={loc}>
            <Route path="/" element={<Home />} />
            <Route path="/kurs" element={<Course />} />
            <Route path="/tag/:id" element={<DayView />} />
            <Route path="/vokabeln" element={<Vocab />} />
            <Route path="/spiele" element={<Games />} />
            <Route path="/spiele/:game" element={<Games />} />
            <Route path="/pruefung" element={<Exam />} />
            <Route path="/einstellungen" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.div>
      </main>
      <Toaster />
      <GlossLayer />
    </div>
  )
}
