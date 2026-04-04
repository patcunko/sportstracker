import { useState } from 'react'
import { useNBALeaders } from '../hooks/useNBA'
import { nbaApi } from '../api/nba'
import type { NBALeaderPlayer } from '../api/nba'
import styles from './Standings.module.css'

const CATS: { key: string; label: string; fmt?: (v: number) => string }[] = [
  { key: 'PTS', label: 'Points' },
  { key: 'REB', label: 'Rebounds' },
  { key: 'AST', label: 'Assists' },
  { key: 'STL', label: 'Steals' },
  { key: 'BLK', label: 'Blocks' },
]

const ROOKIE_CATS: { key: string; label: string }[] = [
  { key: 'PTS', label: 'Points' },
  { key: 'REB', label: 'Rebounds' },
  { key: 'AST', label: 'Assists' },
  { key: 'STL', label: 'Steals' },
  { key: 'BLK', label: 'Blocks' },
]

function nbaHeadshot(playerId: number): string {
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png`
}

type ExpandedModal = {
  title: string
  catKey: string
  isRookie: boolean
  fmt?: (v: number) => string
  players: NBALeaderPlayer[] | null
  loading: boolean
  error: string | null
}

function LeaderCard({ title, players, fmt, onClick }: {
  title: string
  players: NBALeaderPlayer[]
  fmt?: (v: number) => string
  onClick: () => void
}) {
  return (
    <div className={`${styles.leaderCard} ${styles.leaderCardClickable}`} onClick={onClick}>
      <div className={styles.leaderCardTitle}>{title}</div>
      {players.map((p, i) => (
        <div key={p.playerId} className={styles.leaderRow}>
          <span className={styles.leaderRank}>{i + 1}</span>
          <img src={nbaHeadshot(p.playerId)} alt="" className={styles.leaderHeadshot} />
          <span className={styles.leaderName}>{p.playerName}</span>
          <span className={styles.leaderTeam}>{p.team}</span>
          <span className={styles.leaderVal}>{fmt ? fmt(p.value) : p.value.toFixed(1)}</span>
        </div>
      ))}
      <div className={styles.leaderCardMore}>See more →</div>
    </div>
  )
}

function LeaderModal({ modal, onClose }: { modal: ExpandedModal; onClose: () => void }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{modal.title}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {modal.loading && (
            <div className={styles.center}><div className={styles.spinner} /></div>
          )}
          {modal.error && <div className={styles.error}>⚠ {modal.error}</div>}
          {modal.players && modal.players.map((p, i) => (
            <div key={p.playerId} className={styles.modalLeaderRow}>
              <span className={styles.leaderRank}>{i + 1}</span>
              <img src={nbaHeadshot(p.playerId)} alt="" className={styles.leaderHeadshot} />
              <span className={styles.leaderName}>{p.playerName}</span>
              <span className={styles.leaderTeam}>{p.team}</span>
              <span className={styles.leaderVal}>{modal.fmt ? modal.fmt(p.value) : p.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NBALeaders() {
  const { leaders, rookieLeaders, loading, error } = useNBALeaders()
  const [tab, setTab] = useState<'players' | 'rookies'>('players')
  const [modal, setModal] = useState<ExpandedModal | null>(null)

  async function openModal(cat: { key: string; label: string; fmt?: (v: number) => string }, isRookie: boolean) {
    setModal({ title: cat.label, catKey: cat.key, isRookie, fmt: cat.fmt, players: null, loading: true, error: null })
    try {
      const players = isRookie
        ? await nbaApi.rookieLeadersByCategory(cat.key, 20)
        : await nbaApi.leadersByCategory(cat.key, 20)
      setModal(m => m ? { ...m, players, loading: false } : null)
    } catch {
      setModal(m => m ? { ...m, error: 'Failed to load', loading: false } : null)
    }
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Loading leaders…</p>
      </div>
    )
  }

  if (error) return <div className={styles.error}>⚠ {error}</div>

  return (
    <div className={styles.container}>
      {modal && <LeaderModal modal={modal} onClose={() => setModal(null)} />}

      <div className={styles.tabs}>
        {(['players', 'rookies'] as const).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'players' && (
        <div className={styles.leadersGrid}>
          {CATS.map(cat => leaders?.[cat.key]?.length ? (
            <LeaderCard
              key={cat.key}
              title={cat.label}
              players={leaders[cat.key]}
              fmt={cat.fmt}
              onClick={() => openModal(cat, false)}
            />
          ) : null)}
        </div>
      )}

      {tab === 'rookies' && (
        <div className={styles.leadersGrid}>
          {ROOKIE_CATS.map(cat => rookieLeaders?.[cat.key]?.length ? (
            <LeaderCard
              key={cat.key}
              title={cat.label}
              players={rookieLeaders[cat.key]}
              onClick={() => openModal(cat, true)}
            />
          ) : null)}
        </div>
      )}
    </div>
  )
}
