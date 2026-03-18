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
