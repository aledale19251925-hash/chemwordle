import type { AtomType } from '../types'

interface AtomLegendProps {
  atomTypes: AtomType[]
}

export function AtomLegend({ atomTypes }: AtomLegendProps) {
  if (atomTypes.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      padding: '4px 16px',
    }}>
      {atomTypes.map(({ symbol, color, label }) => (
        <div
          key={symbol}
          title={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            backgroundColor: '#1e1e1e',
            border: '1px solid #3a3a3a',
            borderRadius: 20,
            padding: '3px 10px 3px 6px',
          }}
        >
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: color,
            border: '1px solid rgba(255,255,255,0.2)',
            flexShrink: 0,
          }} />
          <span style={{ color: '#cccccc', fontSize: '0.78rem', fontWeight: 600 }}>
            {symbol}
          </span>
        </div>
      ))}
    </div>
  )
}
