// Downloads the official summoner spell icons from Riot's Data Dragon CDN into
// assets/spells/, plus a greyed-out copy of each for the cooldown state, and
// prints Riot's cooldowns so data/spells.ts can be checked against the patch.
//
//   node scripts/fetch-spell-icons.mjs            # latest patch
//   node scripts/fetch-spell-icons.mjs 16.18.1    # a specific patch
//
// The icons are committed, so the app works offline; rerun this after a patch
// that changes them.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

// Our spell id -> Data Dragon summoner spell id.
const SPELLS = {
  flash: 'SummonerFlash',
  teleport: 'SummonerTeleport',
  ignite: 'SummonerDot',
  heal: 'SummonerHeal',
  barrier: 'SummonerBarrier',
  exhaust: 'SummonerExhaust',
  ghost: 'SummonerHaste',
  cleanse: 'SummonerBoost',
  smite: 'SummonerSmite',
};

// Same look as the mockup's CSS: grayscale(1) brightness(.55).
const GREY_BRIGHTNESS = 0.55;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'spells');
const cdn = 'https://ddragon.leagueoflegends.com';

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

function greyscale(pngBuffer) {
  const png = PNG.sync.read(pngBuffer);
  const d = png.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.round((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * GREY_BRIGHTNESS);
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  return PNG.sync.write(png);
}

const version = process.argv[2] ?? (await (await get(`${cdn}/api/versions.json`)).json())[0];
const { data } = await (await get(`${cdn}/cdn/${version}/data/en_US/summoner.json`)).json();

await mkdir(outDir, { recursive: true });
console.log(`Data Dragon ${version}\n`);
console.log('spell      cooldown (s)  image');

for (const [id, ddId] of Object.entries(SPELLS)) {
  const spell = data[ddId];
  if (!spell) throw new Error(`${ddId} missing from summoner.json for ${version}`);
  const png = Buffer.from(await (await get(`${cdn}/cdn/${version}/img/spell/${spell.image.full}`)).arrayBuffer());
  await writeFile(join(outDir, `${id}.png`), png);
  await writeFile(join(outDir, `${id}-grey.png`), greyscale(png));
  console.log(`${id.padEnd(10)} ${String(spell.cooldown[0]).padEnd(13)} ${spell.image.full}`);
}

await writeFile(join(outDir, 'VERSION'), `${version}\n`);
console.log(`\nSaved ${Object.keys(SPELLS).length * 2} icons to assets/spells/`);
