import { ImageSourcePropType } from 'react-native';

// Summoner's Rift spell pool. Verify cooldowns against the current patch before release
// (`node scripts/fetch-spell-icons.mjs` prints Riot's values and refreshes the icons).

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
    cooldown: 360,
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
