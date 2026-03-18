import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./hooks/useGame', () => ({ useGame: vi.fn() }))
vi.mock('./hooks/useWindowWidth', () => ({ useWindowWidth: vi.fn(() => 390) }))
vi.mock('./components/Header',     () => ({ Header:     vi.fn(() => <div data-testid="header" />) }))
vi.mock('./components/GameBoard',  () => ({ GameBoard:  vi.fn(() => <div data-testid="gameboard" />) }))
vi.mock('./components/Keyboard',   () => ({ Keyboard:   vi.fn(() => <div data-testid="keyboard" />) }))
vi.mock('./components/Toast',      () => ({ Toast:      vi.fn(() => <div data-testid="toast" />) }))
vi.mock('./components/Modal',      () => ({ Modal:      vi.fn(() => <div data-testid="modal" />) }))
vi.mock('./components/StatsModal', () => ({ StatsModal: vi.fn(() => <div data-testid="statsmodal" />) }))
vi.mock('./components/HelpModal',  () => ({ HelpModal:  vi.fn(() => <div data-testid="helpmodal" />) }))

import { useGame } from './hooks/useGame'
import { useWindowWidth } from './hooks/useWindowWidth'
import { Header } from './components/Header'
import { GameBoard } from './components/GameBoard'
import { Keyboard } from './components/Keyboard'
import { Toast } from './components/Toast'
import { Modal } from './components/Modal'
import { StatsModal } from './components/StatsModal'
import { HelpModal } from './components/HelpModal'
import App from './App'

// ── Base mock return ───────────────────────────────────────────────────────────

const baseReturn = {
  gameState: {
    target: 'WATER', guesses: [], feedbacks: [], status: 'playing',
    dayIndex: 42, revealedMolecule: null,
  },
  stats: {
    gamesPlayed: 5, gamesWon: 4, currentStreak: 2, bestStreak: 3,
    guessDistribution: [0, 1, 2, 1, 0, 0], lastPlayedDate: '2026-01-01',
  },
  currentGuess: ['', '', '', '', ''],
  invalidRow: -1,
  revealingRow: -1,
  bounceRow: -1,
  toastMessage: null,
  toastFading: false,
  showModal: false,
  showStatsModal: false,
  keyboardStatuses: {},
  soundEnabled: true,
  toggleSound: vi.fn(),
  addLetter: vi.fn(),
  deleteLetter: vi.fn(),
  submitGuess: vi.fn(),
  openModal: vi.fn(),
  closeModal: vi.fn(),
  openStatsModal: vi.fn(),
  closeStatsModal: vi.fn(),
}

beforeEach(() => {
  ;(useGame as any).mockReturnValue(baseReturn)
  ;(useWindowWidth as any).mockReturnValue(390)
  vi.mocked(Header).mockClear()
  vi.mocked(GameBoard).mockClear()
  vi.mocked(Keyboard).mockClear()
  vi.mocked(Toast).mockClear()
  vi.mocked(Modal).mockClear()
  vi.mocked(StatsModal).mockClear()
  vi.mocked(HelpModal).mockClear()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('App', () => {
  it('1 — tutti i componenti principali renderizzati', () => {
    render(<App />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('gameboard')).toBeInTheDocument()
    expect(screen.getByTestId('keyboard')).toBeInTheDocument()
    expect(screen.getByTestId('toast')).toBeInTheDocument()
  })

  it('2 — tileSize 52 su viewport 390px', () => {
    ;(useWindowWidth as any).mockReturnValue(390)
    render(<App />)
    expect(vi.mocked(GameBoard)).toHaveBeenCalledWith(
      expect.objectContaining({ tileSize: 52 }), expect.anything()
    )
  })

  it('3 — tileSize 44 su viewport 375px', () => {
    ;(useWindowWidth as any).mockReturnValue(375)
    render(<App />)
    expect(vi.mocked(GameBoard)).toHaveBeenCalledWith(
      expect.objectContaining({ tileSize: 44 }), expect.anything()
    )
  })

  it('4 — invalidGuess = false quando invalidRow = -1', () => {
    ;(useGame as any).mockReturnValue({ ...baseReturn, invalidRow: -1 })
    render(<App />)
    expect(vi.mocked(GameBoard)).toHaveBeenCalledWith(
      expect.objectContaining({ invalidGuess: false }), expect.anything()
    )
  })

  it('5 — invalidGuess = true quando invalidRow = currentRowIndex', () => {
    ;(useGame as any).mockReturnValue({
      ...baseReturn, invalidRow: 0,
      gameState: { ...baseReturn.gameState, guesses: [] },
    })
    render(<App />)
    expect(vi.mocked(GameBoard)).toHaveBeenCalledWith(
      expect.objectContaining({ invalidGuess: true }), expect.anything()
    )
  })

  it('6 — HelpModal non visibile all\'inizio', () => {
    render(<App />)
    expect(vi.mocked(HelpModal)).toHaveBeenCalledWith(
      expect.objectContaining({ visible: false }), expect.anything()
    )
  })

  it('7 — HelpModal apre quando Header chiama onHelpClick', () => {
    render(<App />)
    const headerCall = vi.mocked(Header).mock.calls[0][0]
    act(() => headerCall.onHelpClick())
    expect(vi.mocked(HelpModal)).toHaveBeenLastCalledWith(
      expect.objectContaining({ visible: true }), expect.anything()
    )
  })

  it('8 — HelpModal chiude quando onClose viene chiamata', () => {
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

  it('9 — StatsModal visibile quando showStatsModal = true', () => {
    ;(useGame as any).mockReturnValue({ ...baseReturn, showStatsModal: true })
    render(<App />)
    expect(vi.mocked(StatsModal)).toHaveBeenCalledWith(
      expect.objectContaining({ visible: true }), expect.anything()
    )
  })

  it('10 — Modal visibile quando showModal = true e status won', () => {
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

  it('11 — Modal NON visibile quando showModal = true ma status = playing', () => {
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

  it('12 — Toast riceve toastMessage e toastFading', () => {
    ;(useGame as any).mockReturnValue({ ...baseReturn, toastMessage: 'Genius!', toastFading: false })
    render(<App />)
    expect(vi.mocked(Toast)).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Genius!', fading: false }), expect.anything()
    )
  })

  it('13 — Keyboard riceve soundEnabled e onToggleSound', () => {
    render(<App />)
    expect(vi.mocked(Keyboard)).toHaveBeenCalledWith(
      expect.objectContaining({
        soundEnabled: true,
        onToggleSound: baseReturn.toggleSound,
      }), expect.anything()
    )
  })
})
