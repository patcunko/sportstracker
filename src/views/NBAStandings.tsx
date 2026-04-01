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

function pctFmt(val: number | undefined): string {
  if (val == null || isNaN(val)) return '–'
  return val.toFixed(3).replace(/^0/, '')
}

interface TableProps {
  teams: NBAStandingsTeam[]
  showPlayoffLine?: boolean
  cutoff?: number
  playInCutoff?: number
  useConferenceRank?: boolean
}

function StandingsTable({ teams, cutoff, playInCutoff, useConferenceRank }: TableProps) {
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
          {teams.map((t, i) => {
            const rank = useConferenceRank ? t.conferenceRank : i + 1
            const playoffCut = cutoff ?? 6
            const playInCut = playInCutoff ?? 10
            const isPlayoff = rank <= playoffCut
            const isPlayIn = rank > playoffCut && rank <= playInCut
            const prev = i > 0 ? teams[i - 1] : null
            const prevRank = prev ? (useConferenceRank ? prev.conferenceRank : i) : null
            const isPlayoffBoundary = prevRank != null && prevRank <= playoffCut && rank > playoffCut
            const isPlayInBoundary = prevRank != null && prevRank > playoffCut && prevRank <= playInCut && rank > playInCut
            return (
            <tr
              key={t.teamId}
              className={`
                ${isPlayoffBoundary ? styles.wildcardLine : ''}
                ${isPlayInBoundary ? styles.playInLine : ''}
                ${isPlayoff ? styles.playoffSpot : ''}
                ${isPlayIn ? styles.playInSpot : ''}
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
              <td className={(t.streak ?? '').startsWith('W') ? styles.streakW : styles.streakL}>
                {t.streak ?? '–'}
              </td>
            </tr>
            )
          })}
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
    return standings
      .filter(t => t.conference?.toLowerCase().startsWith(confKey.toLowerCase()))
      .sort((a, b) => (a.conferenceRank || 999) - (b.conferenceRank || 999) || b.wins - a.wins)
  }

  const byDiv = (div: string) =>
    standings
      .filter(t => t.division?.toLowerCase() === div.toLowerCase())
      .sort((a, b) => (a.divisionRank || 999) - (b.divisionRank || 999) || b.wins - a.wins)

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
              <StandingsTable teams={byConf(conf)} showPlayoffLine cutoff={6} playInCutoff={10} />
            </section>
          ))}
        </div>
      )}

      {view === 'division' && (
        <div className={styles.sections}>
          {ALL_DIVISIONS.map(div => (
            <section key={div} className={styles.section}>
              <h2 className={styles.sectionTitle}>{div} Division</h2>
              <StandingsTable teams={byDiv(div)} useConferenceRank />
            </section>
          ))}
        </div>
      )}

      {view === 'league' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>League Standings</h2>
          <StandingsTable teams={allSorted} useConferenceRank />
        </section>
      )}

      <p className={styles.legend}>
        <span className={styles.playoffDot} /> Top 6 — playoff berth &nbsp;·&nbsp;
        <span className={styles.playInDot} /> Seeds 7–10 — play-in tournament
      </p>
    </div>
  )
}
