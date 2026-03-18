import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getDailyMolecule } from '../data/molecules'
import { isValidGuess } from '../data/validWords'
import {
  computeFeedback, getKeyboardStatuses, normalizeInput,
  updateStats, buildInitialGameState,
} from '../utils/gameLogic'
import { loadGameState, saveGameState, loadStats, saveStats } from '../utils/storage'
import { useSounds } from './useSounds'
import { WIN_MESSAGES } from '../utils/messages'
import type { GameState, LetterStatus, Stats } from '../types'

const MAX_GUESSES = 6

// Local display type — adds 'filled' for current-row tiles that have a letter
export type TileDisplay = LetterStatus | 'filled'

export interface BoardRow {
  letters: string[]
  statuses: TileDisplay[]
  isRevealed: boolean
}

export interface UseGameReturn {
  gameState: GameState
  stats: Stats
  currentGuess: string[]
  cursorIndex: number
  invalidRow: number       // -1 = none
  revealingRow: number     // -1 = none
  bounceRow: number        // -1 = none
  toastMessage: string | null
  toastFading: boolean
  showModal: boolean
  showStatsModal: boolean
  keyboardStatuses: Record<string, LetterStatus>
  soundEnabled: boolean
  addLetter: (letter: string) => void
  deleteLetter: () => void
  submitGuess: () => void
  openModal: () => void
  closeModal: () => void
  openStatsModal: () => void
  closeStatsModal: () => void
  toggleSound: () => void
}

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState>(() => buildInitialGameState())
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [currentGuess, setCurrentGuess] = useState<string[]>([])
  const [cursorIndex, setCursorIndex] = useState(0)
  const [invalidRow, setInvalidRow] = useState(-1)
  const [revealingRow, setRevealingRow] = useState(-1)
  const [bounceRow, setBounceRow] = useState(-1)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastFading, setToastFading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)

  // Sounds hook — integrated here so components don't import useSounds directly
  const sounds = useSounds()
  // Keep a ref so callbacks (with [] deps) always call the latest sound functions
  const soundsRef = useRef(sounds)
  soundsRef.current = sounds

  // Stable refs to prevent stale closures
  const stateRef = useRef(gameState)
  const statsRef = useRef(stats)
  const guessRef = useRef(currentGuess)
  const cursorRef = useRef(cursorIndex)
  const revealRef = useRef(revealingRow)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => { stateRef.current = gameState }, [gameState])
  useEffect(() => { statsRef.current = stats }, [stats])
  useEffect(() => { guessRef.current = currentGuess }, [currentGuess])
  useEffect(() => { cursorRef.current = cursorIndex }, [cursorIndex])
  useEffect(() => { revealRef.current = revealingRow }, [revealingRow])

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

  const resetCurrentGuess = useCallback((tgt: string) => {
    const arr = Array.from(tgt).map(ch => ch === ' ' ? ' ' : '')
    setCurrentGuess(arr)
    const firstEditable = arr.findIndex(ch => ch === '')
    setCursorIndex(firstEditable === -1 ? tgt.length : firstEditable)
  }, [])

  // Initialization — load saved state, do NOT auto-open modal
  useEffect(() => {
    const saved = loadGameState()
    const state = saved ?? buildInitialGameState()
    setGameState(state)
    setStats(loadStats())
    resetCurrentGuess(state.target)
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
    if (stateRef.current.status !== 'playing') return
    if (revealRef.current !== -1) return
    const tgt = stateRef.current.target
    const cursor = cursorRef.current
    if (cursor >= tgt.length) return
    const newGuess = [...guessRef.current]
    newGuess[cursor] = letter.toUpperCase()
    setCurrentGuess(newGuess)
    soundsRef.current.playKeyClick()
    // Find next empty non-space slot after cursor
    let next = -1
    for (let i = cursor + 1; i < tgt.length; i++) {
      if (tgt[i] !== ' ' && newGuess[i] === '') {
        next = i
        break
      }
    }
    setCursorIndex(next === -1 ? tgt.length : next)
  }, [])

  const deleteLetter = useCallback(() => {
    if (stateRef.current.status !== 'playing') return
    if (revealRef.current !== -1) return
    const tgt = stateRef.current.target
    const cursor = cursorRef.current
    const guess = guessRef.current
    // Find rightmost filled (non-space) position to LEFT of cursorIndex
    let pos = -1
    const limit = Math.min(cursor, tgt.length) - 1
    for (let i = limit; i >= 0; i--) {
      if (tgt[i] !== ' ' && guess[i] !== '') {
        pos = i
        break
      }
    }
    if (pos === -1) return
    const newGuess = [...guess]
    newGuess[pos] = ''
    setCurrentGuess(newGuess)
    setCursorIndex(pos)
  }, [])

  const submitGuess = useCallback(() => {
    const state = stateRef.current
    if (state.status !== 'playing') return
    if (revealRef.current !== -1) return
    const guess = guessRef.current
    const tgt = state.target
    const guessStr = guess.join('')

    // Check if enough letters are filled
    const filledCount = guess.filter(c => c !== '' && c !== ' ').length
    const targetNonSpace = Array.from(tgt).filter(c => c !== ' ').length
    if (filledCount < targetNonSpace) {
      showToast('Not enough letters')
      soundsRef.current.playInvalid()
      setInvalidRow(state.guesses.length)
      schedule(() => setInvalidRow(-1), 600)
      return
    }

    // Check validity
    if (!isValidGuess(guessStr.trim())) {
      showToast('Compound not found')
      soundsRef.current.playInvalid()
      setInvalidRow(state.guesses.length)
      schedule(() => setInvalidRow(-1), 600)
      return
    }

    const normalizedGuess = normalizeInput(guessStr)
    const fb = computeFeedback(normalizedGuess, tgt)
    const newGuesses = [...state.guesses, normalizedGuess]
    const newFeedbacks = [...state.feedbacks, fb]

    const mol = getDailyMolecule()
    const won = normalizedGuess === tgt
    const newStatus: GameState['status'] = won
      ? 'won'
      : newGuesses.length >= MAX_GUESSES ? 'lost' : 'playing'

    const newState: GameState = {
      dayIndex: state.dayIndex,
      target: tgt,
      guesses: newGuesses,
      feedbacks: newFeedbacks,
      status: newStatus,
      revealedMolecule: newStatus !== 'playing' ? mol : null,
    }

    setGameState(newState)
    saveGameState(newState)

    const rowIndex = state.guesses.length
    soundsRef.current.playSubmit()
    setRevealingRow(rowIndex)
    soundsRef.current.playTileReveal(fb.map(f => f.status), rowIndex)

    schedule(() => {
      setRevealingRow(-1)

      if (newStatus === 'won') {
        const guessCount = newGuesses.length
        setBounceRow(rowIndex)
        soundsRef.current.playWin()
        schedule(() => {
          showToast(WIN_MESSAGES[guessCount] ?? 'Well done!')
          setBounceRow(-1)
          schedule(() => {
            const updated = updateStats(statsRef.current, newState)
            saveStats(updated)
            setStats(updated)
            setShowModal(true)
            if ([7, 30, 100].includes(updated.currentStreak)) {
              schedule(() => soundsRef.current.playStreakMilestone(updated.currentStreak), 800)
            }
          }, 400)
        }, 600)
      } else if (newStatus === 'lost') {
        showToast(`The answer was ${mol.display_name}`)
        soundsRef.current.playLose()
        schedule(() => {
          const updated = updateStats(statsRef.current, newState)
          saveStats(updated)
          setStats(updated)
          setShowModal(true)
        }, 1000)
      } else {
        resetCurrentGuess(tgt)
      }
    }, 600)
  }, [schedule, showToast, resetCurrentGuess])

  // Keyboard listener (reads current state via refs)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Backspace') deleteLetter()
      else if (e.key === 'Enter') submitGuess()
      else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key.toUpperCase())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addLetter, deleteLetter, submitGuess])

  const keyboardStatuses = useMemo(
    () => getKeyboardStatuses(gameState.feedbacks),
    [gameState.feedbacks]
  )

  const openModal = useCallback(() => setShowModal(true), [])
  const closeModal = useCallback(() => setShowModal(false), [])
  const openStatsModal = useCallback(() => setShowStatsModal(true), [])
  const closeStatsModal = useCallback(() => setShowStatsModal(false), [])

  return {
    gameState,
    stats,
    currentGuess,
    cursorIndex,
    invalidRow,
    revealingRow,
    bounceRow,
    toastMessage,
    toastFading,
    showModal,
    showStatsModal,
    keyboardStatuses,
    soundEnabled: sounds.soundEnabled,
    addLetter,
    deleteLetter,
    submitGuess,
    openModal,
    closeModal,
    openStatsModal,
    closeStatsModal,
    toggleSound: sounds.toggleSound,
  }
}
