interface OnboardingModalProps {
  onDismiss: () => void
}

const EXAMPLE_TILES = [
  { letter: 'W', color: '#16a34a', label: 'Posizione corretta' },
  { letter: 'A', color: '#ca8a04', label: 'Lettera presente, posizione sbagliata' },
  { letter: 'T', color: '#3a3a3a', label: 'Lettera non presente' },
]

export function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#1e1e1e',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #3a3a3a',
        }}
      >
        <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.2rem', textAlign: 'center' }}>
          🧪 Come si gioca
        </h2>
        <p style={{ color: '#cccccc', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
          Osserva la molecola 3D e indovina il nome del composto chimico.
          Hai <strong style={{ color: '#fff' }}>5 tentativi</strong>.
        </p>

        <div style={{ marginBottom: '20px' }}>
          {EXAMPLE_TILES.map(({ letter, color, label }) => (
            <div
              key={letter}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 6,
                backgroundColor: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                flexShrink: 0,
              }}>
                {letter}
              </div>
              <span style={{ color: '#cccccc', fontSize: '0.85rem' }}>{label}</span>
            </div>
          ))}
        </div>

        <p style={{ color: '#aaaaaa', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 20px' }}>
          💡 Una nuova molecola ogni giorno a mezzanotte
        </p>

        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '14px',
            backgroundColor: '#16a34a', color: '#ffffff',
            border: 'none', borderRadius: '10px',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          INIZIA A GIOCARE
        </button>
      </div>
    </div>
  )
}
