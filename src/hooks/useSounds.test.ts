import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useSounds } from './useSounds'

// ── Web Audio API mock ───────────────────────────────────────────────────────

const mockStart    = vi.fn()
const mockStop     = vi.fn()
const mockConnect  = vi.fn()
const mockSetValue = vi.fn()
const mockLinearRamp = vi.fn()
const mockResume   = vi.fn().mockResolvedValue(undefined)
const mockClose    = vi.fn().mockResolvedValue(undefined)

const mockGain = {
  gain: {
    setValueAtTime: mockSetValue,
    linearRampToValueAtTime: mockLinearRamp,
  },
  connect: mockConnect,
}

const mockOscillator = {
  type: '' as OscillatorType,
  frequency: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  },
  connect: mockConnect,
  start: mockStart,
  stop: mockStop,
}

const mockAudioContext = {
  currentTime: 0,
  state: 'running' as AudioContextState,
  resume: mockResume,
  close: mockClose,
  createOscillator: vi.fn(function () { return { ...mockOscillator, frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() } } }),
  createGain: vi.fn(function () { return { ...mockGain } }),
  destination: {},
}

vi.stubGlobal('AudioContext', vi.fn(function () { return mockAudioContext }))

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useSounds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAudioContext.state = 'running'
    // Restore createOscillator to produce fresh oscillator objects each time
    mockAudioContext.createOscillator.mockImplementation(function () {
      return { ...mockOscillator, frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() } }
    })
    mockAudioContext.createGain.mockImplementation(function () { return { ...mockGain } })
    mockResume.mockResolvedValue(undefined)
    mockClose.mockResolvedValue(undefined)
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── Gruppo 1: Inizializzazione ───────────────────────────────────────────

  it('1 — default soundEnabled = true when localStorage has no entry', () => {
    const { result } = renderHook(() => useSounds())
    expect(result.current.soundEnabled).toBe(true)
  })

  it('2 — reads soundEnabled = false from localStorage', () => {
    localStorage.setItem('chemwordle-sound', 'false')
    const { result } = renderHook(() => useSounds())
    expect(result.current.soundEnabled).toBe(false)
  })

  it('3 — toggleSound inverts and persists to localStorage', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.toggleSound() })
    expect(result.current.soundEnabled).toBe(false)
    expect(localStorage.getItem('chemwordle-sound')).toBe('false')

    act(() => { result.current.toggleSound() })
    expect(result.current.soundEnabled).toBe(true)
    expect(localStorage.getItem('chemwordle-sound')).toBe('true')
  })

  // ── Gruppo 2: Creazione AudioContext ─────────────────────────────────────

  it('4 — AudioContext created lazily (only on first play, not at mount)', () => {
    const { result } = renderHook(() => useSounds())
    expect(AudioContext).not.toHaveBeenCalled()
    act(() => { result.current.playKeyClick() })
    expect(AudioContext).toHaveBeenCalledTimes(1)
  })

  it('5 — AudioContext reused across multiple play calls', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playKeyClick() })
    act(() => { result.current.playKeyClick() })
    expect(AudioContext).toHaveBeenCalledTimes(1)
  })

  it('6 — resume() called when context is suspended', () => {
    mockAudioContext.state = 'suspended'
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playKeyClick() })
    expect(mockResume).toHaveBeenCalledTimes(1)
  })

  // ── Gruppo 3: soundEnabled guard ─────────────────────────────────────────

  it('7 — no sounds created when soundEnabled = false', () => {
    localStorage.setItem('chemwordle-sound', 'false')
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playKeyClick() })
    act(() => { result.current.playSubmit() })
    act(() => { result.current.playInvalid() })
    expect(AudioContext).not.toHaveBeenCalled()
    expect(mockStart).not.toHaveBeenCalled()
  })

  // ── Gruppo 4: playKeyClick ────────────────────────────────────────────────

  it('8 — playKeyClick creates 1 sine oscillator at 900Hz', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playKeyClick() })
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1)
    const osc = mockAudioContext.createOscillator.mock.results[0].value as typeof mockOscillator
    expect(osc.type).toBe('sine')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(900, expect.any(Number))
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStop).toHaveBeenCalledTimes(1)
  })

  // ── Gruppo 5: playTileReveal ──────────────────────────────────────────────

  it('9 — playTileReveal creates 1 oscillator per tile', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playTileReveal(['correct', 'present', 'absent'], 0) })
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3)
  })

  it('10 — correct tile → 1047Hz', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playTileReveal(['correct'], 0) })
    const osc = mockAudioContext.createOscillator.mock.results[0].value as typeof mockOscillator
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(1047, expect.any(Number))
  })

  it('11 — present tile → 784Hz', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playTileReveal(['present'], 0) })
    const osc = mockAudioContext.createOscillator.mock.results[0].value as typeof mockOscillator
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(784, expect.any(Number))
  })

  it('12 — absent tile → triangle oscillator at 300Hz', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playTileReveal(['absent'], 0) })
    const osc = mockAudioContext.createOscillator.mock.results[0].value as typeof mockOscillator
    expect(osc.type).toBe('triangle')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(300, expect.any(Number))
  })

  it('13 — stagger uses startDelay (not setTimeout): each start() 100ms later', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playTileReveal(['correct', 'correct', 'correct'], 0) })
    const starts = mockStart.mock.calls.map(call => call[0] as number)
    expect(starts[1]).toBeCloseTo(starts[0] + 0.1, 3)
    expect(starts[2]).toBeCloseTo(starts[0] + 0.2, 3)
  })

  // ── Gruppo 6: playWin ─────────────────────────────────────────────────────

  it('14 — playWin creates 4 oscillators', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playWin() })
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4)
  })

  it('15 — playWin uses frequencies [523, 659, 784, 1047]', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playWin() })
    const oscs = mockAudioContext.createOscillator.mock.results
    const freqs = [523, 659, 784, 1047]
    freqs.forEach((f, i) => {
      const osc = oscs[i].value as typeof mockOscillator
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(f, expect.any(Number))
    })
  })

  // ── Gruppo 7: playStreakMilestone ─────────────────────────────────────────

  it('16 — days=7 → 2 oscillators', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playStreakMilestone(7) })
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2)
  })

  it('17 — days=30 → 3 oscillators', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playStreakMilestone(30) })
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3)
  })

  it('18 — days=100 → 5 oscillators (arpeggio + extra G6)', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playStreakMilestone(100) })
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(5)
  })

  it('19 — non-milestone days → no sound', () => {
    const { result } = renderHook(() => useSounds())
    act(() => { result.current.playStreakMilestone(14) })
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
  })

  // ── Gruppo 8: cleanup ─────────────────────────────────────────────────────

  it('20 — AudioContext.close() called on unmount', () => {
    const { result, unmount } = renderHook(() => useSounds())
    act(() => { result.current.playKeyClick() })  // creates the context
    unmount()
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('21 — no close() if AudioContext was never created', () => {
    const { unmount } = renderHook(() => useSounds())
    // no play function called
    unmount()
    expect(mockClose).not.toHaveBeenCalled()
  })
})
