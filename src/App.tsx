import { useState } from 'react'
import Scores from './views/Scores'
import Schedule from './views/Schedule'
import Standings from './views/Standings'
import NHLLeaders from './views/NHLLeaders'
import NHLTeams from './views/NHLTeams'
import News from './views/News'
import NBAScores from './views/NBAScores'
import NBASchedule from './views/NBASchedule'
import NBAStandings from './views/NBAStandings'
import NBALeaders from './views/NBALeaders'
import NBATeams from './views/NBATeams'
import styles from './App.module.css'

type Sport = 'nhl' | 'nba' | 'mlb' | 'nfl'
type Tab = 'scores' | 'schedule' | 'standings' | 'leaders' | 'news' | 'teams'

const SPORTS: { id: Sport; label: string; icon: string; color: string }[] = [
  { id: 'nhl', label: 'NHL', icon: '🏒', color: '#0ea5e9' },
  { id: 'nba', label: 'NBA', icon: '🏀', color: '#f97316' },
  { id: 'mlb', label: 'MLB', icon: '⚾', color: '#22c55e' },
  { id: 'nfl', label: 'NFL', icon: '🏈', color: '#a855f7' },
]

const TABS: { id: Tab; label: string; sports?: Sport[] }[] = [
  { id: 'scores', label: 'Scores' },
  { id: 'leaders', label: 'Leaders', sports: ['nhl', 'nba'] },
  { id: 'teams', label: 'Teams', sports: ['nhl', 'nba'] },
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
  { id: 'news', label: 'News' },
]

function ComingSoon({ sport }: { sport: Sport }) {
  const s = SPORTS.find(x => x.id === sport)!
  return (
    <div className={styles.comingSoon}>
      <span className={styles.comingSoonIcon}>{s.icon}</span>
      <h2 className={styles.comingSoonTitle}>{s.label} coming soon</h2>
      <p className={styles.comingSoonSub}>We're working on it.</p>
    </div>
  )
}

export default function App() {
  const [sport, setSport] = useState<Sport>('nhl')
  const [tab, setTab] = useState<Tab>('scores')

  const activeSport = SPORTS.find(s => s.id === sport)!

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>📡</span>
            <span className={styles.brandName}>ScoreSync</span>
          </div>

          <div className={styles.sportPicker}>
            {SPORTS.map(s => (
              <button
                key={s.id}
                className={`${styles.sportBtn} ${sport === s.id ? styles.sportActive : ''}`}
                style={sport === s.id ? { '--sport-color': s.color } as React.CSSProperties : undefined}
                onClick={() => {
                  setSport(s.id)
                  const allowed = TABS.filter(t => !t.sports || t.sports.includes(s.id))
                  if (!allowed.find(t => t.id === tab)) setTab('scores')
                }}
              >
                <span className={styles.sportIcon}>{s.icon}</span>
                <span className={styles.sportLabel}>{s.label}</span>
              </button>
            ))}
          </div>

          <nav className={styles.nav}>
            {TABS.filter(t => !t.sports || t.sports.includes(sport)).map(t => (
              <button
                key={t.id}
                className={`${styles.navBtn} ${tab === t.id ? styles.active : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {sport === 'nhl' && (
          <>
            {tab === 'scores' && <Scores />}
            {tab === 'schedule' && <Schedule />}
            {tab === 'standings' && <Standings />}
            {tab === 'leaders' && <NHLLeaders />}
            {tab === 'teams' && <NHLTeams />}
            {tab === 'news' && <News sport="nhl" />}
          </>
        )}
        {sport === 'nba' && (
          <>
            {tab === 'scores' && <NBAScores />}
            {tab === 'leaders' && <NBALeaders />}
            {tab === 'schedule' && <NBASchedule />}
            {tab === 'standings' && <NBAStandings />}
            {tab === 'teams' && <NBATeams />}
            {tab === 'news' && <News sport="nba" />}
          </>
        )}
        {sport !== 'nhl' && sport !== 'nba' && (
          <ComingSoon sport={sport} />
        )}
      </main>

      <footer className={styles.footer}>
        Data provided by the {activeSport.label} API · Updates automatically during live games
      </footer>
    </div>
  )
}
