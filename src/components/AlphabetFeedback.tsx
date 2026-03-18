import type { LetterStatus } from '../types'

interface AlphabetFeedbackProps {
  keyStatuses: Record<string, LetterStatus>
}

const ROW1 = 'ABCDEFGHIJKLM'.split('')
const ROW2 = 'NOPQRSTUVWXYZ'.split('')

const STATUS_COLORS: Record<string, { background: string; color: string; border?: string }> = {
  correct: { background: '#16a34a', color: '#ffffff' },
  present: { background: '#ca8a04', color: '#ffffff' },
  absent:  { background: '#1a1a1a', color: '#666666' },
}
const DEFAULT_COLORS = { background: '#3a3a3a', color: '#ffffff', border: '1px solid #555' }

function LetterChip({ letter, status }: { letter: string; status?: LetterStatus }) {
  const colors = status ? (STATUS_COLORS[status] ?? DEFAULT_COLORS) : DEFAULT_COLORS
  return (
    <div
      style={{
        width: 24, height: 24,
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 700,
        background: colors.background,
        color: colors.color,
        border: colors.border ?? 'none',
        transition: 'background 0.3s, color 0.3s',
        userSelect: 'none',
      }}
    >
      {letter}
    </div>
  )
}

export function AlphabetFeedback({ keyStatuses }: AlphabetFeedbackProps) {
  return (
    <div
      data-testid="alphabet-feedback"
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4,
        padding: '8px 0',
      }}
    >
      {[ROW1, ROW2].map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 4 }}>
          {row.map(letter => (
            <LetterChip
              key={letter}
              letter={letter}
              status={keyStatuses[letter]}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
