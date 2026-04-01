import { useState, useEffect, useCallback, useRef } from 'react'
import { nhlApi, type Game, type StandingsTeam, type DaySchedule } from '../api/nhl'

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

export type { Game, StandingsTeam, DaySchedule }
