import { useState } from 'react'
import { useScoreboard } from '../hooks/useNHL'
import GameCard from '../components/GameCard'
import styles from './Scores.module.css'

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === localDateStr(today)) return 'Today'
  if (dateStr === localDateStr(yesterday)) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateStr(d)
}

export default function Scores() {
  const [dateInput, setDateInput] = useState<string | undefined>(undefined)
  const { days, loading, error, lastUpdated, countdown, refetch } = useScoreboard(dateInput)

  const hasLive = days.some(d => d.games.some(g => g.gameState === 'LIVE' || g.gameState === 'CRIT'))

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.dateNav}>
          <button className={styles.navBtn} onClick={() => {
            const cur = dateInput ?? localDateStr()
            const d = new Date(cur + 'T12:00:00')
            d.setDate(d.getDate() - 1)
            setDateInput(localDateStr(d))
          }}>‹</button>
          <button
            className={`${styles.todayBtn} ${!dateInput ? styles.active : ''}`}
            onClick={() => setDateInput(undefined)}
          >Today</button>
          <button className={styles.navBtn} onClick={() => {
            const cur = dateInput ?? localDateStr()
            const d = new Date(cur + 'T12:00:00')
            d.setDate(d.getDate() + 1)
            setDateInput(localDateStr(d))
          }}>›</button>
          <input
            type="date"
            className={styles.datePicker}
            value={dateInput ?? dateOffset(0)}
            onChange={e => setDateInput(e.target.value)}
          />
        </div>

        <div className={styles.meta}>
          {hasLive && <span className={styles.liveBadge}>● LIVE</span>}
          {lastUpdated && (
            <span className={styles.updated}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {!loading && (
            <span className={styles.countdown}>Refreshes in {countdown}s</span>
          )}
        </div>
      </div>

      {loading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Loading scores…</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>⚠ {error}</p>
          <button onClick={() => void refetch()}>Try again</button>
        </div>
      )}

      {!loading && !error && days.length === 0 && (
        <div className={styles.center}>
          <p className={styles.empty}>No games scheduled for this date.</p>
        </div>
      )}

      {days.map(day => (
        <section key={day.date} className={styles.day}>
          <h2 className={styles.dayHeading}>{formatDate(day.date)}</h2>
          <div className={styles.grid}>
            {day.games.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
