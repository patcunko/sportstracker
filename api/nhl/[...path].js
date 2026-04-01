export const config = { runtime: 'edge' }

export default async function handler(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/nhl\//, '')
  const upstream = await fetch(`https://api-web.nhle.com/${path}${url.search}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Origin': 'https://www.nhl.com',
      'Referer': 'https://www.nhl.com/',
    },
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}
