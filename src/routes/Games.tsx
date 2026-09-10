import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArtikelDuell } from '@/components/games/ArtikelDuell'
import { MatchPairs } from '@/components/games/MatchPairs'
import { HoerQuiz } from '@/components/games/HoerQuiz'
import { ZahlenDiktat } from '@/components/games/ZahlenDiktat'
import { DuOderSie } from '@/components/games/DuOderSie'
import { PageHead, Pill } from '@/components/ui'
import { useStore } from '@/lib/store'

const GAMES = [
  {
    slug: 'artikel',
    icon: '🎲',
    name: 'Artikel-Duell',
    tag: 'der / die / das',
    desc: 'Sixty seconds, three lives. Get the article right on as many nouns as you can.',
    color: 'var(--blue)',
  },
  {
    slug: 'paare',
    icon: '🧩',
    name: 'Find the pairs',
    tag: 'Vocabulary',
    desc: 'Match each German word with its meaning. The faster you finish, the more XP.',
    color: 'var(--green)',
  },
  {
    slug: 'zahlen',
    icon: '🔢',
    name: 'Number dictation',
    tag: 'Hören Teil 2',
    desc: 'Hear a number, phone number or postcode and type the digits. This is where most people lose the listening module.',
    color: 'var(--orange)',
  },
  {
    slug: 'dusie',
    icon: '🤝',
    name: 'du oder Sie?',
    tag: 'Sprechen',
    desc: 'Who gets du and who gets Sie. The examiner listens for this, and Germans notice it.',
    color: 'var(--pink)',
  },
  {
    slug: 'hoeren',
    icon: '🎧',
    name: 'Listening quiz',
    tag: 'Listening practice',
    desc: 'Hear a word and pick the right meaning — direct practice for the Goethe listening module.',
    color: 'var(--purple)',
  },
]

export default function Games() {
  const { game } = useParams()
  const best = useStore((s) => s.artikelBest)

  if (game) {
    const meta = GAMES.find((g) => g.slug === game)
    return (
      <div className="page">
        <Link to="/spiele" className="small dim" style={{ display: 'inline-block', marginBottom: 'var(--s4)' }}>
          ← All games
        </Link>
        <h1 className="h2" style={{ marginBottom: 'var(--s5)' }}>
          {meta?.icon} {meta?.name}
        </h1>
        {game === 'artikel' && <ArtikelDuell />}
        {game === 'paare' && <MatchPairs />}
        {game === 'hoeren' && <HoerQuiz />}
        {game === 'zahlen' && <ZahlenDiktat />}
        {game === 'dusie' && <DuOderSie />}
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead
        eyebrow="Practice"
        title="Games"
        sub="Short drills aimed exactly at where A1 learners lose marks — articles, vocabulary and listening."
      />

      <div className="grid auto-lg">
        {GAMES.map((g, i) => (
          <motion.div
            key={g.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={`/spiele/${g.slug}`} className="day-card" style={{ minHeight: 190 }}>
              <div style={{ fontSize: 34 }}>{g.icon}</div>
              <div className="col grow" style={{ gap: 4 }}>
                <span className="h3">{g.name}</span>
                <span className="small muted">{g.desc}</span>
              </div>
              <div className="between">
                <Pill color={g.color}>{g.tag}</Pill>
                {g.slug === 'artikel' && best > 0 && (
                  <span className="tiny dim mono">Best streak: {best}</span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="card card-pad row" style={{ marginTop: 'var(--s6)', gap: 'var(--s4)', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22 }}>💡</span>
        <div>
          <b>Five minutes of Article Duel and Number dictation a day.</b>
          <p className="small muted" style={{ marginTop: 3 }}>
            Articles trip learners up all the way from A1 to B1, and numbers are what actually cost marks in the
            listening exam. Five minutes of each per day and after a month both feel automatic rather than memorised.
          </p>
        </div>
      </div>
    </div>
  )
}
