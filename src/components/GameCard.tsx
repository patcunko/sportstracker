import type { Game } from '../api/nhl'
import styles from './GameCard.module.css'

interface Props {
  game: Game
}

function formatTime(utc: string): string {
  const d = new Date(utc)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

function periodLabel(game: Game): string {
  const pd = game.periodDescriptor
  if (!pd) return ''
  const type = pd.periodType
  if (type === 'SO') return 'Shootout'
  if (type === 'OT') return `OT${pd.number > 4 ? pd.number - 3 : ''}`
  return `P${pd.number}`
}

function outcomeLabel(game: Game): string {
  const last = game.gameOutcome?.lastPeriodType
  if (last === 'OT') return 'OT'
  if (last === 'SO') return 'SO'
  return ''
}

function statusBadge(game: Game): { label: string; live: boolean; final: boolean } {
  const s = game.gameState
  if (s === 'FUT' || s === 'PRE') {
    return { label: formatTime(game.startTimeUTC), live: false, final: false }
  }
  if (s === 'LIVE' || s === 'CRIT') {
    const clock = game.clock
    const period = periodLabel(game)
    const time = clock ? (clock.inIntermission ? 'INT' : clock.timeRemaining) : ''
    return { label: `${period} ${time}`.trim(), live: true, final: false }
  }
  if (s === 'FINAL' || s === 'OFF') {
    const oc = outcomeLabel(game)
    return { label: oc ? `Final/${oc}` : 'Final', live: false, final: true }
  }
  return { label: s, live: false, final: false }
}

export default function GameCard({ game }: Props) {
  const status = statusBadge(game)
  const awayWon = status.final && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0)
  const homeWon = status.final && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0)
  const hasScore = true

  return (
    <div className={`${styles.card} ${status.live ? styles.live : ''}`}>
      {status.live && <div className={styles.livePulse} />}

      <div className={styles.status}>
        {status.live && <span className={styles.liveDot} />}
        <span className={status.live ? styles.liveText : status.final ? styles.finalText : styles.timeText}>
          {status.label}
        </span>
      </div>

      <div className={styles.matchup}>
        <TeamRow
          logo={game.awayTeam.logo}
          abbrev={game.awayTeam.abbrev}
          score={game.awayTeam.score}
          hasScore={hasScore}
          winner={awayWon}
        />
        <div className={styles.vs}>vs</div>
        <TeamRow
          logo={game.homeTeam.logo}
          abbrev={game.homeTeam.abbrev}
          score={game.homeTeam.score}
          hasScore={hasScore}
          winner={homeWon}
        />
      </div>

      {hasScore && (game.awayTeam.sog !== undefined || game.homeTeam.sog !== undefined) && (
        <div className={styles.sog}>
          <span>{game.awayTeam.sog ?? '-'}</span>
          <span className={styles.sogLabel}>SOG</span>
          <span>{game.homeTeam.sog ?? '-'}</span>
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.venue}>{game.venue.default}</span>
        {game.tvBroadcasts?.length > 0 && (
          <span className={styles.tv}>
            {[...new Set(
              game.tvBroadcasts
                .filter(b => b.countryCode === 'US' || b.market === 'N')
                .map(b => b.network)
            )].slice(0, 2).join(' · ')}
          </span>
        )}
      </div>
    </div>
  )
}

function TeamRow({
  logo,
  abbrev,
  score,
  hasScore,
  winner,
}: {
  logo: string
  abbrev: string
  score?: number
  hasScore: boolean
  winner: boolean
}) {
  return (
    <div className={`${styles.team} ${winner ? styles.winner : ''}`}>
      <img src={logo} alt={abbrev} className={styles.logo} />
      <span className={styles.abbrev}>{abbrev}</span>
      {hasScore && <span className={styles.score}>{score ?? 0}</span>}
    </div>
  )
}
