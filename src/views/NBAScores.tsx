import { useState } from 'react'
import { useNBAScoreboard } from '../hooks/useNBA'
import NBAGameCard from '../components/NBAGameCard'
import NBAGameModal from '../components/NBAGameModal'
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

export default function NBAScores() {
  const [dateInput, setDateInput] = useState<string | undefined>(undefined)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const { games, loading, error, lastUpdated, countdown, refetch } = useNBAScoreboard(dateInput)

  const hasLive = games.some(g => !(/^final/i.test(g.statusText) || /[ap]m\b/i.test(g.statusText)))
  const displayDate = dateInput ?? localDateStr()

  function navigate(delta: number) {
    const cur = dateInput ?? localDateStr()
    const d = new Date(cur + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDateInput(localDateStr(d))
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.dateNav}>
          <button className={styles.navBtn} onClick={() => navigate(-1)}>‹</button>
          <button
            className={`${styles.todayBtn} ${!dateInput ? styles.active : ''}`}
            onClick={() => setDateInput(undefined)}
          >Today</button>
          <button className={styles.navBtn} onClick={() => navigate(1)}>›</button>
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

      {!loading && !error && games.length === 0 && (
        <div className={styles.center}>
          <p className={styles.empty}>No games scheduled for this date.</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <section className={styles.day}>
          <h2 className={styles.dayHeading}>{formatDate(displayDate)}</h2>
          <div className={styles.grid}>
            {games.map(game => (
              <NBAGameCard
                key={game.gameId}
                game={game}
                onClick={() => setSelectedGameId(game.gameId)}
              />
            ))}
          </div>
        </section>
      )}

      {selectedGameId !== null && (
        <NBAGameModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}
    </div>
  )
}
