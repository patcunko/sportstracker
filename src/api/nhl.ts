// NHL API v1 — proxied via Vite to avoid CORS
const BASE = '/api/nhl/v1'
const BASE_STATS = '/api/hockey-rest/stats/rest/en'

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

function currentNHLSeason(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startYear = now.getMonth() + 1 >= 10 ? year : year - 1
  return `${startYear}${startYear + 1}`
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

export interface BoxscoreSkater {
  playerId: number
  sweaterNumber: number
  name: { default: string }
  position: string
  goals: number
  assists: number
  points: number
  plusMinus: number
  pim: number
  hits: number
  powerPlayGoals: number
  sog: number
  faceoffWinningPctg: number
  toi: string
  blockedShots: number
  shifts: number
  giveaways: number
  takeaways: number
}

export interface BoxscoreGoalie {
  playerId: number
  sweaterNumber: number
  name: { default: string }
  position: string
  saveShotsAgainst: string
  savePctg: number
  goalsAgainst: number
  shotsAgainst: number
  saves: number
  toi: string
  evenStrengthShotsAgainst: string
  powerPlayShotsAgainst: string
  shorthandedShotsAgainst: string
}

export interface BoxscoreTeamStats {
  id: number
  abbrev: string
  commonName: { default: string }
  score?: number
  sog?: number
  logo: string
}

export interface BoxscoreResponse {
  id: number
  gameState: string
  awayTeam: BoxscoreTeamStats
  homeTeam: BoxscoreTeamStats
  clock?: { timeRemaining: string; running: boolean; inIntermission: boolean }
  periodDescriptor?: { number: number; periodType: string } | null
  playerByGameStats?: {
    awayTeam: { forwards: BoxscoreSkater[]; defense: BoxscoreSkater[]; goalies: BoxscoreGoalie[] }
    homeTeam: { forwards: BoxscoreSkater[]; defense: BoxscoreSkater[]; goalies: BoxscoreGoalie[] }
  } | null
}

export interface NHLLeaderPlayer {
  id: number
  firstName: { default: string }
  lastName: { default: string }
  sweaterNumber: number
  headshot: string
  teamAbbrev: string
  position: string
  value: number
}

export type NHLLeadersResponse = Record<string, NHLLeaderPlayer[]>

export interface NHLRookiePlayer {
  playerId: number
  skaterFullName: string
  teamAbbrevs: string
  positionCode: string
  goals: number
  assists: number
  points: number
  plusMinus: number
  penaltyMinutes: number
  shots: number
  ppGoals: number
  gamesPlayed: number
}

export interface NHLRookieLeadersResponse {
  data: NHLRookiePlayer[]
  total: number
}

export interface ClubSkater {
  playerId: number
  skaterFullName: string
  teamAbbrevs: string
  positionCode: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  plusMinus: number
  ppGoals: number
  shots: number
  shootingPct: number
  timeOnIcePerGame: number
}

export interface ClubGoalie {
  goalieFullName: string
  playerId: number
  teamAbbrevs: string
  gamesPlayed: number
  wins: number
  losses: number
  otLosses: number
  goalsAgainstAverage: number
  savePct: number
  shutouts: number
}

export interface ClubStatsResponse {
  skaters: ClubSkater[]
  goalies: ClubGoalie[]
}

export const nhlApi = {
  scoreboard: (date?: string) =>
    get<ScoreboardResponse>(`/score/${date ?? today()}`),

  schedule: () => get<ScheduleResponse>(`/schedule/${today()}`),

  scheduleByDate: (date: string) => get<ScheduleResponse>(`/schedule/${date}`),

  standings: () => get<StandingsResponse>(`/standings/${today()}`),

  teamSchedule: (abbrev: string) =>
    get<{ games: Game[] }>(`/club-schedule-season/${abbrev}/now`),

  teamStats: async (abbrev: string): Promise<ClubStatsResponse> => {
    const season = currentNHLSeason()
    const cayenneSkater = encodeURIComponent(`gameTypeId=2 and seasonId=${season} and teamAbbrevs="${abbrev}"`)
    const cayenneGoalie = encodeURIComponent(`gameTypeId=2 and seasonId=${season} and teamAbbrevs="${abbrev}"`)
    const skaterSort = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]))
    const goalieSort = encodeURIComponent(JSON.stringify([{ property: 'wins', direction: 'DESC' }]))

    const [skaterRes, goalieRes] = await Promise.all([
      fetch(`${BASE_STATS}/skater/summary?isAggregate=false&isGame=false&sort=${skaterSort}&start=0&limit=30&cayenneExp=${cayenneSkater}`, { cache: 'no-store' }),
      fetch(`${BASE_STATS}/goalie/summary?isAggregate=false&isGame=false&sort=${goalieSort}&start=0&limit=10&cayenneExp=${cayenneGoalie}`, { cache: 'no-store' }),
    ])

    if (!skaterRes.ok) throw new Error(`NHL team skater stats error: ${skaterRes.status}`)
    if (!goalieRes.ok) throw new Error(`NHL team goalie stats error: ${goalieRes.status}`)

    const skaterData: { data: Record<string, unknown>[] } = await skaterRes.json()
    const goalieData: { data: Record<string, unknown>[] } = await goalieRes.json()

    return {
      skaters: skaterData.data.map(r => ({
        playerId: Number(r['playerId']),
        skaterFullName: String(r['skaterFullName']),
        teamAbbrevs: String(r['teamAbbrevs']),
        positionCode: String(r['positionCode']),
        gamesPlayed: Number(r['gamesPlayed']),
        goals: Number(r['goals']),
        assists: Number(r['assists']),
        points: Number(r['points']),
        plusMinus: Number(r['plusMinus']),
        ppGoals: Number(r['ppGoals']),
        shots: Number(r['shots']),
        shootingPct: Number(r['shootingPct']),
        timeOnIcePerGame: Number(r['timeOnIcePerGame']),
      })),
      goalies: goalieData.data.map(r => ({
        playerId: Number(r['goalieId'] ?? r['playerId']),
        goalieFullName: String(r['goalieFullName']),
        teamAbbrevs: String(r['teamAbbrevs']),
        gamesPlayed: Number(r['gamesPlayed']),
        wins: Number(r['wins']),
        losses: Number(r['losses']),
        otLosses: Number(r['otLosses']),
        goalsAgainstAverage: Number(r['goalsAgainstAverage']),
        savePct: Number(r['savePct']),
        shutouts: Number(r['shutouts']),
      })),
    }
  },

  teamRookieLeaders: async (abbrev: string): Promise<NHLRookiePlayer[]> => {
    const season = currentNHLSeason()
    const sort = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]))
    const cayenne = encodeURIComponent(`gameTypeId=2 and seasonId=${season} and isRookie=1 and teamAbbrevs="${abbrev}"`)
    const res = await fetch(`${BASE_STATS}/skater/summary?isAggregate=false&isGame=false&sort=${sort}&start=0&limit=20&cayenneExp=${cayenne}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`NHL team rookie stats error: ${res.status}`)
    const data: NHLRookieLeadersResponse = await res.json()
    return data.data
  },

  boxscore: (gameId: number) =>
    get<BoxscoreResponse>(`/gamecenter/${gameId}/boxscore`),

  landing: (gameId: number) =>
    get<LandingResponse>(`/gamecenter/${gameId}/landing`),

  skaterLeaders: async (limit = 5): Promise<NHLLeadersResponse> => {
    const season = currentNHLSeason()
    const cats = ['goals', 'assists', 'points', 'plusMinus', 'penaltyMins', 'goalsPp', 'goalsSh', 'toi']
    const results = await Promise.allSettled(
      cats.map(cat => get<NHLLeadersResponse>(`/skater-stats-leaders/${season}/2?categories=${cat}&limit=${limit}`))
    )
    const merged: NHLLeadersResponse = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') Object.assign(merged, r.value)
      else console.warn(`skater leaders category ${cats[i]} failed`)
    })
    return merged
  },

  goalieLeaders: async (limit = 5): Promise<NHLLeadersResponse> => {
    const season = currentNHLSeason()
    const cats = ['wins', 'goalsAgainstAverage', 'savePctg', 'shutouts']
    const results = await Promise.allSettled(
      cats.map(cat => get<NHLLeadersResponse>(`/goalie-stats-leaders/${season}/2?categories=${cat}&limit=${limit}`))
    )
    const merged: NHLLeadersResponse = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') Object.assign(merged, r.value)
      else console.warn(`goalie leaders category ${cats[i]} failed`)
    })
    return merged
  },

  skaterLeadersByCategory: async (cat: string, limit = 20): Promise<NHLLeaderPlayer[]> => {
    const season = currentNHLSeason()
    const res = await get<NHLLeadersResponse>(`/skater-stats-leaders/${season}/2?categories=${cat}&limit=${limit}`)
    return res[cat] ?? []
  },

  goalieLeadersByCategory: async (cat: string, limit = 20): Promise<NHLLeaderPlayer[]> => {
    const season = currentNHLSeason()
    const res = await get<NHLLeadersResponse>(`/goalie-stats-leaders/${season}/2?categories=${cat}&limit=${limit}`)
    return res[cat] ?? []
  },

  rookieLeadersByCategory: async (sortProp: string, limit = 5): Promise<NHLLeaderPlayer[]> => {
    const season = currentNHLSeason()
    const sort = encodeURIComponent(JSON.stringify([{ property: sortProp, direction: 'DESC' }]))
    const cayenne = encodeURIComponent(`gameTypeId=2 and seasonId=${season} and isRookie=1`)
    const res = await fetch(`${BASE_STATS}/skater/summary?isAggregate=false&isGame=false&sort=${sort}&start=0&limit=${limit}&cayenneExp=${cayenne}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`NHL rookie stats error: ${res.status}`)
    const data: NHLRookieLeadersResponse = await res.json()
    return data.data.map(p => {
      const spaceIdx = p.skaterFullName.indexOf(' ')
      return {
        id: p.playerId,
        firstName: { default: spaceIdx >= 0 ? p.skaterFullName.slice(0, spaceIdx) : p.skaterFullName },
        lastName: { default: spaceIdx >= 0 ? p.skaterFullName.slice(spaceIdx + 1) : '' },
        sweaterNumber: 0,
        headshot: `https://assets.nhle.com/mugs/nhl/20252026/${p.teamAbbrevs}/${p.playerId}.png`,
        teamAbbrev: p.teamAbbrevs,
        position: p.positionCode,
        value: (p as unknown as Record<string, number>)[sortProp] ?? 0,
      }
    })
  },
}

export interface LandingPenalty {
  timeInPeriod: string
  type: string
  duration: number
  descKey: string
  committedByPlayer?: { firstName: { default: string }; lastName: { default: string }; sweaterNumber: number }
  drawnBy?: { firstName: { default: string }; lastName: { default: string }; sweaterNumber: number }
  teamAbbrev: { default: string }
}

export interface LandingPenaltyPeriod {
  periodDescriptor: { number: number; periodType: string }
  penalties: LandingPenalty[]
}

export interface LandingResponse {
  gameState: string
  situation?: {
    awayTeam: { abbrev: string; strength: number; situationDescriptions?: string[] }
    homeTeam: { abbrev: string; strength: number; situationDescriptions?: string[] }
    timeRemaining: string
  }
  summary: {
    penalties: LandingPenaltyPeriod[]
  }
}
