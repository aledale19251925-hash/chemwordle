import type { Molecule, GameStatus } from '../types'

interface MoleculeCardProps {
  molecule: Molecule
  gameStatus: GameStatus
}

function renderDifficultyDots(difficulty: 1 | 2 | 3): string {
  if (difficulty === 1) return '●○○'
  if (difficulty === 2) return '●●○'
  return '●●●'
}

export function MoleculeCard({ molecule }: MoleculeCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>

      {/* Badge + difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: '#15803d',
          color: '#fff',
          borderRadius: 50,
          padding: '3px 10px',
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {molecule.category}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#4ade80', letterSpacing: '2px' }}>
          {renderDifficultyDots(molecule.difficulty)}
        </span>
      </div>

      {/* Molecule name */}
      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#e8f5e8', textAlign: 'center', letterSpacing: '0.03em' }}>
        {molecule.display_name}
      </div>

      {/* Formula */}
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.05em' }}>
        {molecule.formula}
      </div>

      {/* Fun fact */}
      <div style={{
        background: '#0d1f0d',
        borderLeft: '3px solid #4ade80',
        borderRadius: '0 8px 8px 0',
        padding: '10px 14px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <p style={{ color: '#a8d4a8', fontStyle: 'italic', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
          {molecule.fun_fact}
        </p>
      </div>

      {/* Applications */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', width: '100%' }}>
        {molecule.applications.slice(0, 3).map(app => (
          <span key={app} style={{
            background: '#1e1e1e',
            color: '#888888',
            borderRadius: 50,
            padding: '3px 10px',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}>
            {app}
          </span>
        ))}
      </div>

      {/* TODO Step 7: 3D molecule viewer */}
      <div style={{ height: 4 }} />
    </div>
  )
}
