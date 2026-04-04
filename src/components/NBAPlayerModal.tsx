import { useEffect } from 'react'
import { useNBAPlayer } from '../hooks/useNBA'
import styles from './NHLPlayerModal.module.css'

interface Props {
  playerId: number | null
  onClose: () => void
}

function nbaHeadshot(id: number) {
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${id}.png`
}

function fmtPct(v: number) {
  return v > 0 ? (v * 100).toFixed(1) + '%' : '–'
}

export default function NBAPlayerModal({ playerId, onClose }: Props) {
  const { info, career, loading, error } = useNBAPlayer(playerId)

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

  const currentSeason = career[0]

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

        {info && (
          <>
            {/* Hero */}
            <div className={styles.hero}>
              <img src={nbaHeadshot(playerId)} alt="" className={styles.headshot} />
              <div className={styles.playerInfo}>
                <div className={styles.playerName}>{info.firstName} {info.lastName}</div>
                <div className={styles.playerMeta}>
                  {info.logo && <img src={info.logo} alt="" className={styles.teamLogo} />}
                  {info.teamName && <span className={styles.metaText}>{info.teamName}</span>}
                  {info.position && <><span className={styles.metaDot}>·</span><span className={styles.metaText}>{info.position}</span></>}
                  {info.jerseyNum && <><span className={styles.metaDot}>·</span><span className={styles.jerseyBadge}>#{info.jerseyNum}</span></>}
                </div>
                <div className={styles.bioGrid}>
                  {info.birthdate && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{new Date(info.birthdate).getFullYear()}</span>
                      <span className={styles.bioLabel}>Born</span>
                    </div>
                  )}
                  {info.height && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{info.height}</span>
                      <span className={styles.bioLabel}>Height</span>
                    </div>
                  )}
                  {info.weight && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{info.weight} lbs</span>
                      <span className={styles.bioLabel}>Weight</span>
                    </div>
                  )}
                  {info.country && (
                    <div className={styles.bioStat}>
                      <span className={styles.bioVal}>{info.country}</span>
                      <span className={styles.bioLabel}>Country</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current season */}
            {currentSeason && (
              <div className={styles.currentSeason}>
                <div className={styles.currentSeasonLabel}>{currentSeason.season} Season</div>
                <div className={styles.statStrip}>
                  {[
                    { label: 'GP', val: currentSeason.gamesPlayed },
                    { label: 'PTS', val: currentSeason.points.toFixed(1) },
                    { label: 'REB', val: currentSeason.rebounds.toFixed(1) },
                    { label: 'AST', val: currentSeason.assists.toFixed(1) },
                    { label: 'STL', val: currentSeason.steals.toFixed(1) },
                    { label: 'BLK', val: currentSeason.blocks.toFixed(1) },
                    { label: 'FG%', val: fmtPct(currentSeason.fgPct) },
                  ].map(item => (
                    <div key={item.label} className={styles.statBox}>
                      <span className={styles.statVal}>{item.val}</span>
                      <span className={styles.statLabel}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career history */}
            {career.length > 0 && (
              <div className={styles.historySection}>
                <div className={styles.historyTitle}>NBA Season History</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Season</th>
                        <th>Team</th>
                        <th>GP</th>
                        <th>PTS</th>
                        <th>REB</th>
                        <th>AST</th>
                        <th>STL</th>
                        <th>BLK</th>
                        <th>FG%</th>
                        <th>3P%</th>
                        <th>FT%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {career.map((s, i) => (
                        <tr key={i} className={i === 0 ? styles.currentSeasonRow : ''}>
                          <td><span className={styles.seasonStr}>{s.season}</span></td>
                          <td><span className={styles.teamStr}>{s.teamAbbrev}</span></td>
                          <td>{s.gamesPlayed}</td>
                          <td className={styles.boldCell}>{s.points.toFixed(1)}</td>
                          <td>{s.rebounds.toFixed(1)}</td>
                          <td>{s.assists.toFixed(1)}</td>
                          <td>{s.steals.toFixed(1)}</td>
                          <td>{s.blocks.toFixed(1)}</td>
                          <td>{fmtPct(s.fgPct)}</td>
                          <td>{fmtPct(s.fg3Pct)}</td>
                          <td>{fmtPct(s.ftPct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
