import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useGame } from './useGame'
import type { Molecule, Stats } from '../types'

// ── Mock data ───────────────────────────────────────────────────────────────

const mockMolecule: Molecule = {
  id: 'water',
  display_name: 'WATER',
  normalized_name: 'WATER',
  aliases: [],
  formula: 'H₂O',
  molecular_weight: 18.02,
  smiles: 'O',
  pubchem_cid: 962,
  category: 'common',
  difficulty: 1,
  fun_fact: '',
  applications: ['app1', 'app2'],
  language: 'en',
  scheduled_date: null,
}

const emptyStats: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
}

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../utils/storage', () => ({
  loadGameState: vi.fn(() => null),
  saveGameState: vi.fn(),
  loadStats: vi.fn(() => ({ ...emptyStats })),
  saveStats: vi.fn(),
}))

vi.mock('../data/molecules', () => ({
  getDailyMolecule: vi.fn(() => mockMolecule),
  findMoleculeByName: vi.fn(() => mockMolecule),
}))

vi.mock('../data/validWords', () => ({
  isValidGuess: vi.fn(() => true),
}))

import { loadGameState, saveGameState, loadStats, saveStats } from '../utils/storage'
import { isValidGuess } from '../data/validWords'

// ── Helper ───────────────────────────────────────────────────────────────────

type HookResult = { current: ReturnType<typeof useGame> }

function fillWord(result: HookResult, word: string) {
  for (const ch of word) {
    act(() => { result.current.addLetter(ch) })
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(loadGameState).mockReturnValue(null)
    vi.mocked(loadStats).mockReturnValue({ ...emptyStats })
    vi.mocked(isValidGuess).mockReturnValue(true)
    vi.mocked(saveGameState).mockClear()
    vi.mocked(saveStats).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 1. After init, currentGuess matches answer length with all empty slots
  it('initialises currentGuess as empty slots matching answer length', () => {
    const { result } = renderHook(() => useGame())
    expect(result.current.currentGuess).toHaveLength(5) // WATER = 5 chars
    expect(result.current.currentGuess.every(c => c === '')).toBe(true)
  })

  // 2. addLetter places letter at first empty slot
  it('addLetter places letter at the first empty editable slot', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    expect(result.current.currentGuess[0]).toBe('W')
  })

  // 3. addLetter fills slots sequentially
  it('addLetter fills slots left to right', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.addLetter('A') })
    expect(result.current.currentGuess[0]).toBe('W')
    expect(result.current.currentGuess[1]).toBe('A')
  })

  // 4. addLetter does nothing when game is over
  it('addLetter does nothing when game status is not playing', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    act(() => vi.advanceTimersByTime(2000))
    const guessBefore = [...result.current.currentGuess]
    act(() => { result.current.addLetter('X') })
    expect(result.current.currentGuess).toEqual(guessBefore)
  })

  // 5. deleteLetter clears the rightmost filled editable slot
  it('deleteLetter clears the rightmost filled letter', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.addLetter('A') })
    act(() => { result.current.deleteLetter() })
    expect(result.current.currentGuess[1]).toBe('')
    expect(result.current.currentGuess[0]).toBe('W')
  })

  // 6. deleteLetter does nothing when no letters are filled
  it('deleteLetter does nothing on an empty guess', () => {
    const { result } = renderHook(() => useGame())
    const before = [...result.current.currentGuess]
    act(() => { result.current.deleteLetter() })
    expect(result.current.currentGuess).toEqual(before)
  })

  // 7. submitGuess shows toast and sets invalidRow when incomplete
  it('submitGuess shows "Not enough letters" and sets invalidRow when incomplete', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.submitGuess() })
    expect(result.current.toastMessage).toBe('Not enough letters')
    expect(result.current.invalidRow).toBe(0)
  })

  // 8. invalidRow resets to -1 after 600ms
  it('invalidRow resets to -1 after 600ms', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.submitGuess() })
    expect(result.current.invalidRow).toBe(0)
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.invalidRow).toBe(-1)
  })

  // 9. submitGuess shows "Compound not found" for invalid compound
  it('submitGuess shows "Compound not found" for an invalid compound', () => {
    vi.mocked(isValidGuess).mockReturnValue(false)
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    expect(result.current.toastMessage).toBe('Compound not found')
  })

  // 10. submitGuess adds entry to guessHistory
  it('submitGuess adds the normalised guess to gameState.guessHistory', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'AAAAA') // wrong word
    act(() => { result.current.submitGuess() })
    expect(result.current.gameState.guessHistory).toHaveLength(1)
    expect(result.current.gameState.guessHistory[0].guess).toBe('AAAAA')
  })

  // 11. Win: correct guess sets status won, shows toast, opens modal
  it('win sequence: status won, win toast shown, modal opens, stats saved', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })

    expect(result.current.gameState.status).toBe('won')

    // After 1200ms: modal opens and stats saved
    act(() => vi.advanceTimersByTime(1200))
    expect(result.current.showModal).toBe(true)
    expect(vi.mocked(saveStats)).toHaveBeenCalledOnce()
  })

  // 12. Lose: after MAX_ATTEMPTS wrong guesses, status is lost and modal opens
  it('lose sequence: shows answer toast and opens modal after max wrong guesses', () => {
    const { result } = renderHook(() => useGame())

    // 5 wrong guesses (MAX_ATTEMPTS = 5)
    for (let i = 0; i < 5; i++) {
      // Reset currentGuess after each non-winning guess
      // (the hook resets it via initCurrentGuess)
      act(() => { result.current.currentGuess.fill('') })
      fillWord(result, 'AAAAA')
      act(() => { result.current.submitGuess() })
    }

    expect(result.current.gameState.status).toBe('lost')
    expect(result.current.toastMessage).toBe('The answer was WATER')

    // After 1000ms: modal opens
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.showModal).toBe(true)
  })

  // 13. openModal / closeModal toggle showModal
  it('openModal and closeModal toggle showModal', () => {
    const { result } = renderHook(() => useGame())
    expect(result.current.showModal).toBe(false)
    act(() => { result.current.openModal() })
    expect(result.current.showModal).toBe(true)
    act(() => { result.current.closeModal() })
    expect(result.current.showModal).toBe(false)
  })
})
