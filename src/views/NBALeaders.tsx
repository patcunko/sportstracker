import { useState } from 'react'
import { useNBALeaders } from '../hooks/useNBA'
import { nbaApi } from '../api/nba'
import type { NBALeaderPlayer } from '../api/nba'
import NBAPlayerModal from '../components/NBAPlayerModal'
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

function PlayerRow({ p, i, fmt, onPlayerClick }: {
  p: NBALeaderPlayer; i: number; fmt?: (v: number) => string; onPlayerClick: (id: number) => void
}) {
  return (
    <div
      className={`${styles.modalLeaderRow} ${styles.leaderRowClickable}`}
      onClick={() => onPlayerClick(p.playerId)}
    >
      <span className={styles.leaderRank}>{i + 1}</span>
      <img src={nbaHeadshot(p.playerId)} alt="" className={styles.leaderHeadshot} />
      <span className={styles.leaderName}>{p.playerName}</span>
      <span className={styles.leaderTeam}>{p.team}</span>
      <span className={styles.leaderVal}>{fmt ? fmt(p.value) : p.value.toFixed(1)}</span>
    </div>
  )
}

function LeaderCard({ title, players, fmt, onExpand, onPlayerClick }: {
  title: string
  players: NBALeaderPlayer[]
  fmt?: (v: number) => string
  onExpand: () => void
  onPlayerClick: (id: number) => void
}) {
  return (
    <div className={styles.leaderCard}>
      <div className={`${styles.leaderCardTitle} ${styles.leaderCardClickable}`} onClick={onExpand}>{title}</div>
      {players.map((p, i) => (
        <PlayerRow key={p.playerId} p={p} i={i} fmt={fmt} onPlayerClick={onPlayerClick} />
      ))}
      <div className={styles.leaderCardMore} onClick={onExpand}>See more →</div>
    </div>
  )
}

function LeaderModal({ modal, onClose, onPlayerClick }: {
  modal: ExpandedModal; onClose: () => void; onPlayerClick: (id: number) => void
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{modal.title}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {modal.loading && <div className={styles.center}><div className={styles.spinner} /></div>}
          {modal.error && <div className={styles.error}>⚠ {modal.error}</div>}
          {modal.players && modal.players.map((p, i) => (
            <PlayerRow key={p.playerId} p={p} i={i} fmt={modal.fmt} onPlayerClick={onPlayerClick} />
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)

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

  function handlePlayerClick(id: number) {
    setModal(null)
    setSelectedPlayerId(id)
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
      {modal && <LeaderModal modal={modal} onClose={() => setModal(null)} onPlayerClick={handlePlayerClick} />}
      {selectedPlayerId && <NBAPlayerModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />}

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
              onExpand={() => openModal(cat, false)}
              onPlayerClick={handlePlayerClick}
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
              onExpand={() => openModal(cat, true)}
              onPlayerClick={handlePlayerClick}
            />
          ) : null)}
        </div>
      )}
    </div>
  )
}
