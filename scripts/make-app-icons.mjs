// Builds the app icon, Android adaptive icon, splash image and favicon from the logo
// artwork in assets/brand/logo.png. Rerun after replacing the logo.
//
//   node scripts/make-app-icons.mjs
//
// The logo is a gold stopwatch on a near-black navy background. Where the icon needs a
// transparent background (adaptive foreground, splash), the clock face is kept whole and
// the background around it is keyed out by colour, which keeps the gold glow soft.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const logo = PNG.sync.read(await readFile(join(assets, 'brand', 'logo.png')));
const W = logo.width;
const H = logo.height;

// Measured from the artwork: its background colour, the clock face (kept opaque), and the
// bounding box of everything drawn (stopwatch crown to the foot of the L).
const BG = [5, 14, 23];
const FACE = { x: 0.5 * W, y: 0.5 * H, r: 0.43 * W };
const BOX = { x0: 54, y0: 10, x1: 824, y1: 826 };

// Bilinear sample of the logo at a fractional source position, as [r, g, b].
function sample(x, y) {
  const cx = Math.min(W - 1, Math.max(0, x - 0.5));
  const cy = Math.min(H - 1, Math.max(0, y - 0.5));
  const x0 = Math.floor(cx);
  const y0 = Math.floor(cy);
  const x1 = Math.min(W - 1, x0 + 1);
  const y1 = Math.min(H - 1, y0 + 1);
  const fx = cx - x0;
  const fy = cy - y0;
  const px = (xx, yy, k) => logo.data[(yy * W + xx) * 4 + k];
  return [0, 1, 2].map(
    (k) =>
      px(x0, y0, k) * (1 - fx) * (1 - fy) +
      px(x1, y0, k) * fx * (1 - fy) +
      px(x0, y1, k) * (1 - fx) * fy +
      px(x1, y1, k) * fx * fy,
  );
}

// The logo at a source position with its background removed, as [r, g, b, alpha].
function cutout(x, y) {
  const c = sample(x, y);
  if (Math.hypot(x - FACE.x, y - FACE.y) < FACE.r) return [...c, 1];
  const diff = Math.max(...c.map((v, k) => Math.abs(v - BG[k])));
  const a = Math.min(1, Math.max(0, (diff - 6) / 40));
  if (a === 0) return [0, 0, 0, 0];
  // Un-mix the background so the edge colour stays gold rather than going dark.
  return [...c.map((v, k) => Math.min(255, Math.max(0, (v - BG[k] * (1 - a)) / a))), a];
}

// Render a size x size image. The logo's point
// (cx, cy) lands in the middle and `scale` is output pixels per logo pixel.
function render(size, { cx, cy, scale, transparent }) {
  const png = new PNG({ width: size, height: size });
  const ss = Math.max(2, Math.ceil(2 / scale)); // enough samples per axis when shrinking
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let [r, g, b, a] = [0, 0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = cx + (px + (sx + 0.5) / ss - size / 2) / scale;
          const y = cy + (py + (sy + 0.5) / ss - size / 2) / scale;
          const inside = x >= 0 && y >= 0 && x < W && y < H;
          let c;
          if (transparent) c = inside ? cutout(x, y) : [0, 0, 0, 0];
          else c = inside ? [...sample(x, y), 1] : [...BG, 1];
          // Premultiplied accumulation so edges blend correctly.
          r += c[0] * c[3];
          g += c[1] * c[3];
          b += c[2] * c[3];
          a += c[3];
        }
      }
      const i = (py * size + px) * 4;
      png.data[i] = a ? Math.round(r / a) : 0;
      png.data[i + 1] = a ? Math.round(g / a) : 0;
      png.data[i + 2] = a ? Math.round(b / a) : 0;
      png.data[i + 3] = Math.round((a / (ss * ss)) * 255);
    }
  }
  return PNG.sync.write(png);
}

// Fit the drawn part of the logo into `fraction` of the canvas, centred.
const fit = (size, fraction) => ({
  cx: (BOX.x0 + BOX.x1) / 2,
  cy: (BOX.y0 + BOX.y1) / 2,
  scale: (size * fraction) / Math.max(BOX.x1 - BOX.x0, BOX.y1 - BOX.y0),
});
// The whole square artwork, background included.
const full = (size) => ({ cx: W / 2, cy: H / 2, scale: size / W });

const outputs = {
  // iOS / legacy / store icon: square and opaque, the artwork as drawn.
  'icon.png': render(1024, full(1024)),
  // Android adaptive foreground: only a 66/108 circle in the middle is sure to show (round
  // launchers), and the L's bottom corner reaches furthest out, so the logo is kept small.
  'android-icon-foreground.png': render(1024, { ...fit(1024, 0.53), transparent: true }),
  // Splash: transparent, shown on the app's background colour.
  'splash-icon.png': render(1024, { ...fit(1024, 0.96), transparent: true }),
  'favicon.png': render(48, full(48)),
};

for (const [name, png] of Object.entries(outputs)) {
  await writeFile(join(assets, name), png);
  console.log(`assets/${name}`);
}
