export const config = { runtime: 'edge' }

export default async function handler(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/nba-stats\//, '')
  const upstream = await fetch(`https://stats.nba.com/${path}${url.search}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.nba.com/',
      'Origin': 'https://www.nba.com',
      'Accept': 'application/json',
      'x-nba-stats-origin': 'stats',
      'x-nba-stats-token': 'true',
    },
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}
