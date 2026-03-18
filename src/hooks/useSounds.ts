import { useState, useRef, useCallback, useEffect } from 'react'
import type { LetterStatus } from '../types'

export interface UseSoundsReturn {
  soundEnabled: boolean
  toggleSound: () => void
  playKeyClick: () => void
  playTileReveal: (feedbacks: LetterStatus[], rowIndex: number) => void
  playSubmit: () => void
  playInvalid: () => void
  playWin: () => void
  playLose: () => void
  playStreakMilestone: (days: number) => void
}

// ── Pure audio helper (no React state) ──────────────────────────────────────

function createTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,     // milliseconds
  type: OscillatorType,
  volume: number,       // 0.0 → 1.0
  startDelay?: number,  // milliseconds, default 0
): void {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)

  const gain = ctx.createGain()
  const startAt = ctx.currentTime + (startDelay ?? 0) / 1000
  const endAt   = startAt + duration / 1000
  const decayAt = startAt + (duration * 0.8) / 1000

  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.005)  // attack
  gain.gain.setValueAtTime(volume, decayAt)
  gain.gain.linearRampToValueAtTime(0, endAt)                 // decay

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(startAt)
  osc.stop(endAt + 0.01)  // small buffer to avoid click
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSounds(): UseSoundsReturn {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('chemwordle-sound')
    return saved === null ? true : saved === 'true'
  })

  // Singleton AudioContext — not React state, never triggers re-render
  const ctxRef = useRef<AudioContext | null>(null)

  // Defined inside the hook to close over ctxRef
  function getOrCreateContext(): AudioContext | null {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )()
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {})
        // Don't await — if still suspended the sound is silently skipped
      }
      return ctxRef.current
    } catch {
      return null  // AudioContext unavailable (SSR, old browser)
    }
  }

  // Close AudioContext on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {})
    }
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem('chemwordle-sound', String(next))
      return next
    })
  }, [])

  // ── B1: keyClick ──────────────────────────────────────────────────────────
  const playKeyClick = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getOrCreateContext()
    if (!ctx) return
    try {
      createTone(ctx, 900, 45, 'sine', 0.15)
    } catch { /* silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  // ── B2: tileReveal ────────────────────────────────────────────────────────
  const playTileReveal = useCallback((feedbacks: LetterStatus[], _rowIndex: number) => {
    if (!soundEnabled) return
    const ctx = getOrCreateContext()
    if (!ctx) return
    try {
      for (let i = 0; i < feedbacks.length; i++) {
        const status = feedbacks[i]
        if (status === 'correct') {
          createTone(ctx, 1047, 80, 'sine', 0.25, i * 100)
        } else if (status === 'present') {
          createTone(ctx, 784, 80, 'sine', 0.25, i * 100)
        } else {
          createTone(ctx, 300, 60, 'triangle', 0.15, i * 100)
        }
      }
    } catch { /* silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  // ── B3: submit ────────────────────────────────────────────────────────────
  const playSubmit = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getOrCreateContext()
    if (!ctx) return
    try {
      createTone(ctx, 600, 80, 'sine', 0.20)
    } catch { /* silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  // ── B4: invalid ───────────────────────────────────────────────────────────
  const playInvalid = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getOrCreateContext()
    if (!ctx) return
    try {
      createTone(ctx, 220, 150, 'sawtooth', 0.30)
    } catch { /* silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  // ── B5: win ───────────────────────────────────────────────────────────────
  const playWin = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getOrCreateContext()
    if (!ctx) return
    try {
      createTone(ctx, 523,  100, 'sine', 0.40, 0)
      createTone(ctx, 659,  100, 'sine', 0.40, 120)
      createTone(ctx, 784,  100, 'sine', 0.40, 240)
      createTone(ctx, 1047, 100, 'sine', 0.40, 360)
    } catch { /* silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  // ── B6: lose ──────────────────────────────────────────────────────────────
  const playLose = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getOrCreateContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.5)
      const gain = ctx.createGain()
      const decayAt = ctx.currentTime + (500 * 0.8) / 1000
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.20, ctx.currentTime + 0.005)
      gain.gain.setValueAtTime(0.20, decayAt)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.51)
    } catch { /* silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  // ── B7: streakMilestone ───────────────────────────────────────────────────
  const playStreakMilestone = useCallback((days: number) => {
    if (!soundEnabled) return
    const ctx = getOrCreateContext()
    if (!ctx) return
    try {
      if (days === 7) {
        createTone(ctx, 784,  150, 'sine', 0.50, 0)
        createTone(ctx, 1047, 200, 'sine', 0.50, 160)
      } else if (days === 30) {
        createTone(ctx, 659,  120, 'sine', 0.50, 0)
        createTone(ctx, 784,  120, 'sine', 0.50, 130)
        createTone(ctx, 1047, 180, 'sine', 0.50, 260)
      } else if (days === 100) {
        createTone(ctx, 523,  100, 'sine', 0.50, 0)
        createTone(ctx, 659,  100, 'sine', 0.50, 120)
        createTone(ctx, 784,  100, 'sine', 0.50, 240)
        createTone(ctx, 1047, 100, 'sine', 0.50, 360)
        createTone(ctx, 1568, 200, 'sine', 0.50, 480)  // G6 extra note
      }
      // days not in [7, 30, 100]: do nothing
    } catch { /* silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  return {
    soundEnabled,
    toggleSound,
    playKeyClick,
    playTileReveal,
    playSubmit,
    playInvalid,
    playWin,
    playLose,
    playStreakMilestone,
  }
}
