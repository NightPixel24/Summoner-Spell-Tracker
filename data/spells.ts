// Summoner's Rift spell pool. Verify cooldowns against the current patch before release.

export type SpellId =
  | 'flash'
  | 'teleport'
  | 'ignite'
  | 'heal'
  | 'barrier'
  | 'exhaust'
  | 'ghost'
  | 'cleanse'
  | 'smite';

export type Role = 'TOP' | 'JG' | 'MID' | 'BOT' | 'SUP';

export interface Spell {
  id: SpellId;
  name: string;
  cooldown: number; // seconds
  // Placeholder art until the Data Dragon icons are bundled (milestone 7).
  colors: [string, string];
  glyph: string;
}

export const SPELLS: Record<SpellId, Spell> = {
  flash: { id: 'flash', name: 'Flash', cooldown: 300, colors: ['#d9f25a', '#3a5f0b'], glyph: 'F' },
  teleport: { id: 'teleport', name: 'Teleport', cooldown: 360, colors: ['#d58cff', '#4b1a6b'], glyph: 'T' },
  ignite: { id: 'ignite', name: 'Ignite', cooldown: 180, colors: ['#ff9b3d', '#8a1204'], glyph: 'I' },
  heal: { id: 'heal', name: 'Heal', cooldown: 240, colors: ['#9ff09a', '#1f6b2a'], glyph: 'H' },
  barrier: { id: 'barrier', name: 'Barrier', cooldown: 180, colors: ['#ffd76b', '#8a5a00'], glyph: 'B' },
  exhaust: { id: 'exhaust', name: 'Exhaust', cooldown: 240, colors: ['#b9d3e6', '#2c4a63'], glyph: 'E' },
  ghost: { id: 'ghost', name: 'Ghost', cooldown: 240, colors: ['#7fd4ff', '#0b3f78'], glyph: 'G' },
  cleanse: { id: 'cleanse', name: 'Cleanse', cooldown: 240, colors: ['#7ff0e0', '#0f5e5a'], glyph: 'C' },
  smite: { id: 'smite', name: 'Smite', cooldown: 90, colors: ['#ffe08a', '#a3470a'], glyph: 'S' },
};

export const SPELL_IDS = Object.keys(SPELLS) as SpellId[];

export const ROLES: Role[] = ['TOP', 'JG', 'MID', 'BOT', 'SUP'];

export const DEFAULT_LOADOUT: Record<Role, [SpellId, SpellId]> = {
  TOP: ['flash', 'teleport'],
  JG: ['flash', 'smite'],
  MID: ['flash', 'ignite'],
  BOT: ['flash', 'heal'],
  SUP: ['flash', 'exhaust'],
};
