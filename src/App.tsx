import { useState } from 'react'
import Scores from './views/Scores'
import Schedule from './views/Schedule'
import Standings from './views/Standings'
import styles from './App.module.css'

type Tab = 'scores' | 'schedule' | 'standings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'scores', label: 'Scores' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('scores')

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🏒</span>
            <div>
              <span className={styles.brandName}>SportsTracker</span>
              <span className={styles.sport}>NHL</span>
            </div>
          </div>

          <nav className={styles.nav}>
            {TABS.map(t => (
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
        {tab === 'scores' && <Scores />}
        {tab === 'schedule' && <Schedule />}
        {tab === 'standings' && <Standings />}
      </main>

      <footer className={styles.footer}>
        Data provided by the NHL API · Updates automatically during live games
      </footer>
    </div>
  )
}
