import { useState } from 'react'
import { useNBAStandings, useNBATeamRoster } from '../hooks/useNBA'
import type { NBAStandingsTeam, NBATeamPlayer } from '../hooks/useNBA'
import NBAPlayerModal from '../components/NBAPlayerModal'
import styles from './NHLTeams.module.css'

const DEFAULT_LIMIT = 8

// ── Team Grid ──────────────────────────────────────────────────────────────────

function TeamCard({ team, onClick }: { team: NBAStandingsTeam; onClick: () => void }) {
  const streak = team.streak ?? ''
  const isW = streak.startsWith('W')
  const isL = streak.startsWith('L')
  return (
    <div className={styles.teamCard} onClick={onClick}>
      <img src={team.logo} alt={team.teamAbbrev} className={styles.teamLogo} />
      <div className={styles.teamCardBottom}>
        <div className={styles.teamName}>{team.teamAbbrev}</div>
        <div className={styles.teamMeta}>{team.wins}-{team.losses}</div>
        <div className={`${styles.teamStreak} ${isW ? styles.streakW : isL ? styles.streakL : ''}`}>{streak}</div>
      </div>
    </div>
  )
}

function TeamGrid({ standings, onSelect }: { standings: NBAStandingsTeam[]; onSelect: (id: number) => void }) {
  const sorted = [...standings].sort((a, b) =>
    `${a.teamCity} ${a.teamName}`.localeCompare(`${b.teamCity} ${b.teamName}`)
  )
  return (
    <div className={styles.teamsCardGrid}>
      {sorted.map(team => (
        <TeamCard key={team.teamId} team={team} onClick={() => onSelect(team.teamId)} />
      ))}
    </div>
  )
}

// ── Roster Section ─────────────────────────────────────────────────────────────

function RosterSection({ players, onPlayerClick }: { players: NBATeamPlayer[]; onPlayerClick: (id: number) => void }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? players : players.slice(0, DEFAULT_LIMIT)

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Roster Leaders</div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.leadersTable}>
          <thead>
            <tr>
              <th>Player</th>
              <th>GP</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>BLK</th>
              <th>FG%</th>
              <th>MIN</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(p => (
              <tr key={p.playerId} style={{ cursor: 'pointer' }} onClick={() => onPlayerClick(p.playerId)}>
                <td>
                  <div className={styles.playerCell}>
                    <img
                      src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.playerId}.png`}
                      alt=""
                      className={styles.playerHeadshot}
                    />
                    <span className={styles.playerName}>{p.playerName}</span>
                  </div>
                </td>
                <td>{p.gamesPlayed}</td>
                <td className={styles.bold}>{p.points.toFixed(1)}</td>
                <td>{p.rebounds.toFixed(1)}</td>
                <td>{p.assists.toFixed(1)}</td>
                <td>{p.steals.toFixed(1)}</td>
                <td>{p.blocks.toFixed(1)}</td>
                <td>{p.fgPct > 0 ? (p.fgPct * 100).toFixed(1) + '%' : '–'}</td>
                <td>{p.minutes.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {players.length > DEFAULT_LIMIT && (
        <button className={styles.viewAllBtn} onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show less' : `View all ${players.length} players`}
        </button>
      )}
    </div>
  )
}

// ── Conference Standings Section ───────────────────────────────────────────────

function ConferenceStandingsSection({ standings, teamId }: { standings: NBAStandingsTeam[]; teamId: number }) {
  const team = standings.find(t => t.teamId === teamId)
  if (!team) return null

  const confTeams = standings
    .filter(t => t.conference === team.conference)
    .sort((a, b) => a.conferenceRank - b.conferenceRank)

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{team.conference}ern Conference Standings</div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.standingsTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>PCT</th>
              <th>HOME</th>
              <th>AWAY</th>
              <th>L10</th>
              <th>STK</th>
            </tr>
          </thead>
          <tbody>
            {confTeams.map((t, i) => {
              const isThis = t.teamId === teamId
              const isPlayoff = i < 6
              const isPlayIn = i >= 6 && i < 10
              return (
                <tr key={t.teamId} className={isThis ? styles.highlight : ''}>
                  <td className={styles.rankCell}>{i + 1}</td>
                  <td>
                    <div className={styles.teamAbbrevCell}>
                      <img src={t.logo} alt="" className={styles.teamLogoSmall} />
                      <span className={styles.teamAbbrevText}>{t.teamAbbrev}</span>
                    </div>
                  </td>
                  <td className={styles.bold}>{t.wins}</td>
                  <td>{t.losses}</td>
                  <td className={styles.ptsCell}>{t.pct.toFixed(3).replace(/^0/, '')}</td>
                  <td>{t.homeRecord}</td>
                  <td>{t.roadRecord}</td>
                  <td>{t.l10}</td>
                  <td style={{ color: t.streak?.startsWith('W') ? 'var(--win)' : t.streak?.startsWith('L') ? 'var(--loss)' : undefined }}>
                    {t.streak}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Team Detail ────────────────────────────────────────────────────────────────

function TeamDetail({ teamId, standings, onBack }: {
  teamId: number
  standings: NBAStandingsTeam[]
  onBack: () => void
}) {
  const { players, loading } = useNBATeamRoster(teamId)
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
  const team = standings.find(t => t.teamId === teamId)

  if (!team) return null

  return (
    <div>
      {selectedPlayerId && <NBAPlayerModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />}

      <button className={styles.backBtn} onClick={onBack}>‹ All Teams</button>

      <div className={styles.detailHeader}>
        <img src={team.logo} alt={team.teamAbbrev} className={styles.detailLogo} />
        <div className={styles.detailTeamInfo}>
          <div className={styles.detailTeamName}>{team.teamCity} {team.teamName}</div>
          <div className={styles.detailTeamSub}>{team.division} Division · {team.conference}ern Conference</div>
          <div className={styles.detailStats}>
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.wins}-{team.losses}</span>
              <span className={styles.detailStatLabel}>RECORD</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.pct.toFixed(3).replace(/^0/, '')}</span>
              <span className={styles.detailStatLabel}>PCT</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>#{team.conferenceRank}</span>
              <span className={styles.detailStatLabel}>CONF</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.homeRecord}</span>
              <span className={styles.detailStatLabel}>HOME</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.roadRecord}</span>
              <span className={styles.detailStatLabel}>AWAY</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={styles.detailStatVal}>{team.l10}</span>
              <span className={styles.detailStatLabel}>L10</span>
            </div>
            <div className={styles.detailStatDivider} />
            <div className={styles.detailStat}>
              <span className={`${styles.detailStatVal} ${team.streak?.startsWith('W') ? styles.streakW : team.streak?.startsWith('L') ? styles.streakL : ''}`}>
                {team.streak}
              </span>
              <span className={styles.detailStatLabel}>STREAK</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.center}><div className={styles.spinner} /></div>
      ) : (
        <div className={styles.sections}>
          {players.length > 0 && <RosterSection players={players} onPlayerClick={setSelectedPlayerId} />}
          <ConferenceStandingsSection standings={standings} teamId={teamId} />
        </div>
      )}
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function NBATeams() {
  const { standings, loading, error } = useNBAStandings()
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

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
      {selectedTeamId ? (
        <TeamDetail
          teamId={selectedTeamId}
          standings={standings}
          onBack={() => setSelectedTeamId(null)}
        />
      ) : (
        <TeamGrid standings={standings} onSelect={setSelectedTeamId} />
      )}
    </div>
  )
}
