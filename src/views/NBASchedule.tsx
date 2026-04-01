import { useState, useMemo } from 'react'
import { useNBASchedule } from '../hooks/useNBA'
import type { NBAGame } from '../api/nba'
import styles from './Schedule.module.css'

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  if (dateStr === localDateStr(today)) return 'Today'
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (dateStr === localDateStr(tomorrow)) return 'Tomorrow'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function gameStatusLabel(game: NBAGame): { text: string; live: boolean; final: boolean } {
  const isFinal = game.statusId === 3 || /^final/i.test(game.statusText)
  const isScheduled = game.statusId === 1 || /[ap]m\b/i.test(game.statusText)
  const isLive = !isFinal && !isScheduled

  if (isFinal) return { text: game.statusText, live: false, final: true }
  if (isLive) {
    const period = game.period > 0
      ? (game.period <= 4 ? `Q${game.period}` : `OT${game.period > 5 ? game.period - 4 : ''}`)
      : ''
    const text = game.clock && period ? `${period} ${game.clock}` : game.statusText
    return { text, live: true, final: false }
  }
  return { text: game.statusText, live: false, final: false }
}

export default function NBASchedule() {
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const { weekDays, loading, error, dates } = useNBASchedule(startDate)

  const isCurrentWeek = startDate === undefined
  const weekStart = dates[0]
  const weekEnd = dates[dates.length - 1]

  const allTeams = useMemo(() => {
    const map = new Map<string, string>()
    for (const day of weekDays) {
      for (const g of day.games) {
        map.set(g.awayTeam.abbrev, `${g.awayTeam.cityName} ${g.awayTeam.abbrev}`)
        map.set(g.homeTeam.abbrev, `${g.homeTeam.cityName} ${g.homeTeam.abbrev}`)
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [weekDays])

  const filteredWeek = useMemo(() =>
    weekDays
      .map(day => ({
        ...day,
        games: selectedTeam === 'all'
          ? day.games
          : day.games.filter(g => g.awayTeam.abbrev === selectedTeam || g.homeTeam.abbrev === selectedTeam),
      }))
      .filter(day => day.games.length > 0),
    [weekDays, selectedTeam]
  )

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Loading schedule…</p>
      </div>
    )
  }

  if (error) {
    return <div className={styles.error}>⚠ {error}</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.weekNav}>
          <button
            className={styles.navBtn}
            disabled={loading}
            onClick={() => setStartDate(addDays(weekStart, -7))}
          >‹</button>
          <button
            className={`${styles.thisWeekBtn} ${isCurrentWeek ? styles.active : ''}`}
            onClick={() => setStartDate(undefined)}
          >This Week</button>
          <button
            className={styles.navBtn}
            disabled={loading}
            onClick={() => setStartDate(addDays(weekEnd, 1))}
          >›</button>
          {weekStart && weekEnd && (
            <span className={styles.weekRange}>
              {new Date(weekStart + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(weekEnd + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <select
          className={styles.teamFilter}
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
        >
          <option value="all">All Teams</option>
          {allTeams.map(([abbrev, name]) => (
            <option key={abbrev} value={abbrev}>{name}</option>
          ))}
        </select>
      </div>

      {filteredWeek.length === 0 ? (
        <div className={styles.center}><p>No games found.</p></div>
      ) : (
        filteredWeek.map(day => (
          <section key={day.date} className={styles.day}>
            <h2 className={styles.dayHeading}>{formatDate(day.date)}</h2>
            <div className={styles.table}>
              {day.games.map(game => {
                const status = gameStatusLabel(game)
                const awayWon = status.final && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0)
                const homeWon = status.final && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0)
                return (
                  <div key={game.gameId} className={`${styles.row} ${status.live ? styles.liveRow : ''}`}>
                    <div className={styles.teams}>
                      <div className={styles.teamInline}>
                        <img src={game.awayTeam.logo} alt={game.awayTeam.abbrev} className={styles.logo} />
                        <span className={`${styles.abbrev} ${awayWon ? styles.winner : ''}`}>{game.awayTeam.abbrev}</span>
                        <span className={styles.name}>{game.awayTeam.cityName}</span>
                      </div>
                      <span className={styles.at}>@</span>
                      <div className={styles.teamInline}>
                        <img src={game.homeTeam.logo} alt={game.homeTeam.abbrev} className={styles.logo} />
                        <span className={`${styles.abbrev} ${homeWon ? styles.winner : ''}`}>{game.homeTeam.abbrev}</span>
                        <span className={styles.name}>{game.homeTeam.cityName}</span>
                      </div>
                    </div>

                    <div className={styles.right}>
                      {(status.live || status.final) && game.awayTeam.score !== null && (
                        <div className={styles.score}>
                          <span className={awayWon ? styles.winScore : ''}>{game.awayTeam.score}</span>
                          <span className={styles.scoreDash}>–</span>
                          <span className={homeWon ? styles.winScore : ''}>{game.homeTeam.score}</span>
                        </div>
                      )}
                      <div className={styles.info}>
                        <span className={status.live ? styles.liveStatus : status.final ? styles.finalStatus : styles.timeStatus}>
                          {status.live && <span className={styles.liveDot} />}
                          {status.text}
                        </span>
                        {!status.live && !status.final && game.tvBroadcaster && (
                          <span className={styles.tv}>{game.tvBroadcaster}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
