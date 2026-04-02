export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/nba-stats/, '')
  const upstream = await fetch(`https://stats.nba.com${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.nba.com/',
      'Origin': 'https://www.nba.com',
      'Accept': 'application/json',
      'x-nba-stats-origin': 'stats',
      'x-nba-stats-token': 'true',
    },
  })
  const body = await upstream.arrayBuffer()
  res.status(upstream.status)
    .setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
    .end(Buffer.from(body))
}
