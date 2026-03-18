import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { TileStatus } from '../types'

interface TileProps {
  letter: string
  status: TileStatus | 'empty' | 'current' | 'space'
  delay?: number
  isCurrentRow?: boolean
}

const COLORS: Record<string, { bg: string; border: string; color: string }> = {
  correct: { bg: '#16a34a', border: '#16a34a', color: '#ffffff' },
  present: { bg: '#ca8a04', border: '#ca8a04', color: '#ffffff' },
  absent:  { bg: '#3a3a3a', border: '#3a3a3a', color: '#ffffff' },
  current: { bg: '#1e1e1e', border: '#888888', color: '#ffffff' },
  empty:   { bg: 'transparent', border: '#2a2a2a', color: 'transparent' },
}

export function Tile({ letter, status, delay = 0, isCurrentRow = false }: TileProps) {
  const isResult = status === 'correct' || status === 'present' || status === 'absent'

  const [revealed, setRevealed] = useState(() => isResult)
  const prevStatusRef = useRef<TileProps['status']>(status)

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    if (status === 'correct' || status === 'present' || status === 'absent') {
      if ((prev === 'empty' || prev === 'current') && !revealed) {
        const t = setTimeout(() => setRevealed(true), delay * 120 + 250)
        return () => clearTimeout(t)
      }
      if (!revealed) {
        setRevealed(true)
      }
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Space separator
  if (status === 'space' || letter === ' ') {
    return (
      <div
        data-testid="tile"
        style={{ width: 52, height: 52, background: '#111111', borderRadius: 8 }}
      />
    )
  }

  const c = revealed ? (COLORS[status] ?? COLORS.empty) : COLORS.empty
  const isPulse = isCurrentRow && status === 'empty' && letter === ''
  const isFlipping = isResult && !revealed

  // Active tile (has letter, current row, not yet submitted)
  const activeStyle = letter && status === 'current'
    ? { bg: '#1e1e1e', border: '#888888', color: '#ffffff' }
    : null

  const displayColors = activeStyle ?? c

  return (
    <motion.div
      role="presentation"
      animate={
        isFlipping
          ? { rotateY: [0, 90, 0] }
          : letter && status === 'current'
          ? { scale: [1, 1.12, 1] }
          : isPulse
          ? { borderColor: ['#2a2a2a', '#555555', '#2a2a2a'] }
          : {}
      }
      transition={
        isFlipping
          ? { duration: 0.5, delay: delay * 0.12, ease: 'easeInOut' }
          : isPulse
          ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 400, damping: 17 }
      }
      style={{
        width: 52,
        height: 52,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${displayColors.border}`,
        backgroundColor: displayColors.bg,
        color: displayColors.color,
        fontSize: '1.2rem',
        fontWeight: 900,
        letterSpacing: '0.05em',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      {letter}
    </motion.div>
  )
}
