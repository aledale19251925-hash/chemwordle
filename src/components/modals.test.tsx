import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import type { Molecule, Stats, GameState } from '../types'

// ── Framer Motion mock ────────────────────────────────────────────────────────

function mockDiv({ children, animate, transition, initial, exit, whileTap, whileHover, style, ...props }: any) {
  const ref = (node: HTMLElement | null) => {
    if (node && style) {
      const str = Object.entries(style as Record<string, unknown>)
        .map(([k, v]) => {
          const css = k.replace(/([A-Z])/g, (m: string) => `-${m.toLowerCase()}`)
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

import { Modal }      from './Modal'
import { StatsModal } from './StatsModal'

// ── Test fixtures ─────────────────────────────────────────────────────────────

const baseMol: Molecule = {
  id: 'water',
  normalized_name: 'WATER',
  display_name: 'Water',
  formula: 'H₂O',
  category: 'common',
  difficulty: 1,
  fun_fact: 'Covers 71% of Earth',
  applications: ['Drinking', 'Cooking'],
  pubchem_cid: 962,
  aliases: [],
  molecular_weight: 18,
  smiles: 'O',
  language: 'en',
  scheduled_date: null,
}

const WON_STATS: Stats = {
  gamesPlayed: 10,
  gamesWon: 7,
  currentStreak: 3,
  bestStreak: 5,
  guessDistribution: [1, 2, 3, 1, 0, 0],
  lastPlayedDate: '2026-03-18',
}

const wonGameState: GameState = {
  dayIndex: 42,
  target: 'WATER',
  guesses: ['WATER'],
  feedbacks: [[
    { letter: 'W', status: 'correct' },
    { letter: 'A', status: 'correct' },
    { letter: 'T', status: 'correct' },
    { letter: 'E', status: 'correct' },
    { letter: 'R', status: 'correct' },
  ]],
  status: 'won',
  revealedMolecule: baseMol,
}

const lostGameState: GameState = {
  ...wonGameState,
  guesses: ['AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF'],
  feedbacks: Array(6).fill([{ letter: 'A', status: 'absent' }]),
  status: 'lost',
}

// ── Gruppo 1: Modal (result) ───────────────────────────────────────────────────

describe('Modal', () => {
  const defaultProps = {
    visible: true,
    gameStatus: 'won' as const,
    molecule: baseMol,
    stats: WON_STATS,
    gameState: wonGameState,
    onClose: vi.fn(),
  }

  it('1 — non renderizza quando visible=false', () => {
    render(<Modal {...defaultProps} visible={false} />)
    expect(screen.queryByText(/Share/i)).not.toBeInTheDocument()
  })

  it('2 — renderizza quando visible=true', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText(/Share/i)).toBeInTheDocument()
  })

  it('3 — mostra "You got it" quando won', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText(/You got it/i)).toBeInTheDocument()
  })

  it('4 — mostra "Better luck" quando lost', () => {
    render(<Modal {...defaultProps} gameStatus="lost" gameState={lostGameState} />)
    expect(screen.getByText(/Better luck/i)).toBeInTheDocument()
  })

  it('5 — mostra WIN_MESSAGE Genius! per 1 guess', () => {
    render(<Modal {...defaultProps} />)
    // wonGameState has 1 guess → WIN_MESSAGES[1] = 'Genius!'
    expect(screen.getByText(/Genius!/)).toBeInTheDocument()
  })

  it('6 — mostra nome della molecola', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('Water')).toBeInTheDocument()
  })

  it('7 — mostra formula della molecola', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('H₂O')).toBeInTheDocument()
  })

  it('8 — mostra countdown "Next molecule in:"', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText(/Next molecule in/i)).toBeInTheDocument()
  })

  it('9 — mostra dayIndex nella footer', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText(/ChemWordle #42/)).toBeInTheDocument()
  })

  it('10 — mostra statistiche: Played, Win %, Streak, Best', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('Played')).toBeInTheDocument()
    expect(screen.getByText('Win %')).toBeInTheDocument()
    expect(screen.getByText('Streak')).toBeInTheDocument()
    expect(screen.getByText('Best')).toBeInTheDocument()
  })

  it('11 — calcola Win % correttamente (7/10 = 70%)', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('70')).toBeInTheDocument()
  })

  it('12 — click su backdrop chiama onClose', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    const backdrop = document.querySelector('[style*="rgba(0,0,0"]')
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('13 — click su X chiama onClose', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('14 — molecule=null non renderizza quando visible=true', () => {
    render(<Modal {...defaultProps} molecule={null} />)
    expect(screen.queryByText(/Share/i)).not.toBeInTheDocument()
  })
})

// ── Gruppo 2: StatsModal ──────────────────────────────────────────────────────

describe('StatsModal', () => {
  const defaultProps = {
    visible: true,
    stats: WON_STATS,
    currentGameState: wonGameState,
    onClose: vi.fn(),
  }

  it('15 — non renderizza quando visible=false', () => {
    render(<StatsModal {...defaultProps} visible={false} />)
    expect(screen.queryByText('STATISTICS')).not.toBeInTheDocument()
  })

  it('16 — renderizza quando visible=true', () => {
    render(<StatsModal {...defaultProps} />)
    expect(screen.getByText('STATISTICS')).toBeInTheDocument()
  })

  it('17 — mostra gamesPlayed', () => {
    render(<StatsModal {...defaultProps} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('18 — mostra Win % (7/10 = 70)', () => {
    render(<StatsModal {...defaultProps} />)
    expect(screen.getByText('70')).toBeInTheDocument()
  })

  it('19 — mostra currentStreak nel grid', () => {
    render(<StatsModal {...defaultProps} />)
    const streakLabel = screen.getByText('Streak')
    const streakValue = streakLabel.previousElementSibling
    expect(streakValue?.textContent).toBe('3')
  })

  it('20 — mostra bestStreak nel grid', () => {
    render(<StatsModal {...defaultProps} />)
    const bestLabel = screen.getByText('Best')
    const bestValue = bestLabel.previousElementSibling
    expect(bestValue?.textContent).toBe('5')
  })

  it('21 — mostra "Guess Distribution"', () => {
    render(<StatsModal {...defaultProps} />)
    expect(screen.getByText(/Guess Distribution/i)).toBeInTheDocument()
  })

  it('22 — click su X chiama onClose', () => {
    const onClose = vi.fn()
    render(<StatsModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close stats'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('23 — click su backdrop chiama onClose', () => {
    const onClose = vi.fn()
    render(<StatsModal {...defaultProps} onClose={onClose} />)
    const backdrop = document.querySelector('[style*="rgba(0,0,0"]')
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
