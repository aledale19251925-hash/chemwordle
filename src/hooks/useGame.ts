import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import { getDailyMolecule } from '../data/molecules'
import { isValidGuess } from '../data/validWords'
import {
  evaluateGuess, getLockedLetters, initCurrentGuess, normalizeInput,
  updateStats, buildInitialGameState, MAX_ATTEMPTS,
} from '../utils/gameLogic'
import { loadGameState, saveGameState, loadStats, saveStats } from '../utils/storage'
import { useSounds } from './useSounds'
import { WIN_MESSAGES } from '../utils/messages'
import type { GameState, Stats, GameStatus, GuessHistoryEntry } from '../types'

export interface UseGameReturn {
  gameState: GameState
  stats: Stats
  currentGuess: string[]
  invalidRow: number       // -1 = none, 0 = shake current row
  toastMessage: string | null
  toastFading: boolean
  showModal: boolean
  showStatsModal: boolean
  soundEnabled: boolean
  addLetter: (letter: string) => void
  deleteLetter: () => void
  submitGuess: () => void
  openModal: () => void
  closeModal: () => void
  openStatsModal: () => void
  closeStatsModal: () => void
  toggleSound: () => void
  inputRef: RefObject<HTMLInputElement>
}

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState>(() => buildInitialGameState())
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [currentGuess, setCurrentGuess] = useState<string[]>([])
  const [invalidRow, setInvalidRow] = useState(-1)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastFading, setToastFading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)

  const sounds = useSounds()
  const soundsRef = useRef(sounds)
  soundsRef.current = sounds

  const stateRef = useRef(gameState)
  const statsRef = useRef(stats)
  const guessRef = useRef(currentGuess)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { stateRef.current = gameState }, [gameState])
  useEffect(() => { statsRef.current = stats }, [stats])
  useEffect(() => { guessRef.current = currentGuess }, [currentGuess])

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
  }, [])

  const showToast = useCallback((message: string) => {
    toastTimers.current.forEach(clearTimeout)
    toastTimers.current = []
    setToastMessage(message)
    setToastFading(false)
    toastTimers.current.push(setTimeout(() => setToastFading(true), 1500))
    toastTimers.current.push(setTimeout(() => {
      setToastMessage(null)
      setToastFading(false)
    }, 1800))
  }, [])

  // Initialization — load saved state
  useEffect(() => {
    const saved = loadGameState()
    const state = saved ?? buildInitialGameState()
    setGameState(state)
    setStats(loadStats())
    setCurrentGuess(initCurrentGuess(state.answer, state.lockedLetters))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Unmount cleanup
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      toastTimers.current.forEach(clearTimeout)
    }
  }, [])

  const addLetter = useCallback((letter: string) => {
    const state = stateRef.current
    if (state.status !== 'playing') return
    const guess = guessRef.current
    const locked = state.lockedLetters
    const answer = state.answer

    // Place at first empty editable slot (not locked, not space)
    for (let i = 0; i < guess.length; i++) {
      if (answer[i] === ' ') continue
      if (locked[i] !== null) continue
      if (guess[i] === '') {
        const newGuess = [...guess]
        newGuess[i] = letter.toUpperCase()
        setCurrentGuess(newGuess)
        soundsRef.current.playKeyClick()
        return
      }
    }
  }, [])

  const deleteLetter = useCallback(() => {
    const state = stateRef.current
    if (state.status !== 'playing') return
    const guess = guessRef.current
    const locked = state.lockedLetters
    const answer = state.answer

    // Clear last filled editable slot
    for (let i = guess.length - 1; i >= 0; i--) {
      if (answer[i] === ' ') continue
      if (locked[i] !== null) continue
      if (guess[i] !== '') {
        const newGuess = [...guess]
        newGuess[i] = ''
        setCurrentGuess(newGuess)
        return
      }
    }
  }, [])

  const submitGuess = useCallback(() => {
    const state = stateRef.current
    if (state.status !== 'playing') return

    const guess = guessRef.current
    const answer = state.answer
    const locked = state.lockedLetters

    // Check all editable slots are filled
    const hasEmpty = guess.some((ch, i) =>
      answer[i] !== ' ' && locked[i] === null && ch === ''
    )
    if (hasEmpty) {
      showToast('Not enough letters')
      soundsRef.current.playInvalid()
      setInvalidRow(0)
      schedule(() => setInvalidRow(-1), 600)
      return
    }

    const guessStr = normalizeInput(guess.join(''))

    // Check validity
    if (!isValidGuess(guessStr.trim())) {
      showToast('Compound not found')
      soundsRef.current.playInvalid()
      setInvalidRow(0)
      schedule(() => setInvalidRow(-1), 600)
      return
    }

    const results = evaluateGuess(guessStr, answer)
    const newLocked = getLockedLetters(locked, guess, results)
    const newHistory: GuessHistoryEntry[] = [...state.guessHistory, { guess: guessStr, results }]
    const newAttemptNumber = state.attemptNumber + 1

    const won = results.every(r => r === 'correct')
    const newStatus: GameStatus = won
      ? 'won'
      : newAttemptNumber >= MAX_ATTEMPTS ? 'lost' : 'playing'

    const newState: GameState = {
      ...state,
      lockedLetters: newLocked,
      attemptNumber: newAttemptNumber,
      status: newStatus,
      guessHistory: newHistory,
    }

    setGameState(newState)
    saveGameState(newState)
    soundsRef.current.playSubmit()

    if (newStatus === 'won') {
      soundsRef.current.playWin()
      showToast(WIN_MESSAGES[newAttemptNumber] ?? 'Well done!')
      schedule(() => {
        const updated = updateStats(statsRef.current, newState)
        saveStats(updated)
        setStats(updated)
        setShowModal(true)
        if ([7, 30, 100].includes(updated.currentStreak)) {
          schedule(() => soundsRef.current.playStreakMilestone(updated.currentStreak), 800)
        }
      }, 1200)
    } else if (newStatus === 'lost') {
      const mol = getDailyMolecule()
      showToast(`The answer was ${mol.display_name}`)
      soundsRef.current.playLose()
      schedule(() => {
        const updated = updateStats(statsRef.current, newState)
        saveStats(updated)
        setStats(updated)
        setShowModal(true)
      }, 1000)
    } else {
      // Continue: reset guess with newly locked letters
      setCurrentGuess(initCurrentGuess(answer, newLocked))
    }
  }, [schedule, showToast])

  // Auto-focus hidden input when game is playing
  useEffect(() => {
    if (gameState.status === 'playing') {
      inputRef.current?.focus()
    }
  }, [gameState.status])

  // Keyboard listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target === inputRef.current) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Backspace') deleteLetter()
      else if (e.key === 'Enter') submitGuess()
      else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key.toUpperCase())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addLetter, deleteLetter, submitGuess])

  const openModal = useCallback(() => setShowModal(true), [])
  const closeModal = useCallback(() => setShowModal(false), [])
  const openStatsModal = useCallback(() => setShowStatsModal(true), [])
  const closeStatsModal = useCallback(() => setShowStatsModal(false), [])

  return {
    gameState,
    stats,
    currentGuess,
    invalidRow,
    toastMessage,
    toastFading,
    showModal,
    showStatsModal,
    soundEnabled: sounds.soundEnabled,
    addLetter,
    deleteLetter,
    submitGuess,
    openModal,
    closeModal,
    openStatsModal,
    closeStatsModal,
    toggleSound: sounds.toggleSound,
    inputRef,
  }
}
