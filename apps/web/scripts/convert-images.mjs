// One-off image conversion: PNG → WebP for the fox icon/hero.
// Keeps source PNGs in case we ever need fallback, but the components
// import .webp directly. Re-run if a PNG source changes:
//   node scripts/convert-images.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = join(__dirname, '..', 'src', 'pages', 'landing');

const sources = ['fox-icon.png', 'fox-hero.png'];

for (const src of sources) {
  const input = join(base, src);
  const output = input.replace(/\.png$/, '.webp');
  const info = await sharp(input)
    // quality 88 is the sweet spot for graphical content — sub-1% visible
    // difference vs 100, but ~3-5x smaller files than equivalent PNG.
    .webp({ quality: 88, effort: 6 })
    .toFile(output);
  console.log(`✓ ${src} → ${src.replace('.png', '.webp')}: ${(info.size / 1024).toFixed(1)} KB`);
}
