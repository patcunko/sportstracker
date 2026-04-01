import { useState } from 'react'
import { useNBAStandings } from '../hooks/useNBA'
import type { NBAStandingsTeam } from '../api/nba'
import styles from './Standings.module.css'

type View = 'conference' | 'division' | 'league'

const CONFERENCES: Record<string, string[]> = {
  East: ['Atlantic', 'Central', 'Southeast'],
  West: ['Northwest', 'Pacific', 'Southwest'],
}

const ALL_DIVISIONS = ['Atlantic', 'Central', 'Southeast', 'Northwest', 'Pacific', 'Southwest']

function pctFmt(val: number): string {
  return val.toFixed(3).replace(/^0/, '')
}

interface TableProps {
  teams: NBAStandingsTeam[]
  showPlayoffLine?: boolean
  cutoff?: number
}

function StandingsTable({ teams, showPlayoffLine, cutoff }: TableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rankCol}>#</th>
            <th className={styles.teamCol}>Team</th>
            <th>W</th>
            <th>L</th>
            <th>PCT</th>
            <th className={styles.hide}>Home</th>
            <th className={styles.hide}>Away</th>
            <th className={styles.hide}>L10</th>
            <th>Streak</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr
              key={t.teamId}
              className={`
                ${showPlayoffLine && i === cutoff ? styles.wildcardLine : ''}
                ${showPlayoffLine && i < (cutoff ?? 6) ? styles.playoffSpot : ''}
              `}
            >
              <td className={styles.rank}>{i + 1}</td>
              <td>
                <div className={styles.teamCell}>
                  <img src={t.logo} alt={t.teamAbbrev} className={styles.logo} />
                  <span className={styles.abbrev}>{t.teamAbbrev}</span>
                  <span className={styles.fullName}>{t.teamCity} {t.teamName}</span>
                </div>
              </td>
              <td className={styles.bold}>{t.wins}</td>
              <td>{t.losses}</td>
              <td className={styles.pts}>{pctFmt(t.pct)}</td>
              <td className={styles.hide}>{t.homeRecord}</td>
              <td className={styles.hide}>{t.roadRecord}</td>
              <td className={styles.hide}>{t.l10}</td>
              <td className={t.streak.startsWith('W') ? styles.streakW : styles.streakL}>
                {t.streak}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function NBAStandings() {
  const { standings, loading, error } = useNBAStandings()
  const [view, setView] = useState<View>('conference')

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

  const byConf = (confKey: string) => {
    const confName = confKey === 'East' ? 'East' : 'West'
    return standings
      .filter(t => t.conference === confName)
      .sort((a, b) => a.conferenceRank - b.conferenceRank || b.wins - a.wins)
  }

  const byDiv = (div: string) =>
    standings
      .filter(t => t.division === div)
      .sort((a, b) => a.divisionRank - b.divisionRank || b.wins - a.wins)

  const allSorted = [...standings].sort((a, b) => b.wins - a.wins || a.losses - b.losses)

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {(['conference', 'division', 'league'] as View[]).map(v => (
          <button
            key={v}
            className={`${styles.tab} ${view === v ? styles.activeTab : ''}`}
            onClick={() => setView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {view === 'conference' && (
        <div className={styles.sections}>
          {Object.keys(CONFERENCES).map(conf => (
            <section key={conf} className={styles.section}>
              <h2 className={styles.sectionTitle}>{conf}ern Conference</h2>
              <StandingsTable teams={byConf(conf)} showPlayoffLine cutoff={6} />
            </section>
          ))}
        </div>
      )}

      {view === 'division' && (
        <div className={styles.sections}>
          {ALL_DIVISIONS.map(div => (
            <section key={div} className={styles.section}>
              <h2 className={styles.sectionTitle}>{div} Division</h2>
              <StandingsTable teams={byDiv(div)} />
            </section>
          ))}
        </div>
      )}

      {view === 'league' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>League Standings</h2>
          <StandingsTable teams={allSorted} />
        </section>
      )}

      <p className={styles.legend}>
        <span className={styles.playoffDot} /> Top 6 seeds — direct playoff berth · Seeds 7–10 compete in play-in
      </p>
    </div>
  )
}
