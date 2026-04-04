import { useState } from 'react'
import { useNHLLeaders } from '../hooks/useNHL'
import { nhlApi } from '../api/nhl'
import type { NHLLeaderPlayer } from '../api/nhl'
import NHLPlayerModal from '../components/NHLPlayerModal'
import styles from './Standings.module.css'

const SKATER_CATS: { key: string; label: string; fmt?: (v: number) => string }[] = [
  { key: 'points', label: 'Points' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'plusMinus', label: 'Plus / Minus', fmt: v => v > 0 ? `+${v}` : String(v) },
  { key: 'penaltyMins', label: 'Penalty Minutes' },
  { key: 'goalsPp', label: 'Power Play Goals' },
  { key: 'goalsSh', label: 'Shorthanded Goals' },
  { key: 'toi', label: 'Time on Ice (avg)', fmt: v => {
    const m = Math.floor(v / 60)
    const s = Math.floor(v % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }},
]

const ROOKIE_CATS: { key: string; label: string; fmt?: (v: number) => string }[] = [
  { key: 'points', label: 'Points' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'plusMinus', label: 'Plus / Minus', fmt: v => v > 0 ? `+${v}` : String(v) },
]

const GOALIE_CATS: { key: string; label: string; fmt?: (v: number) => string }[] = [
  { key: 'wins', label: 'Wins' },
  { key: 'goalsAgainstAverage', label: 'Goals Against Avg', fmt: v => v.toFixed(2) },
  { key: 'savePctg', label: 'Save Percentage', fmt: v => v.toFixed(3).replace(/^0/, '') },
  { key: 'shutouts', label: 'Shutouts' },
]

type ExpandedModal = {
  title: string
  players: NHLLeaderPlayer[] | null
  fmt?: (v: number) => string
  loading: boolean
  error: string | null
}

function LeaderRow({ p, i, fmt, onPlayerClick }: {
  p: NHLLeaderPlayer
  i: number
  fmt?: (v: number) => string
  onPlayerClick: (id: number) => void
}) {
  return (
    <div
      className={`${styles.modalLeaderRow} ${styles.leaderRowClickable}`}
      onClick={() => onPlayerClick(p.id)}
    >
      <span className={styles.leaderRank}>{i + 1}</span>
      <img src={p.headshot} alt="" className={styles.leaderHeadshot} />
      <span className={styles.leaderName}>{p.firstName.default} {p.lastName.default}</span>
      <span className={styles.leaderTeam}>{p.teamAbbrev}</span>
      <span className={styles.leaderVal}>{fmt ? fmt(p.value) : p.value}</span>
    </div>
  )
}

function LeaderCard({ title, players, fmt, onExpand, onPlayerClick }: {
  title: string
  players: NHLLeaderPlayer[]
  fmt?: (v: number) => string
  onExpand: () => void
  onPlayerClick: (id: number) => void
}) {
  return (
    <div className={styles.leaderCard}>
      <div className={`${styles.leaderCardTitle} ${styles.leaderCardClickable}`} onClick={onExpand}>{title}</div>
      {players.map((p, i) => (
        <LeaderRow key={p.id} p={p} i={i} fmt={fmt} onPlayerClick={onPlayerClick} />
      ))}
      <div className={styles.leaderCardMore} onClick={onExpand}>See more →</div>
    </div>
  )
}

function LeaderModal({ modal, onClose, onPlayerClick }: {
  modal: ExpandedModal
  onClose: () => void
  onPlayerClick: (id: number) => void
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
            <LeaderRow key={p.id} p={p} i={i} fmt={modal.fmt} onPlayerClick={onPlayerClick} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NHLLeaders() {
  const { skaterLeaders, goalieLeaders, rookieLeaders, loading, error } = useNHLLeaders()
  const [tab, setTab] = useState<'skaters' | 'goalies' | 'rookies'>('skaters')
  const [modal, setModal] = useState<ExpandedModal | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)

  async function openModal(type: 'skater' | 'goalie' | 'rookie', cat: { key: string; label: string; fmt?: (v: number) => string }) {
    setModal({ title: cat.label, players: null, fmt: cat.fmt, loading: true, error: null })
    try {
      const players = type === 'skater'
        ? await nhlApi.skaterLeadersByCategory(cat.key, 20)
        : type === 'goalie'
        ? await nhlApi.goalieLeadersByCategory(cat.key, 20)
        : await nhlApi.rookieLeadersByCategory(cat.key, 20)
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
      {selectedPlayerId && <NHLPlayerModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />}

      <div className={styles.tabs}>
        {(['skaters', 'goalies', 'rookies'] as const).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'skaters' && skaterLeaders && (
        <div className={styles.leadersGrid}>
          {SKATER_CATS.map(cat => skaterLeaders[cat.key]?.length ? (
            <LeaderCard
              key={cat.key}
              title={cat.label}
              players={skaterLeaders[cat.key]}
              fmt={cat.fmt}
              onExpand={() => openModal('skater', cat)}
              onPlayerClick={handlePlayerClick}
            />
          ) : null)}
        </div>
      )}

      {tab === 'goalies' && goalieLeaders && (
        <div className={styles.leadersGrid}>
          {GOALIE_CATS.map(cat => goalieLeaders[cat.key]?.length ? (
            <LeaderCard
              key={cat.key}
              title={cat.label}
              players={goalieLeaders[cat.key]}
              fmt={cat.fmt}
              onExpand={() => openModal('goalie', cat)}
              onPlayerClick={handlePlayerClick}
            />
          ) : null)}
        </div>
      )}

      {tab === 'rookies' && rookieLeaders && (
        <div className={styles.leadersGrid}>
          {ROOKIE_CATS.map(cat => rookieLeaders[cat.key]?.length ? (
            <LeaderCard
              key={cat.key}
              title={cat.label}
              players={rookieLeaders[cat.key]}
              fmt={cat.fmt}
              onExpand={() => openModal('rookie', cat)}
              onPlayerClick={handlePlayerClick}
            />
          ) : null)}
        </div>
      )}
    </div>
  )
}
