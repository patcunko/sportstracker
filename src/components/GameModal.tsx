import { useEffect, useState } from 'react'
import { useBoxscore, useLanding } from '../hooks/useNHL'
import type { BoxscoreSkater, BoxscoreGoalie, LandingPenalty } from '../api/nhl'
import styles from './GameModal.module.css'

interface Props {
  gameId: number | null
  onClose: () => void
}

type Tab = 'skaters' | 'goalies' | 'penalties'

function periodLabel(number: number, periodType: string): string {
  if (periodType === 'SO') return 'Shootout'
  if (periodType === 'OT') return `OT${number > 4 ? number - 3 : ''}`
  return `P${number}`
}

function formatSavePctg(val: number): string {
  return val.toFixed(3).replace(/^0/, '')
}

function formatPlusMinus(val: number): string {
  if (val > 0) return `+${val}`
  return String(val)
}

function sortSkaters(skaters: BoxscoreSkater[]): BoxscoreSkater[] {
  return [...skaters].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.goals - a.goals
  })
}

function SkaterTable({ skaters, teamAbbrev, teamName }: {
  skaters: BoxscoreSkater[]
  teamAbbrev: string
  teamName: string
}) {
  const sorted = sortSkaters(skaters)
  return (
    <div className={styles.teamSection}>
      <div className={styles.teamLabel}>{teamAbbrev} — {teamName}</div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNum}>#</th>
              <th className={styles.thPlayer}>Player</th>
              <th>Pos</th>
              <th>G</th>
              <th>A</th>
              <th>PTS</th>
              <th>+/-</th>
              <th>SOG</th>
              <th>HIT</th>
              <th>BLK</th>
              <th>TOI</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => (
              <tr key={s.playerId}>
                <td className={styles.tdNum}>{s.sweaterNumber}</td>
                <td className={styles.tdPlayer}>{s.name.default}</td>
                <td>{s.position}</td>
                <td>{s.goals}</td>
                <td>{s.assists}</td>
                <td className={styles.tdPts}>{s.points}</td>
                <td className={s.plusMinus > 0 ? styles.plus : s.plusMinus < 0 ? styles.minus : ''}>
                  {formatPlusMinus(s.plusMinus)}
                </td>
                <td>{s.sog}</td>
                <td>{s.hits}</td>
                <td>{s.blockedShots}</td>
                <td className={styles.tdToi}>{s.toi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GoalieTable({ goalies, teamAbbrev, teamName }: {
  goalies: BoxscoreGoalie[]
  teamAbbrev: string
  teamName: string
}) {
  return (
    <div className={styles.teamSection}>
      <div className={styles.teamLabel}>{teamAbbrev} — {teamName}</div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNum}>#</th>
              <th className={styles.thPlayer}>Player</th>
              <th>SA</th>
              <th>SV</th>
              <th>GA</th>
              <th>SV%</th>
              <th>TOI</th>
            </tr>
          </thead>
          <tbody>
            {goalies.map(g => (
              <tr key={g.playerId}>
                <td className={styles.tdNum}>{g.sweaterNumber}</td>
                <td className={styles.tdPlayer}>{g.name.default}</td>
                <td>{g.shotsAgainst}</td>
                <td>{g.saves}</td>
                <td>{g.goalsAgainst}</td>
                <td>{formatSavePctg(g.savePctg)}</td>
                <td className={styles.tdToi}>{g.toi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function penaltyPlayerName(p: { firstName: { default: string }; lastName: { default: string }; sweaterNumber: number }): string {
  return `#${p.sweaterNumber} ${p.firstName.default} ${p.lastName.default}`
}

function PenaltiesTab({ gameId }: { gameId: number }) {
  const { landing } = useLanding(gameId)

  const situation = landing?.situation
  const onPP = situation && (
    (situation.awayTeam.situationDescriptions ?? []).includes('PP') ||
    (situation.homeTeam.situationDescriptions ?? []).includes('PP')
  )

  const periods = landing?.summary?.penalties ?? []

  return (
    <div className={styles.penaltiesContent}>
      {onPP && situation && (
        <div className={styles.ppBanner}>
          <span className={styles.ppLabel}>POWER PLAY</span>
          <span className={styles.ppTeams}>
            {(situation.awayTeam.situationDescriptions ?? []).includes('PP')
              ? `${situation.awayTeam.abbrev} (${situation.awayTeam.strength}v${situation.homeTeam.strength})`
              : `${situation.homeTeam.abbrev} (${situation.homeTeam.strength}v${situation.awayTeam.strength})`
            }
          </span>
          <span className={styles.ppTime}>{situation.timeRemaining} remaining</span>
        </div>
      )}

      {periods.length === 0 && (
        <p className={styles.noPenalties}>No penalties recorded yet.</p>
      )}

      {periods.map(period => (
        <div key={period.periodDescriptor.number} className={styles.penaltyPeriod}>
          <h3 className={styles.penaltyPeriodTitle}>
            {periodLabel(period.periodDescriptor.number, period.periodDescriptor.periodType)}
          </h3>
          {period.penalties.map((pen: LandingPenalty, i: number) => (
            <div key={i} className={styles.penaltyRow}>
              <span className={styles.penTime}>{pen.timeInPeriod}</span>
              <span className={styles.penTeam}>{pen.teamAbbrev.default}</span>
              <div className={styles.penDetail}>
                <span className={styles.penInfraction}>
                  {pen.descKey.replace(/-/g, ' ')}
                  {' '}<span className={styles.penDuration}>({pen.duration} min)</span>
                </span>
                {pen.committedByPlayer && (
                  <span className={styles.penPlayer}>{penaltyPlayerName(pen.committedByPlayer)}</span>
                )}
                {pen.drawnBy && (
                  <span className={styles.penDrawn}>Drawn by {penaltyPlayerName(pen.drawnBy)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function GameModal({ gameId, onClose }: Props) {
  const { boxscore, loading, error } = useBoxscore(gameId)
  const [tab, setTab] = useState<Tab>('skaters')

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (gameId === null) return null

  const isLive = boxscore
    ? (boxscore.gameState === 'LIVE' || boxscore.gameState === 'CRIT')
    : false
  const isFinal = boxscore
    ? (boxscore.gameState === 'FINAL' || boxscore.gameState === 'OFF')
    : false

  function clockLabel(): string {
    if (!boxscore) return ''
    if (isFinal) {
      const lastPeriod = boxscore.periodDescriptor
      if (lastPeriod && lastPeriod.periodType !== 'REG') {
        return `Final/${lastPeriod.periodType === 'SO' ? 'SO' : 'OT'}`
      }
      return 'Final'
    }
    const pd = boxscore.periodDescriptor
    const cl = boxscore.clock
    if (!pd || !cl) return ''
    const period = periodLabel(pd.number, pd.periodType)
    const time = cl.inIntermission ? 'INT' : cl.timeRemaining
    return `${period} ${time}`.trim()
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
                  <span className={styles.scoreNum}>
                    {boxscore.awayTeam.score ?? '–'}
                  </span>
                  <span className={styles.scoreSep}>–</span>
                  <span className={styles.scoreNum}>
                    {boxscore.homeTeam.score ?? '–'}
                  </span>
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

            {/* SOG bar */}
            {(boxscore.awayTeam.sog != null || boxscore.homeTeam.sog != null) && (
              <div className={styles.sogBar}>
                <span className={styles.sogNum}>{boxscore.awayTeam.sog ?? 0}</span>
                <span className={styles.sogLabel}>SOG</span>
                <span className={styles.sogNum}>{boxscore.homeTeam.sog ?? 0}</span>
              </div>
            )}

            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === 'skaters' ? styles.tabActive : ''}`}
                onClick={() => setTab('skaters')}
              >Skaters</button>
              <button
                className={`${styles.tab} ${tab === 'goalies' ? styles.tabActive : ''}`}
                onClick={() => setTab('goalies')}
              >Goalies</button>
              <button
                className={`${styles.tab} ${tab === 'penalties' ? styles.tabActive : ''}`}
                onClick={() => setTab('penalties')}
              >Penalties</button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {!boxscore.playerByGameStats && (tab === 'skaters' || tab === 'goalies') && (
                <p className={styles.noStats}>No stats available yet.</p>
              )}

              {tab === 'skaters' && boxscore.playerByGameStats && (
                <>
                  <SkaterTable
                    skaters={[
                      ...boxscore.playerByGameStats.awayTeam.forwards,
                      ...boxscore.playerByGameStats.awayTeam.defense,
                    ]}
                    teamAbbrev={boxscore.awayTeam.abbrev}
                    teamName={boxscore.awayTeam.commonName.default}
                  />
                  <SkaterTable
                    skaters={[
                      ...boxscore.playerByGameStats.homeTeam.forwards,
                      ...boxscore.playerByGameStats.homeTeam.defense,
                    ]}
                    teamAbbrev={boxscore.homeTeam.abbrev}
                    teamName={boxscore.homeTeam.commonName.default}
                  />
                </>
              )}

              {tab === 'goalies' && boxscore.playerByGameStats && (
                <>
                  <GoalieTable
                    goalies={boxscore.playerByGameStats.awayTeam.goalies}
                    teamAbbrev={boxscore.awayTeam.abbrev}
                    teamName={boxscore.awayTeam.commonName.default}
                  />
                  <GoalieTable
                    goalies={boxscore.playerByGameStats.homeTeam.goalies}
                    teamAbbrev={boxscore.homeTeam.abbrev}
                    teamName={boxscore.homeTeam.commonName.default}
                  />
                </>
              )}

              {tab === 'penalties' && <PenaltiesTab gameId={boxscore.id} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
