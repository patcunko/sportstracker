// NHL API v1 — proxied via Vite to avoid CORS
const BASE = '/nhl/v1'

export interface TeamAbbrev {
  default: string
}

export interface TeamName {
  default: string
  fr?: string
}

export interface Score {
  home: number
  away: number
}

export interface PeriodDescriptor {
  number: number
  periodType: string // REG, OT, SO
}

export interface GameTeam {
  id: number
  abbrev: string
  name?: TeamName        // score endpoint
  commonName?: TeamName  // schedule endpoint
  placeName?: TeamName   // schedule endpoint
  logo: string
  score?: number
  sog?: number
}

export interface Game {
  id: number
  season: number
  gameType: number
  gameDate: string
  startTimeUTC: string
  easternUTCOffset: string
  venue: { default: string }
  gameState: string // FUT, LIVE, CRIT, FINAL, OFF
  gameScheduleState: string
  tvBroadcasts: { id: number; market: string; countryCode: string; network: string }[]
  awayTeam: GameTeam
  homeTeam: GameTeam
  periodDescriptor?: PeriodDescriptor
  clock?: { timeRemaining: string; secondsRemaining: number; running: boolean; inIntermission: boolean }
  situation?: { awayTeam: { strength: number }; homeTeam: { strength: number } }
  gameOutcome?: { lastPeriodType: string }
}

export interface DaySchedule {
  date: string
  games: Game[]
}

export interface ScheduleResponse {
  nextStartDate: string
  previousStartDate: string
  gameWeek: DaySchedule[]
  oddsPartners: unknown[]
  preSeasonStartDate: string
  regularSeasonStartDate: string
  regularSeasonEndDate: string
  playoffEndDate: string
  numberOfGames: number
}

export interface StandingsTeam {
  conferenceAbbrev: string
  conferenceName: string
  divisionAbbrev: string
  divisionName: string
  gamesPlayed: number
  goalDifferential: number
  goalDifferentialPctg: number
  goalAgainst: number
  goalFor: number
  goalsForPctg: number
  homeGamesPlayed: number
  homeGoalDifferential: number
  homeLosses: number
  homeOtLosses: number
  homeTies: number
  homeWins: number
  l10GamesPlayed: number
  l10GoalDifferential: number
  l10Losses: number
  l10OtLosses: number
  l10Points: number
  l10Wins: number
  leagueL10Sequence: number
  leagueSequence: number
  losses: number
  otLosses: number
  placeName: { default: string }
  pointPctg: number
  points: number
  regulationPlusOtWinPctg: number
  regulationPlusOtWins: number
  regulationWinPctg: number
  regulationWins: number
  roadGamesPlayed: number
  roadGoalDifferential: number
  roadLosses: number
  roadOtLosses: number
  roadTies: number
  roadWins: number
  seasonId: number
  shootoutLosses: number
  shootoutWins: number
  streakCode: string
  streakCount: number
  teamAbbrev: TeamAbbrev
  teamCommonName: TeamName
  teamName: TeamName
  teamLogo: string
  ties: number
  waiversSequence: number
  wildcardSequence: number
  winPctg: number
  wins: number
}

export interface StandingsResponse {
  wildCardIndicator: boolean
  standings: StandingsTeam[]
}

export interface ScoreboardResponse {
  prevDate: string
  currentDate: string
  nextDate: string
  games: Game[]
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`NHL API error: ${res.status}`)
  return res.json() as Promise<T>
}

export const nhlApi = {
  scoreboard: (date?: string) =>
    get<ScoreboardResponse>(`/score/${date ?? today()}`),

  schedule: () => get<ScheduleResponse>(`/schedule/${today()}`),

  scheduleByDate: (date: string) => get<ScheduleResponse>(`/schedule/${date}`),

  standings: () => get<StandingsResponse>(`/standings/${today()}`),
}
