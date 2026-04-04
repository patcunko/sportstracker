import { useState, useEffect, useCallback, useRef } from 'react'
import { nhlApi, type Game, type StandingsTeam, type DaySchedule, type BoxscoreResponse, type LandingResponse, type NHLLeadersResponse, type NHLLeaderPlayer } from '../api/nhl'

const REFRESH_INTERVAL = 30

export function useScoreboard(date?: string) {
  const [days, setDays] = useState<DaySchedule[]>([])
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
      const data = await nhlApi.scoreboard(date)
      const day: DaySchedule = { date: data.currentDate, games: data.games ?? [] }
      setDays([day])
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

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => { void fetch() }, REFRESH_INTERVAL * 1000)
    return () => clearInterval(id)
  }, [fetch])

  // Countdown ticker — decrements every second
  useEffect(() => {
    const id = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return { days, loading, error, lastUpdated, countdown, refetch: fetch }
}

function hasLiveGames(days: DaySchedule[]): boolean {
  return days.some(d => d.games.some(g => g.gameState === 'LIVE' || g.gameState === 'CRIT'))
}

export function useSchedule(startDate?: string) {
  const [gameWeek, setGameWeek] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const req = startDate ? nhlApi.scheduleByDate(startDate) : nhlApi.schedule()
      const data = await req
      setGameWeek(data.gameWeek ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [startDate])

  useEffect(() => {
    setLoading(true)
    void fetch()
  }, [fetch])

  useEffect(() => {
    const delay = hasLiveGames(gameWeek) ? 30_000 : 5 * 60_000
    const id = setInterval(() => { void fetch() }, delay)
    return () => clearInterval(id)
  }, [fetch, gameWeek])

  return { gameWeek, loading, error }
}

export function useStandings() {
  const [standings, setStandings] = useState<StandingsTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const data = await nhlApi.standings()
      setStandings(data.standings ?? [])
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

export function useBoxscore(gameId: number | null) {
  const [boxscore, setBoxscore] = useState<BoxscoreResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (gameId === null) return
    try {
      const data = await nhlApi.boxscore(gameId)
      setBoxscore(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load boxscore')
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    if (gameId === null) {
      setBoxscore(null)
      setError(null)
      return
    }
    setLoading(true)
    void fetchData()
  }, [gameId, fetchData])

  useEffect(() => {
    if (gameId === null) return
    if (!boxscore) return
    const isLive = boxscore.gameState === 'LIVE' || boxscore.gameState === 'CRIT'
    if (!isLive) return
    const id = setInterval(() => { void fetchData() }, 30_000)
    return () => clearInterval(id)
  }, [gameId, boxscore, fetchData])

  return { boxscore, loading, error }
}

export function useLanding(gameId: number | null) {
  const [landing, setLanding] = useState<LandingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (gameId === null) return
    try {
      const data = await nhlApi.landing(gameId)
      setLanding(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load game data')
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    if (gameId === null) { setLanding(null); return }
    setLoading(true)
    void fetchData()
  }, [gameId, fetchData])

  useEffect(() => {
    if (gameId === null || !landing) return
    const isLive = landing.gameState === 'LIVE' || landing.gameState === 'CRIT'
    if (!isLive) return
    const id = setInterval(() => { void fetchData() }, 30_000)
    return () => clearInterval(id)
  }, [gameId, landing, fetchData])

  return { landing, loading, error }
}

export function useNHLLeaders() {
  const [skaterLeaders, setSkaterLeaders] = useState<NHLLeadersResponse | null>(null)
  const [goalieLeaders, setGoalieLeaders] = useState<NHLLeadersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rookieLeaders, setRookieLeaders] = useState<NHLLeadersResponse | null>(null)

  const fetch = useCallback(async () => {
    try {
      const rookieCats = ['points', 'goals', 'assists', 'plusMinus']
      const [skaters, goalies, ...rookieResults] = await Promise.all([
        nhlApi.skaterLeaders(),
        nhlApi.goalieLeaders(),
        ...rookieCats.map(cat => nhlApi.rookieLeadersByCategory(cat)),
      ])
      setSkaterLeaders(skaters)
      setGoalieLeaders(goalies)
      const rookieMerged: NHLLeadersResponse = {}
      rookieCats.forEach((cat, i) => { rookieMerged[cat] = rookieResults[i] as NHLLeaderPlayer[] })
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

  return { skaterLeaders, goalieLeaders, rookieLeaders, loading, error }
}

export type { Game, StandingsTeam, DaySchedule, NHLLeaderPlayer }
