import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tile } from './Tile'
import type { LetterResult } from '../types'

interface SingleRowBoardProps {
  answer: string
  currentGuess: string[]
  lockedLetters: (string | null)[]
  attemptNumber: number
  maxAttempts: number
  lastResults: LetterResult[] | null
  status: 'playing' | 'won' | 'lost'
  invalidGuess: boolean
}

export function SingleRowBoard({
  answer,
  currentGuess,
  lockedLetters,
  attemptNumber,
  maxAttempts,
  lastResults,
  status,
  invalidGuess,
}: SingleRowBoardProps) {
  const wordLength = answer.length

  // Force re-render on resize so tile size stays responsive
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const GAP = 6
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390
  const availableWidth = Math.min(viewportWidth - 32, 480)
  const TILE_SIZE = Math.min(72, Math.max(44, Math.floor((availableWidth - (wordLength - 1) * GAP) / wordLength)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Attempt counter */}
      <div style={{ color: '#6a9a6a', fontSize: '0.8rem', letterSpacing: '0.06em' }}>
        {status === 'playing'
          ? `Tentativo ${attemptNumber + 1} / ${maxAttempts}`
          : status === 'won'
          ? `Risolto in ${attemptNumber} / ${maxAttempts}`
          : `Nessun tentativo rimasto`}
      </div>

      {/* Single row of tiles */}
      <motion.div
        animate={invalidGuess ? { x: [0, -8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{
          display: 'flex',
          gap: GAP,
        }}
      >
        {Array.from({ length: wordLength }, (_, i) => {
          const char = answer[i]

          // Space tile
          if (char === ' ') {
            return (
              <div
                key={i}
                style={{ width: TILE_SIZE, height: TILE_SIZE, background: '#111111', borderRadius: 8 }}
              />
            )
          }

          const isLocked = lockedLetters[i] !== null
          const letter = currentGuess[i] ?? ''

          let tileStatus: 'correct' | 'absent' | 'present' | 'current' | 'empty'
          if (isLocked) {
            tileStatus = 'correct'
          } else if (lastResults && lastResults[i]) {
            // Show last result only if still on same attempt display — not needed
            // Actually for the current guess tiles, we show 'current' or 'empty'
            tileStatus = letter !== '' ? 'current' : 'empty'
          } else {
            tileStatus = letter !== '' ? 'current' : 'empty'
          }

          return (
            <div key={i} style={{ width: TILE_SIZE, height: TILE_SIZE }}>
              <Tile
                letter={letter}
                status={tileStatus}
                isCurrentRow={status === 'playing'}
              />
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
