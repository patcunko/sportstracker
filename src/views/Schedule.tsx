import { useState, useMemo } from 'react'
import { useSchedule } from '../hooks/useNHL'
import type { Game } from '../api/nhl'
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

function formatTime(utc: string): string {
  return new Date(utc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function teamDisplayName(team: Game['awayTeam']): string {
  return team.commonName?.default ?? team.name?.default ?? team.abbrev
}

function gameStatusLabel(game: Game): { text: string; live: boolean; final: boolean } {
  switch (game.gameState) {
    case 'LIVE':
    case 'CRIT': {
      const pd = game.periodDescriptor
      const clock = game.clock
      if (!pd) return { text: 'Live', live: true, final: false }
      const period = pd.periodType === 'SO' ? 'SO'
        : pd.periodType === 'OT' ? 'OT'
        : `P${pd.number}`
      const time = clock ? (clock.inIntermission ? 'INT' : clock.timeRemaining) : ''
      return { text: `${period} ${time}`.trim(), live: true, final: false }
    }
    case 'FINAL':
    case 'OFF': {
      const oc = game.gameOutcome?.lastPeriodType
      return { text: oc === 'OT' ? 'Final/OT' : oc === 'SO' ? 'Final/SO' : 'Final', live: false, final: true }
    }
    default:
      return { text: formatTime(game.startTimeUTC), live: false, final: false }
  }
}

export default function Schedule() {
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const { gameWeek, loading, error } = useSchedule(startDate)

  const isCurrentWeek = startDate === undefined
  const weekStart = gameWeek[0]?.date
  const weekEnd = gameWeek[gameWeek.length - 1]?.date

  const allTeams = useMemo(() => {
    const set = new Map<string, string>()
    for (const day of gameWeek) {
      for (const g of day.games) {
        set.set(g.awayTeam.abbrev, teamDisplayName(g.awayTeam))
        set.set(g.homeTeam.abbrev, teamDisplayName(g.homeTeam))
      }
    }
    return [...set.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [gameWeek])

  const filteredWeek = useMemo(() =>
    gameWeek
      .map(day => ({
        ...day,
        games: selectedTeam === 'all'
          ? day.games
          : day.games.filter(g => g.awayTeam.abbrev === selectedTeam || g.homeTeam.abbrev === selectedTeam),
      }))
      .filter(day => day.games.length > 0),
    [gameWeek, selectedTeam]
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
            onClick={() => weekStart && setStartDate(addDays(weekStart, -7))}
          >‹</button>
          <button
            className={`${styles.thisWeekBtn} ${isCurrentWeek ? styles.active : ''}`}
            onClick={() => setStartDate(undefined)}
          >This Week</button>
          <button
            className={styles.navBtn}
            disabled={loading}
            onClick={() => weekEnd && setStartDate(addDays(weekEnd, 1))}
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
                  <div key={game.id} className={`${styles.row} ${status.live ? styles.liveRow : ''}`}>
                    <div className={styles.teams}>
                      <div className={styles.teamInline}>
                        <img src={game.awayTeam.logo} alt={game.awayTeam.abbrev} className={styles.logo} />
                        <span className={`${styles.abbrev} ${awayWon ? styles.winner : ''}`}>{game.awayTeam.abbrev}</span>
                        <span className={styles.name}>{teamDisplayName(game.awayTeam)}</span>
                      </div>
                      <span className={styles.at}>@</span>
                      <div className={styles.teamInline}>
                        <img src={game.homeTeam.logo} alt={game.homeTeam.abbrev} className={styles.logo} />
                        <span className={`${styles.abbrev} ${homeWon ? styles.winner : ''}`}>{game.homeTeam.abbrev}</span>
                        <span className={styles.name}>{teamDisplayName(game.homeTeam)}</span>
                      </div>
                    </div>

                    <div className={styles.right}>
                      {(status.live || status.final) && game.awayTeam.score !== undefined && (
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
                        {!status.live && !status.final && game.tvBroadcasts?.length > 0 && (
                          <span className={styles.tv}>
                            {[...new Set(game.tvBroadcasts.filter(b => b.countryCode === 'US' || b.market === 'N').map(b => b.network))].slice(0, 2).join(' · ')}
                          </span>
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
