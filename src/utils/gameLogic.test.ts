import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeFeedback,
  getKeyboardStatuses,
  updateStats,
  getDayIndex,
  EMPTY_STATS,
} from './gameLogic';
import { saveGameState, loadGameState, loadStats } from './storage';
import type { LetterFeedback, GameState, Stats } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeGuessHistory(count: number) {
  return Array(count).fill({ guess: 'GUESS', results: [] as any[] });
}

function makeState(overrides: Partial<GameState>): GameState {
  return {
    dayIndex: getDayIndex(),
    answer: 'WATER',
    lockedLetters: [null, null, null, null, null],
    attemptNumber: 0,
    maxAttempts: 5,
    status: 'playing',
    guessHistory: [],
    moleculeData: null,
    ...overrides,
  };
}

function makeStats(overrides: Partial<Stats>): Stats {
  return { ...EMPTY_STATS, ...overrides };
}

// ── GROUP 1: computeFeedback — basic ─────────────────────────────────────────

describe('computeFeedback — basic', () => {
  it('TEST 1 — exact match: all letters correct', () => {
    const result = computeFeedback('WATER', 'WATER');
    expect(result.every(f => f.status === 'correct')).toBe(true);
    expect(result.map(f => f.letter)).toEqual(['W', 'A', 'T', 'E', 'R']);
  });

  it('TEST 2 — no match: all letters absent', () => {
    const result = computeFeedback('OZONE', 'WATER');
    // O(0)→absent, Z(1)→absent, O(2)→absent, N(3)→absent, E(4)→present (E in WATER)
    expect(result[0]).toMatchObject({ letter: 'O', status: 'absent' });
    expect(result[1]).toMatchObject({ letter: 'Z', status: 'absent' });
    expect(result[2]).toMatchObject({ letter: 'O', status: 'absent' });
    expect(result[3]).toMatchObject({ letter: 'N', status: 'absent' });
    expect(result[4]).toMatchObject({ letter: 'E', status: 'present' }); // E exists in WATER
  });

  it('TEST 3 — all present: all letters exist but all in wrong position', () => {
    // AEWRT is an anagram of WATER with no letter in its original position
    const result = computeFeedback('AEWRT', 'WATER');
    expect(result.every(f => f.status === 'present')).toBe(true);
  });

  it('TEST 4 — mixed result: METANOL vs ETHANOL', () => {
    const result = computeFeedback('METANOL', 'ETHANOL');
    expect(result[0]).toMatchObject({ letter: 'M', status: 'absent' });
    expect(result[1]).toMatchObject({ letter: 'E', status: 'present' });
    expect(result[2]).toMatchObject({ letter: 'T', status: 'present' });
    expect(result[3]).toMatchObject({ letter: 'A', status: 'correct' });
    expect(result[4]).toMatchObject({ letter: 'N', status: 'correct' });
    expect(result[5]).toMatchObject({ letter: 'O', status: 'correct' });
    expect(result[6]).toMatchObject({ letter: 'L', status: 'correct' });
  });
});

// ── GROUP 2: computeFeedback — duplicates ────────────────────────────────────

describe('computeFeedback — duplicate letters', () => {
  it('TEST 5 — duplicate in guess, one consumed by exact match', () => {
    const result = computeFeedback('TALL', 'SALT');
    expect(result[0]).toMatchObject({ letter: 'T', status: 'present' });
    expect(result[1]).toMatchObject({ letter: 'A', status: 'correct' });
    expect(result[2]).toMatchObject({ letter: 'L', status: 'correct' });
    expect(result[3]).toMatchObject({ letter: 'L', status: 'absent' });
  });

  it('TEST 6 — two A\'s in guess, two A\'s in target (AORTA vs APART)', () => {
    const result = computeFeedback('APART', 'AORTA');
    expect(result[0]).toMatchObject({ letter: 'A', status: 'correct' });
    expect(result[1]).toMatchObject({ letter: 'P', status: 'absent' });
    expect(result[2]).toMatchObject({ letter: 'A', status: 'present' });
    expect(result[3]).toMatchObject({ letter: 'R', status: 'present' });
    expect(result[4]).toMatchObject({ letter: 'T', status: 'present' });
  });

  it('TEST 7 — duplicate letter in guess where first occurrence is consumed by correct', () => {
    const result = computeFeedback('EATER', 'WATER');
    expect(result[0]).toMatchObject({ letter: 'E', status: 'absent' });
    expect(result[1]).toMatchObject({ letter: 'A', status: 'correct' });
    expect(result[2]).toMatchObject({ letter: 'T', status: 'correct' });
    expect(result[3]).toMatchObject({ letter: 'E', status: 'correct' });
    expect(result[4]).toMatchObject({ letter: 'R', status: 'correct' });
  });
});

// ── GROUP 3: getKeyboardStatuses ─────────────────────────────────────────────

