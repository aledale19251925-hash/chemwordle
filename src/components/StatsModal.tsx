import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { getMidnightCountdown } from '../utils/countdown'
import type { Stats, GameState } from '../types'

interface StatsModalProps {
  visible: boolean
  stats: Stats
  currentGameState: GameState
  onClose: () => void
}

export function StatsModal({ visible, stats, onClose, currentGameState }: StatsModalProps) {
  const [countdown, setCountdown] = useState(getMidnightCountdown)
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setCountdown(getMidnightCountdown()), 1000)
    return () => clearInterval(id)
  }, [visible])

  const dist = stats.guessDistribution // number[] length 6, index 0 = won in 1 guess
  const maxCount = Math.max(1, ...dist)
  const winPct = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0
  // Which row to highlight (0-indexed guess count - 1), only if game is won today
  const highlightIdx = currentGameState.status === 'won' ? currentGameState.guesses.length - 1 : -1

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="stats-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            key="stats-card"
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
              maxWidth: 380,
              position: 'relative',
            }}
          >
            <button
              aria-label="Close stats"
              onClick={onClose}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4a5a4a', fontSize: 22, lineHeight: 1, padding: '2px 6px',
              }}
            >×</button>

            <h2 style={{ color: '#86efac', textAlign: 'center', marginBottom: 20, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.08em' }}>
              STATISTICS
            </h2>

            {/* 2×2 stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Played',   value: stats.gamesPlayed },
                { label: 'Win %',    value: winPct },
                { label: 'Streak',   value: stats.currentStreak },
                { label: 'Best',     value: stats.bestStreak },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center', backgroundColor: '#0d1f0d', borderRadius: 8, padding: '12px 8px' }}>
                  <div style={{ color: '#86efac', fontWeight: 800, fontSize: '1.8rem' }}>{value}</div>
                  <div style={{ color: '#4a6a4a', fontSize: '0.7rem', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ color: '#6a9a6a', fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
              Guess Distribution
            </h3>

            {dist.map((count, idx) => {
              const guessNum = idx + 1
              const pct = Math.round((count / maxCount) * 100)
              const isHighlighted = idx === highlightIdx
              return (
                <div key={guessNum} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ color: '#6a9a6a', fontSize: '0.8rem', width: 12 }}>{guessNum}</span>
                  <div style={{ flex: 1, height: 22, backgroundColor: '#1a2a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                      style={{
                        height: '100%',
                        backgroundColor: isHighlighted ? '#15803d' : '#14532d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 6,
                        borderRadius: 4,
                      }}
                    >
                      {count > 0 && (
                        <span style={{ color: '#86efac', fontSize: '0.75rem', fontWeight: 700 }}>{count}</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              )
            })}

            {/* Countdown */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #2a2a2a', textAlign: 'center' }}>
              <p style={{ color: '#aaaaaa', fontSize: '0.8rem', margin: '0 0 6px 0' }}>
                Prossima molecola in
              </p>
              <p style={{
                color: '#ffffff', fontSize: '1.8rem', fontWeight: 700,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em', margin: 0,
              }}>
                {countdown}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
