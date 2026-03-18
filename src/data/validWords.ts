import { molecules } from './molecules';
import { normalizeInput } from '../utils/gameLogic';

const EXTRA_WORDS: string[] = [
  // Alcohols
  'PROPANOL', 'ISOPROPANOL', 'BUTANOL', 'PENTANOL', 'CYCLOHEXANOL',
  'ETHYLENE GLYCOL', 'BENZYL ALCOHOL',

  // Hydrocarbons
  'PENTANE', 'HEXANE', 'HEPTANE', 'OCTANE', 'CYCLOHEXANE', 'ACETYLENE',
  'PROPYLENE', 'NAPHTHALENE', 'ANTHRACENE', 'STYRENE', 'XYLENE',

  // Organic acids
  'OXALIC ACID', 'MALONIC ACID', 'SUCCINIC ACID', 'MALIC ACID', 'TARTARIC ACID',
  'BUTYRIC ACID', 'PALMITIC ACID', 'STEARIC ACID', 'OLEIC ACID', 'FORMIC ACID',

  // Inorganic
  'CARBON DIOXIDE', 'CARBON MONOXIDE', 'HYDROGEN SULFIDE', 'SODIUM HYDROXIDE',
  'POTASSIUM HYDROXIDE', 'COPPER SULFATE', 'HYDROCHLORIC ACID',
  'SILICON DIOXIDE', 'IRON OXIDE',

  // Amino acids
  'GLYCINE', 'ALANINE', 'VALINE', 'LEUCINE', 'PROLINE', 'SERINE', 'CYSTEINE',
  'TYROSINE', 'TRYPTOPHAN', 'LYSINE', 'ARGININE', 'PHENYLALANINE',

  // Biochemistry
  'CORTISOL', 'ESTROGEN', 'PROGESTERONE', 'OXYTOCIN', 'ADENOSINE', 'ADENINE',
  'GUANINE', 'CYTOSINE', 'THYMINE', 'URACIL', 'ATP', 'RIBOSE',
  'GALACTOSE', 'MALTOSE',

  // Vitamins
  'ASCORBIC ACID', 'RETINOL', 'RIBOFLAVIN', 'NIACIN', 'THIAMINE',
  'FOLIC ACID', 'BIOTIN',

  // Terpenes & aromatics
  'LINALOOL', 'THYMOL', 'CARVONE', 'GERANIOL', 'CAMPHOR', 'CINNAMALDEHYDE',

  // Sweeteners
  'SACCHARIN', 'ASPARTAME', 'SUCRALOSE', 'XYLITOL', 'SORBITOL',

  // Drugs
  'CODEINE', 'COCAINE', 'DIAZEPAM', 'LIDOCAINE', 'METFORMIN', 'AMOXICILLIN',
  'TETRACYCLINE', 'CIPROFLOXACIN',
];

// Layer 1: all molecule display names
const moleculeNames = molecules.map(m => m.normalized_name);

// Layer 2: all aliases from every molecule
const aliasNames = molecules.flatMap(m => m.aliases.map(a => normalizeInput(a)));

// Layer 3: extra words (already uppercase, normalise for safety)
const extraNormalized = EXTRA_WORDS.map(w => normalizeInput(w));

export const validWords: Set<string> = new Set([
  ...moleculeNames,
  ...aliasNames,
  ...extraNormalized,
]);

export const validWordsArray: string[] = [...validWords].sort();

export function isValidGuess(raw: string): boolean {
  return validWords.has(normalizeInput(raw));
}
