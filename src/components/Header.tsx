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
        borderBottom: '1px solid #1e3a1e',
        background: '#0d1505',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Help button */}
      <button
        onClick={onHelpClick}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#1e3a1e',
          border: '1px solid #2d5a2d',
          color: '#e8f5e8',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Help"
      >
        ?
      </button>

      {/* Centre — title */}
      <div style={{ textAlign: 'center' }}>
        {/* TODO: mascotte character placeholder */}
        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ade80', letterSpacing: '0.02em' }}>
          🧪 ChemWordle
        </div>
        <div style={{ fontSize: '0.65rem', color: '#6b9e6b', marginTop: 1 }}>
          Daily chemistry game
        </div>
      </div>

      {/* Right — stats + streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onStatsClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
          aria-label="Statistics"
        >
          📊
        </button>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.82rem', fontWeight: 700, color: '#e8f5e8' }}>
            🔥 {streak}
          </div>
        )}
      </div>
    </header>
  )
}
