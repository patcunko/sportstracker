const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const UPSTREAMS: Record<string, { base: string; headers?: Record<string, string> }> = {
  'nhl':          { base: 'https://api-web.nhle.com', headers: { Accept: 'application/json', Origin: 'https://www.nhl.com', Referer: 'https://www.nhl.com/' } },
  'hockey-rest':  { base: 'https://api.nhle.com' },
  'nba-stats':    { base: 'https://stats.nba.com', headers: { Referer: 'https://www.nba.com/', Origin: 'https://www.nba.com', Accept: 'application/json', 'x-nba-stats-origin': 'stats', 'x-nba-stats-token': 'true' } },
  'nba-cdn':      { base: 'https://cdn.nba.com' },
  'espn-rss':     { base: 'https://www.espn.com' },
}

export default async function middleware(request: Request): Promise<Response | void> {
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/api\/([^/]+)/)
  if (!match) return

  const key = match[1]
  const upstream = UPSTREAMS[key]
  if (!upstream) return

  const upstreamPath = url.pathname.slice(`/api/${key}`.length)
  const upstreamUrl = `${upstream.base}${upstreamPath}${url.search}`

  const response = await fetch(upstreamUrl, {
    headers: { 'User-Agent': UA, ...upstream.headers },
  })

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
  })
}

export const config = { matcher: '/api/:path*' }
