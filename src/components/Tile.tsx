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
  present: { bg: '#d97706', border: '#d97706', color: '#ffffff' },
  absent:  { bg: '#e5e7eb', border: '#e5e7eb', color: '#9ca3af' },
  current: { bg: '#ffffff', border: '#16a34a', color: '#1a1a1a' },
  empty:   { bg: '#ffffff', border: '#d1d5db', color: '#1a1a1a' },
}

export function Tile({ letter, status, delay = 0, isCurrentRow = false }: TileProps) {
  const isResult = status === 'correct' || status === 'present' || status === 'absent'

  // Start revealed=true if mounted with a result status (loaded state — no flip animation)
  const [revealed, setRevealed] = useState(() => isResult)
  const prevStatusRef = useRef<TileProps['status']>(status)

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    if (status === 'correct' || status === 'present' || status === 'absent') {
      if ((prev === 'empty' || prev === 'current') && !revealed) {
        // Tile transitioning from input → result: schedule color reveal mid-flip
        const t = setTimeout(() => setRevealed(true), delay * 120 + 250)
        return () => clearTimeout(t)
      }
      if (!revealed) {
        setRevealed(true)
      }
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Space separator — hooks must come before early returns
  if (status === 'space' || letter === ' ') {
    return (
      <div
        data-testid="tile"
        style={{ width: 52, height: 52, background: '#f3f4f6', borderRadius: 8 }}
      />
    )
  }

  const c = revealed ? (COLORS[status] ?? COLORS.empty) : COLORS.empty
  const isPulse = isCurrentRow && status === 'empty' && letter === ''
  const isFlipping = isResult && !revealed

  return (
    <motion.div
      role="presentation"
      animate={
        isFlipping
          ? { rotateY: [0, 90, 0] }
          : letter && status === 'current'
          ? { scale: [1, 1.12, 1] }
          : isPulse
          ? { borderColor: ['#d1d5db', '#16a34a', '#d1d5db'] }
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
        border: `2px solid ${c.border}`,
        backgroundColor: c.bg,
        color: c.color,
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
