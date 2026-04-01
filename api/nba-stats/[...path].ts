import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = (req.query.path as string[])?.join('/') ?? ''
  const qs = new URLSearchParams(req.query as Record<string, string>)
  qs.delete('path')
  const search = qs.toString() ? `?${qs.toString()}` : ''
  const upstream = await fetch(`https://stats.nba.com/${path}${search}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.nba.com/',
      'Origin': 'https://www.nba.com',
      'Accept': 'application/json',
      'x-nba-stats-origin': 'stats',
      'x-nba-stats-token': 'true',
    },
  })
  const data = await upstream.text()
  res.status(upstream.status)
    .setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
    .send(data)
}
