import type { GameState, Stats } from '../types';
import { getDayIndex } from './gameLogic';
import { getDailyMolecule, findMoleculeByName } from '../data/molecules';
import { EMPTY_STATS } from './gameLogic';

const SCHEMA_VERSION = '1.0';

const KEYS = {
  state: 'chemwordle-state',
  stats:  'chemwordle-stats',
} as const;

// ── Internal helpers ────────────────────────────────────────────────────────

type Versioned<T> = T & { _v: string };

function withVersion<T extends object>(data: T): Versioned<T> {
  return { ...data, _v: SCHEMA_VERSION };
}

function versionOk(parsed: Record<string, unknown>): boolean {
  return parsed['_v'] === SCHEMA_VERSION;
}

// ── GameState ────────────────────────────────────────────────────────────────

type PersistedState = {
  _v: string;
  dayIndex: number;
  guesses: string[];
  feedbacks: unknown;
  status: string;
};

export function saveGameState(state: GameState): void {
  try {
    const payload = withVersion({
      dayIndex:  state.dayIndex,
      guesses:   state.guesses,
      feedbacks: state.feedbacks,
      status:    state.status,
    });
    localStorage.setItem(KEYS.state, JSON.stringify(payload));
  } catch (error) {
    console.error('[ChemWordle storage] saveGameState failed:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEYS.state);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedState;

    // Schema version check
    if (!versionOk(parsed as unknown as Record<string, unknown>)) {
      console.warn('[ChemWordle storage] Schema mismatch — resetting game state');
      localStorage.removeItem(KEYS.state);
      return null;
    }

    // Stale day check
    if (parsed.dayIndex !== getDayIndex()) return null;

    // Reconstruct derived fields
    const target = getDailyMolecule().normalized_name;
    const status = parsed.status as GameState['status'];
    const revealedMolecule = status !== 'playing'
      ? (findMoleculeByName(target) ?? null)
      : null;

    return {
      dayIndex: parsed.dayIndex,
      target,
      guesses:   parsed.guesses,
      feedbacks: parsed.feedbacks as GameState['feedbacks'],
      status,
      revealedMolecule,
    };
  } catch (error) {
    console.error('[ChemWordle storage] loadGameState failed:', error);
    localStorage.removeItem(KEYS.state);
    return null;
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function saveStats(stats: Stats): void {
  try {
    localStorage.setItem(KEYS.stats, JSON.stringify(withVersion(stats)));
  } catch (error) {
    console.error('[ChemWordle storage] saveStats failed:', error);
  }
}

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEYS.stats);
    if (!raw) return { ...EMPTY_STATS };

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (!versionOk(parsed)) {
      console.warn('[ChemWordle storage] Schema mismatch — resetting stats');
      localStorage.removeItem(KEYS.stats);
      return { ...EMPTY_STATS };
    }

    // Merge with EMPTY_STATS as base so any missing keys are filled in
    const { _v: _version, ...data } = parsed;
    void _version;
    return { ...EMPTY_STATS, ...(data as Partial<Stats>) };
  } catch (error) {
    console.error('[ChemWordle storage] loadStats failed:', error);
    localStorage.removeItem(KEYS.stats);
    return { ...EMPTY_STATS };
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" (local timezone). */
export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Converts a UTC day index to a human-readable date string, e.g. "17 March 2026". */
export function dayIndexToDateString(dayIndex: number): string {
  return new Date(dayIndex * 86_400_000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
