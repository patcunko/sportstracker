import { useEffect } from 'react'
import { usePlayerLanding } from '../hooks/useNHL'
import type { PlayerSeasonStats } from '../api/nhl'
import styles from './NHLPlayerModal.module.css'

interface Props {
  playerId: number | null
  onClose: () => void
}

function fmtSeason(s: number): string {
  const y1 = String(s).slice(0, 4)
  const y2 = String(s).slice(6)
  return `${y1}-${y2}`
}

function fmtHeight(cm: number): string {
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function isGoalie(position: string): boolean {
  return position === 'G'
}

function SkaterStatStrip({ stats }: { stats: Record<string, number> }) {
  const items = [
    { label: 'GP', val: stats['gamesPlayed'] ?? 0 },
    { label: 'G', val: stats['goals'] ?? 0 },
    { label: 'A', val: stats['assists'] ?? 0 },
    { label: 'PTS', val: stats['points'] ?? 0 },
    { label: '+/-', val: stats['plusMinus'] > 0 ? `+${stats['plusMinus']}` : stats['plusMinus'] },
    { label: 'PPG', val: stats['powerPlayGoals'] ?? 0 },
    { label: 'SHG', val: stats['shorthandedGoals'] ?? 0 },
  ]
  return (
    <div className={styles.statStrip}>
      {items.map(i => (
        <div key={i.label} className={styles.statBox}>
          <span className={styles.statVal}>{i.val}</span>
          <span className={styles.statLabel}>{i.label}</span>
        </div>
      ))}
    </div>
  )
}

function GoalieStatStrip({ stats }: { stats: Record<string, number> }) {
  const items = [
    { label: 'GP', val: stats['gamesPlayed'] ?? 0 },
    { label: 'W', val: stats['wins'] ?? 0 },
    { label: 'L', val: stats['losses'] ?? 0 },
    { label: 'OTL', val: stats['otLosses'] ?? 0 },
    { label: 'GAA', val: (stats['goalsAgainstAverage'] ?? 0).toFixed(2) },
    { label: 'SV%', val: (stats['savePctg'] ?? 0).toFixed(3).replace(/^0/, '') },
    { label: 'SO', val: stats['shutouts'] ?? 0 },
  ]
  return (
    <div className={styles.statStrip}>
      {items.map(i => (
        <div key={i.label} className={styles.statBox}>
          <span className={styles.statVal}>{i.val}</span>
          <span className={styles.statLabel}>{i.label}</span>
        </div>
      ))}
    </div>
  )
}

function SkaterHistoryTable({ seasons, currentSeason }: { seasons: PlayerSeasonStats[]; currentSeason: number }) {
  const nhlSeasons = seasons
    .filter(s => s.gameTypeId === 2 && s.leagueAbbrev === 'NHL')
    .sort((a, b) => b.season - a.season)

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Season</th>
          <th>Team</th>
          <th>GP</th>
          <th>G</th>
          <th>A</th>
          <th>PTS</th>
          <th>+/-</th>
          <th>PPG</th>
          <th>SHG</th>
        </tr>
      </thead>
      <tbody>
        {nhlSeasons.map((s, i) => (
          <tr key={i} className={s.season === currentSeason ? styles.currentSeasonRow : ''}>
            <td><span className={styles.seasonStr}>{fmtSeason(s.season)}</span></td>
            <td><span className={styles.teamStr}>{s.teamName?.default ?? '—'}</span></td>
            <td>{s.gamesPlayed}</td>
            <td>{s.goals ?? 0}</td>
            <td>{s.assists ?? 0}</td>
            <td className={styles.boldCell}>{s.points ?? 0}</td>
            <td style={{ color: (s.plusMinus ?? 0) > 0 ? 'var(--win)' : (s.plusMinus ?? 0) < 0 ? 'var(--loss)' : undefined }}>
              {(s.plusMinus ?? 0) > 0 ? `+${s.plusMinus}` : s.plusMinus ?? 0}
            </td>
            <td>{s.powerPlayGoals ?? 0}</td>
            <td>{s.shorthandedGoals ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function GoalieHistoryTable({ seasons, currentSeason }: { seasons: PlayerSeasonStats[]; currentSeason: number }) {
  const nhlSeasons = seasons
    .filter(s => s.gameTypeId === 2 && s.leagueAbbrev === 'NHL')
    .sort((a, b) => b.season - a.season)

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Season</th>
          <th>Team</th>
          <th>GP</th>
          <th>W</th>
          <th>L</th>
          <th>OTL</th>
          <th>GAA</th>
          <th>SV%</th>
          <th>SO</th>
        </tr>
      </thead>
      <tbody>
        {nhlSeasons.map((s, i) => (
          <tr key={i} className={s.season === currentSeason ? styles.currentSeasonRow : ''}>
            <td><span className={styles.seasonStr}>{fmtSeason(s.season)}</span></td>
            <td><span className={styles.teamStr}>{s.teamName?.default ?? '—'}</span></td>
            <td>{s.gamesPlayed}</td>
            <td className={styles.boldCell}>{s.wins ?? 0}</td>
            <td>{s.losses ?? 0}</td>
            <td>{s.otLosses ?? 0}</td>
            <td>{(s.goalsAgainstAverage ?? 0).toFixed(2)}</td>
            <td>{(s.savePctg ?? 0).toFixed(3).replace(/^0/, '')}</td>
            <td>{s.shutouts ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function NHLPlayerModal({ playerId, onClose }: Props) {
  const { player, loading, error } = usePlayerLanding(playerId)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!playerId) return null

  const goalie = player ? isGoalie(player.position) : false
  const currentSeason = player?.featuredStats?.season ?? 0
  const currentStats = player?.featuredStats?.regularSeason?.subSeason ?? {}

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {loading && (
          <div className={styles.center}>
            <div className={styles.spinner} />
            <p>Loading player…</p>
          </div>
        )}

        {error && <div className={styles.error}>⚠ {error}</div>}

        {player && (
          <>
            {/* Hero */}
            <div className={styles.hero}>
              <img src={player.headshot} alt="" className={styles.headshot} />
              <div className={styles.playerInfo}>
                <div className={styles.playerName}>
                  {player.firstName.default} {player.lastName.default}
                </div>
                <div className={styles.playerMeta}>
                  {player.teamLogo && <img src={player.teamLogo} alt="" className={styles.teamLogo} />}
                  {player.fullTeamName && <span className={styles.metaText}>{player.fullTeamName.default}</span>}
                  {player.fullTeamName && <span className={styles.metaDot}>·</span>}
                  <span className={styles.metaText}>{player.position}</span>
                  {player.sweaterNumber && (
                    <>
                      <span className={styles.metaDot}>·</span>
                      <span className={styles.jerseyBadge}>#{player.sweaterNumber}</span>
                    </>
                  )}
                </div>
                <div className={styles.bioGrid}>
                  {player.birthDate && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{new Date(player.birthDate).getFullYear()}</span>
                      <span className={styles.bioLabel}>Born</span>
                    </div>
                  )}
                  {player.heightInCm && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{fmtHeight(player.heightInCm)}</span>
                      <span className={styles.bioLabel}>Height</span>
                    </div>
                  )}
                  {player.weightInKg && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{Math.round(player.weightInKg * 2.205)} lbs</span>
                      <span className={styles.bioLabel}>Weight</span>
                    </div>
                  )}
                  {player.birthCountry && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{player.birthCountry}</span>
                      <span className={styles.bioLabel}>Country</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current season */}
            {Object.keys(currentStats).length > 0 && (
              <div className={styles.currentSeason}>
                <div className={styles.currentSeasonLabel}>
                  {fmtSeason(currentSeason)} Season
                </div>
                {goalie
                  ? <GoalieStatStrip stats={currentStats} />
                  : <SkaterStatStrip stats={currentStats} />
                }
              </div>
            )}

            {/* Career history */}
            {player.seasonTotals && player.seasonTotals.length > 0 && (
              <div className={styles.historySection}>
                <div className={styles.historyTitle}>NHL Season History</div>
                <div style={{ overflowX: 'auto' }}>
                  {goalie
                    ? <GoalieHistoryTable seasons={player.seasonTotals} currentSeason={currentSeason} />
                    : <SkaterHistoryTable seasons={player.seasonTotals} currentSeason={currentSeason} />
                  }
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
