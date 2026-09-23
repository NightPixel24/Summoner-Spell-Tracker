import { ImageSourcePropType } from 'react-native';

// Summoner's Rift spell pool. Default cooldowns checked against patch 16.18.1 (Data Dragon)
// and the League wiki on 2026-09-24. `node scripts/fetch-spell-icons.mjs` prints Riot's
// current values and refreshes the icons. Smite is the exception: Riot lists its 15s
// between-charges cooldown, but the 90s charge recharge is what's worth tracking.

export type SpellId =
  | 'flash'
  | 'teleport'
  | 'ignite'
  | 'heal'
  | 'barrier'
  | 'exhaust'
  | 'ghost'
  | 'cleanse'
  | 'smite'
  | 'unleashedTeleport';

export type Role = 'TOP' | 'JG' | 'MID' | 'BOT' | 'SUP';

export interface Spell {
  id: SpellId;
  name: string;
  cooldown: number; // seconds
  // Official Data Dragon icon, plus a greyed-out copy for the cooldown state.
  icon: ImageSourcePropType;
  iconGrey: ImageSourcePropType;
}

export const SPELLS: Record<SpellId, Spell> = {
  flash: {
    id: 'flash',
    name: 'Flash',
    cooldown: 300,
    icon: require('../assets/spells/flash.png'),
    iconGrey: require('../assets/spells/flash-grey.png'),
  },
  teleport: {
    id: 'teleport',
    name: 'Teleport',
    cooldown: 300,
    icon: require('../assets/spells/teleport.png'),
    iconGrey: require('../assets/spells/teleport-grey.png'),
  },
  ignite: {
    id: 'ignite',
    name: 'Ignite',
    cooldown: 180,
    icon: require('../assets/spells/ignite.png'),
    iconGrey: require('../assets/spells/ignite-grey.png'),
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    cooldown: 240,
    icon: require('../assets/spells/heal.png'),
    iconGrey: require('../assets/spells/heal-grey.png'),
  },
  barrier: {
    id: 'barrier',
    name: 'Barrier',
    cooldown: 180,
    icon: require('../assets/spells/barrier.png'),
    iconGrey: require('../assets/spells/barrier-grey.png'),
  },
  exhaust: {
    id: 'exhaust',
    name: 'Exhaust',
    cooldown: 240,
    icon: require('../assets/spells/exhaust.png'),
    iconGrey: require('../assets/spells/exhaust-grey.png'),
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    cooldown: 240,
    icon: require('../assets/spells/ghost.png'),
    iconGrey: require('../assets/spells/ghost-grey.png'),
  },
  cleanse: {
    id: 'cleanse',
    name: 'Cleanse',
    cooldown: 240,
    icon: require('../assets/spells/cleanse.png'),
    iconGrey: require('../assets/spells/cleanse-grey.png'),
  },
  smite: {
    id: 'smite',
    name: 'Smite',
    cooldown: 90,
    icon: require('../assets/spells/smite.png'),
    iconGrey: require('../assets/spells/smite-grey.png'),
  },
  // Teleport upgrades to this at 10:00. Its cooldown drops from 330s at level 1 to 240s
  // at level 18; 330 is the default and users can change it in Settings.
  unleashedTeleport: {
    id: 'unleashedTeleport',
    name: 'Unleashed Teleport',
    cooldown: 330,
    icon: require('../assets/spells/unleashedTeleport.png'),
    iconGrey: require('../assets/spells/unleashedTeleport-grey.png'),
  },
};

// Every spell, including in-game upgrades (Settings lists all of them).
export const SPELL_IDS = Object.keys(SPELLS) as SpellId[];

// The nine Summoner's Rift spells a player can pick, shown in the edit-mode pool.
// Unleashed Teleport isn't here: you get it by holding a Teleport tile.
export const POOL_SPELL_IDS = SPELL_IDS.filter((id) => id !== 'unleashedTeleport');

// Holding a tile swaps between these (Teleport <-> Unleashed Teleport).
export const UPGRADES: Partial<Record<SpellId, SpellId>> = {
  teleport: 'unleashedTeleport',
  unleashedTeleport: 'teleport',
};

export const ROLES: Role[] = ['TOP', 'JG', 'MID', 'BOT', 'SUP'];

// TOP has a third slot (for the extra spell the top lane quest can give); the other roles have two.
export const SLOTS_PER_ROLE: Record<Role, number> = { TOP: 3, JG: 2, MID: 2, BOT: 2, SUP: 2 };

export const DEFAULT_LOADOUT: Record<Role, SpellId[]> = {
  TOP: ['flash', 'ghost', 'unleashedTeleport'],
  JG: ['flash', 'smite'],
  MID: ['flash', 'ignite'],
  BOT: ['flash', 'barrier'],
  SUP: ['flash', 'heal'],
};
