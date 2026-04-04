import { useEffect, useState } from 'react'
import { useNBABoxscore } from '../hooks/useNBA'
import type { NBABoxscoreTeam } from '../api/nba'
import styles from './NBAGameModal.module.css'

interface Props {
  gameId: string | null
  onClose: () => void
}

type Tab = 'players' | 'teamstats'

function fmtPct(made: number, attempted: number): string {
  if (attempted === 0) return '–'
  return (made / attempted * 100).toFixed(1) + '%'
}

function fmtPlusMinus(val: number): string {
  if (val > 0) return `+${val}`
  return String(Math.round(val))
}

function periodLabel(period: number): string {
  if (period <= 4) return `Q${period}`
  return `OT${period > 5 ? period - 4 : ''}`
}

function PlayerTable({ team }: { team: NBABoxscoreTeam }) {
  const starters = team.players.filter(p => p.position !== '')
  const bench = [...team.players.filter(p => p.position === '')].sort((a, b) => b.points - a.points || b.assists - a.assists)

  function PlayerRow({ p }: { p: NBABoxscorePlayer }) {
    return (
      <tr key={p.personId} className={!p.played ? styles.dnp : ''}>
        <td className={styles.tdNum}>{p.jerseyNum}</td>
        <td className={styles.tdPlayer}>{p.name}</td>
        <td>{p.position || ''}</td>
        {!p.played ? (
          <td colSpan={11} style={{ textAlign: 'left', paddingLeft: 8 }}>DNP</td>
        ) : (
          <>
            <td>{p.minutesFormatted}</td>
            <td className={styles.tdPts}>{p.points}</td>
            <td>{p.rebounds}</td>
            <td>{p.assists}</td>
            <td>{p.steals}</td>
            <td>{p.blocks}</td>
            <td>{p.turnovers}</td>
            <td>{p.fgMade}/{p.fgAttempted}</td>
            <td>{p.fg3Made}/{p.fg3Attempted}</td>
            <td>{p.ftMade}/{p.ftAttempted}</td>
            <td className={p.plusMinus > 0 ? styles.plus : p.plusMinus < 0 ? styles.minus : ''}>
              {fmtPlusMinus(p.plusMinus)}
            </td>
          </>
        )}
      </tr>
    )
  }

  return (
    <div className={styles.teamSection}>
      <div className={styles.teamLabel}>{team.abbrev} — {team.teamCity} {team.teamName}</div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNum}>#</th>
              <th className={styles.thPlayer}>Player</th>
              <th>Pos</th>
              <th>Min</th>
              <th>Pts</th>
              <th>Reb</th>
              <th>Ast</th>
              <th>Stl</th>
              <th>Blk</th>
              <th>To</th>
              <th>FG</th>
              <th>3P</th>
              <th>FT</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {starters.map(p => <PlayerRow key={p.personId} p={p} />)}
            {bench.length > 0 && (
              <tr className={styles.benchDivider}>
                <td colSpan={14}>BENCH</td>
              </tr>
            )}
            {bench.map(p => <PlayerRow key={p.personId} p={p} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TeamStatsCard({ team }: { team: NBABoxscoreTeam }) {
  const s = team.statistics
  return (
    <div className={styles.teamStatsCard}>
      <div className={styles.teamStatsTitle}>
        <img src={team.logo} alt={team.abbrev} className={styles.teamStatsLogo} />
        {team.abbrev}
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>FG</span>
        <span className={styles.statNumber}>{s.fgMade}/{s.fgAttempted} ({fmtPct(s.fgMade, s.fgAttempted)})</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>3PT</span>
        <span className={styles.statNumber}>{s.fg3Made}/{s.fg3Attempted} ({fmtPct(s.fg3Made, s.fg3Attempted)})</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>FT</span>
        <span className={styles.statNumber}>{s.ftMade}/{s.ftAttempted} ({fmtPct(s.ftMade, s.ftAttempted)})</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>Rebounds</span>
        <span className={styles.statNumber}>{s.rebounds}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>Assists</span>
        <span className={styles.statNumber}>{s.assists}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>Steals</span>
        <span className={styles.statNumber}>{s.steals}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>Blocks</span>
        <span className={styles.statNumber}>{s.blocks}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statName}>Turnovers</span>
        <span className={styles.statNumber}>{s.turnovers}</span>
      </div>
    </div>
  )
}

export default function NBAGameModal({ gameId, onClose }: Props) {
  const { boxscore, loading, error } = useNBABoxscore(gameId)
  const [tab, setTab] = useState<Tab>('players')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (gameId === null) return null

  const isFinal = boxscore ? (boxscore.gameStatus === 3 || /^final/i.test(boxscore.gameStatusText)) : false
  const isLive = boxscore ? (!isFinal && !/[ap]m\b/i.test(boxscore.gameStatusText)) : false
  const hasStats = boxscore && (boxscore.homeTeam.players.some(p => p.played) || boxscore.awayTeam.players.some(p => p.played))

  function clockLabel(): string {
    if (!boxscore) return ''
    if (isFinal) return boxscore.gameStatusText
    if (!isLive) return ''
    const period = periodLabel(boxscore.period)
    return boxscore.gameClock ? `${period} ${boxscore.gameClock}` : period
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {loading && (
          <div className={styles.center}>
            <div className={styles.spinner} />
            <p>Loading boxscore…</p>
          </div>
        )}

        {error && (
          <div className={styles.center}>
            <p className={styles.errorMsg}>Failed to load boxscore: {error}</p>
          </div>
        )}

        {boxscore && (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.teamBlock}>
                <img src={boxscore.awayTeam.logo} alt={boxscore.awayTeam.abbrev} className={styles.headerLogo} />
                <span className={styles.headerAbbrev}>{boxscore.awayTeam.abbrev}</span>
              </div>

              <div className={styles.scoreBlock}>
                <div className={styles.scoreDisplay}>
                  <span className={styles.scoreNum}>{boxscore.awayTeam.score}</span>
                  <span className={styles.scoreSep}>–</span>
                  <span className={styles.scoreNum}>{boxscore.homeTeam.score}</span>
                </div>
                <div className={`${styles.clockLabel} ${isLive ? styles.liveLabel : ''}`}>
                  {isLive && <span className={styles.liveDot} />}
                  {clockLabel()}
                </div>
              </div>

              <div className={`${styles.teamBlock} ${styles.teamBlockRight}`}>
                <span className={styles.headerAbbrev}>{boxscore.homeTeam.abbrev}</span>
                <img src={boxscore.homeTeam.logo} alt={boxscore.homeTeam.abbrev} className={styles.headerLogo} />
              </div>
            </div>

            {/* Team stats bar */}
            {hasStats && (
              <div className={styles.statsBar}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{fmtPct(boxscore.awayTeam.statistics.fgMade, boxscore.awayTeam.statistics.fgAttempted)}</span>
                  <span className={styles.statLabel}>FG%</span>
                  <span className={styles.statVal}>{fmtPct(boxscore.homeTeam.statistics.fgMade, boxscore.homeTeam.statistics.fgAttempted)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{boxscore.awayTeam.statistics.rebounds}</span>
                  <span className={styles.statLabel}>REB</span>
                  <span className={styles.statVal}>{boxscore.homeTeam.statistics.rebounds}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{boxscore.awayTeam.statistics.assists}</span>
                  <span className={styles.statLabel}>AST</span>
                  <span className={styles.statVal}>{boxscore.homeTeam.statistics.assists}</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === 'players' ? styles.tabActive : ''}`}
                onClick={() => setTab('players')}
              >Players</button>
              <button
                className={`${styles.tab} ${tab === 'teamstats' ? styles.tabActive : ''}`}
                onClick={() => setTab('teamstats')}
              >Team Stats</button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {!hasStats && (
                <p className={styles.noStats}>No stats available yet.</p>
              )}

              {tab === 'players' && hasStats && (
                <>
                  <PlayerTable team={boxscore.awayTeam} />
                  <PlayerTable team={boxscore.homeTeam} />
                </>
              )}

              {tab === 'teamstats' && hasStats && (
                <div className={styles.teamStatsGrid}>
                  <TeamStatsCard team={boxscore.awayTeam} />
                  <TeamStatsCard team={boxscore.homeTeam} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