describe('getKeyboardStatuses', () => {
  it('TEST 8 — single guess, mixed results', () => {
    const feedbacks: LetterFeedback[][] = [[
      { letter: 'E', status: 'correct' },
      { letter: 'T', status: 'present' },
      { letter: 'H', status: 'absent' },
    ]];
    const result = getKeyboardStatuses(feedbacks);
    expect(result['E']).toBe('correct');
    expect(result['T']).toBe('present');
    expect(result['H']).toBe('absent');
  });

  it('TEST 9 — same letter upgraded across two guesses (present → correct)', () => {
    const feedbacks: LetterFeedback[][] = [
      [{ letter: 'E', status: 'present' }],
      [{ letter: 'E', status: 'correct' }],
    ];
    const result = getKeyboardStatuses(feedbacks);
    expect(result['E']).toBe('correct');
  });

  it('TEST 10 — correct is never overwritten by a later absent', () => {
    const feedbacks: LetterFeedback[][] = [
      [{ letter: 'A', status: 'correct' }],
      [{ letter: 'A', status: 'absent' }],
    ];
    const result = getKeyboardStatuses(feedbacks);
    expect(result['A']).toBe('correct');
  });
});

// ── GROUP 4: updateStats ──────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

describe('updateStats', () => {
  it('TEST 11 — first win starts streak at 1', () => {
    const state = makeState({ status: 'won', guessHistory: makeGuessHistory(3), dayIndex: 100 });
    const result = updateStats(EMPTY_STATS, state);
    expect(result.gamesPlayed).toBe(1);
    expect(result.gamesWon).toBe(1);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
    expect(result.guessDistribution[2]).toBe(1); // 3 guesses → index 2
    expect(result.lastPlayedDate).toBe(todayISO());
  });

  it('TEST 12 — consecutive win increments streak', () => {
    const stats = makeStats({ currentStreak: 3, bestStreak: 3, lastPlayedDate: yesterdayISO() });
    const state = makeState({ status: 'won', guessHistory: makeGuessHistory(2), dayIndex: 100 });
    const result = updateStats(stats, state);
    expect(result.currentStreak).toBe(4);
    expect(result.bestStreak).toBe(4);
  });

  it('TEST 13 — streak resets to 1 after gap (bestStreak preserved)', () => {
    const stats = makeStats({ currentStreak: 5, bestStreak: 5, lastPlayedDate: '2020-01-01' });
    const state = makeState({ status: 'won', guessHistory: makeGuessHistory(1), dayIndex: 100 });
    const result = updateStats(stats, state);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(5);
  });

  it('TEST 14 — loss resets streak to 0, gamesWon unchanged', () => {
    const stats = makeStats({ gamesWon: 10, currentStreak: 3, bestStreak: 3, lastPlayedDate: yesterdayISO() });
    const state = makeState({ status: 'lost', guessHistory: makeGuessHistory(5), dayIndex: 100 });
    const result = updateStats(stats, state);
    expect(result.currentStreak).toBe(0);
    expect(result.gamesWon).toBe(10);
  });

  it('TEST 15 — double-count guard: same day returns stats unchanged', () => {
    const stats = makeStats({ gamesPlayed: 1, lastPlayedDate: todayISO() });
    const state = makeState({ status: 'won', dayIndex: 100 });
    const result = updateStats(stats, state);
    expect(result).toBe(stats); // exact same reference
    expect(result.gamesPlayed).toBe(1);
  });
});

// ── GROUP 5: storage ─────────────────────────────────────────────────────────

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TEST 16 — save and reload GameState for today', () => {
    const state = makeState({
      dayIndex: getDayIndex(),
      guessHistory: [
        { guess: 'WATER', results: ['correct', 'correct', 'correct', 'correct', 'correct'] },
        { guess: 'ETHANOL', results: [] as any },
      ],
      status: 'playing',
    });
    saveGameState(state);
    const loaded = loadGameState();
    expect(loaded).not.toBeNull();
    expect(loaded!.guessHistory).toHaveLength(2);
    expect(loaded!.guessHistory[0].guess).toBe('WATER');
    expect(loaded!.status).toBe('playing');
    expect(loaded!.dayIndex).toBe(getDayIndex());
  });

  it('TEST 17 — stale state (yesterday\'s dayIndex) returns null', () => {
    const state = makeState({ dayIndex: getDayIndex() - 1 });
    saveGameState(state);
    const loaded = loadGameState();
    expect(loaded).toBeNull();
  });

  it('TEST 18 — corrupt localStorage returns EMPTY_STATS, no exception thrown', () => {
    localStorage.setItem('chemwordle-stats', 'not valid json{');
    expect(() => {
      const result = loadStats();
      expect(result).toEqual(EMPTY_STATS);
    }).not.toThrow();
  });
});
