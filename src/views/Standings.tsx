import { useState } from 'react'
import { useStandings } from '../hooks/useNHL'
import type { StandingsTeam } from '../api/nhl'
import styles from './Standings.module.css'

type View = 'division' | 'conference' | 'league' | 'wildcard'

const DIVISIONS = ['Atlantic', 'Metropolitan', 'Central', 'Pacific']
const CONFERENCES: Record<string, string[]> = {
  Eastern: ['Atlantic', 'Metropolitan'],
  Western: ['Central', 'Pacific'],
}

function streak(team: StandingsTeam): string {
  return `${team.streakCode}${team.streakCount}`
}

function pctg(val: number): string {
  return val.toFixed(3).replace(/^0/, '')
}

interface TableProps {
  teams: StandingsTeam[]
  showWildcard?: boolean
  cutoff?: number
}

function StandingsTable({ teams, showWildcard, cutoff }: TableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rankCol}>#</th>
            <th className={styles.teamCol}>Team</th>
            <th>GP</th>
            <th>W</th>
            <th>L</th>
            <th>OTL</th>
            <th>PTS</th>
            <th className={styles.hide}>P%</th>
            <th className={styles.hide}>GF</th>
            <th className={styles.hide}>GA</th>
            <th className={styles.hide}>DIFF</th>
            <th className={styles.hide}>L10</th>
            <th>STRK</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr
              key={t.teamAbbrev.default}
              className={`
                ${showWildcard && i === cutoff ? styles.wildcardLine : ''}
                ${showWildcard && i < (cutoff ?? 3) ? styles.playoffSpot : ''}
              `}
            >
              <td className={styles.rank}>{i + 1}</td>
              <td>
                <div className={styles.teamCell}>
                  <img src={t.teamLogo} alt={t.teamAbbrev.default} className={styles.logo} />
                  <span className={styles.abbrev}>{t.teamAbbrev.default}</span>
                  <span className={styles.fullName}>{t.teamName.default}</span>
                </div>
              </td>
              <td>{t.gamesPlayed}</td>
              <td className={styles.bold}>{t.wins}</td>
              <td>{t.losses}</td>
              <td>{t.otLosses}</td>
              <td className={styles.pts}>{t.points}</td>
              <td className={styles.hide}>{pctg(t.pointPctg)}</td>
              <td className={styles.hide}>{t.goalFor}</td>
              <td className={styles.hide}>{t.goalAgainst}</td>
              <td className={`${styles.hide} ${t.goalDifferential > 0 ? styles.pos : t.goalDifferential < 0 ? styles.neg : ''}`}>
                {t.goalDifferential > 0 ? '+' : ''}{t.goalDifferential}
              </td>
              <td className={styles.hide}>{t.l10Wins}-{t.l10Losses}-{t.l10OtLosses}</td>
              <td className={`${t.streakCode === 'W' ? styles.streakW : styles.streakL}`}>
                {streak(t)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Standings() {
  const { standings, loading, error } = useStandings()
  const [view, setView] = useState<View>('division')

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Loading standings…</p>
      </div>
    )
  }

  if (error) {
    return <div className={styles.error}>⚠ {error}</div>
  }

  const byDiv = (div: string) =>
    standings
      .filter(t => t.divisionName === div)
      .sort((a, b) => b.points - a.points || b.wins - a.wins)

  const byConf = (divs: string[]) =>
    standings
      .filter(t => divs.includes(t.divisionName))
      .sort((a, b) => b.points - a.points || b.wins - a.wins)

  const allSorted = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins)

  // Wildcard: top 3 per division qualify; remaining teams in conference compete for 2 wildcard spots
  const wildcardConf = (divs: string[]) => {
    const divLeaders = new Set(
      divs.flatMap(div => byDiv(div).slice(0, 3).map(t => t.teamAbbrev.default))
    )
    const divSections = divs.map(div => ({ div, teams: byDiv(div).slice(0, 3) }))
    const wildcards = standings
      .filter(t => divs.includes(t.divisionName) && !divLeaders.has(t.teamAbbrev.default))
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
    return { divSections, wildcards }
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {(['division', 'conference', 'wildcard', 'league'] as View[]).map(v => (
          <button
            key={v}
            className={`${styles.tab} ${view === v ? styles.activeTab : ''}`}
            onClick={() => setView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {view === 'division' && (
        <div className={styles.sections}>
          {DIVISIONS.map(div => (
            <section key={div} className={styles.section}>
              <h2 className={styles.sectionTitle}>{div} Division</h2>
              <StandingsTable teams={byDiv(div)} showWildcard cutoff={3} />
            </section>
          ))}
        </div>
      )}

      {view === 'conference' && (
        <div className={styles.sections}>
          {Object.entries(CONFERENCES).map(([conf, divs]) => (
            <section key={conf} className={styles.section}>
              <h2 className={styles.sectionTitle}>{conf} Conference</h2>
              <StandingsTable teams={byConf(divs)} showWildcard cutoff={8} />
            </section>
          ))}
        </div>
      )}

      {view === 'wildcard' && (
        <div className={styles.sections}>
          {Object.entries(CONFERENCES).map(([conf, divs]) => {
            const { divSections, wildcards } = wildcardConf(divs)
            return (
              <section key={conf} className={styles.section}>
                <h2 className={styles.sectionTitle}>{conf} Conference</h2>
                {divSections.map(({ div, teams }) => (
                  <div key={div} className={styles.wildcardGroup}>
                    <h3 className={styles.wildcardDivTitle}>{div}</h3>
                    <StandingsTable teams={teams} showWildcard cutoff={3} />
                  </div>
                ))}
                <div className={styles.wildcardGroup}>
                  <h3 className={styles.wildcardDivTitle}>Wildcard</h3>
                  <StandingsTable teams={wildcards} showWildcard cutoff={2} />
                </div>
              </section>
            )
          })}
        </div>
      )}

      {view === 'league' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>League Standings</h2>
          <StandingsTable teams={allSorted} />
        </section>
      )}

      <p className={styles.legend}>
        <span className={styles.playoffDot} /> Playoff position
      </p>
    </div>
  )
}
