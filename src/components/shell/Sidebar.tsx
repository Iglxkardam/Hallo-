import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore, useLevel, useMasteredCount, useDaysDone } from '@/lib/store'
import { ProgressRing } from '@/components/ui'
import { TOTAL_DAYS } from '@/data/curriculum'

const I = {
  today: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  course: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-1.5z" />
      <path d="M8 7h7M8 11h7" />
    </svg>
  ),
  vocab: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M7 9h6M7 13h4" />
    </svg>
  ),
  games: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
      <rect x="2" y="6" width="20" height="12" rx="5" />
    </svg>
  ),
  exam: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 8l10 5 10-5-10-5z" />
      <path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 8.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.5 1.5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 11h.1a2 2 0 1 1 0 4H21z" />
    </svg>
  ),
}

const LINKS = [
  { to: '/', label: 'Today', icon: I.today, end: true },
  { to: '/kurs', label: 'Course', icon: I.course },
  { to: '/vokabeln', label: 'Words', icon: I.vocab },
  { to: '/spiele', label: 'Games', icon: I.games },
  { to: '/pruefung', label: 'Exam', icon: I.exam },
  { to: '/einstellungen', label: 'More', icon: I.settings },
]

const CollapseIcon = ({ mini }: { mini: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M9.5 4v16" />
    <path d={mini ? 'M13.5 9.5 16 12l-2.5 2.5' : 'M16.5 9.5 14 12l2.5 2.5'} />
  </svg>
)

export function Sidebar() {
  const streak = useStore((s) => s.streak)
  const mini = useStore((s) => s.settings.miniSidebar)
  const set = useStore((s) => s.set)
  const lvl = useLevel()
  const words = useMasteredCount()
  const done = useDaysDone()

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-mark" src="/logo.svg" alt="" width={34} height={34} />
        <div className="col brand-text">
          <span className="brand-name">Deutsch Quest</span>
          <span className="brand-sub">German A1 in 30 days</span>
        </div>
        <button
          className="btn btn-ghost btn-icon sidebar-toggle"
          onClick={() => set('miniSidebar', !mini)}
          title={mini ? 'Expand sidebar  (Ctrl+B)' : 'Collapse sidebar  (Ctrl+B)'}
          aria-label={mini ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <CollapseIcon mini={mini} />
        </button>
      </div>

      <nav className="nav">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} title={l.label} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-glow" className="nav-glow" transition={{ type: 'spring', stiffness: 480, damping: 40 }} />}
                {l.icon}
                <span className="nav-label">{l.label}</span>
                {l.to === '/kurs' && <span className="nav-count">{done}/{TOTAL_DAYS}</span>}
                {l.to === '/vokabeln' && <span className="nav-count">{words}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="level-card">
        <div className="row" style={{ gap: 12 }}>
          <ProgressRing value={lvl.progress} size={50} stroke={5}>
            <span className="mono" style={{ fontSize: 15, fontWeight: 800 }}>{lvl.level}</span>
          </ProgressRing>
          <div className="col grow level-detail" style={{ gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 750, fontSize: 14 }}>{lvl.rank}</span>
            <span className="tiny dim mono">{lvl.toNext} XP to level {lvl.level + 1}</span>
          </div>
        </div>
        <div className="between level-detail" style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--line)' }}>
          <span className="tiny dim">Streak</span>
          <span className="streak-flame small">🔥 {streak} {streak === 1 ? 'day' : 'days'}</span>
        </div>
      </div>
    </aside>
  )
}
