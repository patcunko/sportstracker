export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/nhl\//, '')
  const upstream = await fetch(`https://api-web.nhle.com/${path}${url.search}`, {
    headers: { 'User-Agent': 'sportstracker/1.0' },
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}
