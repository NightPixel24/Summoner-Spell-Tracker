// Draws the app icon, Android adaptive icon layers, splash image and favicon:
// a cooldown clock like the tiles use, gold swept 3/4 of the way round from 12 o'clock,
// with the last quarter still grey. Rerun after changing the colours or shape.
//
//   node scripts/make-app-icons.mjs

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

export const NAVY = [0x13, 0x23, 0x3b];
const GOLD = [0xe0, 0xa9, 0x3b];
const GREY = [0x5b, 0x65, 0x73];
const WHITE = [0xff, 0xff, 0xff];
const SWEEP = 0.75; // fraction of the clock that has "come back"
const SS = 4; // supersampling per axis, for smooth edges

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// Colour + alpha of the clock at (x, y), in a unit square centred on the clock.
// r is the clock radius as a fraction of the canvas.
function clock(x, y, r, mono) {
  const dx = x - 0.5;
  const dy = y - 0.5;
  const d = Math.hypot(dx, dy);
  const ring = r * 0.09;
  if (d > r) return null;
  if (d > r - ring) return [...WHITE, 1]; // outer ring
  if (d < r * 0.11) return mono ? null : [...WHITE, 1]; // centre hub
  // Angle clockwise from 12 o'clock, 0..1.
  const turn = ((Math.atan2(dx, -dy) / (2 * Math.PI)) + 1) % 1;
  if (turn <= SWEEP) return mono ? [...WHITE, 1] : [...GOLD, 1];
  return mono ? [...WHITE, 0.35] : [...GREY, 1];
}

function render(size, { r, bg = null, mono = false }) {
  const png = new PNG({ width: size, height: size });
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let [cr, cg, cb, ca] = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          let c = clock(x, y, r, mono);
          if (!c && bg) c = [...bg, 1];
          if (!c) continue;
          // Premultiplied accumulation so edges blend correctly.
          cr += c[0] * c[3];
          cg += c[1] * c[3];
          cb += c[2] * c[3];
          ca += c[3];
        }
      }
      const i = (py * size + px) * 4;
      const n = SS * SS;
      png.data[i] = ca ? Math.round(cr / ca) : 0;
      png.data[i + 1] = ca ? Math.round(cg / ca) : 0;
      png.data[i + 2] = ca ? Math.round(cb / ca) : 0;
      png.data[i + 3] = Math.round((ca / n) * 255);
    }
  }
  return PNG.sync.write(png);
}

const outputs = {
  // iOS / legacy / store icon: square, opaque, no rounded corners.
  'icon.png': render(1024, { r: 0.36, bg: NAVY }),
  // Android adaptive layers: the launcher masks to ~66% in the middle, so keep the clock inside that.
  'android-icon-foreground.png': render(1024, { r: 0.27 }),
  'android-icon-monochrome.png': render(1024, { r: 0.27, mono: true }),
  // Splash: transparent, shown on the navy splash background.
  'splash-icon.png': render(1024, { r: 0.46 }),
  'favicon.png': render(48, { r: 0.44, bg: NAVY }),
};

for (const [name, png] of Object.entries(outputs)) {
  await writeFile(join(assets, name), png);
  console.log(`assets/${name}`);
}
