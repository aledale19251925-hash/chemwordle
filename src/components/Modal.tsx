import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MoleculeCard } from './MoleculeCard'
import { buildShareText } from '../utils/gameLogic'
import { WIN_MESSAGES } from '../utils/messages'
import { getMidnightCountdown } from '../utils/countdown'
import type { Molecule, Stats, GameState } from '../types'

interface ModalProps {
  visible: boolean
  gameStatus: 'playing' | 'won' | 'lost'
  molecule: Molecule | null
  stats: Stats
  gameState: GameState
  onClose: () => void
}

export function Modal({ visible, gameStatus, molecule, stats, gameState, onClose }: ModalProps) {
  const [countdown, setCountdown] = useState(getMidnightCountdown)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setCountdown(getMidnightCountdown()), 1000)
    return () => clearInterval(id)
  }, [visible])

  const won = gameStatus === 'won'
  const guessCount = gameState.guesses.length
  const winPct = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0

  function handleShare() {
    const text = buildShareText(gameState)
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {visible && molecule && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            key="modal-card"
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #3a3a3a',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              position: 'relative',
              maxHeight: '90dvh',
              overflowY: 'auto',
            }}
          >
            <button
              aria-label="Close"
              onClick={onClose}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4a5a4a', fontSize: 22, lineHeight: 1, padding: '2px 6px',
              }}
            >×</button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: won ? '#86efac' : '#f87171', marginBottom: 4 }}>
                {won ? '🎉 You got it!' : '😔 Better luck tomorrow'}
              </div>
              <div style={{ color: '#6a9a6a', fontSize: '0.9rem' }}>
                {won
                  ? (WIN_MESSAGES[guessCount] ?? 'Well done!') + ` — ${guessCount}/6`
                  : `The answer was ${molecule.display_name}`}
              </div>
            </div>

            {/* Molecule card */}
            <div style={{ marginBottom: 20 }}>
              <MoleculeCard molecule={molecule} gameStatus={gameStatus} />
            </div>

            {/* Mini stats row */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
              {[
                { label: 'Played', value: stats.gamesPlayed },
                { label: 'Win %',  value: winPct },
                { label: 'Streak', value: stats.currentStreak },
                { label: 'Best',   value: stats.bestStreak },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#86efac', fontWeight: 800, fontSize: '1.4rem' }}>{value}</div>
                  <div style={{ color: '#4a6a4a', fontSize: '0.65rem', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                width: '100%', padding: '12px 0',
                backgroundColor: '#14532d', color: '#86efac',
                border: '1px solid #86efac', borderRadius: 8,
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginBottom: 14,
              }}
            >
              {copied ? '✓ Copied!' : '📤 Share result'}
            </button>

            {/* Countdown */}
            <div style={{ textAlign: 'center', color: '#4a6a4a', fontSize: '0.8rem' }}>
              Next molecule in:{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#86efac' }}>{countdown}</span>
            </div>
            <div style={{ textAlign: 'center', color: '#1a2a1a', fontSize: '0.7rem', marginTop: 10 }}>
              ChemWordle #{gameState.dayIndex}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
