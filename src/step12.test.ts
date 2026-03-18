import { test, expect, vi } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { createElement } from 'react'

// ── Countdown ─────────────────────────────────────────────────────────────────

import { getMidnightCountdown } from './utils/countdown'

test('1 — getMidnightCountdown returns HH:MM:SS format', () => {
  const result = getMidnightCountdown()
  expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
})

test('2 — getMidnightCountdown value is between 0 and 86400 seconds', () => {
  const result = getMidnightCountdown()
  const parts = result.split(':').map(Number)
  const totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
  expect(totalSeconds).toBeGreaterThanOrEqual(0)
  expect(totalSeconds).toBeLessThanOrEqual(86400)
})

// ── OnboardingModal ───────────────────────────────────────────────────────────

import { OnboardingModal } from './components/OnboardingModal'

test('3 — OnboardingModal renders how-to-play content', () => {
  render(createElement(OnboardingModal, { onDismiss: () => {} }))
  expect(screen.getByText(/come si gioca/i)).toBeDefined()
  expect(screen.getByText(/inizia a giocare/i)).toBeDefined()
})

test('4 — OnboardingModal calls onDismiss when button clicked', () => {
  const onDismiss = vi.fn()
  render(createElement(OnboardingModal, { onDismiss }))
  fireEvent.click(screen.getByText(/inizia a giocare/i))
  expect(onDismiss).toHaveBeenCalledTimes(1)
})

// ── useOnboarding ─────────────────────────────────────────────────────────────

import { useOnboarding } from './hooks/useOnboarding'

test('5 — useOnboarding shows modal when not previously seen', async () => {
  localStorage.clear()
  vi.useFakeTimers()
  const { result } = renderHook(() => useOnboarding())
  expect(result.current.showOnboarding).toBe(false)
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(result.current.showOnboarding).toBe(true)
  vi.useRealTimers()
})

test('6 — useOnboarding does not show modal when already seen', async () => {
  localStorage.setItem('chemwordle_onboarding_v1', '1')
  vi.useFakeTimers()
  const { result } = renderHook(() => useOnboarding())
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(result.current.showOnboarding).toBe(false)
  vi.useRealTimers()
  localStorage.clear()
})

test('7 — dismissOnboarding saves to localStorage', () => {
  localStorage.clear()
  const { result } = renderHook(() => useOnboarding())
  act(() => { result.current.dismissOnboarding() })
  expect(localStorage.getItem('chemwordle_onboarding_v1')).toBe('1')
  expect(result.current.showOnboarding).toBe(false)
  localStorage.clear()
})

// ── Header ────────────────────────────────────────────────────────────────────

import { Header } from './components/Header'

test('8 — Header shows title and subtitle', () => {
  render(createElement(Header, {
    streak: 0,
    dayNumber: 1,
    onStatsClick: () => {},
    onHelpClick: () => {},
  }))
  expect(screen.getByText('ChemWordle')).toBeDefined()
  expect(screen.getByText(/indovina la molecola/i)).toBeDefined()
})

// ── Tile colors ───────────────────────────────────────────────────────────────

import { Tile } from './components/Tile'

test('9 — Tile with correct status has green background', () => {
  const { container } = render(createElement(Tile, { letter: 'A', status: 'correct' }))
  // Framer-motion renders a motion.div; find the outermost div
  const tile = container.querySelector('[role="presentation"]') as HTMLElement
  const style = tile?.getAttribute('style') ?? ''
  expect(style).toMatch(/16a34a|rgb\(22,\s*163,\s*74\)/i)
})

test('10 — Tile with absent status has dark gray background', () => {
  const { container } = render(createElement(Tile, { letter: 'B', status: 'absent' }))
  const tile = container.querySelector('[role="presentation"]') as HTMLElement
  const style = tile?.getAttribute('style') ?? ''
  expect(style).toMatch(/3a3a3a|rgb\(58,\s*58,\s*58\)/i)
})
