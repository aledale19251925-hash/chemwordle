import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, 'public');
mkdirSync(publicDir, { recursive: true });

function buildSvg(size) {
  const pad = Math.round(size * 0.08);
  const cx = size / 2;
  const cy = size / 2;
  const r  = cx - pad;

  const neckW  = size * 0.22;
  const neckH  = size * 0.30;
  const bodyW  = size * 0.64;
  const bodyH  = size * 0.32;
  const neckX  = (size - neckW) / 2;
  const neckY  = size * 0.12;
  const bodyX  = (size - bodyW) / 2;
  const bodyY  = neckY + neckH;
  const btmR   = size * 0.06;

  const capW   = neckW + size * 0.06;
  const capH   = size * 0.06;
  const capX   = (size - capW) / 2;
  const capY   = neckY - capH + size * 0.01;

  const b1cx = bodyX + bodyW * 0.22;
  const b1cy = bodyY + bodyH * 0.55;
  const b1r  = size * 0.035;

  const b2cx = bodyX + bodyW * 0.42;
  const b2cy = bodyY + bodyH * 0.72;
  const b2r  = size * 0.025;

  const b3cx = bodyX + bodyW * 0.28;
  const b3cy = bodyY + bodyH * 0.82;
  const b3r  = size * 0.018;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0d1505"/>
    <rect x="${capX}" y="${capY}" width="${capW}" height="${capH}"
          rx="${size * 0.015}" fill="#4ade80" opacity="0.85"/>
    <rect x="${neckX}" y="${neckY}" width="${neckW}" height="${neckH}"
          fill="#4ade80"/>
    <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}"
          rx="${btmR}" fill="#4ade80"/>
    <rect x="${neckX}" y="${bodyY - size * 0.015}"
          width="${neckW}" height="${size * 0.03}" fill="#4ade80"/>
    <rect x="${bodyX + size * 0.02}" y="${bodyY + bodyH * 0.42}"
          width="${bodyW - size * 0.04}" height="${bodyH * 0.52}"
          rx="${btmR * 0.6}" fill="#15803d" opacity="0.7"/>
    <circle cx="${b1cx}" cy="${b1cy}" r="${b1r}" fill="#86efac" opacity="0.8"/>
    <circle cx="${b2cx}" cy="${b2cy}" r="${b2r}" fill="#86efac" opacity="0.8"/>
    <circle cx="${b3cx}" cy="${b3cy}" r="${b3r}" fill="#86efac" opacity="0.8"/>
  </svg>`;
}

const sizes = [192, 512];

for (const size of sizes) {
  const svg = Buffer.from(buildSvg(size));
  const outPath = resolve(publicDir, `icon-${size}.png`);
  await sharp(svg)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ Generated ${outPath}`);
}

console.log('Icons generated successfully!');
