import { useState, useEffect } from 'react'
import styles from './News.module.css'

interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  author: string
}

function parseRSS(xml: string): NewsItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  return Array.from(doc.querySelectorAll('item')).map(item => ({
    title: item.querySelector('title')?.textContent?.trim() ?? '',
    description: item.querySelector('description')?.textContent?.trim() ?? '',
    link: item.querySelector('link')?.textContent?.trim() ?? '',
    pubDate: item.querySelector('pubDate')?.textContent?.trim() ?? '',
    author: item.querySelector('creator')?.textContent?.trim() ?? '',
  }))
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const RSS_PATHS: Record<string, string> = {
  nhl: '/espn-rss/espn/rss/nhl/news',
  nba: '/espn-rss/espn/rss/nba/news',
  mlb: '/espn-rss/espn/rss/mlb/news',
  nfl: '/espn-rss/espn/rss/nfl/news',
}

export default function News({ sport = 'nhl' }: { sport?: string }) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setItems([])
    setError(null)
    fetch(RSS_PATHS[sport] ?? RSS_PATHS['nhl'], { cache: 'no-store' })
      .then(r => r.text())
      .then(xml => { setItems(parseRSS(xml)); setLoading(false) })
      .catch(() => { setError('Failed to load news'); setLoading(false) })
  }, [sport])

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Loading news…</p>
      </div>
    )
  }

  if (error) {
    return <div className={styles.error}>⚠ {error}</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.source}>Via ESPN {sport.toUpperCase()} News</div>
      <div className={styles.feed}>
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.item}
          >
            <div className={styles.itemMain}>
              <h2 className={styles.title}>{item.title}</h2>
              {item.description && (
                <p className={styles.desc}>{item.description}</p>
              )}
            </div>
            <div className={styles.meta}>
              {item.author && <span className={styles.author}>{item.author}</span>}
              {item.pubDate && <span className={styles.time}>{timeAgo(item.pubDate)}</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
