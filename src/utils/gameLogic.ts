import type { LetterFeedback, LetterStatus, LetterResult, GameState, GuessHistoryEntry, Stats } from '../types';
import { getDailyMolecule } from '../data/molecules';

export const MAX_ATTEMPTS = 5;

export function normalizeInput(raw: string): string {
  return raw.trim().toUpperCase()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function computeFeedback(guess: string, target: string): LetterFeedback[] {
  const result: LetterFeedback[] = Array.from(guess).map(letter => ({ letter, status: 'absent' as LetterStatus }));
  const targetArr = Array.from(target);
  const used = new Array(target.length).fill(false);

  // Pass 1: correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === targetArr[i]) {
      result[i].status = 'correct';
      used[i] = true;
    }
  }

  // Pass 2: present but wrong position
  for (let i = 0; i < guess.length; i++) {
    if (result[i].status === 'correct') continue;
    const idx = targetArr.findIndex((l, j) => !used[j] && l === guess[i]);
    if (idx !== -1) {
      result[i].status = 'present';
      used[idx] = true;
    }
  }

  return result;
}

export function getKeyboardStatuses(feedbacks: LetterFeedback[][]): Record<string, LetterStatus> {
  const priority: Record<LetterStatus, number> = { empty: 0, absent: 1, present: 2, correct: 3 };
  const map: Record<string, LetterStatus> = {};
  for (const row of feedbacks) {
    for (const { letter, status } of row) {
      const existing = map[letter];
      if (!existing || priority[status] > priority[existing]) {
        map[letter] = status;
      }
    }
  }
  return map;
}

// ── Step 13: new game logic ───────────────────────────────────────────────────

export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  return computeFeedback(guess, answer).map(f => f.status as LetterResult);
}

export function getLockedLetters(
  prevLocked: (string | null)[],
  guess: string[],
  results: LetterResult[],
): (string | null)[] {
  return prevLocked.map((existing, i) => {
    if (existing !== null) return existing;
    if (results[i] === 'correct') return guess[i];
    return null;
  });
}

export function initCurrentGuess(answer: string, lockedLetters: (string | null)[]): string[] {
  return answer.split('').map((char, i) => {
    if (char === ' ') return ' ';
    if (lockedLetters[i] !== null) return lockedLetters[i]!;
    return '';
  });
}

// ── Shared utilities ──────────────────────────────────────────────────────────

export function getDayIndex(): number {
  return Math.floor(Date.now() / 86_400_000);
}

export function isGameOver(state: GameState): boolean {
  return state.status !== 'playing';
}

export function checkWin(guess: string, target: string): boolean {
  return normalizeInput(guess) === normalizeInput(target);
}

export const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function updateStats(stats: Stats, state: GameState): Stats {
  const todayISO = toISODate(new Date());
  // Guard against double-counting the same day
  if (stats.lastPlayedDate === todayISO) return stats;

  const won = state.status === 'won';
  const dist = [...stats.guessDistribution];

  if (won) {
    const idx = state.guessHistory.length - 1; // 0-indexed
    dist[idx] = (dist[idx] ?? 0) + 1;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const streakContinues = stats.lastPlayedDate === toISODate(yesterday);
  const newStreak = won ? (streakContinues ? stats.currentStreak + 1 : 1) : 0;

  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    currentStreak: newStreak,
    bestStreak: Math.max(stats.bestStreak, newStreak),
    guessDistribution: dist,
    lastPlayedDate: todayISO,
  };
}

export function buildInitialGameState(): GameState {
  const mol = getDailyMolecule();
  const answer = mol.normalized_name;
  return {
    dayIndex: getDayIndex(),
    answer,
    lockedLetters: new Array(answer.length).fill(null),
    attemptNumber: 0,
    maxAttempts: MAX_ATTEMPTS,
    status: 'playing',
    guessHistory: [],
    moleculeData: null,
  };
}

const SHARE_EMOJI: Record<LetterResult | 'empty', string> = {
  correct: '🟩',
  present: '🟨',
  absent:  '⬛',
  empty:   '⬜',
};

export function buildShareText(state: GameState): string {
  const score = state.status === 'won' ? `${state.guessHistory.length}/${state.maxAttempts}` : `X/${state.maxAttempts}`;
  const grid = state.guessHistory
    .map((entry: GuessHistoryEntry) => entry.results.map(r => SHARE_EMOJI[r]).join(''))
    .join('\n');
  return `ChemWordle #${state.dayIndex} — ${score} 🧪\n${grid}\nchemwordle.app ⚗️`;
}
