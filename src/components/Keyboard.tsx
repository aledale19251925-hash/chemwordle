import { motion } from 'framer-motion'
import type { LetterStatus } from '../types'

interface KeyboardProps {
  onKey: (letter: string) => void
  onEnter: () => void
  onDelete: () => void
  keyStatuses: Record<string, LetterStatus>
  soundEnabled: boolean
  onToggleSound: () => void
}

const ROW1 = ['Q','W','E','R','T','Y','U','I','O','P']
const ROW2 = ['A','S','D','F','G','H','J','K','L']
const ROW3 = ['ENTER','Z','X','C','V','B','N','M','DEL']

const KEY_BG: Record<string, string> = {
  correct: '#15803d',
  present: '#854d0e',
  absent:  '#1e1e1e',
}

const KEY_COLOR: Record<string, string> = {
  correct: '#ffffff',
  present: '#ffffff',
  absent:  '#888888',
}

interface KeyButtonProps {
  label: string
  onKey: (letter: string) => void
  onEnter: () => void
  onDelete: () => void
  status?: LetterStatus
}

function KeyButton({ label, onKey, onEnter, onDelete, status }: KeyButtonProps) {
  const isSpecial = label === 'ENTER' || label === 'DEL'
  const bg = status ? (KEY_BG[status] ?? '#1e3a1e') : '#1e3a1e'
  const color = status ? (KEY_COLOR[status] ?? '#e8f5e8') : '#e8f5e8'

  function handleClick() {
    if (label === 'ENTER') onEnter()
    else if (label === 'DEL') onDelete()
    else onKey(label)
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={handleClick}
      style={{
        minWidth: isSpecial ? 54 : 34,
        height: 52,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: bg,
        color,
        fontWeight: 700,
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        padding: '0 4px',
      }}
    >
      {label}
    </motion.button>
  )
}

export function Keyboard({ onKey, onEnter, onDelete, keyStatuses, soundEnabled, onToggleSound }: KeyboardProps) {
  const rows = [ROW1, ROW2, ROW3]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, userSelect: 'none' }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 6 }}>
          {row.map(key => (
            <KeyButton
              key={key}
              label={key}
              onKey={onKey}
              onEnter={onEnter}
              onDelete={onDelete}
              status={keyStatuses[key]}
            />
          ))}
        </div>
      ))}

      {/* Sound toggle */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', paddingRight: 4, marginTop: 4 }}>
        <button
          onClick={onToggleSound}
          aria-label="Toggle sound"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#1e3a1e',
            border: '1px solid #2d5a2d',
            color: '#e8f5e8',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  )
}
