import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./hooks/useGame', () => ({ useGame: vi.fn() }))
vi.mock('./data/molecules', () => ({
  getDailyMolecule: vi.fn(() => ({ pubchem_cid: 962, display_name: 'Water', formula: 'H2O' })),
}))
vi.mock('./utils/pubchem', () => ({
  getAtomTypesFromFormula: vi.fn(() => []),
}))
vi.mock('./components/Header',           () => ({ Header:           vi.fn(() => <div data-testid="header" />) }))
vi.mock('./components/SingleRowBoard',   () => ({ SingleRowBoard:   vi.fn(() => <div data-testid="single-row-board" />) }))
vi.mock('./components/AtomLegend',       () => ({ AtomLegend:       vi.fn(() => <div data-testid="atom-legend" />) }))
vi.mock('./components/Toast',            () => ({ Toast:            vi.fn(() => <div data-testid="toast" />) }))
vi.mock('./components/Modal',            () => ({ Modal:            vi.fn(() => <div data-testid="modal" />) }))
vi.mock('./components/StatsModal',       () => ({ StatsModal:       vi.fn(() => <div data-testid="statsmodal" />) }))
vi.mock('./components/HelpModal',        () => ({ HelpModal:        vi.fn(() => <div data-testid="helpmodal" />) }))
vi.mock('./components/MoleculeViewer3D', () => ({ MoleculeViewer3D: vi.fn(() => <div data-testid="molecule-viewer" />) }))

import { useGame } from './hooks/useGame'
import { Header } from './components/Header'
import { SingleRowBoard } from './components/SingleRowBoard'
import { Toast } from './components/Toast'
import { Modal } from './components/Modal'
import { StatsModal } from './components/StatsModal'
import { HelpModal } from './components/HelpModal'
import { MoleculeViewer3D } from './components/MoleculeViewer3D'
import App from './App'

// ── Base mock return ───────────────────────────────────────────────────────────

const baseReturn = {
  gameState: {
    answer: 'WATER',
    lockedLetters: [null, null, null, null, null],
    attemptNumber: 0,
    maxAttempts: 5,
    guessHistory: [],
    status: 'playing',
    dayIndex: 42,
    moleculeData: null,
  },
  stats: {
    gamesPlayed: 5, gamesWon: 4, currentStreak: 2, bestStreak: 3,
    guessDistribution: [0, 1, 2, 1, 0, 0], lastPlayedDate: '2026-01-01',
  },
  currentGuess: ['', '', '', '', ''],
  invalidRow: -1,
  toastMessage: null,
  toastFading: false,
  showModal: false,
  showStatsModal: false,
  soundEnabled: true,
  toggleSound: vi.fn(),
  addLetter: vi.fn(),
  deleteLetter: vi.fn(),
  submitGuess: vi.fn(),
  openModal: vi.fn(),
  closeModal: vi.fn(),
  openStatsModal: vi.fn(),
  closeStatsModal: vi.fn(),
  inputRef: { current: null },
}

beforeEach(() => {
  ;(useGame as any).mockReturnValue(baseReturn)
  vi.mocked(Header).mockClear()
  vi.mocked(SingleRowBoard).mockClear()
  vi.mocked(Toast).mockClear()
  vi.mocked(Modal).mockClear()
  vi.mocked(StatsModal).mockClear()
  vi.mocked(HelpModal).mockClear()
  vi.mocked(MoleculeViewer3D).mockClear()
})

describe('App', () => {
  it('1 — tutti i componenti principali renderizzati', () => {
    render(<App />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('single-row-board')).toBeInTheDocument()
    expect(screen.getByTestId('toast')).toBeInTheDocument()
    expect(screen.getByTestId('molecule-viewer')).toBeInTheDocument()
    expect(screen.getByTestId('atom-legend')).toBeInTheDocument()
  })

  it('2 — GameBoard NON presente (sostituito da SingleRowBoard in Step 13)', () => {
    render(<App />)
    expect(screen.queryByTestId('gameboard')).not.toBeInTheDocument()
  })

  it('3 — AlphabetFeedback NON presente (rimosso in Step 13)', () => {
    render(<App />)
    expect(screen.queryByTestId('alphabet-feedback')).not.toBeInTheDocument()
  })

  it('4 — HelpModal non visibile all\'inizio', () => {
    render(<App />)
    expect(vi.mocked(HelpModal)).toHaveBeenCalledWith(
      expect.objectContaining({ visible: false }), expect.anything()
    )
  })

  it('5 — HelpModal apre quando Header chiama onHelpClick', () => {
    render(<App />)
    const headerCall = vi.mocked(Header).mock.calls[0][0]
    act(() => headerCall.onHelpClick())
    expect(vi.mocked(HelpModal)).toHaveBeenLastCalledWith(
      expect.objectContaining({ visible: true }), expect.anything()
    )
  })

  it('6 — HelpModal chiude quando onClose viene chiamata', () => {
    render(<App />)
    const headerCall = vi.mocked(Header).mock.calls[0][0]
    act(() => headerCall.onHelpClick())
    const calls = vi.mocked(HelpModal).mock.calls
    const helpModalCall = calls[calls.length - 1][0]
    act(() => helpModalCall.onClose())
    expect(vi.mocked(HelpModal)).toHaveBeenLastCalledWith(
      expect.objectContaining({ visible: false }), expect.anything()
    )
  })

  it('7 — StatsModal visibile quando showStatsModal = true', () => {
    ;(useGame as any).mockReturnValue({ ...baseReturn, showStatsModal: true })
    render(<App />)
    expect(vi.mocked(StatsModal)).toHaveBeenCalledWith(
      expect.objectContaining({ visible: true }), expect.anything()
    )
  })

  it('8 — Modal visibile quando showModal = true e status won', () => {
    ;(useGame as any).mockReturnValue({
      ...baseReturn,
      showModal: true,
      gameState: { ...baseReturn.gameState, status: 'won' },
    })
    render(<App />)
    expect(vi.mocked(Modal)).toHaveBeenCalledWith(
      expect.objectContaining({ visible: true, gameStatus: 'won' }), expect.anything()
    )
  })

  it('9 — Modal NON visibile quando showModal = true ma status = playing', () => {
    ;(useGame as any).mockReturnValue({
      ...baseReturn,
      showModal: true,
      gameState: { ...baseReturn.gameState, status: 'playing' },
    })
    render(<App />)
    expect(vi.mocked(Modal)).toHaveBeenCalledWith(
      expect.objectContaining({ visible: false }), expect.anything()
    )
  })

  it('10 — Toast riceve toastMessage e toastFading', () => {
    ;(useGame as any).mockReturnValue({ ...baseReturn, toastMessage: 'Genius!', toastFading: false })
    render(<App />)
    expect(vi.mocked(Toast)).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Genius!', fading: false }), expect.anything()
    )
  })

  it('11 — MoleculeViewer3D riceve pubchemCid dalla molecola del giorno', () => {
    render(<App />)
    expect(vi.mocked(MoleculeViewer3D)).toHaveBeenCalledWith(
      expect.objectContaining({ pubchemCid: 962 }), expect.anything()
    )
  })

  it('12 — SingleRowBoard riceve answer e lockedLetters', () => {
    render(<App />)
    expect(vi.mocked(SingleRowBoard)).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: 'WATER',
        lockedLetters: [null, null, null, null, null],
      }), expect.anything()
    )
  })
})
