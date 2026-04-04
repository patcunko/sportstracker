import { useState } from 'react'
import { useStandings, useTeamSchedule, useTeamStats, useTeamRookies } from '../hooks/useNHL'
import type { StandingsTeam, Game } from '../hooks/useNHL'
import type { ClubSkater, ClubGoalie, NHLRookiePlayer } from '../api/nhl'
import styles from './NHLTeams.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────────


function formatGameDate(utc: string): string {
  const d = new Date(utc)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatGameTime(utc: string): string {
  const d = new Date(utc)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function outcomeLabel(game: Game): string {
  const t = game.gameOutcome?.lastPeriodType
  if (t === 'OT') return ' OT'
  if (t === 'SO') return ' SO'
  return ''
}

function streakColor(streak: string): string {
  if (streak.startsWith('W')) return styles.streakW
  if (streak.startsWith('L')) return styles.streakL
  return ''
}

// ── Team Grid ──────────────────────────────────────────────────────────────────

function TeamCard({ team, onClick }: { team: StandingsTeam; onClick: () => void }) {
  const record = `${team.wins}-${team.losses}-${team.otLosses}`
  const streak = `${team.streakCode}${team.streakCount}`
  return (
    <div className={styles.teamCard} onClick={onClick}>
      <img src={team.teamLogo} alt={team.teamAbbrev.default} className={styles.teamLogo} />
      <div className={styles.teamCardBottom}>
        <div className={styles.teamName}>{team.teamAbbrev.default}</div>
        <div className={styles.teamMeta}>{record}</div>
        <div className={`${styles.teamStreak} ${streakColor(streak)}`}>{streak}</div>
      </div>
    </div>
  )
}

function TeamGrid({ standings, onSelect }: { standings: StandingsTeam[]; onSelect: (abbrev: string) => void }) {
  const sorted = [...standings].sort((a, b) =>
    a.teamName.default.localeCompare(b.teamName.default)
  )

  return (
    <div className={styles.teamsCardGrid}>
      {sorted.map(team => (
        <TeamCard
          key={team.teamAbbrev.default}
          team={team}
          onClick={() => onSelect(team.teamAbbrev.default)}
        />
      ))}
    </div>
  )
}

// ── Schedule Section ───────────────────────────────────────────────────────────

function ScheduleSection({ games, abbrev }: { games: Game[]; abbrev: string }) {
  const done = games
    .filter(g => g.gameState === 'FINAL' || g.gameState === 'OFF')
    .slice(-5)
  const upcoming = games
    .filter(g => g.gameState === 'FUT' || g.gameState === 'PRE')
    .slice(0, 5)

  function GameRow({ game }: { game: Game }) {
    const isHome = game.homeTeam.abbrev === abbrev
    const opponent = isHome ? game.awayTeam : game.homeTeam
    const myScore = isHome ? game.homeTeam.score : game.awayTeam.score
    const oppScore = isHome ? game.awayTeam.score : game.homeTeam.score
    const isDone = game.gameState === 'FINAL' || game.gameState === 'OFF'
    const won = isDone && (myScore ?? 0) > (oppScore ?? 0)
    const resultClass = isDone ? (won ? styles.scheduleW : styles.scheduleL) : styles.scheduleTime

    return (
      <div className={styles.scheduleRow}>
        <span className={styles.scheduleDate}>
          {isDone ? formatGameDate(game.startTimeUTC) : formatGameDate(game.startTimeUTC)}
        </span>
        <div className={styles.scheduleOpponent}>
          <span className={styles.scheduleLoc}>{isHome ? 'vs' : '@'}</span>
          <img src={opponent.logo} alt={opponent.abbrev} className={styles.scheduleOpponentLogo} />
          <span className={styles.scheduleOpponentAbbrev}>{opponent.abbrev}</span>
        </div>
        <span className={`${styles.scheduleResult} ${resultClass}`}>
          {isDone
            ? `${won ? 'W' : 'L'} ${myScore}–${oppScore}${outcomeLabel(game)}`
            : formatGameTime(game.startTimeUTC)}
        </span>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Schedule</div>
      <div className={styles.scheduleRows}>
        {done.map(g => <GameRow key={g.id} game={g} />)}
        {upcoming.length > 0 && (
          <>
            <div className={styles.scheduleDivider}>Upcoming</div>
            {upcoming.map(g => <GameRow key={g.id} game={g} />)}
          </>
        )}
      </div>
    </div>
  )
}

// ── Leaders Section ────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 8

function LeadersSection({ skaters, goalies, rookies }: {
  skaters: ClubSkater[]
  goalies: ClubGoalie[]
  rookies: NHLRookiePlayer[]
}) {
  const [tab, setTab] = useState<'skaters' | 'goalies' | 'rookies'>('skaters')
  const [showAll, setShowAll] = useState(false)

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Team Leaders</div>

      <div className={styles.leadersTabs}>
        {(['skaters', 'goalies', 'rookies'] as const).map(t => (
          <button
            key={t}
            className={`${styles.leadersTab} ${tab === t ? styles.leadersTabActive : ''}`}
            onClick={() => { setTab(t); setShowAll(false) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        {tab === 'skaters' && (() => {
          const visible = showAll ? skaters : skaters.slice(0, DEFAULT_LIMIT)
          return (
            <>
              <table className={styles.leadersTable}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>GP</th>
                    <th>G</th>
                    <th>A</th>
                    <th>PTS</th>
                    <th>+/-</th>
                    <th>PPG</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(p => (
                    <tr key={p.playerId}>
                      <td>
                        <div className={styles.playerCell}>
                          <img src={`https://assets.nhle.com/mugs/nhl/20252026/${p.teamAbbrevs}/${p.playerId}.png`} alt="" className={styles.playerHeadshot} />
                          <span className={styles.playerName}>{p.skaterFullName}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left' }}><span className={styles.playerPos}>{p.positionCode}</span></td>
                      <td>{p.gamesPlayed}</td>
                      <td>{p.goals}</td>
                      <td>{p.assists}</td>
                      <td className={styles.bold}>{p.points}</td>
                      <td style={{ color: p.plusMinus > 0 ? 'var(--win)' : p.plusMinus < 0 ? 'var(--loss)' : undefined }}>
                        {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
                      </td>
                      <td>{p.ppGoals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {skaters.length > DEFAULT_LIMIT && (
                <button className={styles.viewAllBtn} onClick={() => setShowAll(v => !v)}>
                  {showAll ? 'Show less' : `View all ${skaters.length} skaters`}
                </button>
              )}
            </>
          )
        })()}

        {tab === 'goalies' && (() => {
          const visible = showAll ? goalies : goalies.slice(0, DEFAULT_LIMIT)
          return (
            <>
              <table className={styles.leadersTable}>
                <thead>
                  <tr>
                    <th>Goalie</th>
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
                  {visible.map(g => (
                    <tr key={g.playerId}>
                      <td>
                        <div className={styles.playerCell}>
                          <img src={`https://assets.nhle.com/mugs/nhl/20252026/${g.teamAbbrevs}/${g.playerId}.png`} alt="" className={styles.playerHeadshot} />
                          <span className={styles.playerName}>{g.goalieFullName}</span>
                        </div>
                      </td>
                      <td>{g.gamesPlayed}</td>
                      <td className={styles.bold}>{g.wins}</td>
                      <td>{g.losses}</td>
                      <td>{g.otLosses}</td>
                      <td>{g.goalsAgainstAverage.toFixed(2)}</td>
                      <td>{g.savePct.toFixed(3).replace(/^0/, '')}</td>
                      <td>{g.shutouts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {goalies.length > DEFAULT_LIMIT && (
                <button className={styles.viewAllBtn} onClick={() => setShowAll(v => !v)}>
                  {showAll ? 'Show less' : `View all ${goalies.length} goalies`}
                </button>
              )}
            </>
          )
        })()}

        {tab === 'rookies' && (() => {
          if (rookies.length === 0) return <p style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: 13 }}>No rookies on this team.</p>
          const visible = showAll ? rookies : rookies.slice(0, DEFAULT_LIMIT)
          return (
            <>
              <table className={styles.leadersTable}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>GP</th>
                    <th>G</th>
                    <th>A</th>
                    <th>PTS</th>
                    <th>+/-</th>
                    <th>PPG</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(p => (
                    <tr key={p.playerId}>
                      <td>
                        <div className={styles.playerCell}>
                          <img src={`https://assets.nhle.com/mugs/nhl/20252026/${p.teamAbbrevs}/${p.playerId}.png`} alt="" className={styles.playerHeadshot} />
                          <span className={styles.playerName}>{p.skaterFullName}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left' }}><span className={styles.playerPos}>{p.positionCode}</span></td>
                      <td>{p.gamesPlayed}</td>
                      <td>{p.goals}</td>
                      <td>{p.assists}</td>
                      <td className={styles.bold}>{p.points}</td>
                      <td style={{ color: p.plusMinus > 0 ? 'var(--win)' : p.plusMinus < 0 ? 'var(--loss)' : undefined }}>
                        {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
                      </td>
                      <td>{p.ppGoals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rookies.length > DEFAULT_LIMIT && (
                <button className={styles.viewAllBtn} onClick={() => setShowAll(v => !v)}>
                  {showAll ? 'Show less' : `View all ${rookies.length} rookies`}
                </button>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}

// ── Division Standings Section ─────────────────────────────────────────────────

function DivisionStandingsSection({ standings, abbrev }: { standings: StandingsTeam[]; abbrev: string }) {
  const team = standings.find(t => t.teamAbbrev.default === abbrev)
  if (!team) return null

  const divTeams = standings
    .filter(t => t.divisionName === team.divisionName)
    .sort((a, b) => b.points - a.points || b.wins - a.wins)

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{team.divisionName} Division Standings</div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.standingsTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>GP</th>
              <th>W</th>
              <th>L</th>
              <th>OTL</th>
              <th>PTS</th>
              <th>GF</th>
              <th>GA</th>
              <th>DIFF</th>
              <th>L10</th>
              <th>STK</th>
            </tr>
          </thead>
          <tbody>
            {divTeams.map((t, i) => {
              const isThis = t.teamAbbrev.default === abbrev
              const l10 = `${t.l10Wins}-${t.l10Losses}-${t.l10OtLosses}`
              const streak = `${t.streakCode}${t.streakCount}`
              return (
                <tr key={t.teamAbbrev.default} className={isThis ? styles.highlight : ''}>
                  <td className={styles.rankCell}>{i + 1}</td>
                  <td>
                    <div className={styles.teamAbbrevCell}>
                      <img src={t.teamLogo} alt="" className={styles.teamLogoSmall} />
                      <span className={styles.teamAbbrevText}>{t.teamAbbrev.default}</span>
                    </div>
                  </td>
                  <td>{t.gamesPlayed}</td>
                  <td>{t.wins}</td>
                  <td>{t.losses}</td>
                  <td>{t.otLosses}</td>
                  <td className={styles.ptsCell}>{t.points}</td>
                  <td>{t.goalFor}</td>
                  <td>{t.goalAgainst}</td>
                  <td style={{ color: t.goalDifferential > 0 ? 'var(--win)' : t.goalDifferential < 0 ? 'var(--loss)' : undefined }}>
                    {t.goalDifferential > 0 ? `+${t.goalDifferential}` : t.goalDifferential}
                  </td>
                  <td>{l10}</td>
                  <td>{streak}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Team Detail Page ───────────────────────────────────────────────────────────

function TeamDetail({ abbrev, standings, onBack }: {
  abbrev: string
  standings: StandingsTeam[]
  onBack: () => void
}) {
  const { games, loading: schedLoading } = useTeamSchedule(abbrev)
  const { stats, loading: statsLoading } = useTeamStats(abbrev)
  const { rookies, loading: rookiesLoading } = useTeamRookies(abbrev)
  const team = standings.find(t => t.teamAbbrev.default === abbrev)

  const isLoading = schedLoading || statsLoading || rookiesLoading

  if (!team) return null

  const record = `${team.wins}-${team.losses}-${team.otLosses}`

  return (
    <div>
      <button className={styles.backBtn} onClick={onBack}>
        ‹ All Teams
      </button>

      <div className={styles.detailHeader}>
        <img src={team.teamLogo} alt={abbrev} className={styles.detailLogo} />
        <div className={styles.detailTeamInfo}>
          <div className={styles.detailTeamName}>{team.teamName.default}</div>
          <div className={styles.detailTeamSub}>{team.divisionName} Division · {team.conferenceName} Conference</div>
          <div className={styles.detailStats}>
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.points}</span>
              <span className={styles.detailStatLabel}>PTS</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{record}</span>
              <span className={styles.detailStatLabel}>W-L-OT</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.goalFor}</span>
              <span className={styles.detailStatLabel}>GF</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.goalAgainst}</span>
              <span className={styles.detailStatLabel}>GA</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal} style={{ color: team.goalDifferential > 0 ? 'var(--win)' : team.goalDifferential < 0 ? 'var(--loss)' : undefined }}>
                {team.goalDifferential > 0 ? `+${team.goalDifferential}` : team.goalDifferential}
              </span>
              <span className={styles.detailStatLabel}>DIFF</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.homeWins}-{team.homeLosses}-{team.homeOtLosses}</span>
              <span className={styles.detailStatLabel}>HOME</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.roadWins}-{team.roadLosses}-{team.roadOtLosses}</span>
              <span className={styles.detailStatLabel}>AWAY</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={`${styles.detailStatVal} ${streakColor(`${team.streakCode}${team.streakCount}`)}`}>
                {team.streakCode}{team.streakCount}
              </span>
              <span className={styles.detailStatLabel}>STREAK</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.center}><div className={styles.spinner} /></div>
      ) : (
        <div className={styles.sections}>
          {games.length > 0 && <ScheduleSection games={games} abbrev={abbrev} />}
          {stats && stats.skaters.length > 0 && (
            <LeadersSection skaters={stats.skaters} goalies={stats.goalies} rookies={rookies} />
          )}
          <DivisionStandingsSection standings={standings} abbrev={abbrev} />
        </div>
      )}
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function NHLTeams() {
  const { standings, loading, error } = useStandings()
  const [selectedAbbrev, setSelectedAbbrev] = useState<string | null>(null)

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Loading teams…</p>
      </div>
    )
  }

  if (error) return <div className={styles.error}>⚠ {error}</div>

  return (
    <div className={styles.container}>
      {selectedAbbrev ? (
        <TeamDetail
          abbrev={selectedAbbrev}
          standings={standings}
          onBack={() => setSelectedAbbrev(null)}
        />
      ) : (
        <TeamGrid standings={standings} onSelect={setSelectedAbbrev} />
      )}
    </div>
  )
}
