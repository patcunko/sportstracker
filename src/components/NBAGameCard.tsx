import type { NBAGame } from '../api/nba'
import styles from './GameCard.module.css'

interface Props {
  game: NBAGame
  onClick?: () => void
}

function periodLabel(period: number): string {
  if (period === 0) return ''
  if (period <= 4) return `Q${period}`
  return `OT${period > 5 ? period - 4 : ''}`
}

function statusBadge(game: NBAGame): { label: string; live: boolean; final: boolean } {
  const isFinal = game.statusId === 3 || /^final/i.test(game.statusText)
  const isLive = !isFinal && (game.statusId === 2 || /^Q\d|Halftime|Half/i.test(game.statusText))

  if (isFinal) return { label: game.statusText, live: false, final: true }
  if (isLive) {
    const period = periodLabel(game.period)
    const label = game.clock ? `${period} ${game.clock}` : game.statusText
    return { label, live: true, final: false }
  }
  return { label: game.statusText, live: false, final: false }
}

export default function NBAGameCard({ game, onClick }: Props) {
  const status = statusBadge(game)
  const awayWon = status.final && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0)
  const homeWon = status.final && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0)
  const hasScore = game.statusId !== 1

  return (
    <div
      className={`${styles.card} ${status.live ? styles.live : ''} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
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
          score={hasScore ? (game.awayTeam.score ?? 0) : undefined}
          winner={awayWon}
        />
        <div className={styles.vs}>vs</div>
        <TeamRow
          logo={game.homeTeam.logo}
          abbrev={game.homeTeam.abbrev}
          score={hasScore ? (game.homeTeam.score ?? 0) : undefined}
          winner={homeWon}
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.venue}>{game.awayTeam.winsLosses} · {game.homeTeam.winsLosses}</span>
        {game.tvBroadcaster && (
          <span className={styles.tv}>{game.tvBroadcaster}</span>
        )}
      </div>
    </div>
  )
}

function TeamRow({
  logo, abbrev, score, winner,
}: {
  logo: string
  abbrev: string
  score?: number
  winner: boolean
}) {
  return (
    <div className={`${styles.team} ${winner ? styles.winner : ''}`}>
      <img src={logo} alt={abbrev} className={styles.logo} />
      <span className={styles.abbrev}>{abbrev}</span>
      {score !== undefined && <span className={styles.score}>{score}</span>}
    </div>
  )
}
