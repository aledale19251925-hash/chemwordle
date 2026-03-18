export type Category =
  | 'common'        // Water, Salt — easy, universally known
  | 'organic'       // Ethanol, Benzene — organic chemistry
  | 'biochemistry'  // Glucose, Dopamine — life sciences
  | 'drugs'         // Caffeine, Aspirin — pharmacology
  | 'inorganic'     // Sulfuric Acid, NaHCO3
  | 'everyday';     // Capsaicin, Vanillin — kitchen & senses

export type Difficulty = 1 | 2 | 3;

export interface Molecule {
  id: string;
  display_name: string;
  normalized_name: string;
  aliases: string[];
  formula: string;
  molecular_weight: number;
  smiles: string;
  pubchem_cid: number;
  category: Category;
  difficulty: Difficulty;
  fun_fact: string;
  applications: [string, string] | [string, string, string];
  language: 'en';
  scheduled_date: string | null;
}

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

// TileStatus: feedback values for a played tile
export type TileStatus = LetterStatus;

// GameStatus: overall game phase
export type GameStatus = 'playing' | 'won' | 'lost';

// LetterFeedback kept for computeFeedback / getKeyboardStatuses
export interface LetterFeedback {
  letter: string;
  status: LetterStatus;
}

// ── Step 13: new game mechanic types ─────────────────────────────────────────

export type LetterResult = 'correct' | 'present' | 'absent';

export interface GuessHistoryEntry {
  guess: string;
  results: LetterResult[];
}

export interface AtomType {
  symbol: string;
  color: string;
  label: string;
}

export interface MoleculeData {
  formula: string;
  formulaDisplay: string;
  molecularWeight: number;
  atomTypes: AtomType[];
}

export interface GameState {
  dayIndex: number;
  answer: string;
  lockedLetters: (string | null)[];
  attemptNumber: number;
  maxAttempts: number;
  status: GameStatus;
  guessHistory: GuessHistoryEntry[];
  moleculeData: MoleculeData | null;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  guessDistribution: number[];   // length 6; index 0 = won on guess 1, etc.
  lastPlayedDate: string | null; // ISO date 'YYYY-MM-DD'
}
