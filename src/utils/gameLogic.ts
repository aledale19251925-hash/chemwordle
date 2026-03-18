import type { LetterFeedback, LetterStatus, GameState, Stats } from '../types';
import { getDailyMolecule } from '../data/molecules';

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

export function getDayIndex(): number {
  return Math.floor(Date.now() / 86_400_000);
}

export function isGameOver(state: GameState): boolean {
  return state.status !== 'playing' || state.guesses.length >= 6;
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
    const idx = state.guesses.length - 1; // 0-indexed
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
  return {
    dayIndex: getDayIndex(),
    target: getDailyMolecule().normalized_name,
    guesses: [],
    feedbacks: [],
    status: 'playing',
    revealedMolecule: null,
  };
}

// Legacy helper kept for internal use — new callers should use share.ts buildShareText
const SHARE_EMOJI: Record<LetterStatus, string> = {
  correct: '🟩',
  present: '🟨',
  absent:  '⬛',
  empty:   '⬜',
};

export function buildShareText(state: GameState): string {
  const score = state.status === 'won' ? `${state.guesses.length}/6` : 'X/6';
  const grid = state.feedbacks
    .map(row => row.map(f => SHARE_EMOJI[f.status]).join(''))
    .join('\n');
  return `ChemWordle #${state.dayIndex} — ${score} 🧪\n${grid}\nchemwordle.app ⚗️`;
}
