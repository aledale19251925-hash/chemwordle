import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Tile } from './Tile'
import type { TileStatus, GameStatus, LetterFeedback } from '../types'

interface GameBoardProps {
  guesses: string[]
  feedbacks: LetterFeedback[][] | TileStatus[][]
  currentGuess: string[]
  wordLength: number
  target: string
  gameStatus: GameStatus
  invalidGuess: boolean
  tileSize?: number  // optional override; if omitted, computed from wordLength
}

type RowData = {
  letters: string[]
  statuses: (TileStatus | 'empty' | 'current' | 'space')[]
  isCurrentRow: boolean
}

function buildRows({
  guesses,
  feedbacks,
  currentGuess,
  wordLength,
  target,
  gameStatus,
}: GameBoardProps): RowData[] {
  const rows: RowData[] = []

  for (let i = 0; i < guesses.length; i++) {
    const letters = guesses[i].split('')
    const statuses = (feedbacks[i] as (LetterFeedback | TileStatus)[]).map((f, j) => {
      if (target[j] === ' ') return 'space'
      const status: TileStatus = typeof f === 'object' ? (f as LetterFeedback).status : f as TileStatus
      return status
    }) as (TileStatus | 'space')[]
    rows.push({ letters, statuses, isCurrentRow: false })
  }

  if (gameStatus === 'playing' && guesses.length < 6) {
    const letters = Array.from({ length: wordLength }, (_, j) =>
      target[j] === ' ' ? ' ' : (currentGuess[j] ?? '')
    )
    const statuses = letters.map((ch, j) => {
      if (target[j] === ' ') return 'space'
      return ch !== '' ? 'current' : 'empty'
    }) as (TileStatus | 'empty' | 'current' | 'space')[]
    rows.push({ letters, statuses, isCurrentRow: true })
  }

  while (rows.length < 6) {
    rows.push({
      letters: Array(wordLength).fill(''),
      statuses: Array.from({ length: wordLength }, (_, j) =>
        target[j] === ' ' ? 'space' : 'empty'
      ) as (TileStatus | 'empty' | 'space')[],
      isCurrentRow: false,
    })
  }

  return rows
}

function RowWrapper({ children, shake }: { children: ReactNode; shake: boolean }) {
  return (
    <motion.div
      data-testid="tile"
      animate={shake ? { x: [0, -8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

export function GameBoard(props: GameBoardProps) {
  const { wordLength, invalidGuess, tileSize } = props

  const TILE_SIZE = tileSize ?? (() => {
    if (wordLength <= 6)  return 56
    if (wordLength <= 9)  return 52
    if (wordLength <= 12) return 46
    if (wordLength <= 15) return 40
    return 36
  })()

  const GAP = wordLength <= 9 ? 6 : 4
  const rows = buildRows(props)
  const gridWidth = wordLength * TILE_SIZE + (wordLength - 1) * GAP

  return (
    <div style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${wordLength}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(6, ${TILE_SIZE}px)`,
          gap: `${GAP}px`,
          width: `${gridWidth}px`,
          margin: '0 auto',
        }}
      >
        {rows.map((row, rowIdx) =>
          row.letters.map((letter, colIdx) => (
            <RowWrapper
              key={`${rowIdx}-${colIdx}`}
              shake={invalidGuess && row.isCurrentRow}
            >
              <Tile
                letter={letter}
                status={row.statuses[colIdx]}
                delay={colIdx}
                isCurrentRow={row.isCurrentRow}
              />
            </RowWrapper>
          ))
        )}
      </div>
    </div>
  )
}
