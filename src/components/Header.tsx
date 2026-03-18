interface HeaderProps {
  streak: number
  dayNumber: number
  onStatsClick: () => void
  onHelpClick: () => void
}

export function Header({ streak, dayNumber: _dayNumber, onStatsClick, onHelpClick }: HeaderProps) {
  return (
    <header
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #2a2a2a',
        backgroundColor: '#111111',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Left — logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="4" fill="#16a34a" />
          <circle cx="6"  cy="10" r="3" fill="#ca8a04" />
          <circle cx="26" cy="10" r="3" fill="#ca8a04" />
          <circle cx="16" cy="28" r="3" fill="#3b82f6" />
          <line x1="16" y1="16" x2="6"  y2="10" stroke="#888888" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="26" y2="10" stroke="#888888" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="16" y2="28" stroke="#888888" strokeWidth="1.5" />
        </svg>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff' }}>
            ChemWordle
          </h1>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#aaaaaa', letterSpacing: '0.02em' }}>
            Indovina la molecola del giorno
          </p>
        </div>
      </div>

      {/* Right — stats + streak + help */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
            🔥 {streak}
          </div>
        )}
        <button
          onClick={onStatsClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
          aria-label="Statistics"
        >
          📊
        </button>
        <button
          onClick={onHelpClick}
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Help"
        >
          ?
        </button>
      </div>
    </header>
  )
}
