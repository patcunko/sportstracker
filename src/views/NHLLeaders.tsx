import { useState } from 'react'
import { useNHLLeaders } from '../hooks/useNHL'
import type { NHLLeaderPlayer } from '../api/nhl'
import styles from './Standings.module.css'

const SKATER_CATS: { key: string; label: string; fmt?: (v: number) => string }[] = [
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'points', label: 'Points' },
  { key: 'plusMinus', label: 'Plus / Minus', fmt: v => v > 0 ? `+${v}` : String(v) },
  { key: 'penaltyMins', label: 'Penalty Minutes' },
  { key: 'goalsPp', label: 'Power Play Goals' },
  { key: 'goalsSh', label: 'Shorthanded Goals' },
  { key: 'toi', label: 'Time on Ice' },
]

const GOALIE_CATS: { key: string; label: string; fmt?: (v: number) => string }[] = [
  { key: 'wins', label: 'Wins' },
  { key: 'goalsAgainstAverage', label: 'Goals Against Avg', fmt: v => v.toFixed(2) },
  { key: 'savePctg', label: 'Save Percentage', fmt: v => v.toFixed(3).replace(/^0/, '') },
  { key: 'shutouts', label: 'Shutouts' },
]

function LeaderCard({ title, players, fmt }: { title: string; players: NHLLeaderPlayer[]; fmt?: (v: number) => string }) {
  return (
    <div className={styles.leaderCard}>
      <div className={styles.leaderCardTitle}>{title}</div>
      {players.map((p, i) => (
        <div key={p.id} className={styles.leaderRow}>
          <span className={styles.leaderRank}>{i + 1}</span>
          <img src={p.headshot} alt="" className={styles.leaderHeadshot} />
          <span className={styles.leaderName}>{p.firstName.default} {p.lastName.default}</span>
          <span className={styles.leaderTeam}>{p.teamAbbrev}</span>
          <span className={styles.leaderVal}>{fmt ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function NHLLeaders() {
  const { skaterLeaders, goalieLeaders, rookieLeaders, loading, error } = useNHLLeaders()
  const [tab, setTab] = useState<'skaters' | 'goalies' | 'rookies'>('skaters')

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Loading leaders…</p>
      </div>
    )
  }

  if (error) {
    return <div className={styles.error}>⚠ {error}</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {(['skaters', 'goalies', 'rookies'] as const).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'skaters' && skaterLeaders && (
        <div className={styles.leadersGrid}>
          {SKATER_CATS.map(cat => skaterLeaders[cat.key]?.length ? (
            <LeaderCard key={cat.key} title={cat.label} players={skaterLeaders[cat.key]} fmt={cat.fmt} />
          ) : null)}
        </div>
      )}

      {tab === 'goalies' && goalieLeaders && (
        <div className={styles.leadersGrid}>
          {GOALIE_CATS.map(cat => goalieLeaders[cat.key]?.length ? (
            <LeaderCard key={cat.key} title={cat.label} players={goalieLeaders[cat.key]} fmt={cat.fmt} />
          ) : null)}
        </div>
      )}

      {tab === 'rookies' && rookieLeaders && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rankCol}>#</th>
                <th className={styles.teamCol}>Player</th>
                <th>Team</th>
                <th>Pos</th>
                <th>GP</th>
                <th className={styles.bold}>PTS</th>
                <th>G</th>
                <th>A</th>
                <th>+/-</th>
                <th className={styles.hide}>PPG</th>
                <th className={styles.hide}>PIM</th>
              </tr>
            </thead>
            <tbody>
              {rookieLeaders.map((p, i) => (
                <tr key={p.playerId}>
                  <td className={styles.rank}>{i + 1}</td>
                  <td>
                    <div className={styles.teamCell}>
                      <img src={`https://assets.nhle.com/mugs/nhl/20252026/${p.teamAbbrevs}/${p.playerId}.png`} alt="" className={styles.leaderHeadshot} />
                      <span className={styles.abbrev}>{p.skaterFullName}</span>
                    </div>
                  </td>
                  <td>{p.teamAbbrevs}</td>
                  <td>{p.positionCode}</td>
                  <td>{p.gamesPlayed}</td>
                  <td className={styles.pts}>{p.points}</td>
                  <td className={styles.bold}>{p.goals}</td>
                  <td>{p.assists}</td>
                  <td className={p.plusMinus > 0 ? styles.pos : p.plusMinus < 0 ? styles.neg : ''}>{p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}</td>
                  <td className={styles.hide}>{p.ppGoals}</td>
                  <td className={styles.hide}>{p.penaltyMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
