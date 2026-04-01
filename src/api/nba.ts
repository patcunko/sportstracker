// NBA Stats API — proxied via Vite to avoid CORS
const BASE_STATS = '/api/nba-stats/stats'
const BASE_CDN = '/api/nba-cdn/static/json/liveData'

function localDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}


export function currentNBASeason(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startYear = now.getMonth() + 1 >= 10 ? year : year - 1
  return `${startYear}-${String(startYear + 1).slice(2)}`
}

function teamLogo(teamId: number): string {
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`
}

// ─── Raw NBA Stats API shapes ─────────────────────────────────────────────────

interface StatsResultSet {
  name: string
  headers: string[]
  rowSet: unknown[][]
}

interface StatsResponse {
  resultSets: StatsResultSet[]
}

function findRS(res: StatsResponse, name: string): StatsResultSet | undefined {
  return res.resultSets.find(rs => rs.name === name)
}

function toObjects(rs: StatsResultSet): Record<string, unknown>[] {
  return rs.rowSet.map(row => {
    const obj: Record<string, unknown> = {}
    rs.headers.forEach((h, i) => { obj[h] = row[i] })
    return obj
  })
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface NBATeamInGame {
  teamId: number
  abbrev: string
  cityName: string
  winsLosses: string
  score: number | null
  logo: string
}

export interface NBAGame {
  gameId: string
  gameDate: string         // YYYY-MM-DD
  statusId: number         // 1=scheduled, 2=live, 3=final
  statusText: string       // "7:30 pm ET" | "Q3 5:32" | "Final"
  period: number
  clock: string
  tvBroadcaster: string | null
  homeTeam: NBATeamInGame
  awayTeam: NBATeamInGame
}

export interface NBADay {
  date: string
  games: NBAGame[]
}

export interface NBAStandingsTeam {
  teamId: number
  teamCity: string
  teamName: string
  teamAbbrev: string
  conference: string
  division: string
  wins: number
  losses: number
  pct: number
  conferenceRank: number
  divisionRank: number
  homeRecord: string
  roadRecord: string
  l10: string
  streak: string
  logo: string
}

export interface NBABoxscorePlayer {
  personId: number
  jerseyNum: string
  name: string
  position: string
  played: boolean
  minutesFormatted: string
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  fgMade: number
  fgAttempted: number
  fg3Made: number
  fg3Attempted: number
  ftMade: number
  ftAttempted: number
  plusMinus: number
}

export interface NBABoxscoreTeamStats {
  fgMade: number
  fgAttempted: number
  fg3Made: number
  fg3Attempted: number
  ftMade: number
  ftAttempted: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
}

export interface NBABoxscoreTeam {
  teamId: number
  teamCity: string
  teamName: string
  abbrev: string
  wins: number
  losses: number
  score: number
  logo: string
  players: NBABoxscorePlayer[]
  statistics: NBABoxscoreTeamStats
}

export interface NBABoxscoreResponse {
  gameId: string
  gameStatus: number
  gameStatusText: string
  period: number
  gameClock: string   // "5:32" or ""
  homeTeam: NBABoxscoreTeam
  awayTeam: NBABoxscoreTeam
}

// ─── scoreboardv3 types & parsing ────────────────────────────────────────────

interface V3Team {
  teamId: number; teamCity: string; teamName: string; teamTricode: string
  wins: number; losses: number; score: number
}

interface V3Game {
  gameId: string; gameStatus: number; gameStatusText: string
  period: number; gameClock: string; gameTimeUTC: string
  homeTeam: V3Team; awayTeam: V3Team
  broadcasters?: {
    nationalBroadcasters?: Array<{ broadcasterAbbreviation: string }>
  }
}

interface V3Response {
  scoreboard: { games: V3Game[] }
}

function parseScoreboardV3(res: V3Response, date: string): NBAGame[] {
  return res.scoreboard.games.map(g => {
    const tv = g.broadcasters?.nationalBroadcasters?.[0]?.broadcasterAbbreviation ?? null
    const clockRaw = g.gameClock ?? ''
    const clock = clockRaw.startsWith('PT') ? formatClock(clockRaw) : clockRaw.trim()
    return {
      gameId: g.gameId,
      gameDate: date,
      statusId: g.gameStatus,
      statusText: g.gameStatusText.trim(),
      period: g.period,
      clock,
      tvBroadcaster: tv,
      homeTeam: {
        teamId: g.homeTeam.teamId,
        abbrev: g.homeTeam.teamTricode,
        cityName: g.homeTeam.teamCity,
        winsLosses: `${g.homeTeam.wins}-${g.homeTeam.losses}`,
        score: g.gameStatus === 1 ? null : g.homeTeam.score,
        logo: teamLogo(g.homeTeam.teamId),
      },
      awayTeam: {
        teamId: g.awayTeam.teamId,
        abbrev: g.awayTeam.teamTricode,
        cityName: g.awayTeam.teamCity,
        winsLosses: `${g.awayTeam.wins}-${g.awayTeam.losses}`,
        score: g.gameStatus === 1 ? null : g.awayTeam.score,
        logo: teamLogo(g.awayTeam.teamId),
      },
    }
  })
}

// ─── Standings parsing ────────────────────────────────────────────────────────

const TEAM_ABBREVS: Record<number, string> = {
  1610612737: 'ATL', 1610612738: 'BOS', 1610612751: 'BKN', 1610612766: 'CHA',
  1610612741: 'CHI', 1610612739: 'CLE', 1610612742: 'DAL', 1610612743: 'DEN',
  1610612765: 'DET', 1610612744: 'GSW', 1610612745: 'HOU', 1610612754: 'IND',
  1610612746: 'LAC', 1610612747: 'LAL', 1610612763: 'MEM', 1610612748: 'MIA',
  1610612749: 'MIL', 1610612750: 'MIN', 1610612740: 'NOP', 1610612752: 'NYK',
  1610612760: 'OKC', 1610612753: 'ORL', 1610612755: 'PHI', 1610612756: 'PHX',
  1610612757: 'POR', 1610612758: 'SAC', 1610612759: 'SAS', 1610612761: 'TOR',
  1610612762: 'UTA', 1610612764: 'WAS',
}

function parseStandings(res: StatsResponse): NBAStandingsTeam[] {
  const rs = findRS(res, 'Standings')
  if (!rs) return []
  return toObjects(rs).map(row => {
    const teamId = Number(row['TeamID'])
    const wins = Number(row['WINS']) || 0
    const losses = Number(row['L']) || 0
    const pctRaw = row['PCT']
    const pct = pctRaw != null ? Number(pctRaw) : (wins + losses > 0 ? wins / (wins + losses) : 0)
    return {
      teamId,
      teamCity: (row['TeamCity'] as string) ?? '',
      teamName: (row['TeamName'] as string) ?? '',
      teamAbbrev: TEAM_ABBREVS[teamId] ?? '',
      conference: (row['Conference'] as string) ?? '',
      division: (row['Division'] as string) ?? '',
      wins,
      losses,
      pct,
      conferenceRank: Number(row['PlayoffRank']) || 0,
      divisionRank: Number(row['DivisionRank']) || 0,
      homeRecord: (row['HomeRecord'] as string) ?? '',
      roadRecord: (row['RoadRecord'] as string) ?? '',
      l10: (row['L10'] as string) ?? '',
      streak: (row['strCurrentStreak'] as string) ?? '',
      logo: teamLogo(teamId),
    }
  })
}

// ─── CDN boxscore parsing ─────────────────────────────────────────────────────

function formatClock(raw: string): string {
  const m = raw.match(/PT(\d+)M([\d.]+)S/)
  if (!m) return ''
  const mins = parseInt(m[1])
  const secs = Math.floor(parseFloat(m[2]))
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatMinutes(raw: string): string {
  return formatClock(raw) || '0:00'
}

interface CDNPlayerStats {
  assists: number; blocks: number; fieldGoalsAttempted: number; fieldGoalsMade: number
  freeThrowsAttempted: number; freeThrowsMade: number; minutes: string
  plusMinusPoints: number; points: number; reboundsTotal: number; steals: number
  threePointersAttempted: number; threePointersMade: number; turnovers: number; foulsPersonal: number
}

interface CDNPlayer {
  personId: number; jerseyNum: string; name: string; position: string
  played: string; status: string; statistics: CDNPlayerStats
}

interface CDNTeamStats {
  fieldGoalsAttempted: number; fieldGoalsMade: number; threePointersAttempted: number
  threePointersMade: number; freeThrowsMade: number; freeThrowsAttempted: number
  reboundsTotal: number; assists: number; steals: number; blocks: number; turnovers: number
}

interface CDNTeam {
  teamId: number; teamCity: string; teamName: string; teamTricode: string
  wins: number; losses: number; score: number
  statistics: CDNTeamStats; players: CDNPlayer[]
}

interface CDNBoxscore {
  game: {
    gameId: string; gameStatus: number; gameStatusText: string
    period: number; gameClock: string; homeTeam: CDNTeam; awayTeam: CDNTeam
  }
}

function parseCDNTeam(raw: CDNTeam): NBABoxscoreTeam {
  return {
    teamId: raw.teamId,
    teamCity: raw.teamCity,
    teamName: raw.teamName,
    abbrev: raw.teamTricode,
    wins: raw.wins,
    losses: raw.losses,
    score: raw.score,
    logo: teamLogo(raw.teamId),
    statistics: {
      fgMade: raw.statistics.fieldGoalsMade,
      fgAttempted: raw.statistics.fieldGoalsAttempted,
      fg3Made: raw.statistics.threePointersMade,
      fg3Attempted: raw.statistics.threePointersAttempted,
      ftMade: raw.statistics.freeThrowsMade,
      ftAttempted: raw.statistics.freeThrowsAttempted,
      rebounds: raw.statistics.reboundsTotal,
      assists: raw.statistics.assists,
      steals: raw.statistics.steals,
      blocks: raw.statistics.blocks,
      turnovers: raw.statistics.turnovers,
    },
    players: raw.players
      .filter(p => p.status === 'ACTIVE')
      .map(p => ({
        personId: p.personId,
        jerseyNum: p.jerseyNum,
        name: p.name,
        position: p.position,
        played: p.played === '1',
        minutesFormatted: formatMinutes(p.statistics.minutes),
        points: p.statistics.points,
        rebounds: p.statistics.reboundsTotal,
        assists: p.statistics.assists,
        steals: p.statistics.steals,
        blocks: p.statistics.blocks,
        turnovers: p.statistics.turnovers,
        foulsPersonal: p.statistics.foulsPersonal,
        fgMade: p.statistics.fieldGoalsMade,
        fgAttempted: p.statistics.fieldGoalsAttempted,
        fg3Made: p.statistics.threePointersMade,
        fg3Attempted: p.statistics.threePointersAttempted,
        ftMade: p.statistics.freeThrowsMade,
        ftAttempted: p.statistics.freeThrowsAttempted,
        plusMinus: p.statistics.plusMinusPoints,
      })),
  }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function statsGet(path: string, params: Record<string, string>): Promise<StatsResponse> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE_STATS}${path}?${qs}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`NBA Stats API error: ${res.status}`)
  return res.json() as Promise<StatsResponse>
}

async function cdnGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_CDN}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`NBA CDN error: ${res.status}`)
  return res.json() as Promise<T>
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const nbaApi = {
  scoreboard: async (date?: string): Promise<NBAGame[]> => {
    const iso = date ?? localDate()
    const qs = new URLSearchParams({ GameDate: iso, LeagueID: '00' }).toString()
    const res = await fetch(`${BASE_STATS}/scoreboardv3?${qs}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`NBA scoreboard error: ${res.status}`)
    return parseScoreboardV3(await res.json() as V3Response, iso)
  },

  standings: async (): Promise<NBAStandingsTeam[]> => {
    const res = await statsGet('/leaguestandingsv3', {
      LeagueID: '00',
      Season: currentNBASeason(),
      SeasonType: 'Regular Season',
    })
    return parseStandings(res)
  },

  boxscore: async (gameId: string): Promise<NBABoxscoreResponse> => {
    const raw = await cdnGet<CDNBoxscore>(`/boxscore/boxscore_${gameId}.json`)
    return {
      gameId: raw.game.gameId,
      gameStatus: raw.game.gameStatus,
      gameStatusText: raw.game.gameStatusText,
      period: raw.game.period,
      gameClock: formatClock(raw.game.gameClock),
      homeTeam: parseCDNTeam(raw.game.homeTeam),
      awayTeam: parseCDNTeam(raw.game.awayTeam),
    }
  },
}
