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
  correct: { bg: '#15803d', border: '#15803d', color: '#ffffff' },
  present: { bg: '#854d0e', border: '#854d0e', color: '#ffffff' },
  absent:  { bg: '#1e1e1e', border: '#404040', color: '#888888' },
  current: { bg: 'transparent', border: '#4ade80', color: '#e8f5e8' },
  empty:   { bg: 'transparent', border: '#2d5a2d', color: '#e8f5e8' },
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
        style={{ width: 52, height: 52, background: '#1a1a1a', borderRadius: 8 }}
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
          ? { borderColor: ['#2d5a2d', '#4ade80', '#2d5a2d'] }
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
