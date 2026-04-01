// NBA Stats API — proxied via Vite to avoid CORS
const BASE_STATS = '/nba-stats/stats'
const BASE_CDN = '/nba-cdn/static/json/liveData'

function localDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoToMDY(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
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

// ─── Scoreboard parsing ───────────────────────────────────────────────────────

function parseScoreboard(res: StatsResponse, date: string): NBAGame[] {
  const ghRS = findRS(res, 'GameHeader')
  const lsRS = findRS(res, 'LineScore')
  if (!ghRS || !lsRS) return []

  const headers = toObjects(ghRS)
  const lineScores = toObjects(lsRS)

  const lsMap = new Map<string, Record<string, unknown>>()
  for (const ls of lineScores) {
    lsMap.set(`${ls['GAME_ID']}_${ls['TEAM_ID']}`, ls)
  }

  return headers.map(gh => {
    const gameId = gh['GAME_ID'] as string
    const homeId = gh['HOME_TEAM_ID'] as number
    const awayId = gh['VISITOR_TEAM_ID'] as number
    const homeLS = lsMap.get(`${gameId}_${homeId}`)
    const awayLS = lsMap.get(`${gameId}_${awayId}`)

    const pts = (ls: Record<string, unknown> | undefined) => {
      const v = ls?.['PTS']
      return v != null && v !== '' ? Number(v) : null
    }

    return {
      gameId,
      gameDate: date,
      statusId: Number(gh['GAME_STATUS_ID']),
      statusText: (gh['GAME_STATUS_TEXT'] as string).trim(),
      period: Number(gh['LIVE_PERIOD']) || 0,
      clock: ((gh['LIVE_PC_TIME'] as string) || '').trim(),
      tvBroadcaster: (gh['NATL_TV_BROADCASTER_ABBREVIATION'] as string | null) || null,
      homeTeam: {
        teamId: homeId,
        abbrev: (homeLS?.['TEAM_ABBREVIATION'] as string) || '',
        cityName: (homeLS?.['TEAM_CITY_NAME'] as string) || '',
        winsLosses: (homeLS?.['TEAM_WINS_LOSSES'] as string) || '',
        score: pts(homeLS),
        logo: teamLogo(homeId),
      },
      awayTeam: {
        teamId: awayId,
        abbrev: (awayLS?.['TEAM_ABBREVIATION'] as string) || '',
        cityName: (awayLS?.['TEAM_CITY_NAME'] as string) || '',
        winsLosses: (awayLS?.['TEAM_WINS_LOSSES'] as string) || '',
        score: pts(awayLS),
        logo: teamLogo(awayId),
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
    const teamId = row['TeamID'] as number
    return {
      teamId,
      teamCity: row['TeamCity'] as string,
      teamName: row['TeamName'] as string,
      teamAbbrev: TEAM_ABBREVS[teamId] ?? '',
      conference: row['Conference'] as string,
      division: row['Division'] as string,
      wins: row['WINS'] as number,
      losses: row['L'] as number,
      pct: row['PCT'] as number,
      conferenceRank: row['PlayoffRank'] as number,
      divisionRank: row['DivisionRank'] as number,
      homeRecord: row['HomeRecord'] as string,
      roadRecord: row['RoadRecord'] as string,
      l10: row['L10'] as string,
      streak: row['strCurrentStreak'] as string,
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
    const res = await statsGet('/scoreboardV2', {
      GameDate: isoToMDY(iso), LeagueID: '00', DayOffset: '0',
    })
    return parseScoreboard(res, iso)
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
