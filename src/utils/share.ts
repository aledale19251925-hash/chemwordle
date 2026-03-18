import type { GameState } from '../types';

const EMOJI: Record<string, string> = {
  correct: '🟩',
  present: '🟨',
  absent:  '⬛',
};

/**
 * Generates the shareable result card from a GameState.
 *
 * Example (won in 4):
 *   ChemWordle #20178 — ETHANOL — 4/6 🧪
 *   ⬛⬛⬛⬛⬛⬛⬛
 *   ⬛🟨⬛🟨⬛⬛⬛
 *   🟩🟩🟩⬛🟩🟩🟩
 *   🟩🟩🟩🟩🟩🟩🟩
 *   chemwordle.app ⚗️
 */
export function buildShareText(gameState: GameState): string {
  const name = gameState.revealedMolecule?.display_name ?? gameState.target;
  const score = gameState.status === 'won' ? `${gameState.feedbacks.length}/6` : 'X/6';
  const header = `ChemWordle #${gameState.dayIndex} — ${name} — ${score} 🧪`;
  const grid = gameState.feedbacks
    .map(row => row.map(f => EMOJI[f.status] ?? '⬛').join(''))
    .join('\n');
  return [header, grid, 'chemwordle.app ⚗️'].join('\n');
}

/**
 * Copies text to clipboard.
 * Primary:  navigator.clipboard.writeText
 * Fallback: execCommand('copy') via a temporary textarea
 * Returns true on success, false on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Primary: modern Clipboard API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback
    }
  }

  // Fallback: execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
