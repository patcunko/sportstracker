export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/espn-rss\//, '')
  const upstream = await fetch(`https://www.espn.com/${path}${url.search}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/xml' },
  })
}
