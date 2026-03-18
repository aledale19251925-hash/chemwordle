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

// ── Helper: add each letter in its own act() so refs stay fresh ──────────────

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

  // 1. After init, currentGuess matches target length
  it('initialises currentGuess as empty slots matching target length', () => {
    const { result } = renderHook(() => useGame())
    expect(result.current.currentGuess).toHaveLength(5) // WATER = 5 chars
    expect(result.current.currentGuess.every(c => c === '')).toBe(true)
  })

  // 2. cursorIndex starts at 0
  it('initialises cursorIndex at 0', () => {
    const { result } = renderHook(() => useGame())
    expect(result.current.cursorIndex).toBe(0)
  })

  // 3. addLetter places letter at cursor position
  it('addLetter places letter at the cursor position', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    expect(result.current.currentGuess[0]).toBe('W')
  })

  // 4. addLetter advances cursor to next empty slot
  it('addLetter advances cursor after placing a letter', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    expect(result.current.cursorIndex).toBe(1)
  })

  // 5. addLetter signals full (cursor = wordLength) when no empty slots remain
  it('addLetter sets cursorIndex to word length when all slots are filled', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    expect(result.current.cursorIndex).toBe(5)
  })

  // 6. addLetter ignored when game is over
  it('addLetter does nothing when game status is not playing', () => {
    const { result } = renderHook(() => useGame())
    // Guess the correct word → status becomes 'won' immediately
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    // stateRef is updated by act() flushing effects
    const guessBefore = [...result.current.currentGuess]
    act(() => { result.current.addLetter('X') })
    expect(result.current.currentGuess).toEqual(guessBefore)
  })

  // 7. addLetter ignored while reveal animation is in progress
  it('addLetter does nothing while revealingRow !== -1', () => {
    const { result } = renderHook(() => useGame())
    // Submit a wrong guess to enter reveal state while status is still 'playing'
    fillWord(result, 'AAAAA')
    act(() => { result.current.submitGuess() })
    // revealingRow === 0, status === 'playing' → blocked by revealRef guard
    const guessBefore = [...result.current.currentGuess]
    act(() => { result.current.addLetter('X') })
    expect(result.current.currentGuess).toEqual(guessBefore)
  })

  // 8. deleteLetter clears the rightmost filled letter
  it('deleteLetter clears the rightmost filled letter and moves cursor back', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.addLetter('A') })
    act(() => { result.current.deleteLetter() })
    expect(result.current.currentGuess[1]).toBe('')
    expect(result.current.cursorIndex).toBe(1)
  })

  // 9. deleteLetter does nothing when no letters are filled
  it('deleteLetter does nothing on an empty guess', () => {
    const { result } = renderHook(() => useGame())
    const before = [...result.current.currentGuess]
    act(() => { result.current.deleteLetter() })
    expect(result.current.currentGuess).toEqual(before)
    expect(result.current.cursorIndex).toBe(0)
  })

  // 10. submitGuess shows toast and sets invalidRow when word is incomplete
  it('submitGuess shows "Not enough letters" and sets invalidRow when incomplete', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.submitGuess() })
    expect(result.current.toastMessage).toBe('Not enough letters')
    expect(result.current.invalidRow).toBe(0)
  })

  // 11. invalidRow resets to -1 after 600ms
  it('invalidRow resets to -1 after 600ms', () => {
    const { result } = renderHook(() => useGame())
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.submitGuess() })
    expect(result.current.invalidRow).toBe(0)
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.invalidRow).toBe(-1)
  })

  // 12. submitGuess shows "Compound not found" for invalid compound
  it('submitGuess shows "Compound not found" for an invalid compound', () => {
    vi.mocked(isValidGuess).mockReturnValue(false)
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    expect(result.current.toastMessage).toBe('Compound not found')
  })

  // 13. submitGuess sets revealingRow immediately on valid guess
  it('submitGuess sets revealingRow to current row index on valid guess', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    expect(result.current.revealingRow).toBe(0)
  })

  // 14. revealingRow clears to -1 after 600ms
  it('revealingRow resets to -1 after 600ms', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.revealingRow).toBe(-1)
  })

  // 15. submitGuess adds the guess to gameState
  it('submitGuess adds the normalised guess to gameState.guesses', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    expect(result.current.gameState.guesses).toHaveLength(1)
    expect(result.current.gameState.guesses[0]).toBe('WATER')
  })

  // 16. Win sequence: bounceRow → win toast → modal
  it('win sequence: bounceRow set, win toast shown, modal opened', () => {
    const { result } = renderHook(() => useGame())
    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })

    // After 600ms: reveal done → bounceRow starts
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.bounceRow).toBe(0)
    expect(result.current.revealingRow).toBe(-1)

    // After another 600ms: toast shown, bounce done
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.toastMessage).toBe('Genius!') // 1 guess
    expect(result.current.bounceRow).toBe(-1)

    // After 400ms more: modal opens and stats saved
    act(() => vi.advanceTimersByTime(400))
    expect(result.current.showModal).toBe(true)
    expect(result.current.gameState.status).toBe('won')
    expect(vi.mocked(saveStats)).toHaveBeenCalledOnce()
  })

  // 17. Lose sequence: shows answer toast after 6 wrong guesses, modal after 1000ms
  it('lose sequence: shows answer toast and opens modal after 6 wrong guesses', () => {
    const { result } = renderHook(() => useGame())

    for (let i = 0; i < 6; i++) {
      // After first guess, each iteration fires the previous 600ms reveal timer
      if (i > 0) act(() => vi.advanceTimersByTime(600))
      fillWord(result, 'AAAAA') // wrong word (AAAAA ≠ WATER)
      act(() => { result.current.submitGuess() })
    }

    // Fire the 6th guess's 600ms reveal timer → shows lose toast
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.toastMessage).toBe('The answer was WATER')
    expect(result.current.gameState.status).toBe('lost')

    // Fire the 1000ms timer → modal opens
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.showModal).toBe(true)
  })

  // 18. Toast replacement: second toast cancels first
  it('second toast replaces first toast before the first expires', () => {
    const { result } = renderHook(() => useGame())

    // First: submit with only 1 letter → "Not enough letters"
    act(() => { result.current.addLetter('W') })
    act(() => { result.current.submitGuess() })
    expect(result.current.toastMessage).toBe('Not enough letters')

    // Make isValidGuess return false for the next call
    vi.mocked(isValidGuess).mockReturnValueOnce(false)

    // Reset invalidRow so next submit isn't blocked, then fill all 5 letters
    act(() => vi.advanceTimersByTime(600)) // clear invalidRow (-1)
    act(() => { result.current.addLetter('A') })
    act(() => { result.current.addLetter('T') })
    act(() => { result.current.addLetter('E') })
    act(() => { result.current.addLetter('R') })
    act(() => { result.current.submitGuess() })

    // Second toast should have replaced first
    expect(result.current.toastMessage).toBe('Compound not found')
  })

  // 19. keyboardStatuses reflects submitted feedbacks
  it('keyboardStatuses updates after a guess is submitted', () => {
    const { result } = renderHook(() => useGame())
    expect(Object.keys(result.current.keyboardStatuses)).toHaveLength(0)

    fillWord(result, 'WATER')
    act(() => { result.current.submitGuess() })
    expect(Object.keys(result.current.keyboardStatuses).length).toBeGreaterThan(0)
  })

  // 20. openModal / closeModal toggle showModal
  it('openModal and closeModal toggle showModal', () => {
    const { result } = renderHook(() => useGame())
    expect(result.current.showModal).toBe(false)
    act(() => { result.current.openModal() })
    expect(result.current.showModal).toBe(true)
    act(() => { result.current.closeModal() })
    expect(result.current.showModal).toBe(false)
  })
})
