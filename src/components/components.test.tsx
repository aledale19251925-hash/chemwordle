import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import type { Molecule, Stats, GameState } from '../types'

// ── Framer Motion mock ────────────────────────────────────────────────────────
// Uses ref+setAttribute so inline rgba() values are preserved without JSDOM normalization.
// This lets [style*="rgba(0,0,0"] selectors work correctly in tests.

function mockDiv({ children, animate, transition, initial, exit, whileTap, whileHover, style, ...props }: any) {
  const ref = (node: HTMLElement | null) => {
    if (node && style) {
      const str = Object.entries(style as Record<string, unknown>)
        .map(([k, v]) => {
          const css = k.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`)
          return `${css}:${v}`
        })
        .join(';')
      node.setAttribute('style', str)
    }
  }
  return <div ref={ref} style={style} {...props}>{children}</div>
}

function mockButton({ children, whileTap, animate, transition, style, ...props }: any) {
  return <button style={style} {...props}>{children}</button>
}

vi.mock('framer-motion', () => ({
  motion: { div: mockDiv, button: mockButton },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// ── Components under test ─────────────────────────────────────────────────────

import { Tile }         from './Tile'
import { GameBoard }    from './GameBoard'
import { Keyboard }     from './Keyboard'
import { Header }       from './Header'
import { Toast }        from './Toast'
import { MoleculeCard } from './MoleculeCard'
import { Modal }        from './Modal'

// ── Test fixtures ─────────────────────────────────────────────────────────────

const baseMol: Molecule = {
  id: 'water',
  normalized_name: 'WATER',
  display_name: 'Water',
  formula: 'H₂O',
  category: 'common',
  difficulty: 1,
  fun_fact: 'Covers 71% of Earth surface',
  applications: ['Drinking', 'Cooking'],
  pubchem_cid: 962,
  aliases: [],
  molecular_weight: 18,
  smiles: 'O',
  language: 'en',
  scheduled_date: null,
}

const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
}

const baseGameState: GameState = {
  dayIndex: 1,
  target: 'WATER',
  guesses: [],
  feedbacks: [],
  status: 'won',
  revealedMolecule: baseMol,
}

// ── Gruppo 1: Tile ────────────────────────────────────────────────────────────

describe('Tile', () => {
  it('1 — Tile vuoto renderizza senza lettera', () => {
    render(<Tile letter="" status="empty" />)
    expect(screen.getByRole('presentation')).toBeInTheDocument()
  })

  it('2 — Tile con lettera mostra il carattere', () => {
    render(<Tile letter="H" status="current" />)
    expect(screen.getByText('H')).toBeInTheDocument()
  })

  it('3 — Tile space renderizza div senza testo', () => {
    render(<Tile letter=" " status="space" />)
    expect(screen.queryByText(' ')).not.toBeInTheDocument()
  })

  it('4 — Tile status correct ha colore corretto', () => {
    render(<Tile letter="H" status="correct" />)
    const tile = screen.getByText('H').closest('div')
    expect(tile).toHaveStyle({ backgroundColor: '#15803d' })
  })
})

// ── Gruppo 2: GameBoard ───────────────────────────────────────────────────────

describe('GameBoard', () => {
  const defaultProps = {
    guesses: [] as string[],
    feedbacks: [] as any[][],
    currentGuess: ['', '', '', '', ''],
    wordLength: 5,
    target: 'WATER',
    gameStatus: 'playing' as const,
    invalidGuess: false,
  }

  it('5 — GameBoard renderizza 6 righe × wordLength celle', () => {
    render(<GameBoard {...defaultProps} />)
    expect(document.querySelectorAll('[data-testid="tile"]')).toHaveLength(30)
  })

  it('6 — GameBoard mostra la lettera della riga corrente', () => {
    render(<GameBoard {...defaultProps} currentGuess={['W', 'A', '', '', '']} />)
    expect(screen.getByText('W')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('7 — GameBoard con riga già giocata mostra le lettere', () => {
    render(
      <GameBoard
        {...defaultProps}
        guesses={['WATER']}
        feedbacks={[['correct', 'absent', 'present', 'absent', 'correct'] as any]}
      />
    )
    expect(screen.getByText('W')).toBeInTheDocument()
  })
})

// ── Gruppo 3: Keyboard ────────────────────────────────────────────────────────

describe('Keyboard', () => {
  const defaultProps = {
    onKey: vi.fn(),
    onEnter: vi.fn(),
    onDelete: vi.fn(),
    keyStatuses: {} as Record<string, any>,
    soundEnabled: true,
    onToggleSound: vi.fn(),
  }

  it('8 — Keyboard renderizza tutti i tasti QWERTY', () => {
    render(<Keyboard {...defaultProps} />)
    expect(screen.getByText('Q')).toBeInTheDocument()
    expect(screen.getByText('Z')).toBeInTheDocument()
    expect(screen.getByText('ENTER')).toBeInTheDocument()
    expect(screen.getByText('DEL')).toBeInTheDocument()
  })

  it('9 — Click su tasto chiama onKey con lettera uppercase', () => {
    const onKey = vi.fn()
    render(<Keyboard {...defaultProps} onKey={onKey} />)
    fireEvent.click(screen.getByText('A'))
    expect(onKey).toHaveBeenCalledWith('A')
  })

  it('10 — Click su ENTER chiama onEnter', () => {
    const onEnter = vi.fn()
    render(<Keyboard {...defaultProps} onEnter={onEnter} />)
    fireEvent.click(screen.getByText('ENTER'))
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('11 — Click su DEL chiama onDelete', () => {
    const onDelete = vi.fn()
    render(<Keyboard {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('DEL'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('12 — Sound toggle button: mostra 🔊 quando soundEnabled=true', () => {
    render(<Keyboard {...defaultProps} soundEnabled={true} />)
    expect(screen.getByLabelText('Toggle sound')).toHaveTextContent('🔊')
  })

  it('13 — Sound toggle button: mostra 🔇 quando soundEnabled=false', () => {
    render(<Keyboard {...defaultProps} soundEnabled={false} />)
    expect(screen.getByLabelText('Toggle sound')).toHaveTextContent('🔇')
  })
})

// ── Gruppo 4: Header ──────────────────────────────────────────────────────────

describe('Header', () => {
  it('14 — Header mostra titolo ChemWordle', () => {
    render(<Header streak={3} dayNumber={42} onStatsClick={vi.fn()} onHelpClick={vi.fn()} />)
    expect(screen.getByText(/ChemWordle/i)).toBeInTheDocument()
  })

  it('15 — Header mostra streak quando > 0', () => {
    render(<Header streak={7} dayNumber={1} onStatsClick={vi.fn()} onHelpClick={vi.fn()} />)
    expect(screen.getByText(/7/)).toBeInTheDocument()
  })

  it('16 — Header non mostra streak quando streak = 0', () => {
    render(<Header streak={0} dayNumber={1} onStatsClick={vi.fn()} onHelpClick={vi.fn()} />)
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument()
  })
})

// ── Gruppo 5: Toast ───────────────────────────────────────────────────────────

describe('Toast', () => {
  it('17 — Toast visibile con message', () => {
    render(<Toast message="Genius!" fading={false} />)
    expect(screen.getByText('Genius!')).toBeInTheDocument()
  })

  it('18 — Toast non renderizza quando message = null', () => {
    render(<Toast message={null} fading={false} />)
    expect(screen.queryByText(/./)).not.toBeInTheDocument()
  })
})

// ── Gruppo 6: MoleculeCard ────────────────────────────────────────────────────

describe('MoleculeCard', () => {
  it('19 — MoleculeCard mostra nome, formula e fun fact', () => {
    render(<MoleculeCard molecule={baseMol} gameStatus="won" />)
    expect(screen.getByText('Water')).toBeInTheDocument()
    expect(screen.getByText('H₂O')).toBeInTheDocument()
    expect(screen.getByText(/Covers 71%/)).toBeInTheDocument()
  })

  it('20 — MoleculeCard mostra max 3 application pills', () => {
    const mol: Molecule = { ...baseMol, applications: ['A', 'B', 'C', 'D'] as any }
    render(<MoleculeCard molecule={mol} gameStatus="won" />)
    expect(screen.getAllByText(/^(A|B|C)$/)).toHaveLength(3)
    expect(screen.queryByText('D')).not.toBeInTheDocument()
  })
})

// ── Gruppo 7: Modal (result) ───────────────────────────────────────────────────

describe('Modal', () => {
  const defaultModalProps = {
    visible: true,
    gameStatus: 'won' as const,
    molecule: baseMol,
    stats: EMPTY_STATS,
    gameState: baseGameState,
    onClose: vi.fn(),
  }

  it('21 — Modal non renderizza quando visible=false', () => {
    render(<Modal {...defaultModalProps} visible={false} />)
    expect(screen.queryByText(/Share/i)).not.toBeInTheDocument()
  })

  it('22 — Modal renderizza quando visible=true', () => {
    render(<Modal {...defaultModalProps} />)
    expect(screen.getByText(/Share/i)).toBeInTheDocument()
    expect(screen.getByText(/You got it/i)).toBeInTheDocument()
  })

  it('23 — Click su backdrop chiama onClose', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultModalProps} onClose={onClose} />)
    const backdrop = document.querySelector('[style*="rgba(0,0,0"]')
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('24 — Click su X chiama onClose', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultModalProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('25 — Modal lost mostra messaggio diverso', () => {
    render(<Modal {...defaultModalProps} gameStatus="lost" />)
    expect(screen.getByText(/Better luck/i)).toBeInTheDocument()
  })
})
