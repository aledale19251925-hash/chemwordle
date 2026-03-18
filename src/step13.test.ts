import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import type { LetterResult } from './types'

// ── getLockedLetters ──────────────────────────────────────────────────────────

import { getLockedLetters, initCurrentGuess, MAX_ATTEMPTS } from './utils/gameLogic'

test('1 — getLockedLetters locks correct positions from a guess', () => {
  const prevLocked: (string | null)[] = [null, null, null, null, null]
  const guess = ['W', 'A', 'T', 'E', 'R']
  const results = ['correct', 'absent', 'correct', 'absent', 'absent'] as LetterResult[]
  const newLocked = getLockedLetters(prevLocked, guess, results)
  expect(newLocked[0]).toBe('W')   // correct → locked
  expect(newLocked[1]).toBeNull()  // absent → not locked
  expect(newLocked[2]).toBe('T')   // correct → locked
  expect(newLocked[3]).toBeNull()
  expect(newLocked[4]).toBeNull()
})

test('2 — getLockedLetters preserves already-locked positions', () => {
  const prevLocked: (string | null)[] = ['W', null, 'T', null, null]
  const guess = ['W', 'A', 'T', 'E', 'R']
  const results = ['correct', 'absent', 'correct', 'correct', 'absent'] as LetterResult[]
  const newLocked = getLockedLetters(prevLocked, guess, results)
  expect(newLocked[0]).toBe('W')   // was already locked
  expect(newLocked[2]).toBe('T')   // was already locked
  expect(newLocked[3]).toBe('E')   // newly locked
  expect(newLocked[4]).toBeNull()
})

// ── initCurrentGuess ──────────────────────────────────────────────────────────

test('3 — initCurrentGuess returns empty slots where not locked', () => {
  const answer = 'WATER'
  const locked: (string | null)[] = [null, null, null, null, null]
  const guess = initCurrentGuess(answer, locked)
  expect(guess).toEqual(['', '', '', '', ''])
})

test('4 — initCurrentGuess pre-fills locked positions', () => {
  const answer = 'WATER'
  const locked: (string | null)[] = ['W', null, 'T', null, null]
  const guess = initCurrentGuess(answer, locked)
  expect(guess[0]).toBe('W')
  expect(guess[1]).toBe('')
  expect(guess[2]).toBe('T')
  expect(guess[3]).toBe('')
  expect(guess[4]).toBe('')
})

// ── getAtomTypesFromFormula ───────────────────────────────────────────────────

import { getAtomTypesFromFormula } from './utils/pubchem'

test('5 — getAtomTypesFromFormula returns unique elements from H2O', () => {
  const atoms = getAtomTypesFromFormula('H2O')
  const symbols = atoms.map(a => a.symbol)
  expect(symbols).toContain('H')
  expect(symbols).toContain('O')
  expect(new Set(symbols).size).toBe(symbols.length) // no duplicates
})

test('6 — getAtomTypesFromFormula returns CPK colors', () => {
  const atoms = getAtomTypesFromFormula('C6H12O6')
  const c = atoms.find(a => a.symbol === 'C')
  const o = atoms.find(a => a.symbol === 'O')
  expect(c?.color).toBe('#909090')
  expect(o?.color).toBe('#ff4040')
})

// ── formulaDisplay conversion ─────────────────────────────────────────────────

test('7 — getAtomTypesFromFormula handles multi-char elements like Cl, Br', () => {
  const atoms = getAtomTypesFromFormula('C2H5Cl')
  const symbols = atoms.map(a => a.symbol)
  expect(symbols).toContain('C')
  expect(symbols).toContain('H')
  expect(symbols).toContain('Cl')
  // 'l' alone should NOT be a separate element
  expect(symbols).not.toContain('l')
})

// ── getMidnightCountdown ──────────────────────────────────────────────────────

import { getMidnightCountdown } from './utils/countdown'

test('8 — getMidnightCountdown returns HH:MM:SS and is between 0–86400s', () => {
  const result = getMidnightCountdown()
  expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  const parts = result.split(':').map(Number)
  const total = parts[0] * 3600 + parts[1] * 60 + parts[2]
  expect(total).toBeGreaterThanOrEqual(0)
  expect(total).toBeLessThanOrEqual(86400)
})

// ── MAX_ATTEMPTS ──────────────────────────────────────────────────────────────

test('9 — MAX_ATTEMPTS equals 5', () => {
  expect(MAX_ATTEMPTS).toBe(5)
})

// ── AtomLegend ────────────────────────────────────────────────────────────────

import { AtomLegend } from './components/AtomLegend'

test('10 — AtomLegend renders atom symbols', () => {
  render(createElement(AtomLegend, {
    atomTypes: [
      { symbol: 'H', color: '#ffffff', label: 'Idrogeno' },
      { symbol: 'O', color: '#ff4040', label: 'Ossigeno' },
    ],
  }))
  expect(screen.getByText('H')).toBeDefined()
  expect(screen.getByText('O')).toBeDefined()
})

test('11 — AtomLegend returns null when atomTypes is empty', () => {
  const { container } = render(createElement(AtomLegend, { atomTypes: [] }))
  expect(container.firstChild).toBeNull()
})

// ── SingleRowBoard ────────────────────────────────────────────────────────────

import { SingleRowBoard } from './components/SingleRowBoard'

// Mock framer-motion for this test file
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, animate, transition, ...props }: any) =>
      createElement('div', { style, ...props }, children),
  },
  AnimatePresence: ({ children }: any) => children,
}))

test('12 — SingleRowBoard shows attempt counter', () => {
  render(createElement(SingleRowBoard, {
    answer: 'WATER',
    currentGuess: ['', '', '', '', ''],
    lockedLetters: [null, null, null, null, null],
    attemptNumber: 1,
    maxAttempts: 5,
    lastResults: null,
    status: 'playing',
    invalidGuess: false,
  }))
  expect(screen.getByText(/Tentativo 2 \/ 5/)).toBeDefined()
})
