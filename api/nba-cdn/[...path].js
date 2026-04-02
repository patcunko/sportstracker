export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/nba-cdn/, '')
  const upstream = await fetch(`https://cdn.nba.com${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const body = await upstream.arrayBuffer()
  res.status(upstream.status)
  res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
  res.end(Buffer.from(body))
}
