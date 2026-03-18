import type { AtomType } from '../types';

const BASE = 'https://pubchem.ncbi.nlm.nih.gov';
const PUG  = `${BASE}/rest/pug`;

export const pubchemUrl = {
  image2D: (cid: number, size = 300) =>
    `${PUG}/compound/cid/${cid}/PNG?image_size=${size}x${size}`,

  sdf3D: (cid: number) =>
    `${PUG}/compound/cid/${cid}/SDF?record_type=3d`,

  embedViewer: (cid: number) =>
    `${BASE}/compound/${cid}#section=3D-Conformer&embed=true`,

  compoundPage: (cid: number) =>
    `${BASE}/compound/${cid}`,
};

export async function fetchSDF3D(cid: number): Promise<string | null> {
  try {
    const res = await fetch(pubchemUrl.sdf3D(cid));
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export const MOLECULE_3D_STYLE = {
  stick:  { radius: 0.12, colorscheme: 'Jmol' },
  sphere: { scale: 0.25,  colorscheme: 'Jmol' },
};

// ── CPK colors for common elements ───────────────────────────────────────────

const CPK_COLORS: Record<string, { color: string; label: string }> = {
  H:  { color: '#ffffff', label: 'Idrogeno' },
  C:  { color: '#909090', label: 'Carbonio' },
  N:  { color: '#3050f8', label: 'Azoto' },
  O:  { color: '#ff4040', label: 'Ossigeno' },
  F:  { color: '#90e050', label: 'Fluoro' },
  P:  { color: '#ff8000', label: 'Fosforo' },
  S:  { color: '#ffff30', label: 'Zolfo' },
  Cl: { color: '#1ff01f', label: 'Cloro' },
  Br: { color: '#a62929', label: 'Bromo' },
  I:  { color: '#940094', label: 'Iodio' },
  Na: { color: '#ab5cf2', label: 'Sodio' },
  K:  { color: '#8f40d4', label: 'Potassio' },
  Ca: { color: '#3dff00', label: 'Calcio' },
  Fe: { color: '#e06633', label: 'Ferro' },
  Cu: { color: '#c88033', label: 'Rame' },
  Zn: { color: '#7d80b0', label: 'Zinco' },
  Mg: { color: '#8aff00', label: 'Magnesio' },
};

const DEFAULT_ATOM = { color: '#cccccc', label: 'Elemento' };

/** Parse a molecular formula and return unique AtomType[] with CPK colors. */
export function getAtomTypesFromFormula(formula: string): AtomType[] {
  // Strip subscripts and superscripts (unicode or digits after element)
  // Match elements: uppercase letter optionally followed by lowercase letter
  const elementRegex = /([A-Z][a-z]?)/g;
  const seen = new Set<string>();
  const result: AtomType[] = [];
  let match: RegExpExecArray | null;

  while ((match = elementRegex.exec(formula)) !== null) {
    const symbol = match[1];
    if (!seen.has(symbol)) {
      seen.add(symbol);
      const info = CPK_COLORS[symbol] ?? DEFAULT_ATOM;
      result.push({ symbol, color: info.color, label: info.label });
    }
  }

  return result;
}
