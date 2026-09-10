import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useSpeak } from '@/lib/audio'
import { cn } from '@/lib/utils'

/* ── Progress ring ────────────────────────────────────────────────────── */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  children,
  color = 'var(--blue)',
}: {
  value: number
  size?: number
  stroke?: number
  children?: ReactNode
  color?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
      )}
    </div>
  )
}

/* ── Speak button ─────────────────────────────────────────────────────── */
export function SpeakButton({ text, className, label }: { text: string; className?: string; label?: string }) {
  const { say, speaking } = useSpeak()
  const on = speaking(text)
  return (
    <button
      className={cn('btn btn-ghost btn-icon', className)}
      onClick={(e) => {
        e.stopPropagation()
        say(text)
      }}
      aria-label={label ?? `Listen: ${text}`}
      title="Listen"
      style={on ? { color: 'var(--blue)' } : undefined}
    >
      {on ? <WaveIcon /> : <SpeakerIcon />}
    </button>
  )
}

const SpeakerIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)

const WaveIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {[5, 9, 13, 17, 21].map((x, i) => (
      <motion.line
        key={x}
        x1={x}
        x2={x}
        y1="9"
        y2="15"
        animate={{ y1: [10, 5, 10], y2: [14, 19, 14] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.09, ease: 'easeInOut' }}
      />
    ))}
  </svg>
)

/* ── Small pieces ─────────────────────────────────────────────────────── */
export function Stat({ label, value, sub, color }: { label: string; value: ReactNode; sub?: string; color?: string }) {
  return (
    <div className="card card-pad col" style={{ gap: 2 }}>
      <span className="eyebrow">{label}</span>
      <span className="h2 mono" style={{ color, lineHeight: 1.15 }}>
        {value}
      </span>
      {sub && <span className="tiny dim">{sub}</span>}
    </div>
  )
}

export function Pill({ children, color, solid }: { children: ReactNode; color?: string; solid?: boolean }) {
  return (
    <span
      className={cn('pill', solid && 'pill-solid')}
      style={solid ? { background: color } : color ? { color, borderColor: color } : undefined}
    >
      {children}
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div
      className="row"
      style={{
        gap: 2,
        padding: 3,
        background: 'var(--paper-2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-full)',
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="btn btn-sm"
          style={{
            position: 'relative',
            border: 'none',
            background: 'transparent',
            color: value === o.value ? 'var(--ink)' : 'var(--ink-3)',
            fontWeight: value === o.value ? 700 : 600,
          }}
        >
          {value === o.value && (
            <motion.span
              layoutId="seg"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--paper)',
                borderRadius: 'var(--r-full)',
                boxShadow: 'var(--shadow-sm)',
                zIndex: -1,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon, title, note }: { icon: string; title: string; note?: string }) {
  return (
    <div className="card card-pad col center" style={{ gap: 8, padding: 'var(--s8) var(--s5)', textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>{icon}</div>
      <div className="h3">{title}</div>
      {note && <div className="small muted" style={{ maxWidth: 380 }}>{note}</div>}
    </div>
  )
}

/* ── Page header ──────────────────────────────────────────────────────── */
export function PageHead({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="between wrap" style={{ marginBottom: 'var(--s5)', alignItems: 'flex-end' }}>
      <div className="col" style={{ gap: 4 }}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="h1">{title}</h1>
        {sub && <p className="muted" style={{ maxWidth: '60ch' }}>{sub}</p>}
      </div>
      {right}
    </header>
  )
}
