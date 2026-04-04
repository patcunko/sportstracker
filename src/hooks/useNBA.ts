import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { nbaApi, type NBAGame, type NBADay, type NBAStandingsTeam, type NBABoxscoreResponse, type NBALeadersResponse, type NBALeaderPlayer, type NBATeamPlayer, type NBAPlayerInfo, type NBAPlayerSeasonStats } from '../api/nba'

const REFRESH_INTERVAL = 30

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

export function useNBAScoreboard(date?: string) {
  const [games, setGames] = useState<NBAGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const countdownRef = useRef(REFRESH_INTERVAL)

  const resetCountdown = useCallback(() => {
    countdownRef.current = REFRESH_INTERVAL
    setCountdown(REFRESH_INTERVAL)
  }, [])

  const fetch = useCallback(async () => {
    try {
      const data = await nbaApi.scoreboard(date)
      setGames(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scores')
    } finally {
      setLoading(false)
      resetCountdown()
    }
  }, [date, resetCountdown])

  useEffect(() => {
    setLoading(true)
    void fetch()
  }, [fetch])

  useEffect(() => {
    const id = setInterval(() => { void fetch() }, REFRESH_INTERVAL * 1000)
    return () => clearInterval(id)
  }, [fetch])

  useEffect(() => {
    const id = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return { games, loading, error, lastUpdated, countdown, refetch: fetch }
}

export function useNBASchedule(startDate?: string) {
  const [weekDays, setWeekDays] = useState<NBADay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dates = useMemo(() => {
    const base = startDate ?? localDateStr()
    return Array.from({ length: 7 }, (_, i) => addDays(base, i))
  }, [startDate])

  const fetch = useCallback(async () => {
    try {
      const results = await Promise.all(dates.map(d => nbaApi.scoreboard(d)))
      const days: NBADay[] = results
        .map((gs, i) => ({ date: dates[i], games: gs }))
        .filter(d => d.games.length > 0)
      setWeekDays(days)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [dates])

  useEffect(() => {
    setLoading(true)
    void fetch()
  }, [fetch])

  useEffect(() => {
    const hasLive = weekDays.some(d => d.games.some(g => !(/^final/i.test(g.statusText) || /[ap]m\b/i.test(g.statusText))))
    const delay = hasLive ? 30_000 : 5 * 60_000
    const id = setInterval(() => { void fetch() }, delay)
    return () => clearInterval(id)
  }, [fetch, weekDays])

  return { weekDays, loading, error, dates }
}

export function useNBAStandings() {
  const [standings, setStandings] = useState<NBAStandingsTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const data = await nbaApi.standings()
      setStandings(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load standings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch() }, [fetch])

  useEffect(() => {
    const id = setInterval(() => { void fetch() }, 5 * 60_000)
    return () => clearInterval(id)
  }, [fetch])

  return { standings, loading, error }
}

export function useNBABoxscore(gameId: string | null) {
  const [boxscore, setBoxscore] = useState<NBABoxscoreResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (gameId === null) return
    try {
      const data = await nbaApi.boxscore(gameId)
      setBoxscore(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load boxscore')
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    if (gameId === null) { setBoxscore(null); setError(null); return }
    setLoading(true)
    void fetchData()
  }, [gameId, fetchData])

  useEffect(() => {
    if (!gameId || !boxscore) return
    if (boxscore.gameStatus !== 2) return
    const id = setInterval(() => { void fetchData() }, 30_000)
    return () => clearInterval(id)
  }, [gameId, boxscore, fetchData])

  return { boxscore, loading, error }
}

const ROOKIE_CATS = ['PTS', 'REB', 'AST', 'STL', 'BLK']

export function useNBALeaders() {
  const [leaders, setLeaders] = useState<NBALeadersResponse | null>(null)
  const [rookieLeaders, setRookieLeaders] = useState<NBALeadersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const [main, ...rookieResults] = await Promise.all([
        nbaApi.leaders(),
        ...ROOKIE_CATS.map(cat => nbaApi.rookieLeadersByCategory(cat)),
      ])
      setLeaders(main)
      const rookieMerged: NBALeadersResponse = {}
      ROOKIE_CATS.forEach((cat, i) => { rookieMerged[cat] = rookieResults[i] as NBALeaderPlayer[] })
      setRookieLeaders(rookieMerged)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leaders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch() }, [fetch])
  useEffect(() => {
    const id = setInterval(() => { void fetch() }, 5 * 60_000)
    return () => clearInterval(id)
  }, [fetch])

  return { leaders, rookieLeaders, loading, error }
}

export function useNBATeamRoster(teamId: number | null) {
  const [players, setPlayers] = useState<NBATeamPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    try {
      const data = await nbaApi.teamRoster(teamId)
      setPlayers(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load roster')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { if (teamId) void fetchData() }, [fetchData, teamId])
  return { players, loading, error }
}

export function useNBAPlayer(playerId: number | null) {
  const [info, setInfo] = useState<NBAPlayerInfo | null>(null)
  const [career, setCareer] = useState<NBAPlayerSeasonStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!playerId) return
    setLoading(true)
    setInfo(null)
    setCareer([])
    try {
      const [i, c] = await Promise.all([
        nbaApi.playerInfo(playerId),
        nbaApi.playerCareerStats(playerId),
      ])
      setInfo(i)
      setCareer(c)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load player')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => { if (playerId) void fetchData() }, [fetchData, playerId])
  return { info, career, loading, error }
}

export type { NBAGame, NBADay, NBAStandingsTeam, NBATeamPlayer, NBAPlayerInfo, NBAPlayerSeasonStats }
